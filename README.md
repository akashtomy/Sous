# Sous

**Your second-in-command in the kitchen.** Quick, healthy home cooking for busy working couples. Add your kitchen once and Sous does the rest:
- Quick weekday meals and relaxed weekends, plus a weekend prep list that does the slow work ahead.
- Recipes with portion sizes, calories and cooking time, several alternatives for every meal, and a YouTube link for each dish.
- It deducts ingredients when you cook, learns what you like, and tracks meals you eat outside.
- It builds a refill list when anything runs low, ready to paste to Claude to fill a Swiggy Instamart cart.

Built with Expo (React Native + react-native-web). One codebase serves the installable web app (iPhone and Android) and native iOS/Android builds.

## Run it

```bash
npm install
```

```bash
npm run web
```

Phone during development: scan the QR code from `npx expo start` with Expo Go.

## Share it with people

### Installable web app (iPhone and Android, recommended for now)

The web build is a Progressive Web App: people open a link and add Sous to their home screen. It opens full-screen with its own icon, keeps the kitchen on the phone and works offline. There is no app store and nothing to sideload.

**GitHub Pages (set up):** the site is published at **https://akashtomy.github.io/Sous/**.

1. Deploy from your machine. It builds with the Supabase values in your `.env` and publishes `dist/` to the `gh-pages` branch with `scripts/deploy-pages.mjs`:

   ```bash
   npm run deploy
   ```

2. First time only: in GitHub → *Settings → Pages*, set **Source** to *Deploy from a branch*, then select **gh-pages** and **/ (root)**.
3. In Supabase → *Authentication → URL Configuration*, set the **Site URL** to `https://akashtomy.github.io/Sous/`.

How the sub-path works: `SOUS_BASE_PATH=/Sous` makes `app.config.js` set Expo's `experiments.baseUrl`. `scripts/prepare-pages.mjs` then points the manifest, icons and service worker at `/Sous/` and copies `index.html` to `404.html`, so deep links like `/Sous/plan` open the app. Local development is unaffected.

**Other hosts:** `npm run build:web` writes a root-path build to `dist/`. Netlify, Vercel, Cloudflare Pages and EAS Hosting (`npx eas-cli@latest deploy --prod`) all work. Send every unknown path to `/index.html`.

How people install it:
- **iPhone:** open the link in **Safari** → Share → **Add to Home Screen**.
- **Android:** open the link in **Chrome** → ⋮ menu → **Install app** (or **Add to Home screen**).

The installed app updates itself: each launch fetches the latest version when online.

### Android APK (optional, ready when you want it)

`eas.json` has a `preview` profile that builds a sideloadable APK. It needs a free Expo account:

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR-PROJECT-REF.supabase.co --visibility plaintext
```

```bash
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value sb_publishable_xxx --visibility plaintext
```

```bash
npx eas-cli@latest build -p android --profile preview
```

EAS prints a download link and QR code when the build finishes. Recipients allow "Install unknown apps" for their browser. An iPhone app needs an Apple Developer account ($99/year) for TestFlight; until then iPhone users use the web app.

## Accounts and sharing with your partner

Create an account with a **username and password** (no email needed), then either start a kitchen or join your partner's kitchen with a **6-character invite code**. Everyone in a kitchen sees the same stock, plans, shopping list, history and tastes. Changes arrive on the other phone within seconds, and the app keeps working offline and syncs when it reconnects.

Without Supabase settings the app runs in **single-device mode** (no login).

Usernames are 3–20 characters (letters, numbers, dots, underscores) and are not case-sensitive. Google sign-in is built but switched off with the `EXPO_PUBLIC_FEATURE_GOOGLE_SIGNIN` flag.

### One-time setup (about 10 minutes)

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (the free tier is fine).
2. **Create the database.** In the dashboard open *SQL Editor* and run each file in `supabase/migrations/` in name order: `20261012000000_households.sql`, then `20261013000000_usernames.sql`. With the Supabase CLI you can instead run `npx supabase link` and then `npx supabase db push`.
3. **Turn off email confirmation.** In *Authentication → Sign In / Providers → Email*, switch **Confirm email** off. Usernames are stored as `username@users.sous.app`, an address that never receives mail, so confirmation links could never arrive. For the same reason, leave Supabase's optional security notification emails (for example *Password changed*) off. Sign-up showing **Email address "…@users.sous.app" is invalid** means *Confirm email* is still on.
4. **Connect the app.** Copy `.env.example` to `.env` and fill in the Project URL and the publishable key from *Project Settings → API*. Restart with `npx expo start -c`. These two values are safe to ship in the app because row-level security protects the data.
5. **Allow the redirect URLs** (used by Google sign-in if you turn it on later). In *Authentication → URL Configuration* add your hosted web URL, `http://localhost:8081/**`, `sous://**` and `exp://**`.
6. **Google sign-in (optional, off by default).** Set `EXPO_PUBLIC_FEATURE_GOOGLE_SIGNIN=true`, then:
   1. In Google Cloud Console → *APIs & Services → Credentials*, create an **OAuth client ID** of type *Web application*.
   2. Add `https://<your-project-ref>.supabase.co/auth/v1/callback` as an *Authorized redirect URI*.
   3. Paste the client ID and secret into Supabase → *Authentication → Providers → Google* and enable it.

### Forgotten passwords

Accounts have no email, so there is no "forgot password" link. Signed-in people can change their password under *Household → Change password*. If someone is locked out, reset it in the Supabase *SQL Editor*:

```sql
update auth.users
set encrypted_password = extensions.crypt('a-new-password', extensions.gen_salt('bf'))
where email = 'their_username@users.sous.app';
```

### How sharing works

- **Households.** A person belongs to one kitchen. The creator is the *owner*, and partners join as *members* (up to 6 people). Invite codes are single-use and expire after 48 hours.
- **Roles.** Everyone can edit the kitchen. Only the owner can rename it or remove people. If the owner leaves, ownership passes to the longest-standing member. If the last person leaves, the kitchen and its data are deleted.
- **Security.** Row-level security means only members can read a kitchen's rows. Clients can't write tables directly; every change goes through `apply_ops()`, which checks membership.
- **Sync.** Every change is an *operation*: "−120 g onion", "rate poha: loved", "set plan". The phone applies it at once and queues it, and the server applies it atomically. Stock changes are deltas, so if one partner cooks while the other unpacks groceries, both changes count. Each operation has an ID, so retries after a dropped connection never double-deduct. On every live update the phone re-reads one consistent snapshot (`household_snapshot()`) and replays anything not yet confirmed.
- **Last write wins** for the week plan, preferences and prep checkboxes. If you both edit the plan at the same moment, the later save is kept.
- **Your existing data.** When you first create a kitchen, you can bring the data already on the phone. Joining a partner's kitchen uses theirs. Signing out removes the kitchen from that phone.

### Checks for the backend

```bash
npm run test:db
```

This runs the real migration in an in-process Postgres (PGlite). It checks row-level security, invites, joining and leaving, ownership hand-over, idempotent operations, concurrent edits and snapshots as different users.

## Where data is kept

| | Device storage | Shared copy |
| --- | --- | --- |
| iOS / Android app | SQLite database `sous.db` (`expo-sqlite`), one row per data slice | Supabase, when signed in to a kitchen |
| Web / installed web app | IndexedDB database `sous`; Sous asks the browser for **persistent storage** so it isn't cleared under storage pressure | Supabase, when signed in to a kitchen |

Writes are batched every 250 ms and flushed when the app goes to the background. Data from older versions (the single AsyncStorage/localStorage blob) is migrated on first launch. *Settings → Kitchen* shows which storage is in use and whether the browser has granted persistent storage.

## How it works

The screen-by-screen review and the user flows behind this layout are in [docs/ux-review.md](docs/ux-review.md).

| Screen | What it does |
| --- | --- |
| **Welcome** | What Sous does, then *Get started* (create an account, or straight to setup without accounts) or *I already have an account*. |
| **Setup** (3 steps) | 1 · kitchen name, people, diet → 2 · cuisines, weekday cooking time, weekend prep day → 3 · pantry: tick what you have or add the "typical Indian kitchen" starter, then edit quantities. |
| **Questions** | Today or the week · meals · people (default 2) · healthy / balanced / cheat · mood · cuisines · **weekday** and **weekend** cooking time (default quick / any) · weekend meal prep and prep day · diet · foods to avoid · optional daily calories · use perishables first. |
| **Today** | Kitchen name (tap to rename), quick actions (plan week, groceries, shopping, ate out), today's plan or a *Plan your week* card, then ideas with the **next meal first**, weekday- or weekend-aware, personalised by your tastes: stock coverage, what's missing, reasons, kcal and time. "How was it?" after cooking; **Ate out** shortcut. |
| **Plan** | 7 days starting on your prep day, quick weekdays, fuller weekends, no repeats. **Alternatives** for every meal (up to 8, ranked); **Ate out** replaces a planned meal. |
| **Weekend prep** | Sunday (or Saturday) checklist built from the coming weekday meals: batter, beans, dals, sprouts, grains, masala base, ginger-garlic paste, potatoes, marinades, chutneys, dough, chopped veg, herbs. Quantities, storage, which meals each task feeds, which portions to freeze, time spent vs saved. |
| **Recipes** | All 258 dishes. Search by dish or ingredient (aliases like palak, jeera), filter by cuisine, meal, diet, quick, healthy, can-cook-now, loved; sort by match, time or calories. |
| **Recipe** | Portion per person, scaled ingredients, method, nutrition, weekday time after prep, **Watch on YouTube** (or the video you saved), verdict (loved / OK / not for me), **Add to week plan**, similar dishes. **Cook this** deducts stock, with **Undo**. |
| **Kitchen** | Add one item by search or **update many at once** with the setup checklist; inventory by category, running-low and use-soon filters, "+ bought" pack buttons, alert levels, and the shopping list (badge on the tab). |
| **Shopping** | Low stock + plan needs + items added from a recipe, rounded to packs. **Copy for Instamart**, **Share**, **Mark bought**. |
| **You** | Taste profile (styles, cuisines, favourite ingredients, favourites, what you skip), last 7 days (home vs out, spend, kcal/person/day), meals to rate, eating-out log. Settings live here. |

### How the app learns your tastes

Every meal you cook, rate, mark "not for me", swap away from a plan, or eat outside is stored on the device. From three or more of these, the app builds a profile:
- Cuisines and styles you cook most.
- Ingredients you favour.
- Dishes you loved.
- Dishes and ingredients you skip. An ingredient counts as skipped when it appears in two or more rejected dishes and in nothing you loved.

Suggestions then lean towards what you like. Rejected dishes are never suggested, and dishes you keep swapping away rank lower. The reasons shown with a suggestion say why ("You loved this", "You often cook South Indian"). See `src/core/persona.ts`.

### Weekend prep rules

`src/core/mealprep.ts` decides prep tasks from each dish's ingredients and steps, so it works for every recipe, including AI ideas. Each task type has:
- minutes saved per meal
- hands-on time
- fridge life
- whether later portions can be frozen

Fridge-only tasks (chopped veg, dough, chutney) skip meals they wouldn't last until. On weekdays, a dish counts its after-prep time, capped at half its full time. This is why many 35-minute dinners still fit a 20-minute weekday.

### Eating out

Pick from about 37 common restaurant dishes with per-person calorie estimates, or from the recipe list (scaled up for restaurant richness). You can edit the number, and add place and spend. If the meal replaces a planned one, its ingredients come off the shopping list.

### YouTube

Each recipe opens a YouTube search for that dish, so there's no API key and no dead links. Paste the video you liked and the recipe remembers it.

### Filling a Swiggy Instamart cart

The app doesn't log in to Swiggy itself. Instead:
1. On **Shopping**, tap **Copy for Instamart**. The message lists every selected item with pack sizes and tells Claude not to check out.
2. In Claude, enable the Swiggy Instamart connector and paste the message. Claude searches each item, adds it to your cart and asks when a brand or size is unclear.
3. Review and pay in Instamart yourself. When the order arrives, tap **Mark bought** to restock.

### Optional: more ideas with Claude

In Settings, turn on "More ideas with Claude" and paste your own Anthropic API key. Each meal then gets a **More ideas with Claude** button that generates recipes from your stock. It uses the Anthropic TypeScript SDK with structured JSON output, model `claude-opus-5-5` by default, and server-side refusal fallback.

Generated ingredients are matched to the pantry by name and alias. Anything that can't be matched is listed as "not tracked" and isn't deducted. On phones the key is kept in secure storage; on the web it stays in that browser, so use the web option for personal use only. The built-in recipes never need a key.

## Recipe dataset

258 original recipes across:
- **Indian** (112): every region, including North-East and Central.
- **Lebanese** (30)
- **Chinese** (36): Cantonese, Sichuan, Northern and Indo-Chinese.
- **Continental** (41)
- **International** (39): Thai, Japanese, Korean, Mexican, Greek, Moroccan, Turkish, Vietnamese, Indonesian, Spanish, Hawaiian.

Every recipe is classified by:
- course (breakfast / lunch / dinner / dessert / snack)
- cuisine, style, region and origin
- diet: vegan, veg, egg or non-veg
- effort, with prep and cook time
- health tier: 62 % healthy, 33 % balanced, 5 % treats

| Path | Purpose |
| --- | --- |
| `data/source/ingredients.ts` | 193 ingredients: per-100 g nutrition, aliases (jeera, rai, palak …), pack sizes, alert levels, shelf life |
| `data/source/recipes/*.ts` | Recipes in a compact format (`"id qty, id qty?"` per serving) |
| `scripts/build-dataset.ts` | Computes per-serving nutrition and the health tier, then writes `src/core/data/*.json` and `data/*.json` |
| `scripts/validate-dataset.ts` | Checks references, diet consistency, kcal ranges and coverage, and prints the cuisine × course table |
| `data/SOURCES.md` | Nutrition sources (USDA FoodData Central, IFCT 2017), dish references and the classification rules |

After editing recipes, rebuild and validate:

```bash
npm run validate-data
```

## Code layout

```
src/core/      pure TypeScript domain logic (no React Native) + Jest tests
  catalog.ts   dataset access and ingredient search/alias matching
  nutrition.ts nutrition maths and the health-tier rules
  inventory.ts deduct / undo / restock, low-stock and freshness checks
  planner.ts   filters, scoring, weekday/weekend effort, 7-day plan with simulated stock depletion
  mealprep.ts  weekend prep tasks and weekday time savings
  persona.ts   taste profile from cooking, ratings, swaps and eating out
  eatout.ts    common outside dishes with calorie estimates
  youtube.ts   per-recipe YouTube search links and saved-link validation
src/sync/      shared-kitchen operations (state.ts) and the Supabase sync engine (engine.ts)
src/store/auth.ts   username sign-in, households, invites, members
src/lib/supabase.ts Supabase client (encrypted session storage on phones)
supabase/      database migration and PGlite tests
  refill.ts    shopping list, pack-size rounding, cart message
  claude.ts    optional Claude recipe ideas
src/store/     zustand store; persistence.ts saves it per slice to the device database
src/lib/kitchen-db*.ts  SQLite (phones) / IndexedDB (web) storage
public/        web app shell: index.html, manifest.json, sw.js (offline), icons
src/app/       Expo Router screens
src/components shared UI
```

## Checks

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run lint
```

## Notes

- `metro.config.js` makes Metro load the Anthropic SDK's CommonJS build. Its ESM build crashes React Refresh in development.
- Brand assets (app icons, adaptive icons, splash, PWA icons) are generated from code by `npm run build-icons`; the source SVGs are in `assets/brand/`.
- Local notifications need a phone. On the web you get the in-app refill banner instead.
- Calories are estimates computed from ingredient composition values. They aren't lab measurements.
