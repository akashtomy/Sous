import Anthropic from '@anthropic-ai/sdk';

import { buildPrompt, ClaudeIdeasError, generateIdeas, toRecipe } from '../claude';
import { DEFAULT_PREFS } from '../planner';

const RAW = {
  name: 'Spinach Moong Dal',
  cuisine: 'indian',
  style: 'North Indian',
  origin: 'Punjab',
  course: 'dinner',
  diet: 'vegan',
  prepMin: 10,
  cookMin: 20,
  portion: '1 bowl + 2 rotis',
  kcalPerServing: 420,
  proteinG: 20,
  carbsG: 60,
  fatG: 9,
  fiberG: 12,
  tags: ['High Protein'],
  ingredients: [
    { name: 'Moong dal', qtyPerServing: 40, unit: 'g' },
    { name: 'Palak', qtyPerServing: 100, unit: 'g' },
    { name: 'Jeera', qtyPerServing: 1, unit: 'g' },
    { name: 'Egg', qtyPerServing: 50, unit: 'g' },
    { name: 'Unicorn dust', qtyPerServing: 2, unit: 'g' },
  ],
  steps: ['Cook dal.', 'Add spinach.'],
} as const;

function mockClient(impl: () => Promise<unknown>) {
  return { beta: { messages: { create: jest.fn(impl) } } } as unknown as Pick<Anthropic, 'beta'>;
}
const textResponse =
  (text: string, stop_reason = 'end_turn') =>
  async () => ({
    stop_reason,
    content: [{ type: 'text', text }],
  });

describe('Claude recipe mapping', () => {
  it('maps names/aliases to pantry ingredients and converts units', () => {
    const r = toRecipe(JSON.parse(JSON.stringify(RAW)), 1)!;
    expect(r.source).toBe('claude');
    expect(r.effort).toBe('moderate');
    expect(r.ingredients).toEqual([
      { id: 'moong-dal', qty: 40 },
      { id: 'spinach', qty: 100 },
      { id: 'cumin-seeds', qty: 1 },
      { id: 'egg', qty: 1 }, // 50 g → 1 pc
    ]);
    expect(r.steps[r.steps.length - 1]).toMatch(/Unicorn dust/);
    expect(r.tags).toContain('high-protein');
  });

  it('rejects incomplete recipes', () => {
    expect(toRecipe({ ...JSON.parse(JSON.stringify(RAW)), steps: [] })).toBeUndefined();
    expect(toRecipe({ ...JSON.parse(JSON.stringify(RAW)), course: 'brunch' })).toBeUndefined();
  });

  it('puts stock and constraints in the prompt', () => {
    const p = buildPrompt({ ...DEFAULT_PREFS, avoid: ['peanuts'] }, 'dinner', {
      onion: { ingredientId: 'onion', qty: 500 },
    });
    expect(p).toContain('Onion: 500 g');
    expect(p).toContain('Avoid: Peanuts');
    expect(p).toContain('dinner');
  });
});

describe('generateIdeas', () => {
  const base = { apiKey: 'test', prefs: DEFAULT_PREFS, course: 'dinner' as const, inventory: {} };

  it('returns parsed recipes and requests structured JSON with fallbacks', async () => {
    const client = mockClient(textResponse(JSON.stringify({ recipes: [RAW] })));
    const res = await generateIdeas({ ...base, client });
    expect(res).toHaveLength(1);
    const body = (client.beta.messages.create as jest.Mock).mock.calls[0][0];
    expect(body.model).toBe('claude-opus-5-5');
    expect(body.output_config.format.type).toBe('json_schema');
    expect(body.fallbacks).toBe('default');
  });

  it('maps an invalid key to a friendly error', async () => {
    const client = mockClient(async () => {
      throw new Anthropic.AuthenticationError(401, {}, 'invalid x-api-key', new Headers());
    });
    await expect(generateIdeas({ ...base, client })).rejects.toThrow(/API key was rejected/);
  });

  it('maps timeouts and refusals', async () => {
    await expect(
      generateIdeas({
        ...base,
        client: mockClient(async () => {
          throw new Anthropic.APIConnectionTimeoutError();
        }),
      }),
    ).rejects.toThrow(/too long/);
    await expect(
      generateIdeas({ ...base, client: mockClient(textResponse('', 'refusal')) }),
    ).rejects.toThrow(/declined/);
  });

  it('fails cleanly on malformed or empty output', async () => {
    await expect(
      generateIdeas({ ...base, client: mockClient(textResponse('not json')) }),
    ).rejects.toBeInstanceOf(ClaudeIdeasError);
    await expect(
      generateIdeas({ ...base, client: mockClient(textResponse('{"recipes":[]}')) }),
    ).rejects.toThrow(/usable/);
  });
});
