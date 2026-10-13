# Sous — UX review and user flows (2026-10-13)

Reviewed every screen on a 375 px phone, as a first-time user and as a returning user. Severity: **P0** blocks or misleads, **P1** costs real effort or trust, **P2** polish.

## Findings

| # | Screen | Finding | Sev | Fix |
|---|---|---|---|---|
| 1 | First launch | No landing page. A new person lands straight in a 60-chip pantry list (single-device) or a login form (accounts) with no idea what Sous does. | P0 | **Welcome** page: what Sous does in three lines, then *Get started* / *I have an account*. |
| 2 | Setup | Diet, household size and cuisines are never asked. A vegetarian sees whatever the defaults allow until they find *Change*. | P0 | Setup becomes a 3-step guide: **Your kitchen** (name, people, diet) → **How you cook** (cuisines, weekday time, weekend prep) → **Pantry**. |
| 3 | Plan → Questions | *Plan my week* opens the questions with *Today* selected, so the button reads *Show suggestions* and no week is built. | P0 | Entry points pass the scope: *Plan my week* opens week mode, *Change* on Today opens day mode. |
| 4 | All tabs | Every tab shows its title twice: the navigation header ("Today") and the page title ("Good evening"). It wastes the top 60 px. | P1 | Hide tab headers; each tab owns its title, with a safe-area inset. |
| 5 | Kitchen name | The kitchen name only exists inside *Household*, only the owner can change it, and single-device users have none. | P1 | Kitchen name heads Today and Kitchen, with a pencil to rename. Anyone in the kitchen can rename it (the server already allowed it). Single-device kitchens get a name too. |
| 6 | Today | Meals always list breakfast first, even at 9 pm. | P1 | Order meals by time of day: the next meal comes first. |
| 7 | Today | With no week plan, nothing points to planning, the app's main job. | P1 | *Plan your week* card at the top until a plan exists; quick actions for the four daily jobs (plan, add groceries, shopping list, ate out). |
| 8 | Questions | 13 sections every time, mixing per-meal choices (mood, healthy or cheat) with settings that rarely change (diet, people, prep day). | P1 | Per-plan questions first; stable preferences grouped under *Household preferences*, collapsed once set. |
| 9 | Setup → pantry | *Use* on the starter kitchen gives no feedback and can be tapped again. | P2 | Button turns into *Added ✓*. |
| 10 | Kitchen | Updating many items after a big shop means one search per item. The empty shopping-list banner takes the best spot. | P1 | *Update in bulk* reopens the pantry checklist; the shopping banner only shows when there is something to buy. |
| 11 | Signed-out | Login was the only signed-out screen; errors in setup were raw Supabase codes. | P1 | Fixed: welcome → login with friendly errors (see auth changes). |
| 12 | Deployed web | Icons missing on GitHub Pages: the deploy tool skipped `node_modules` folders that hold the icon font. | P0 | Fixed: `scripts/deploy-pages.mjs` publishes `dist/` as built. |

## User flows

### First-time user (accounts)
```
Welcome ──Get started──▶ Create account ──▶ Kitchen: start new (name it) ─┐
   │                                              or join with invite code ──▶ Today (shared kitchen, already set up)
   └──I have an account──▶ Sign in ──▶ Today                              │
                                                                          ▼
                       Setup 1/3 Your kitchen ▶ 2/3 How you cook ▶ 3/3 Pantry ▶ Today
                                                                                 │
                                         "Plan your week" card ──▶ Questions (week) ──▶ Plan
```

### First-time user (single device, no Supabase)
Welcome → Setup 1/3 → 2/3 → 3/3 → Today (same as above, minus the account steps).

### Daily use
- **What do we cook now?** Today → next meal first → recipe → *Cook this* (stock deducted, Undo).
- **Plan the week.** Today *Plan your week* or Plan tab → week questions → Plan → *Alternatives* / *Ate out* per meal → Weekend prep checklist.
- **Update the pantry.** Kitchen → search *Add groceries* (one item) or *Update in bulk* (checklist) → tap any item to set quantity or alert level.
- **Shop.** Kitchen / Today badge → Shopping list → *Copy for Instamart* → *Mark bought* restocks.
- **Ate out.** Today quick action or a meal's *Ate out*.
- **Kitchen & partner.** Kitchen name pencil (rename) · You → Household (invite code, members, password, sign out).
