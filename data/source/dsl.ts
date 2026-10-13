// Compact authoring format for recipes. Expanded and validated by scripts/build-dataset.ts.
//
// i: "id qty, id qty, id qty?"  — qty per serving in the ingredient's base unit
//    (g / ml / pc as defined in ingredients.ts); a trailing "?" marks it optional.

import type { Course, Cuisine, Diet, Effort } from '../../src/core/types';

export interface RecipeDraft {
  id: string;
  /** name */
  n: string;
  /** style, e.g. 'South Indian', 'Cantonese' */
  st: string;
  /** region */
  rg: string;
  /** origin: state or country */
  o: string;
  /** course(s), space separated, primary first */
  c: string;
  d: Diet;
  /** [prep minutes, cook minutes] — active time only */
  t: [number, number];
  /** effort override; default derived from total time */
  e?: Effort;
  adv?: string;
  /** tags, space separated */
  tg?: string;
  /** portion description for one serving */
  p: string;
  i: string;
  s: string[];
}

export interface CuisineDrafts {
  cuisine: Cuisine;
  recipes: RecipeDraft[];
}

export function cuisine(c: Cuisine, recipes: RecipeDraft[]): CuisineDrafts {
  return { cuisine: c, recipes };
}

export function parseCourses(c: string): Course[] {
  return c.split(/\s+/).filter(Boolean) as Course[];
}
