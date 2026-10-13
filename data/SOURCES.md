# Dataset sources and licensing

The recipe text in this dataset is original: steps, portion notes and per-serving quantities were written for this app. No instructions or prose were copied from recipe sites. Dish lists, regional attribution and typical ingredients are factual information gathered from the references below.

## Nutrition (per 100 g / 100 ml values in `source/ingredients.ts`)

| Source | Use | License / terms |
| --- | --- | --- |
| USDA FoodData Central (SR Legacy / Foundation) — https://fdc.nal.usda.gov | Default per-100 g values for most ingredients | Public domain (US Government work) |
| Indian Food Composition Tables 2017, National Institute of Nutrition (Longvah et al.) — https://www.nin.res.in/ebooks/IFCT2017.pdf | Cross-check for Indian staples (dals, millets, atta, rice, paneer, jaggery, mustard/cumin seeds) | Values cited as facts; the book and the `ifct2017` npm data (AGPL-3.0 since April 2025) are **not** bundled |

The values are rounded. Composite items such as garam masala, sambar powder, za'atar, seven-spice and Thai curry paste are typical-blend estimates. Kcal per serving is **computed** from these values in `src/core/nutrition.ts`, so it is an estimate. It is not a lab measurement.

## Dish coverage and classification references

- Kaggle "Indian Food 101" (255 dishes with course, state and region): used only as a **checklist of dish names and regions**. Its license is "Data files © Original Authors", so no rows are reused.
- Regional breakfast survey: The Quint FIT, "Breakfasts of India across states" — https://www.thequint.com/fit/breakfasts-of-india-across-states-2
- North-East Indian dishes: EastMojo — https://eastmojo.com/features/2020/11/17/15-delicacies-from-northeast-india-that-will-make-you-drool ; Wikipedia "List of Indian dishes" — https://en.wikipedia.org/wiki/List_of_Indian_dishes
- Lebanese breakfast and desserts: Food Heritage Foundation — https://food-heritage.org/breakfast-of-kings/ ; Taste of Beirut — https://www.tasteofbeirut.com/course/breakfast/ ; Feel Good Foodie — https://feelgoodfoodie.net/lebanese-desserts/
- Chinese breakfast and regional dishes: Travel of China, "What Chinese people have for breakfast" — https://www.travelofchina.com/what-do-chinese-people-have-for-breakfast/
- Continental and international dishes: well-known classics, classified by country of origin.

## Classification rules (computed, not hand-labelled)

- **healthTier**: see `classifyHealth` in `src/core/nutrition.ts`. It uses course-specific kcal caps; fat share; fibre; added (free) sugar per the WHO free-sugar definition, counting only sugar, jaggery and honey; protein share for meals; and a `fried` tag.
- **effort**: active prep + cook time. Quick is ≤ 20 min, moderate ≤ 45 min, elaborate above that. Passive soaking and fermenting time is listed separately as `advancePrep`.
- **course**: the first course listed is the primary one and decides the calorie limits.
