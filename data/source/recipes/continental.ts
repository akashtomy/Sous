import { cuisine } from '../dsl';

const ITALY = { st: 'Italian', rg: 'Southern Europe', o: 'Italy' } as const;
const FRANCE = { st: 'French', rg: 'Western Europe', o: 'France' } as const;
const BRIT = { st: 'British', rg: 'Western Europe', o: 'United Kingdom' } as const;
const AMER = { st: 'American', rg: 'North America', o: 'United States' } as const;
const SWISS = { st: 'Swiss', rg: 'Central Europe', o: 'Switzerland' } as const;
const EURO = { st: 'Modern European', rg: 'Europe', o: 'Europe' } as const;

export const continental = cuisine('continental', [
  // ---------------- breakfast
  {
    ...EURO, id: 'overnight-oats-berries', n: 'Overnight Oats with Berries', c: 'breakfast', d: 'veg',
    t: [5, 0], adv: 'Soak overnight in the fridge', tg: 'no-cook high-fiber',
    p: '1 jar (about 300 g)',
    i: 'oats 50, milk 120, greek-yogurt 50, chia-seeds 8, berries 70, honey 5, almonds 6',
    s: [
      'Stir oats, chia, milk and yogurt together in a jar; refrigerate overnight.',
      'In the morning loosen with a splash of milk, top with berries, sliced almonds and a little honey.',
    ],
  },
  {
    ...FRANCE, id: 'veggie-omelette', n: 'Vegetable Omelette with Toast', c: 'breakfast dinner', d: 'egg',
    t: [5, 8], tg: 'quick high-protein',
    p: '2-egg omelette + 1 slice toast + tomato',
    i: 'egg 2, spinach 40, mushroom 40, red-pepper 30, cheese 10, olive-oil 4, ww-bread 1, tomato 80, black-pepper 0.2, salt 0.6',
    s: [
      'Sauté mushrooms, pepper and spinach in olive oil; season.',
      'Pour in beaten eggs, tilt to set the edges, add cheese and fold.',
      'Serve with whole wheat toast and sliced tomato.',
    ],
  },
  {
    ...AMER, id: 'avocado-egg-toast', n: 'Avocado Toast with Poached Egg', c: 'breakfast', d: 'egg',
    t: [5, 5], tg: 'quick high-fiber',
    p: '2 slices toast + 1 egg',
    i: 'ww-bread 2, avocado 0.5, egg 1, lemon 0.15, dry-red-chilli 0.2, tomato 50, black-pepper 0.2, salt 0.5',
    s: [
      'Toast bread; mash avocado with lemon, salt and pepper and spread on top.',
      'Poach the egg 3 minutes in simmering water with a splash of vinegar.',
      'Top with egg, chilli flakes and sliced tomato.',
    ],
  },
  {
    ...EURO, id: 'yogurt-parfait', n: 'Greek Yogurt Parfait', c: 'breakfast snack', d: 'veg',
    t: [5, 0], tg: 'no-cook high-protein quick',
    p: '1 glass (about 280 g)',
    i: 'greek-yogurt 170, oats 25, berries 60, banana 0.5, walnuts 8, honey 5, flax-seeds 5',
    s: [
      'Toast oats briefly in a dry pan (optional).',
      'Layer yogurt, fruit, oats, walnuts and flax in a glass; drizzle with honey.',
    ],
  },
  {
    ...AMER, id: 'banana-oat-pancakes', n: 'Banana Oat Pancakes', c: 'breakfast', d: 'egg',
    t: [5, 10], tg: 'gluten-free high-fiber',
    p: '4 small pancakes + fruit',
    i: 'oats 50, banana 1, egg 1, milk 40, baking-soda 1, cinnamon 0.3, oil 3, berries 50, greek-yogurt 40, honey 4',
    s: [
      'Blend oats, banana, egg, milk, baking powder and cinnamon into a batter.',
      'Cook small rounds on a lightly oiled pan until bubbles form; flip.',
      'Serve with berries, a spoon of yogurt and a drizzle of honey.',
    ],
  },
  {
    ...BRIT, id: 'mushrooms-eggs-toast', n: 'Scrambled Eggs and Mushrooms on Toast', c: 'breakfast', d: 'egg',
    t: [5, 8], tg: 'quick high-protein',
    p: '2 eggs + mushrooms + 1 slice toast',
    i: 'egg 2, mushroom 100, milk 15, butter 4, ww-bread 1, spinach 40, black-pepper 0.2, salt 0.6',
    s: [
      'Sauté sliced mushrooms in half the butter until golden; wilt spinach in at the end.',
      'Whisk eggs with milk; cook slowly in the remaining butter, stirring, until softly set.',
      'Serve on toast with mushrooms and spinach.',
    ],
  },
  {
    ...BRIT, id: 'apple-cinnamon-porridge', n: 'Apple Cinnamon Porridge', c: 'breakfast', d: 'veg',
    t: [3, 8], tg: 'warming high-fiber',
    p: '1 bowl (about 320 g)',
    i: 'oats 50, milk 200, apple 0.5, cinnamon 0.5, walnuts 8, honey 5, chia-seeds 5',
    s: [
      'Simmer oats in milk, stirring, 5–6 minutes until creamy.',
      'Stir in grated apple and cinnamon.',
      'Top with walnuts, chia and a little honey.',
    ],
  },
  {
    ...EURO, id: 'berry-smoothie-bowl', n: 'Berry Smoothie Bowl', c: 'breakfast snack', d: 'veg',
    t: [8, 0], tg: 'no-cook quick',
    p: '1 bowl (about 350 g)',
    i: 'berries 100, banana 1, greek-yogurt 100, milk 50, oats 20, pumpkin-seeds 6, chia-seeds 5',
    s: [
      'Blend frozen berries, banana, yogurt and milk until thick.',
      'Pour into a bowl and top with oats, pumpkin seeds and chia.',
    ],
  },
  {
    ...SWISS, id: 'bircher-muesli', n: 'Bircher Muesli', c: 'breakfast', d: 'veg',
    t: [10, 0], adv: 'Soak overnight', tg: 'no-cook high-fiber',
    p: '1 bowl (about 300 g)',
    i: 'oats 50, milk 80, curd 80, apple 0.5, lemon 0.1, raisins 8, almonds 8, honey 4',
    s: [
      'Soak oats in milk and yogurt overnight.',
      'In the morning grate in apple with a squeeze of lemon; stir.',
      'Top with raisins, chopped almonds and honey.',
    ],
  },
  {
    ...ITALY, id: 'spinach-frittata', n: 'Spinach and Feta Frittata', c: 'breakfast dinner', d: 'egg',
    t: [10, 15], tg: 'high-protein gluten-free',
    p: '1 wedge (2 eggs) + salad',
    i: 'egg 2, spinach 60, onion 30, feta 20, red-pepper 40, olive-oil 5, lettuce 40, tomato 50, black-pepper 0.2, salt 0.5',
    s: [
      'Soften onion and pepper in olive oil in an ovenproof pan; wilt in spinach.',
      'Pour over beaten eggs, crumble in feta and cook on low until the edges set.',
      'Finish under the grill until puffed and golden; serve with salad.',
    ],
  },
  {
    ...FRANCE, id: 'french-toast-berries', n: 'Whole Wheat French Toast with Berries', c: 'breakfast', d: 'egg',
    t: [5, 10], tg: 'comfort',
    p: '2 slices + fruit + yogurt',
    i: 'ww-bread 2, egg 1, milk 50, cinnamon 0.3, butter 5, berries 60, greek-yogurt 50, honey 6',
    s: [
      'Whisk egg, milk and cinnamon; soak bread slices briefly.',
      'Cook in a buttered pan until golden on both sides.',
      'Serve with berries, yogurt and honey.',
    ],
  },

  // ---------------- lunch & dinner
  {
    ...ITALY, id: 'minestrone', n: 'Minestrone with Beans', c: 'dinner lunch', d: 'vegan',
    t: [15, 30], adv: 'Cooked kidney beans or chickpeas', tg: 'soup high-fiber',
    p: '1 large bowl + 1 slice bread',
    i: 'onion 40, carrot 40, celery 30, zucchini 50, tomato-puree 100, rajma 25, ww-pasta 20, spinach 30, garlic 3, olive-oil 7, oregano 0.5, basil 2, ww-bread 1, salt 1.5',
    s: [
      'Sauté onion, carrot and celery in olive oil with garlic.',
      'Add tomato, beans, zucchini, herbs and water; simmer 15 minutes.',
      'Add small pasta and cook until tender, then stir in spinach and basil.',
    ],
  },
  {
    ...ITALY, id: 'pasta-primavera', n: 'Whole Wheat Pasta Primavera', c: 'dinner lunch', d: 'veg',
    t: [10, 15], tg: 'high-fiber',
    p: '1 plate (about 350 g)',
    i: 'ww-pasta 75, broccoli 60, zucchini 50, red-pepper 50, peas 30, garlic 4, olive-oil 10, parmesan 10, lemon 0.2, basil 3, dry-red-chilli 0.2, salt 1.5',
    s: [
      'Cook pasta in salted water; reserve a cup of pasta water.',
      'Sauté garlic and chilli in olive oil, then the vegetables until crisp-tender.',
      'Toss in pasta with lemon, a splash of pasta water and parmesan; finish with basil.',
    ],
  },
  {
    ...ITALY, id: 'penne-arrabbiata', n: 'Penne Arrabbiata', c: 'dinner lunch', d: 'vegan',
    t: [5, 20], tg: 'spicy quick',
    p: '1 plate (about 330 g) + side salad',
    i: 'ww-pasta 80, tomato-puree 150, garlic 5, dry-red-chilli 0.5, olive-oil 9, basil 3, lettuce 40, cucumber 40, salt 1.5',
    s: [
      'Sizzle garlic and chilli in olive oil; add passata and simmer 10 minutes.',
      'Cook pasta until al dente and toss in the sauce with a little pasta water.',
      'Finish with basil; serve with a green salad.',
    ],
  },
  {
    ...ITALY, id: 'pesto-chicken-pasta', n: 'Pesto Chicken Pasta', c: 'dinner', d: 'nonveg',
    t: [10, 20], tg: 'high-protein',
    p: '1 plate (100 g chicken)',
    i: 'ww-pasta 70, chicken-breast 100, basil 15, walnuts 8, parmesan 8, garlic 3, olive-oil 10, lemon 0.15, tomato 60, salt 1.5',
    s: [
      'Blend basil, walnuts, parmesan, garlic, lemon and olive oil into pesto.',
      'Sear sliced chicken until cooked through.',
      'Toss cooked pasta with pesto, chicken and halved cherry tomatoes.',
    ],
  },
  {
    ...AMER, id: 'grilled-chicken-veg', n: 'Herb Grilled Chicken with Roasted Vegetables', c: 'dinner lunch', d: 'nonveg',
    t: [15, 30], tg: 'high-protein gluten-free',
    p: '170 g chicken + 1 cup vegetables + ½ cup potato',
    i: 'chicken-breast 170, zucchini 80, red-pepper 60, broccoli 60, onion 40, potato 100, olive-oil 12, garlic 4, oregano 1, lemon 0.25, black-pepper 0.3, salt 1.5',
    s: [
      'Marinate chicken in olive oil, garlic, lemon, herbs, salt and pepper.',
      'Toss vegetables and potato with oil and salt; roast at 220 °C for 25 minutes.',
      'Grill chicken 6–7 minutes per side; rest and slice.',
    ],
  },
  {
    ...FRANCE, id: 'lemon-herb-fish', n: 'Lemon Herb Baked Fish', c: 'dinner', d: 'nonveg',
    t: [10, 20], tg: 'light high-protein gluten-free',
    p: '1 fillet (170 g) + vegetables + ½ cup potatoes',
    i: 'fish 170, lemon 0.4, garlic 3, parsley 5, olive-oil 8, green-beans 100, potato 100, butter 3, black-pepper 0.3, salt 1.5',
    s: [
      'Place fish on a tray, top with garlic, lemon slices, parsley, olive oil, salt and pepper.',
      'Bake at 200 °C for 12–15 minutes.',
      'Serve with steamed green beans and buttered new potatoes.',
    ],
  },
  {
    ...EURO, id: 'salmon-quinoa-bowl', n: 'Salmon Quinoa Bowl', c: 'lunch dinner', d: 'nonveg',
    t: [10, 20], tg: 'high-protein omega-3 gluten-free',
    p: '1 bowl (130 g salmon)',
    i: 'salmon 130, quinoa 50, spinach 40, cucumber 60, avocado 0.3, tomato 50, lemon 0.25, olive-oil 5, black-pepper 0.2, salt 1',
    s: [
      'Rinse and cook quinoa 15 minutes; fluff.',
      'Season salmon and pan-sear skin-side down until crisp, then flip briefly.',
      'Build bowls with quinoa, greens, vegetables, avocado and salmon; dress with lemon and oil.',
    ],
  },
  {
    ...FRANCE, id: 'ratatouille', n: 'Ratatouille with Quinoa', c: 'dinner lunch', d: 'vegan',
    t: [15, 35], tg: 'high-fiber',
    p: '1 bowl ratatouille + ½ cup quinoa',
    i: 'brinjal 100, zucchini 100, red-pepper 80, tomato 120, onion 50, garlic 5, olive-oil 10, oregano 0.5, basil 3, quinoa 40, salt 1.5',
    s: [
      'Sauté onion and garlic in olive oil; add peppers.',
      'Add eggplant and zucchini, then tomatoes and herbs.',
      'Simmer covered 25 minutes until silky; finish with basil. Serve with quinoa.',
    ],
  },
  {
    ...ITALY, id: 'mushroom-risotto', n: 'Mushroom Risotto', c: 'dinner', d: 'veg',
    t: [10, 30], tg: 'comfort gluten-free',
    p: '1 plate (about 320 g) + salad',
    i: 'rice 70, mushroom 120, onion 40, garlic 3, butter 6, olive-oil 5, parmesan 12, peas 30, oregano 0.3, lettuce 40, salt 1.5',
    s: [
      'Sauté mushrooms until browned; set aside.',
      'Soften onion and garlic, toast the rice, then add hot stock a ladle at a time, stirring, for 18 minutes.',
      'Stir in mushrooms, peas, butter and parmesan. Serve with a green salad.',
    ],
  },
  {
    ...BRIT, id: 'chicken-veg-stew', n: 'Chicken and Vegetable Stew', c: 'dinner', d: 'nonveg',
    t: [15, 40], tg: 'comfort high-protein one-pot',
    p: '1 large bowl + 1 slice bread',
    i: 'chicken 150, potato 100, carrot 60, celery 30, onion 50, peas 30, garlic 3, maida 5, olive-oil 6, oregano 0.5, bay-leaf 0.2, ww-bread 1, black-pepper 0.3, salt 1.5',
    s: [
      'Brown chicken pieces in olive oil; remove.',
      'Soften onion, celery and garlic; stir in flour.',
      'Add stock, chicken, potato, carrot and herbs; simmer 30 minutes, then peas for 5. Serve with bread.',
    ],
  },
  {
    ...FRANCE, id: 'french-lentil-soup', n: 'French Lentil Soup with Toast', c: 'dinner lunch', d: 'vegan',
    t: [10, 30], tg: 'soup high-protein high-fiber',
    p: '1 large bowl + 1 slice toast',
    i: 'brown-lentils 55, onion 40, carrot 40, celery 30, tomato-puree 60, garlic 3, olive-oil 6, oregano 0.5, bay-leaf 0.2, spinach 30, ww-bread 1, lemon 0.1, salt 1.5',
    s: [
      'Sauté onion, carrot, celery and garlic in olive oil.',
      'Add lentils, tomato, herbs and water; simmer 25 minutes.',
      'Stir in spinach and lemon; serve with toast.',
    ],
  },
  {
    ...AMER, id: 'light-caesar-chicken', n: 'Light Chicken Caesar Salad', c: 'lunch dinner', d: 'nonveg',
    t: [15, 12], tg: 'high-protein',
    p: '1 large bowl (130 g chicken)',
    i: 'chicken-breast 130, lettuce 120, ww-bread 1, parmesan 10, greek-yogurt 40, lemon 0.25, garlic 2, olive-oil 6, black-pepper 0.3, salt 1',
    s: [
      'Grill seasoned chicken and slice.',
      'Cube bread and bake with a little oil into croutons.',
      'Whisk yogurt, lemon, garlic, grated parmesan, oil and pepper into a light dressing.',
      'Toss lettuce with dressing; top with chicken, croutons and more parmesan.',
    ],
  },
  {
    ...FRANCE, id: 'nicoise-salad', n: 'Salade Niçoise', c: 'lunch', d: 'nonveg',
    t: [15, 12], tg: 'high-protein gluten-free',
    p: '1 large plate',
    i: 'tuna 90, egg 1, potato 100, green-beans 80, tomato 80, lettuce 50, olives 15, olive-oil 8, vinegar 5, lemon 0.15, salt 1',
    s: [
      'Boil potatoes, green beans and egg; cool.',
      'Arrange lettuce, potatoes, beans, tomato, olives, halved egg and tuna on a plate.',
      'Dress with olive oil, vinegar, lemon, salt and pepper.',
    ],
  },
  {
    ...AMER, id: 'stuffed-peppers', n: 'Quinoa and Bean Stuffed Peppers', c: 'dinner', d: 'veg',
    t: [15, 30], adv: 'Cooked kidney or black beans', tg: 'high-fiber gluten-free baked',
    p: '2 pepper halves + salad',
    i: 'red-pepper 200, quinoa 35, black-beans 30, corn 40, onion 30, tomato-puree 50, cumin-powder 1, paprika 0.5, cheese 20, olive-oil 5, lettuce 40, salt 1.2',
    s: [
      'Cook quinoa.',
      'Sauté onion with spices; add beans, corn, tomato and quinoa.',
      'Fill halved peppers, top with cheese and bake at 190 °C for 25 minutes.',
    ],
  },
  {
    ...ITALY, id: 'veg-lasagne', n: 'Spinach Mushroom Lasagne', c: 'dinner', d: 'veg',
    t: [30, 40], tg: 'festive baked',
    p: '1 slice (about 350 g)',
    i: 'maida 50, spinach 80, mushroom 80, tomato-puree 120, onion 40, garlic 3, milk 100, butter 8, mozzarella 35, parmesan 8, olive-oil 5, oregano 0.5, salt 1.5',
    s: [
      'Make a tomato-mushroom sauce with onion, garlic and herbs.',
      'Make a white sauce with butter, flour and milk; stir in wilted spinach.',
      'Layer dried lasagne sheets, sauces and mozzarella; finish with parmesan.',
      'Bake at 190 °C for 35–40 minutes; rest 10 minutes before slicing.',
    ],
  },
  {
    ...AMER, id: 'tomato-soup-grilled-cheese', n: 'Tomato Soup with Grilled Cheese', c: 'dinner lunch', d: 'veg',
    t: [10, 25], tg: 'comfort',
    p: '1 bowl soup + 1 sandwich',
    i: 'tomato 250, onion 40, carrot 30, garlic 3, olive-oil 6, basil 3, milk 40, ww-bread 2, cheese 30, butter 5, black-pepper 0.2, salt 1.5',
    s: [
      'Roast or sauté tomatoes, onion, carrot and garlic in olive oil; add water and simmer 15 minutes.',
      'Blend with basil and a splash of milk; season.',
      'Fill bread with cheese, butter the outside and toast in a pan until golden.',
    ],
  },
  {
    ...EURO, id: 'pumpkin-soup', n: 'Roasted Pumpkin Soup with Seeds', c: 'dinner', d: 'vegan',
    t: [10, 35], tg: 'soup light',
    p: '1 large bowl + 1 slice bread',
    i: 'pumpkin 250, onion 40, garlic 3, ginger 3, olive-oil 6, pumpkin-seeds 8, coconut-milk 25, cumin-powder 0.5, ww-bread 1, salt 1.3',
    s: [
      'Roast pumpkin chunks with onion and garlic at 210 °C for 25 minutes.',
      'Blend with ginger, cumin, hot water and coconut milk.',
      'Top with toasted pumpkin seeds; serve with bread.',
    ],
  },
  {
    ...ITALY, id: 'chicken-meatballs-marinara', n: 'Chicken Meatballs in Marinara', c: 'dinner', d: 'nonveg',
    t: [20, 25], tg: 'high-protein',
    p: '5 meatballs + sauce + ½ cup pasta',
    i: 'chicken-breast 140, oats 15, egg 0.3, onion 30, garlic 4, parmesan 8, tomato-puree 150, olive-oil 7, basil 3, oregano 0.5, ww-pasta 40, salt 1.5',
    s: [
      'Mix minced chicken with oats, egg, grated onion, garlic, parmesan, herbs and salt; roll into balls.',
      'Brown meatballs in olive oil; add passata and simmer 15 minutes.',
      'Serve over pasta with basil.',
    ],
  },
  {
    ...AMER, id: 'mac-and-cheese', n: 'Baked Mac and Cheese', c: 'dinner', d: 'veg',
    t: [10, 30], tg: 'comfort baked',
    p: '1 bowl (about 300 g)',
    i: 'ww-pasta 80, cheese 50, milk 150, butter 12, maida 10, broccoli 60, black-pepper 0.2, salt 1',
    s: [
      'Cook pasta and broccoli; drain.',
      'Make a sauce with butter, flour and milk; stir in most of the cheese.',
      'Combine, top with remaining cheese and bake at 200 °C until bubbling.',
    ],
  },
  {
    ...ITALY, id: 'margherita-pizza', n: 'Whole Wheat Margherita Pizza', c: 'dinner', d: 'veg',
    t: [20, 12], adv: 'Dough rises 1 h', tg: 'baked',
    p: '½ medium pizza + side salad',
    i: 'atta 50, maida 30, yeast 1, olive-oil 8, tomato-puree 60, mozzarella 50, basil 4, oregano 0.3, lettuce 40, tomato 40, salt 1.2',
    s: [
      'Knead flours with yeast, salt, oil and warm water; let rise.',
      'Stretch thin, spread seasoned passata and top with mozzarella.',
      'Bake on the hottest oven setting for 8–12 minutes; finish with basil.',
    ],
  },
  {
    ...ITALY, id: 'caprese-panzanella', n: 'Caprese Panzanella', c: 'lunch', d: 'veg',
    t: [15, 5], tg: 'summer no-cook',
    p: '1 large bowl',
    i: 'tomato 180, mozzarella 50, ww-bread 1.5, cucumber 60, onion 15, basil 6, olive-oil 10, vinegar 5, salt 1',
    s: [
      'Toast cubed bread until crisp.',
      'Toss tomatoes, cucumber and onion with salt, vinegar and olive oil; rest 10 minutes.',
      'Add bread, torn mozzarella and basil; toss.',
    ],
  },
  {
    ...BRIT, id: 'baked-fish-chips', n: 'Oven Fish and Chips with Peas', c: 'dinner', d: 'nonveg',
    t: [15, 30], tg: 'baked high-protein',
    p: '1 fillet (150 g) + chips + peas',
    i: 'fish 150, ww-bread 0.7, egg 0.3, potato 180, olive-oil 12, peas 80, mint 2, lemon 0.25, salt 1.5',
    s: [
      'Cut potatoes into wedges, toss with oil and salt; roast at 220 °C for 30 minutes.',
      'Dip fish in egg then breadcrumbs; bake on a greased tray for the last 15 minutes.',
      'Crush cooked peas with mint and lemon.',
    ],
  },
  {
    ...AMER, id: 'chicken-veg-skewers', n: 'Chicken and Vegetable Skewers with Couscous', c: 'dinner lunch', d: 'nonveg',
    t: [20, 15], adv: 'Marinate 1 h', tg: 'high-protein grilled',
    p: '2 skewers (150 g chicken) + ½ cup couscous',
    i: 'chicken-breast 150, red-pepper 60, onion 40, zucchini 60, olive-oil 10, lemon 0.25, garlic 3, paprika 1, oregano 0.5, couscous 40, parsley 4, salt 1.5',
    s: [
      'Marinate chicken in oil, lemon, garlic, paprika and oregano.',
      'Thread with vegetables and grill 12–15 minutes, turning.',
      'Pour boiling water over couscous, cover 5 minutes, fluff with parsley.',
    ],
  },

  // ---------------- desserts
  {
    ...BRIT, id: 'apple-oat-crumble', n: 'Apple Oat Crumble', c: 'dessert', d: 'veg',
    t: [10, 30], tg: 'baked warming',
    p: '1 small dish (about 150 g) + yogurt',
    i: 'apple 0.8, oats 20, atta 10, butter 8, honey 8, cinnamon 0.5, walnuts 5, greek-yogurt 40',
    s: [
      'Slice apples into a dish with cinnamon and half the honey.',
      'Rub oats, flour and butter with remaining honey and walnuts into a crumble.',
      'Scatter on top and bake at 190 °C for 25–30 minutes; serve with yogurt.',
    ],
  },
  {
    ...EURO, id: 'choc-avocado-mousse', n: 'Chocolate Avocado Mousse', c: 'dessert', d: 'vegan',
    t: [10, 0], adv: 'Chill 1 h', tg: 'no-cook',
    p: '1 small cup (about 110 g)',
    i: 'avocado 0.4, cocoa 8, banana 0.3, jaggery 8, berries 30',
    s: [
      'Blend ripe avocado, banana, cocoa and jaggery or maple syrup until silky.',
      'Chill and top with berries.',
    ],
  },
  {
    ...ITALY, id: 'yogurt-panna-cotta', n: 'Yogurt Panna Cotta with Berries', c: 'dessert', d: 'veg',
    t: [10, 5], adv: 'Chill 4 h', tg: 'chilled gluten-free',
    p: '1 cup (about 150 g)',
    i: 'greek-yogurt 80, milk 50, cornflour 4, honey 8, berries 50',
    s: [
      'Warm milk with honey and cornflour (or agar) until thickened.',
      'Whisk into yogurt, pour into cups and chill to set.',
      'Top with a quick berry compote.',
    ],
  },
  {
    ...AMER, id: 'banana-oat-cookies', n: 'Banana Oat Cookies', c: 'dessert snack', d: 'vegan',
    t: [10, 15], tg: 'baked no-sugar',
    p: '2 cookies (about 50 g)',
    i: 'oats 20, banana 0.4, peanut-butter 5, raisins 5, cinnamon 0.2, dark-chocolate 4',
    s: [
      'Mash banana with peanut butter; stir in oats, raisins, cinnamon and chopped chocolate.',
      'Scoop onto a lined tray and flatten.',
      'Bake at 180 °C for 12–15 minutes.',
    ],
  },
  {
    ...EURO, id: 'chia-berry-pudding', n: 'Berry Chia Pudding', c: 'dessert breakfast', d: 'veg',
    t: [5, 0], adv: 'Chill 4 h or overnight', tg: 'no-cook high-fiber',
    p: '1 jar (about 200 g)',
    i: 'chia-seeds 20, milk 140, honey 6, berries 60',
    s: [
      'Stir chia into milk with honey; stir again after 10 minutes.',
      'Chill until set and top with berries.',
    ],
  },
  {
    ...FRANCE, id: 'choc-strawberries', n: 'Dark Chocolate Dipped Strawberries', c: 'dessert', d: 'vegan',
    t: [10, 3], adv: 'Chill 20 min', tg: 'no-bake gluten-free',
    p: '6 strawberries',
    i: 'berries 100, dark-chocolate 15',
    s: [
      'Melt dark chocolate gently.',
      'Dip strawberries halfway and set on parchment until firm.',
    ],
  },
  {
    ...AMER, id: 'fudgy-brownies', n: 'Fudgy Brownies', c: 'dessert', d: 'egg',
    t: [15, 25], tg: 'baked festive',
    p: '1 square (about 60 g)',
    i: 'dark-chocolate 18, butter 12, sugar 18, egg 0.4, maida 8, cocoa 3, walnuts 5',
    s: [
      'Melt chocolate with butter; whisk in sugar and eggs.',
      'Fold in flour, cocoa and walnuts.',
      'Bake at 175 °C for 20–25 minutes; cool before slicing.',
    ],
  },
]);
