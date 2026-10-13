import { cuisine } from '../dsl';

const L = { st: 'Lebanese', rg: 'Levant', o: 'Lebanon' } as const;

export const lebanese = cuisine('lebanese', [
  // ---------------- breakfast
  {
    ...L, id: 'manakish-zaatar', n: "Manakish Za'atar with Salad", c: 'breakfast', d: 'vegan',
    t: [20, 10], adv: 'Dough rises 1 h', tg: 'baked',
    p: '1 flatbread + tomato, cucumber, mint',
    i: 'atta 45, maida 20, yeast 1, sugar 1, zaatar 8, olive-oil 10, tomato 60, cucumber 60, mint 3, olives 10, salt 1',
    s: [
      'Knead the flours with yeast, sugar, salt and warm water into a soft dough; let rise 1 hour.',
      "Mix za'atar with olive oil to a loose paste.",
      'Press the dough into a thin round, spread the za’atar oil, and bake at 250 °C for 7–9 minutes.',
      'Serve with sliced tomato, cucumber, mint and olives.',
    ],
  },
  {
    ...L, id: 'foul-mudammas', n: 'Foul Mudammas', c: 'breakfast lunch', d: 'vegan',
    t: [10, 20], adv: 'Soak dried fava beans overnight and boil 1 h (or use canned)', tg: 'high-protein high-fiber',
    p: '1 bowl foul + ½ pita + vegetables',
    i: 'fava-beans 50, garlic 3, lemon 0.4, cumin-powder 1, olive-oil 8, tomato 50, parsley 5, radish 30, mint 2, pita 0.5, salt 1.5',
    s: [
      'Simmer cooked fava beans in a little of their liquid until very soft.',
      'Mash roughly with crushed garlic, lemon juice, cumin and salt.',
      'Top with diced tomato, parsley and a drizzle of olive oil; serve with pita, radish and mint.',
    ],
  },
  {
    ...L, id: 'balila', n: 'Balila (Warm Spiced Chickpeas)', c: 'breakfast snack', d: 'vegan',
    t: [5, 10], adv: 'Soak chickpeas overnight and boil', tg: 'high-protein high-fiber',
    p: '1 bowl (about 200 g)',
    i: 'chickpeas 50, garlic 3, lemon 0.3, cumin-powder 1, olive-oil 7, parsley 4, salt 1',
    s: [
      'Warm cooked chickpeas in their liquid.',
      'Drain and toss with crushed garlic, lemon juice, cumin, salt and olive oil.',
      'Finish with parsley.',
    ],
  },
  {
    ...L, id: 'labneh-plate', n: 'Labneh Breakfast Plate', c: 'breakfast', d: 'veg',
    t: [10, 0], tg: 'no-cook quick',
    p: '4 tbsp labneh + ½ pita + vegetables + olives',
    i: 'labneh 70, olive-oil 5, zaatar 2, pita 0.75, cucumber 80, tomato 80, mint 3, olives 15',
    s: [
      "Spread labneh on a plate, make a well and fill with olive oil; sprinkle za'atar.",
      'Arrange cucumber, tomato, mint and olives alongside.',
      'Serve with warm pita.',
    ],
  },
  {
    ...L, id: 'beid-bi-banadoura', n: 'Beid bi Banadoura (Eggs with Tomato)', c: 'breakfast dinner', d: 'egg',
    t: [5, 15], tg: 'quick high-protein',
    p: '2 eggs in tomato + ½ pita',
    i: 'egg 2, tomato 150, onion 40, garlic 2, olive-oil 7, cumin-powder 0.5, chilli-powder 0.3, parsley 3, pita 0.5, salt 1',
    s: [
      'Soften onion and garlic in olive oil.',
      'Add chopped tomatoes, cumin and chilli and cook until saucy.',
      'Crack in the eggs, cover and cook until the whites set; top with parsley and serve with pita.',
    ],
  },
  {
    ...L, id: 'fatteh-hummus', n: 'Fatteh Hummus', c: 'breakfast lunch', d: 'veg',
    t: [10, 10], adv: 'Cooked chickpeas', tg: 'high-protein',
    p: '1 bowl (about 300 g)',
    i: 'chickpeas 45, pita 0.75, curd 120, tahini 10, garlic 3, lemon 0.25, olive-oil 5, cumin-powder 0.5, paprika 0.3, parsley 3, salt 1',
    s: [
      'Toast torn pita in the oven until crisp; place in a bowl.',
      'Top with warm chickpeas and a splash of their liquid.',
      'Whisk yogurt with tahini, garlic, lemon and salt; spoon over.',
      'Finish with cumin, paprika, olive oil and parsley.',
    ],
  },
  {
    ...L, id: 'batata-wa-beid', n: 'Batata wa Beid (Potato & Egg Hash)', c: 'breakfast', d: 'egg',
    t: [10, 15], tg: 'comfort',
    p: '1 plate (2 eggs)',
    i: 'potato 150, egg 2, onion 40, olive-oil 8, sumac 1, seven-spice 0.5, parsley 3, tomato 60, salt 1',
    s: [
      'Sauté diced potato and onion in olive oil until golden and tender.',
      'Season with seven-spice and salt; pour in beaten eggs and stir gently until just set.',
      'Sprinkle with sumac and parsley; serve with sliced tomato.',
    ],
  },

  // ---------------- lunch & dinner
  {
    ...L, id: 'hummus-bowl', n: 'Hummus Bowl with Crudités', c: 'lunch snack', d: 'vegan',
    t: [15, 0], adv: 'Cooked chickpeas', tg: 'high-protein high-fiber no-cook',
    p: '1 bowl hummus + vegetables + ½ pita',
    i: 'chickpeas 55, tahini 15, garlic 3, lemon 0.4, olive-oil 6, cumin-powder 0.5, carrot 60, cucumber 80, red-pepper 60, pita 0.5, paprika 0.2, salt 1',
    s: [
      'Blend warm chickpeas with tahini, garlic, lemon, salt and ice water until very smooth.',
      'Swirl into a bowl, drizzle olive oil and dust with paprika and cumin.',
      'Serve with carrot, cucumber and pepper sticks and pita.',
    ],
  },
  {
    ...L, id: 'shish-tawook-tabbouleh', n: 'Shish Tawook with Tabbouleh', c: 'lunch dinner', d: 'nonveg',
    t: [25, 15], adv: 'Marinate chicken 2 h', tg: 'high-protein grilled',
    p: '180 g chicken skewers + 1 bowl tabbouleh + garlic yogurt',
    i: 'chicken-breast 180, curd 50, lemon 0.6, garlic 5, paprika 1, tomato-paste 5, olive-oil 12, bulgur 20, parsley 40, mint 8, tomato 80, onion 15, seven-spice 0.3, salt 2',
    s: [
      'Marinate chicken cubes in yogurt, lemon, garlic, paprika, tomato paste, a little oil and salt.',
      'Thread on skewers and grill or broil 12–15 minutes, turning, until charred.',
      'Soak fine bulgur in lemon juice; toss with lots of chopped parsley, mint, tomato, onion, olive oil and salt.',
      'Serve with a spoon of garlic yogurt.',
    ],
  },
  {
    ...L, id: 'fattoush-halloumi', n: 'Fattoush with Grilled Halloumi', c: 'lunch dinner', d: 'veg',
    t: [15, 10], tg: 'light',
    p: '1 large salad bowl (60 g cheese)',
    i: 'lettuce 80, tomato 80, cucumber 80, radish 30, red-pepper 40, spring-onion 15, parsley 10, mint 5, pita 0.5, feta 60, sumac 2, lemon 0.4, olive-oil 10, pomegranate 20, salt 1',
    s: [
      'Toast pita pieces until crisp.',
      'Chop the vegetables and herbs into a bowl.',
      'Whisk lemon, olive oil, sumac and salt; toss with salad and pita just before serving.',
      'Grill halloumi slices until golden and place on top with pomegranate.',
    ],
  },
  {
    ...L, id: 'mujadara', n: 'Mujadara with Salata', c: 'lunch dinner', d: 'vegan',
    t: [10, 35], tg: 'high-fiber one-pot comfort',
    p: '1 plate mujadara + tomato-cucumber salad',
    i: 'brown-lentils 50, rice 35, onion 100, olive-oil 12, cumin-powder 1, seven-spice 0.5, tomato 70, cucumber 70, lemon 0.25, mint 3, curd 60?, salt 2',
    s: [
      'Simmer lentils 15 minutes until half cooked.',
      'Slowly fry sliced onions in olive oil until deep brown; set half aside.',
      'Add rice, lentils, spices, salt and water to the pot; cover and cook 18 minutes.',
      'Top with crispy onions; serve with salad and yogurt.',
    ],
  },
  {
    ...L, id: 'shorbat-adas', n: 'Shorbat Adas (Lemony Lentil Soup)', c: 'dinner lunch', d: 'vegan',
    t: [10, 25], tg: 'soup high-protein high-fiber light',
    p: '1 large bowl + ½ pita',
    i: 'masoor-dal 55, onion 50, carrot 40, potato 40, garlic 3, cumin-powder 1.5, turmeric 0.3, olive-oil 6, lemon 0.4, parsley 3, pita 0.5, salt 1.5',
    s: [
      'Sauté onion, carrot and garlic in olive oil.',
      'Add lentils, potato, cumin, turmeric and water; simmer 20 minutes.',
      'Blend until smooth, season, and serve with plenty of lemon, parsley and toasted pita.',
    ],
  },
  {
    ...L, id: 'baba-ghanoush-plate', n: 'Baba Ghanoush Mezze Plate', c: 'lunch snack', d: 'vegan',
    t: [10, 25], tg: 'smoky light',
    p: '1 plate baba ghanoush + vegetables + ½ pita',
    i: 'brinjal 250, tahini 12, garlic 3, lemon 0.3, olive-oil 5, pomegranate 20, parsley 3, cucumber 60, red-pepper 50, pita 0.5, salt 1',
    s: [
      'Char whole eggplant on a flame or under the grill until collapsed; cool and scoop out the flesh.',
      'Mash with tahini, garlic, lemon and salt.',
      'Top with olive oil, pomegranate and parsley; serve with vegetables and pita.',
    ],
  },
  {
    ...L, id: 'baked-falafel-wrap', n: 'Baked Falafel Wrap', c: 'lunch dinner', d: 'vegan',
    t: [20, 25], adv: 'Soak dried chickpeas overnight (do not cook)', tg: 'baked high-fiber',
    p: '1 wrap with 4 falafel',
    i: 'chickpeas 50, onion 20, garlic 3, parsley 10, coriander-leaves 5, cumin-powder 1, coriander-powder 1, baking-soda 0.3, olive-oil 8, pita 1, tahini 10, lemon 0.2, tomato 50, cucumber 50, lettuce 20, salt 1.5',
    s: [
      'Pulse soaked raw chickpeas with onion, garlic, herbs, spices and salt to a coarse paste; stir in soda.',
      'Shape into patties, brush with oil and bake at 200 °C for 20–25 minutes, flipping once.',
      'Thin tahini with lemon and water for the sauce.',
      'Fill pita with falafel, salad and tahini sauce.',
    ],
  },
  {
    ...L, id: 'kafta-meshwi', n: 'Kafta Meshwi with Salad', c: 'dinner lunch', d: 'nonveg',
    t: [15, 12], tg: 'high-protein grilled',
    p: '3 kafta skewers (120 g) + salad + ½ pita',
    i: 'lamb-mince 120, onion 50, parsley 10, seven-spice 1, tomato 80, cucumber 80, sumac 1, lemon 0.25, olive-oil 5, pita 0.5, salt 1.5',
    s: [
      'Mix mince with grated onion, chopped parsley, seven-spice and salt; knead well.',
      'Mould onto skewers and grill 10–12 minutes, turning.',
      'Toss tomato, cucumber and sliced onion with sumac, lemon and olive oil; serve with pita.',
    ],
  },
  {
    ...L, id: 'samke-harra', n: 'Samke Harra (Spicy Fish with Tahini)', c: 'dinner', d: 'nonveg',
    t: [15, 25], tg: 'high-protein',
    p: '1 fillet (150 g) in sauce + ½ cup rice',
    i: 'fish 150, tahini 15, lemon 0.4, garlic 5, coriander-leaves 8, dry-red-chilli 0.5, onion 40, olive-oil 8, walnuts 5, rice 35, cumin-powder 0.5, salt 1.5',
    s: [
      'Season fish with cumin and salt and bake at 200 °C for 10 minutes.',
      'Sauté onion, garlic, coriander and chilli in olive oil.',
      'Whisk tahini with lemon and water until pourable; stir into the pan and spread over the fish.',
      'Bake 10 minutes more; top with walnuts and serve with rice.',
    ],
  },
  {
    ...L, id: 'loubieh-bi-zeit', n: 'Loubieh bi Zeit (Green Beans in Olive Oil)', c: 'lunch dinner', d: 'vegan',
    t: [10, 30], tg: 'light',
    p: '1 bowl beans + ½ cup vermicelli rice',
    i: 'green-beans 200, tomato 120, onion 50, garlic 5, olive-oil 10, seven-spice 0.3, rice 35, vermicelli 5, salt 1.5',
    s: [
      'Sauté onion and garlic in olive oil; add trimmed beans and cook 5 minutes.',
      'Add chopped tomato, seven-spice and salt; cover and simmer until beans are soft, about 25 minutes.',
      'Toast vermicelli, add rice and water and cook for the side.',
    ],
  },
  {
    ...L, id: 'bamieh', n: 'Bamieh bi Lahmeh (Okra Stew) with Rice', c: 'dinner lunch', d: 'nonveg',
    t: [15, 40], tg: 'high-protein',
    p: '1 bowl stew + ½ cup rice',
    i: 'okra 150, mutton 80, tomato-puree 80, tomato-paste 10, onion 40, garlic 5, coriander-leaves 5, olive-oil 8, seven-spice 0.5, lemon 0.2, rice 45, salt 1.5',
    s: [
      'Brown meat with onion in olive oil; add water and simmer 25 minutes.',
      'Fry okra separately until bright; sauté garlic and coriander.',
      'Add okra, garlic-coriander, tomato and spices to the meat; simmer 15 minutes; finish with lemon.',
    ],
  },
  {
    ...L, id: 'maghmour', n: "Maghmour (Lebanese Moussaka'a)", c: 'dinner', d: 'vegan',
    t: [15, 35], adv: 'Cooked chickpeas', tg: 'high-fiber',
    p: '1 bowl + ½ pita',
    i: 'brinjal 200, chickpeas 35, onion 50, garlic 5, tomato 120, tomato-paste 10, olive-oil 12, chilli-powder 0.3, mint 2, pita 0.5, salt 1.5',
    s: [
      'Cube eggplant, toss with a little oil and roast at 220 °C until golden.',
      'Sauté onion and garlic, add tomato, paste, chilli and chickpeas and simmer.',
      'Fold in the eggplant and cook 10 minutes; finish with dried mint. Serve warm or at room temperature.',
    ],
  },
  {
    ...L, id: 'kibbeh-saniyeh', n: 'Kibbeh bil Saniyeh (Baked Kibbeh)', c: 'dinner', d: 'nonveg',
    t: [30, 35], tg: 'high-protein festive',
    p: '1 slice (about 200 g) + cucumber yogurt',
    i: 'bulgur 45, lamb-mince 100, onion 50, seven-spice 1.5, cinnamon 0.2, walnuts 6, olive-oil 8, curd 80, cucumber 50, mint 2, salt 1.5',
    s: [
      'Soak fine bulgur 15 minutes and squeeze dry; knead with two-thirds of the mince, grated onion, spices and salt.',
      'Brown remaining mince with chopped onion and walnuts for the filling.',
      'Press half the shell into a tray, add the filling, top with the rest; score into diamonds and brush with oil.',
      'Bake at 200 °C for 30 minutes; serve with cucumber-mint yogurt.',
    ],
  },
  {
    ...L, id: 'riz-a-djej', n: "Riz a Djej (Spiced Chicken and Rice)", c: 'lunch dinner', d: 'nonveg',
    t: [15, 35], tg: 'festive high-protein one-pot',
    p: '1 plate (130 g chicken) + yogurt',
    i: 'chicken 130, rice 65, onion 30, seven-spice 1.5, cinnamon 0.3, almonds 6, cashews 4, olive-oil 8, curd 80, salt 2',
    s: [
      'Poach chicken with onion and cinnamon; shred and keep the broth.',
      'Toast rice in oil with seven-spice, add broth and cook covered.',
      'Top with shredded chicken and toasted nuts; serve with yogurt.',
    ],
  },
  {
    ...L, id: 'sayadieh', n: 'Sayadieh (Fish and Caramelised Onion Rice)', c: 'dinner', d: 'nonveg',
    t: [15, 35], tg: 'high-protein',
    p: '1 plate (140 g fish) + tahini sauce',
    i: 'fish 140, rice 60, onion 80, cumin-powder 1, cinnamon 0.2, olive-oil 10, almonds 5, tahini 8, lemon 0.25, salt 2',
    s: [
      'Caramelise onions slowly in oil until dark; simmer with water to make a brown stock and strain.',
      'Cook rice in the onion stock with cumin and cinnamon.',
      'Pan-sear seasoned fish; serve over rice with toasted almonds and lemony tahini sauce.',
    ],
  },
  {
    ...L, id: 'malfouf-salad', n: 'Malfouf Salad with Chickpeas', c: 'lunch dinner', d: 'vegan',
    t: [15, 0], adv: 'Cooked chickpeas', tg: 'light no-cook',
    p: '1 large bowl',
    i: 'cabbage 150, chickpeas 40, tomato 50, garlic 2, lemon 0.4, olive-oil 8, mint 3, pita 0.5, salt 1.5',
    s: [
      'Shred cabbage very finely and salt lightly.',
      'Mash garlic with salt, lemon and olive oil; add dried mint.',
      'Toss with cabbage, chickpeas and tomatoes; serve with pita.',
    ],
  },
  {
    ...L, id: 'batata-harra', n: 'Batata Harra (Oven Spicy Potatoes)', c: 'snack', d: 'vegan',
    t: [10, 30], tg: 'baked',
    p: '1 side bowl (about 180 g)',
    i: 'potato 180, olive-oil 8, garlic 4, coriander-leaves 6, dry-red-chilli 0.5, lemon 0.2, paprika 0.5, salt 1',
    s: [
      'Toss cubed potatoes with olive oil, paprika and salt; roast at 220 °C for 25–30 minutes.',
      'Fry garlic, coriander and chilli in a little oil for a minute.',
      'Toss potatoes with the garlic-coriander mix and lemon juice.',
    ],
  },

  // ---------------- desserts
  {
    ...L, id: 'riz-bi-haleeb', n: 'Riz bi Haleeb (Rice Pudding)', c: 'dessert', d: 'veg',
    t: [5, 30], adv: 'Chill 1 h', tg: 'gluten-free',
    p: '1 small bowl (about 150 g)',
    i: 'rice 15, milk 150, sugar 10, rose-water 3, pistachios 3',
    s: [
      'Simmer rice in water until soft, then add milk and cook on low, stirring, until creamy.',
      'Stir in sugar and orange blossom or rose water.',
      'Chill and top with crushed pistachios.',
    ],
  },
  {
    ...L, id: 'layali-lubnan', n: 'Light Layali Lubnan', c: 'dessert', d: 'veg',
    t: [10, 15], adv: 'Chill 2 h', tg: 'festive',
    p: '1 square (about 130 g)',
    i: 'semolina 15, milk 120, sugar 8, rose-water 3, greek-yogurt 30, banana 0.3, pistachios 3, honey 4',
    s: [
      'Cook semolina in milk with sugar, stirring, until thick; add blossom water and set in a dish.',
      'Spread whipped Greek yogurt on top once cool.',
      'Top with banana slices, pistachios and a thin drizzle of honey; chill.',
    ],
  },
  {
    ...L, id: 'sfouf', n: 'Sfouf (Turmeric Semolina Cake)', c: 'dessert snack', d: 'veg',
    t: [10, 30], tg: 'baked',
    p: '1 square (about 50 g)',
    i: 'semolina 18, maida 6, sugar 10, turmeric 0.4, baking-soda 0.4, oil 5, milk 25, sesame-seeds 1',
    s: [
      'Whisk semolina, flour, turmeric and baking powder.',
      'Add sugar, oil and milk to form a pourable batter.',
      'Pour into a greased tin, scatter sesame and bake at 180 °C for 30 minutes.',
    ],
  },
  {
    ...L, id: 'meghli', n: 'Meghli (Spiced Rice Pudding)', c: 'dessert', d: 'vegan',
    t: [5, 25], adv: 'Chill 2 h', tg: 'festive gluten-free',
    p: '1 small bowl (about 150 g) + nuts',
    i: 'rice-flour 15, sugar 10, cinnamon 1, fennel-seeds 0.5, coconut 6, walnuts 5, almonds 4',
    s: [
      'Whisk rice flour, sugar, cinnamon and ground fennel/caraway into cold water.',
      'Cook, stirring, until thick and glossy, about 20 minutes.',
      'Set in bowls, chill, and top with coconut and soaked nuts.',
    ],
  },
  {
    ...L, id: 'date-maamoul', n: 'Date Maamoul', c: 'dessert snack', d: 'veg',
    t: [30, 20], adv: 'Rest semolina dough overnight', tg: 'festive baked',
    p: '2 cookies (about 50 g)',
    i: 'semolina 20, ghee 8, sugar 3, rose-water 2, yeast 0.1, dates 15, cinnamon 0.1',
    s: [
      'Rub semolina with melted ghee and rest overnight.',
      'Knead with sugar, blossom water and a little yeast and water.',
      'Wrap around date paste balls, press into a mould, and bake at 200 °C until just golden at the base.',
    ],
  },
  {
    ...L, id: 'muhallabia', n: 'Muhallabia with Pistachio', c: 'dessert', d: 'veg',
    t: [5, 15], adv: 'Chill 2 h', tg: 'gluten-free',
    p: '1 cup (about 140 g)',
    i: 'milk 130, cornflour 8, sugar 9, rose-water 3, pistachios 4',
    s: [
      'Whisk cornflour into cold milk with sugar.',
      'Cook, stirring, until thick; add orange blossom or rose water.',
      'Pour into cups, chill and top with ground pistachios.',
    ],
  },
]);
