// Runs the real migration in an in-process Postgres (PGlite) with a minimal stand-in for
// Supabase's auth schema, then checks RLS and the household functions as different users.
//   npm run test:db

import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

// All migrations, in filename (timestamp) order — exactly what `supabase db push` applies.
const MIGRATIONS_DIR = join(__dirname, '../migrations');
const MIGRATIONS = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8'));

// What Supabase provides that the migration relies on.
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create publication supabase_realtime;
  grant usage on schema public, auth to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`;

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const C = '00000000-0000-0000-0000-00000000000c';

let db: PGlite;
let opCounter = 0;
const opId = () => `00000000-0000-4000-8000-${String(++opCounter).padStart(12, '0')}`;

/** Runs a query as a signed-in user (role authenticated + JWT sub), like PostgREST does. */
async function as<T = Record<string, unknown>>(uid: string, sql: string, params: unknown[] = []) {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`,
  );
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

async function rejects(p: Promise<unknown>, pattern: RegExp) {
  await assert.rejects(p, (e: Error) => pattern.test(e.message));
}

const ops = (hid: string, list: object[]) =>
  as(A, 'select apply_ops($1, $2::jsonb) as n', [hid, JSON.stringify(list)]);
const opsAs = (uid: string, hid: string, list: object[]) =>
  as<{ n: number }>(uid, 'select apply_ops($1, $2::jsonb) as n', [hid, JSON.stringify(list)]);
const qty = async (uid: string, id: string) =>
  (
    await as<{ qty: string }>(uid, 'select qty from inventory_items where ingredient_id = $1', [id])
  )[0]?.qty;

let hid = '';

before(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  for (const sql of MIGRATIONS) await db.exec(sql);
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
    ($1, 'akash@example.com', '{"full_name":"Akash"}'),
    ($2, 'partner@example.com', '{"display_name":"Partner"}'),
    ($3, 'stranger@example.com', '{}')`,
    [A, B, C],
  );
});

after(async () => db.close());

describe('profiles', () => {
  it('creates a profile on sign-up from metadata or email', async () => {
    const rows = (
      await db.query<{ display_name: string }>('select display_name from profiles order by id')
    ).rows;
    assert.deepEqual(
      rows.map((r) => r.display_name),
      ['Akash', 'Partner', 'stranger'],
    );
  });
});

describe('usernames', () => {
  const D = '00000000-0000-0000-0000-00000000000d';
  const E = '00000000-0000-0000-0000-00000000000e';

  it('stores the sign-up username (lowercased) and uses it as the display name', async () => {
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'riya@users.sous.app', '{"username":"Riya.K"}')`,
      [D],
    );
    const row = (await db.query<{ username: string; display_name: string }>('select username, display_name from profiles where id = $1', [D])).rows[0];
    assert.deepEqual(row, { username: 'riya.k', display_name: 'riya.k' });
  });

  it('rejects a taken username, so the sign-up fails', async () => {
    await rejects(
      db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'x@users.sous.app', '{"username":"riya.k"}')`, [E]),
      /duplicate key|unique/,
    );
  });

  it('rejects usernames that break the rules', async () => {
    for (const bad of ['ab', 'Has Space', '_start', 'a..b', 'waytoolongusername_123']) {
      await rejects(
        db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'y@users.sous.app', $2)`, [E, JSON.stringify({ username: bad })]),
        /check constraint/,
      );
    }
  });

  it('answers "is this username free?" even before sign-in', async () => {
    await db.exec(`set role anon;`);
    try {
      const taken = (await db.query<{ ok: boolean }>(`select username_available(' RIYA.K ') as ok`)).rows[0].ok;
      const free = (await db.query<{ ok: boolean }>(`select username_available('someone_new') as ok`)).rows[0].ok;
      assert.equal(taken, false);
      assert.equal(free, true);
    } finally {
      await db.exec('reset role;');
    }
  });
});

describe('households and invites', () => {
  it('creates a household with the caller as owner, only once', async () => {
    hid = (await as<{ id: string }>(A, `select create_household('Our kitchen') as id`))[0].id;
    const me = await as<{ role: string }>(A, 'select role from household_members');
    assert.deepEqual(
      me.map((r) => r.role),
      ['owner'],
    );
    await rejects(as(A, `select create_household('Second')`), /already_in_household/);
  });

  it('writes go through apply_ops and are idempotent', async () => {
    const set = {
      id: opId(),
      type: 'inv.set',
      ingredientId: 'onion',
      qty: 1000,
      addedOn: '2026-10-12',
    };
    const use = { id: opId(), type: 'inv.delta', ingredientId: 'onion', delta: -120 };
    assert.equal((await ops(hid, [set, use]))[0].n, 2);
    assert.equal((await ops(hid, [use]))[0].n, 0); // replayed op is ignored
    assert.equal(await qty(A, 'onion'), '880');
  });

  it('clamps deductions at zero and ignores deductions of unstocked items', async () => {
    await ops(hid, [
      { id: opId(), type: 'inv.delta', ingredientId: 'onion', delta: -5000 },
      { id: opId(), type: 'inv.delta', ingredientId: 'saffron', delta: -1 },
    ]);
    assert.equal(await qty(A, 'onion'), '0');
    assert.equal(await qty(A, 'saffron'), undefined);
    await ops(hid, [{ id: opId(), type: 'inv.delta', ingredientId: 'onion', delta: 880 }]);
  });

  it('blocks direct table writes (no write policies)', async () => {
    await rejects(
      as(
        A,
        `insert into inventory_items (household_id, ingredient_id, qty) values ($1, 'rice', 1)`,
        [hid],
      ),
      /row-level security|permission denied/,
    );
  });

  it('invites a partner with a 6-character code that works once', async () => {
    const code = (await as<{ c: string }>(A, 'select create_invite() as c'))[0].c;
    assert.match(code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
    const joined = (
      await as<{ id: string }>(B, 'select join_household($1) as id', [code.toLowerCase()])
    )[0].id;
    assert.equal(joined, hid);
    await rejects(as(C, 'select join_household($1)', [code]), /invalid_or_expired_code/);
  });

  it('rejects expired codes', async () => {
    const code = (await as<{ c: string }>(A, 'select create_invite() as c'))[0].c;
    await db.query(
      `update household_invites set expires_at = now() - interval '1 minute' where code = $1`,
      [code],
    );
    await rejects(as(C, 'select join_household($1)', [code]), /invalid_or_expired_code/);
  });
});

describe('sharing between partners', () => {
  it('partner sees the same kitchen; strangers see nothing', async () => {
    assert.equal(await qty(B, 'onion'), '880');
    assert.equal((await as(C, 'select * from inventory_items')).length, 0);
    assert.equal((await as(C, 'select * from households')).length, 0);
    await rejects(
      opsAs(C, hid, [{ id: opId(), type: 'inv.set', ingredientId: 'x', qty: 1 }]),
      /not_a_member/,
    );
  });

  it('concurrent edits by both partners both count', async () => {
    await opsAs(A, hid, [{ id: opId(), type: 'inv.delta', ingredientId: 'onion', delta: -100 }]);
    await opsAs(B, hid, [
      { id: opId(), type: 'inv.delta', ingredientId: 'onion', delta: 500, addedOn: '2026-10-13' },
    ]);
    assert.equal(await qty(A, 'onion'), '1280');
  });

  it('partners see each other’s profile names; strangers do not', async () => {
    const names = (
      await as<{ display_name: string }>(
        A,
        'select display_name from profiles order by display_name',
      )
    ).map((r) => r.display_name);
    assert.deepEqual(names, ['Akash', 'Partner']);
    assert.deepEqual((await as(C, 'select display_name from profiles')).length, 1); // only self
  });

  it('stores history, outside meals, feedback, shopping, AI recipes and docs', async () => {
    await opsAs(B, hid, [
      {
        id: opId(),
        type: 'history.add',
        entry: {
          id: 'h1',
          recipeId: 'kanda-poha',
          servings: 2,
          date: '2026-10-12',
          course: 'breakfast',
          applied: [],
        },
      },
      {
        id: opId(),
        type: 'outside.add',
        meal: {
          id: 'o1',
          date: '2026-10-12',
          course: 'dinner',
          name: 'Pizza',
          kcal: 700,
          people: 2,
        },
      },
      { id: opId(), type: 'feedback.rating', recipeId: 'kanda-poha', rating: 'love' },
      { id: opId(), type: 'feedback.swapped', recipeId: 'undhiyu' },
      { id: opId(), type: 'feedback.swapped', recipeId: 'undhiyu' },
      { id: opId(), type: 'feedback.video', recipeId: 'kanda-poha', url: 'https://youtu.be/abc' },
      { id: opId(), type: 'shopping.add', items: [{ ingredientId: 'paneer', qty: 200 }] },
      { id: opId(), type: 'shopping.add', items: [{ ingredientId: 'paneer', qty: 150 }] },
      { id: opId(), type: 'ai.add', recipes: [{ id: 'ai-x', name: 'Idea' }] },
      { id: opId(), type: 'doc.set', key: 'prefs', data: { people: 2 } },
    ]);
    const fb = await as<{ rating: string; swapped_away: number; video_url: string }>(
      A,
      `select rating, swapped_away, video_url from recipe_feedback order by recipe_id`,
    );
    assert.deepEqual(fb, [
      { rating: 'love', swapped_away: 0, video_url: 'https://youtu.be/abc' },
      { rating: null, swapped_away: 2, video_url: null },
    ]);
    assert.equal((await as<{ qty: string }>(A, 'select qty from shopping_extras'))[0].qty, '200');
    assert.equal((await as(A, 'select * from meal_history')).length, 1);
    assert.equal((await as(A, 'select * from outside_meals')).length, 1);
    assert.deepEqual(
      (await as<{ data: object }>(A, `select data from household_docs where key = 'prefs'`))[0]
        .data,
      { people: 2 },
    );
    await rejects(
      opsAs(A, hid, [
        { id: opId(), type: 'feedback.video', recipeId: 'x', url: 'https://evil.example.com/v' },
      ]),
      /check constraint/,
    );
    await rejects(opsAs(A, hid, [{ id: opId(), type: 'bogus' }]), /unknown_op/);
  });
});

describe('snapshot', () => {
  it('returns all shared data plus which pending ops are applied, members only', async () => {
    const applied = opId();
    await opsAs(A, hid, [{ id: applied, type: 'inv.delta', ingredientId: 'onion', delta: -80 }]);
    const notYet = '00000000-0000-4000-8000-999999999999';
    const snap = (
      await as<{ s: Record<string, unknown[]> }>(
        A,
        'select household_snapshot($1, $2::uuid[]) as s',
        [hid, [applied, notYet]],
      )
    )[0].s;
    assert.deepEqual(snap.applied, [applied]);
    assert.equal(
      (snap.inventory as { ingredient_id: string; qty: number }[]).find(
        (r) => r.ingredient_id === 'onion',
      )?.qty,
      1200,
    );
    assert.equal(snap.history.length, 1);
    assert.equal(snap.outside.length, 1);
    assert.equal(snap.docs.length, 1);
    const stranger = (await as<{ s: unknown }>(C, 'select household_snapshot($1) as s', [hid]))[0]
      .s;
    assert.equal(stranger, null);
  });
});

describe('membership changes', () => {
  it('only the owner can remove members', async () => {
    await rejects(as(B, 'select remove_member($1)', [A]), /owner_only/);
  });

  it('when the owner leaves, the partner becomes owner and keeps the data', async () => {
    await as(A, 'select leave_household()');
    const rows = await as<{ role: string }>(B, 'select role from household_members');
    assert.deepEqual(
      rows.map((r) => r.role),
      ['owner'],
    );
    assert.equal(await qty(B, 'onion'), '1200');
    assert.equal((await as(A, 'select * from inventory_items')).length, 0);
  });

  it('joining another kitchen as the last member deletes their old solo kitchen', async () => {
    const solo = (await as<{ id: string }>(A, `select create_household('Solo') as id`))[0].id;
    await opsAs(A, solo, [{ id: opId(), type: 'inv.set', ingredientId: 'rice', qty: 500 }]);
    const code = (await as<{ c: string }>(B, 'select create_invite() as c'))[0].c;
    await as(A, 'select join_household($1)', [code]);
    assert.equal((await db.query('select * from households where id = $1', [solo])).rows.length, 0);
    assert.equal(
      (await db.query('select * from inventory_items where household_id = $1', [solo])).rows.length,
      0,
    );
    assert.equal(await qty(A, 'onion'), '1200');
  });

  it('owner can remove a member, who then loses access', async () => {
    await as(B, 'select remove_member($1)', [A]);
    assert.equal((await as(A, 'select * from inventory_items')).length, 0);
  });

  it('reset wipes shared data for the household only', async () => {
    await opsAs(B, hid, [{ id: opId(), type: 'reset' }]);
    for (const t of [
      'inventory_items',
      'meal_history',
      'outside_meals',
      'recipe_feedback',
      'shopping_extras',
      'ai_recipes',
      'household_docs',
    ]) {
      assert.equal((await as(B, `select * from ${t}`)).length, 0, t);
    }
  });
});
