// Username rules shared by the sign-up form and the database check constraint.

/** 3–20 characters: lowercase letters, digits, dot and underscore; starts with a letter or digit. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._]{2,19}$/;

export function normaliseUsername(input: string): string {
  return input.trim().toLowerCase();
}

/** Why a username can't be used, or undefined when it's fine. */
export function usernameProblem(input: string): string | undefined {
  const u = normaliseUsername(input);
  if (u.length < 3) return 'At least 3 characters.';
  if (u.length > 20) return 'At most 20 characters.';
  if (!/^[a-z0-9]/.test(u)) return 'Start with a letter or number.';
  if (!USERNAME_PATTERN.test(u)) return 'Use only letters, numbers, dots and underscores.';
  if (/[._]{2}/.test(u)) return 'No two dots or underscores in a row.';
  return undefined;
}

/** The internal account email for a username (never shown, never mailed). */
export function usernameToEmail(username: string, domain: string): string {
  return `${normaliseUsername(username)}@${domain}`;
}

export function passwordProblem(password: string): string | undefined {
  if (password.length < 8) return 'At least 8 characters.';
  if (password.length > 72) return 'At most 72 characters.';
  return undefined;
}
