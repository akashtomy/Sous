// Feature flags. Set in .env (or EAS env) and restart the bundler; defaults are the shipped behaviour.

/** "Continue with Google". Off until the Google OAuth client is set up in Supabase. */
export const GOOGLE_SIGN_IN = process.env.EXPO_PUBLIC_FEATURE_GOOGLE_SIGNIN === 'true';

/**
 * Supabase accounts need an email, so a username becomes `<username>@<this domain>` behind the
 * scenes. No mail is ever sent (turn "Confirm email" off in Supabase). Use a domain you control
 * and avoid reserved ones (.test, .local, example.com), which Supabase's mailer rejects.
 */
export const USERNAME_EMAIL_DOMAIN = process.env.EXPO_PUBLIC_USERNAME_EMAIL_DOMAIN || 'users.sous.app';
