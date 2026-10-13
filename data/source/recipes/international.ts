import { cuisine } from '../dsl';

const THAI = { st: 'Thai', rg: 'Southeast Asia', o: 'Thailand' } as const;
const JAPAN = { st: 'Japanese', rg: 'East Asia', o: 'Japan' } as const;
const KOREA = { st: 'Korean', rg: 'East Asia', o: 'South Korea' } as const;
const MEX = { st: 'Mexican', rg: 'Latin America', o: 'Mexico' } as const;
const GREEK = { st: 'Greek', rg: 'Mediterranean', o: 'Greece' } as const;
const MOROCCO = { st: 'Moroccan', rg: 'North Africa', o: 'Morocco' } as const;
const TURK = { st: 'Turkish', rg: 'Middle East', o: 'Türkiye' } as const;
const VIET = { st: 'Vietnamese', rg: 'Southeast Asia', o: 'Vietnam' } as const;
const INDO = { st: 'Indonesian', rg: 'Southeast Asia', o: 'Indonesia' } as const;
const SPAIN = { st: 'Spanish', rg: 'Mediterranean', o: 'Spain' } as const;
const HAWAII = { st: 'Hawaiian', rg: 'Pacific', o: 'United States (Hawaii)' } as const;

export const international = cuisine('international', [
  // ---------------- breakfast
  {
    ...MOROCCO, st: 'North African', id: 'shakshuka', n: 'Shakshuka', c: 'breakfast dinner', d: 'egg',
    t: [10, 20], tg: 'high-protein one-pot',
    p: '2 eggs in sauce + 1 slice bread',
    i: 'egg 2, tomato 200, red-pepper 60, onion 40, garlic 4, olive-oil 8, cumin-powder 1, paprika 1, chilli-powder 0.3, parsley 4, feta 15, ww-bread 1, salt 1',
    s: [
      'Soften onion, pepper and garlic in olive oil; add cumin, paprika and chilli.',
      'Add chopped tomatoes and simmer until thick, about 10 minutes.',
      'Make wells, crack in the eggs, cover and cook until set; top with feta and parsley.',
    ],
  },
  {
    ...JAPAN, id: 'japanese-breakfast', n: 'Japanese Breakfast Set', c: 'breakfast', d: 'nonveg',
    t: [10, 15], tg: 'high-protein light',
    p: '1 bowl rice + miso soup + salmon + pickled cucumber',
    i: 'rice 55, salmon 80, miso 15, tofu 50, spring-onion 5, spinach 40, cucumber 50, vinegar 5, sugar 2, soy-sauce 4, salt 0.5',
    s: [
      'Cook short-grain rice.',
      'Dissolve miso in hot (not boiling) water with tofu cubes and spring onion.',
      'Salt and grill salmon until just flaky.',
      'Toss sliced cucumber with vinegar, sugar and salt; blanch spinach and dress with soy.',
    ],
  },
  {
    ...MEX, id: 'huevos-rancheros', n: 'Huevos Rancheros', c: 'breakfast', d: 'egg',
    t: [10, 15], adv: 'Cooked black beans', tg: 'high-protein high-fiber',
    p: '2 tortillas, 2 eggs, beans, salsa',
    i: 'tortilla 2, egg 2, black-beans 30, tomato-puree 60, onion 20, garlic 2, cumin-powder 0.5, chilli-powder 0.3, avocado 0.25, coriander-leaves 3, oil 5, lemon 0.15, salt 0.8',
    s: [
      'Warm tortillas in a dry pan.',
      'Simmer beans with onion, garlic, cumin, chilli and tomato into a quick sauce.',
      'Fry eggs sunny side up; place on tortillas with beans and sauce.',
      'Top with avocado, coriander and a squeeze of lime.',
    ],
  },
  {
    ...MEX, id: 'breakfast-burrito', n: 'Breakfast Burrito', c: 'breakfast lunch', d: 'egg',
    t: [10, 10], adv: 'Cooked black beans', tg: 'high-protein',
    p: '1 large burrito',
    i: 'tortilla 1.5, egg 2, black-beans 35, red-pepper 40, onion 25, spinach 30, cheese 15, salsa 40, oil 4, cumin-powder 0.3, salt 0.6',
    s: [
      'Sauté onion and pepper; add spinach and beans with cumin.',
      'Scramble eggs softly.',
      'Fill tortillas with eggs, vegetables, cheese and salsa; roll and toast seam-side down.',
    ],
  },
  {
    ...TURK, id: 'menemen', n: 'Menemen', c: 'breakfast', d: 'egg',
    t: [5, 15], tg: 'quick high-protein',
    p: '2 eggs + 1 slice bread + cucumber',
    i: 'egg 2, tomato 180, capsicum 60, onion 30, olive-oil 8, butter 3, chilli-powder 0.3, ww-bread 1, cucumber 60, olives 10, salt 0.8',
    s: [
      'Soften peppers and onion in olive oil and butter.',
      'Add grated tomatoes and cook until thick.',
      'Stir in beaten eggs gently until just set; serve with bread, cucumber and olives.',
    ],
  },
  {
    ...KOREA, id: 'gyeran-bap', n: 'Gyeran Bap (Egg Rice)', c: 'breakfast lunch', d: 'egg',
    t: [3, 7], tg: 'quick comfort',
    p: '1 bowl (2 eggs)',
    i: 'rice 60, egg 2, soy-sauce 6, sesame-oil 3, sesame-seeds 1, spring-onion 6, spinach 60, oil 3',
    s: [
      'Fry eggs with crispy edges.',
      'Place over hot rice with soy sauce and sesame oil.',
      'Top with spring onion and sesame; serve with seasoned blanched spinach. Mix before eating.',
    ],
  },
  {
    ...JAPAN, id: 'tamagoyaki-onigiri', n: 'Tamagoyaki with Onigiri', c: 'breakfast snack', d: 'egg',
    t: [15, 10], tg: 'lunchbox',
    p: '3 omelette slices + 2 rice balls',
    i: 'egg 2, sugar 3, soy-sauce 4, oil 3, rice 60, sesame-seeds 1, cucumber 50, salt 0.6',
    s: [
      'Whisk eggs with sugar and soy; cook in thin layers in a pan, rolling each layer into a log.',
      'Shape warm salted rice into triangles and sprinkle with sesame.',
      'Slice the omelette; serve with cucumber.',
    ],
  },
  {
    ...GREEK, id: 'greek-yogurt-honey-walnuts', n: 'Greek Yogurt with Honey, Walnuts and Fruit', c: 'breakfast dessert', d: 'veg',
    t: [5, 0], tg: 'no-cook high-protein quick',
    p: '1 bowl (about 250 g)',
    i: 'greek-yogurt 170, honey 8, walnuts 12, orange 0.5, cinnamon 0.2',
    s: [
      'Spoon yogurt into a bowl.',
      'Top with orange segments, toasted walnuts, cinnamon and a drizzle of honey.',
    ],
  },

  // ---------------- lunch & dinner
  {
    ...THAI, id: 'thai-green-curry-veg', n: 'Thai Green Curry with Tofu', c: 'dinner', d: 'vegan',
    t: [15, 20], tg: 'spicy',
    p: '1 bowl curry + 1 cup jasmine rice',
    i: 'tofu 100, thai-curry-paste 15, coconut-milk 90, zucchini 60, red-pepper 50, green-beans 40, brinjal 40, basil 4, lemongrass 3, soy-sauce 5, jaggery 3, oil 4, rice 60, lemon 0.15',
    s: [
      'Fry green curry paste in oil until fragrant.',
      'Add coconut milk, lemongrass and a little water; simmer.',
      'Add vegetables and tofu and cook until just tender; season with soy, palm sugar and lime.',
      'Finish with Thai basil; serve with jasmine rice.',
    ],
  },
  {
    ...THAI, id: 'tom-yum', n: 'Tom Yum Soup with Prawns', c: 'dinner lunch', d: 'nonveg',
    t: [10, 15], tg: 'soup light high-protein spicy',
    p: '1 large bowl (100 g prawns)',
    i: 'prawns 100, mushroom 60, tomato 50, lemongrass 6, ginger 5, dry-red-chilli 1, chilli-paste 5, fish-sauce 8, lemon 0.4, coriander-leaves 4, onion 20, rice 30',
    s: [
      'Simmer water with bruised lemongrass, galangal or ginger, and chillies for 5 minutes.',
      'Add mushrooms, tomato and onion, then prawns until pink.',
      'Season off heat with fish sauce, chilli paste and lime juice; garnish with coriander. Small portion of rice on the side.',
    ],
  },
  {
    ...THAI, id: 'pad-thai', n: 'Pad Thai with Tofu and Egg', c: 'dinner lunch', d: 'egg',
    t: [15, 10], adv: 'Soak rice noodles 20 min', tg: 'street',
    p: '1 plate (about 350 g)',
    i: 'rice-noodles 70, tofu 60, egg 1, bean-sprouts 50, spring-onion 15, peanuts 12, tamarind 6, jaggery 6, fish-sauce 8, garlic 3, oil 8, lemon 0.2, dry-red-chilli 0.3',
    s: [
      'Mix tamarind, palm sugar and fish sauce (or soy) into the sauce.',
      'Fry garlic and tofu, push aside and scramble the egg.',
      'Add soaked noodles and sauce; toss until absorbed.',
      'Add sprouts and spring onion; serve with peanuts, chilli and lime.',
    ],
  },
  {
    ...THAI, id: 'pad-kra-pao', n: 'Pad Kra Pao (Basil Chicken) with Rice', c: 'dinner lunch', d: 'nonveg',
    t: [10, 10], tg: 'quick high-protein spicy',
    p: '1 plate (140 g chicken) + rice + fried egg',
    i: 'chicken 140, basil 10, garlic 6, green-chilli 2, capsicum 40, soy-sauce 8, fish-sauce 4, jaggery 2, oil 8, rice 60, egg 1',
    s: [
      'Pound garlic and chillies.',
      'Stir-fry with minced or chopped chicken until cooked; add capsicum.',
      'Season with soy, fish sauce and sugar; toss in lots of basil.',
      'Serve over rice with a crispy fried egg.',
    ],
  },
  {
    ...THAI, id: 'larb-gai', n: 'Larb Gai (Chicken Herb Salad)', c: 'lunch dinner', d: 'nonveg',
    t: [15, 8], tg: 'light high-protein gluten-free',
    p: '1 plate (140 g chicken) + lettuce cups + small sticky rice',
    i: 'chicken-breast 140, shallots 25, mint 6, coriander-leaves 6, spring-onion 8, lemon 0.5, fish-sauce 8, dry-red-chilli 0.5, rice 30, lettuce 60, cucumber 50',
    s: [
      'Toast raw rice until golden and grind coarsely.',
      'Poach minced chicken in a splash of water until just cooked.',
      'Toss warm chicken with lime, fish sauce, chilli, shallots, herbs and toasted rice powder.',
      'Serve in lettuce leaves with cucumber.',
    ],
  },
  {
    ...THAI, id: 'som-tam', n: 'Som Tam (Green Papaya Salad)', c: 'lunch snack', d: 'vegan',
    t: [15, 0], tg: 'no-cook light spicy',
    p: '1 plate + small portion of sticky rice',
    i: 'raw-papaya 150, tomato 50, green-beans 30, peanuts 12, garlic 3, green-chilli 1, lemon 0.5, jaggery 5, soy-sauce 8, rice 30',
    s: [
      'Shred green papaya finely.',
      'Pound garlic and chillies in a mortar; add beans, tomato, palm sugar, lime and soy (or fish sauce).',
      'Add papaya and pound lightly while tossing; top with peanuts.',
    ],
  },
  {
    ...JAPAN, id: 'teriyaki-chicken-bowl', n: 'Teriyaki Chicken Bowl', c: 'dinner lunch', d: 'nonveg',
    t: [10, 15], tg: 'high-protein',
    p: '1 bowl (140 g chicken)',
    i: 'chicken 140, soy-sauce 12, honey 8, ginger 3, garlic 2, cornflour 3, rice 60, broccoli 80, carrot 30, sesame-seeds 1, spring-onion 6, oil 5',
    s: [
      'Sear chicken thigh pieces until golden.',
      'Add soy, honey, ginger, garlic and a little cornflour slurry; reduce to a glaze.',
      'Serve over rice with steamed broccoli and carrot; sprinkle sesame and spring onion.',
    ],
  },
  {
    ...JAPAN, id: 'miso-salmon', n: 'Miso Glazed Salmon with Greens', c: 'dinner', d: 'nonveg',
    t: [10, 15], adv: 'Marinate 30 min', tg: 'omega-3 high-protein',
    p: '1 fillet (140 g) + greens + ½ cup rice',
    i: 'salmon 140, miso 12, honey 5, soy-sauce 4, ginger 2, bok-choy 120, garlic 2, sesame-oil 2, rice 40',
    s: [
      'Mix miso, honey, soy and ginger; brush over salmon and marinate.',
      'Bake at 210 °C for 10–12 minutes (grill the last 2 for colour).',
      'Stir-fry bok choy with garlic and sesame oil; serve with rice.',
    ],
  },
  {
    ...JAPAN, id: 'soba-salad', n: 'Cold Soba Salad with Edamame', c: 'lunch', d: 'vegan',
    t: [10, 6], tg: 'summer light',
    p: '1 bowl (about 320 g)',
    i: 'soba 65, edamame 60, cucumber 60, carrot 40, spring-onion 8, soy-sauce 10, vinegar 6, sesame-oil 3, ginger 2, sesame-seeds 2, jaggery 3',
    s: [
      'Cook soba, rinse in cold water.',
      'Whisk soy, rice vinegar, sesame oil, grated ginger and honey.',
      'Toss noodles with edamame, cucumber, carrot and dressing; top with sesame and spring onion.',
    ],
  },
  {
    ...HAWAII, id: 'tuna-poke-bowl', n: 'Tuna Poke-style Bowl', c: 'lunch', d: 'nonveg',
    t: [15, 15], tg: 'high-protein',
    p: '1 bowl',
    i: 'tuna 100, rice 55, edamame 40, cucumber 60, avocado 0.3, carrot 30, spring-onion 6, soy-sauce 8, sesame-oil 3, sesame-seeds 2, vinegar 4, chilli-paste 3',
    s: [
      'Cook rice and season with rice vinegar.',
      'Toss tuna with soy, sesame oil and spring onion.',
      'Arrange rice, tuna, edamame, cucumber, carrot and avocado; drizzle with spicy mayo-free chilli sauce and sesame.',
    ],
  },
  {
    ...KOREA, id: 'bibimbap', n: 'Bibimbap', c: 'lunch dinner', d: 'egg',
    t: [20, 20], tg: 'balanced-bowl',
    p: '1 large bowl',
    i: 'rice 65, egg 1, spinach 60, bean-sprouts 50, carrot 40, mushroom 50, zucchini 40, tofu 50, chilli-paste 12, soy-sauce 6, sesame-oil 4, garlic 3, sesame-seeds 1, oil 4',
    s: [
      'Blanch spinach and sprouts; season each with sesame oil, garlic and salt.',
      'Sauté carrot, mushroom and zucchini separately; pan-sear tofu.',
      'Arrange over rice with a fried egg; serve with gochujang thinned with sesame oil. Mix well.',
    ],
  },
  {
    ...KOREA, id: 'kimchi-style-fried-rice', n: 'Spicy Cabbage Fried Rice', c: 'lunch dinner', d: 'egg',
    t: [10, 10], adv: 'Use day-old rice', tg: 'quick spicy',
    p: '1 plate + fried egg',
    i: 'rice 60, cabbage 80, chilli-paste 10, vinegar 4, spring-onion 8, garlic 3, egg 1, soy-sauce 4, sesame-oil 2, oil 6',
    s: [
      'Stir-fry chopped cabbage with garlic, gochujang and a splash of vinegar (or chopped kimchi if you have it).',
      'Add cold rice and soy; toss on high heat.',
      'Top with a fried egg, spring onion and sesame oil.',
    ],
  },
  {
    ...KOREA, id: 'dubu-jorim', n: 'Dubu Jorim (Braised Tofu) with Rice', c: 'dinner', d: 'vegan',
    t: [5, 15], tg: 'high-protein',
    p: '1 plate tofu (150 g) + rice + greens',
    i: 'tofu 150, soy-sauce 10, chilli-powder 1, garlic 3, spring-onion 8, jaggery 3, sesame-seeds 1, oil 5, rice 55, spinach 60, sesame-oil 2',
    s: [
      'Pan-fry tofu slabs until golden on both sides.',
      'Pour over a sauce of soy, chilli flakes, garlic, honey, spring onion and water.',
      'Simmer until the sauce reduces; serve with rice and seasoned spinach.',
    ],
  },
  {
    ...MEX, id: 'burrito-bowl', n: 'Black Bean Burrito Bowl', c: 'lunch dinner', d: 'veg',
    t: [15, 15], adv: 'Cooked black beans', tg: 'high-fiber high-protein',
    p: '1 large bowl',
    i: 'brown-rice 50, black-beans 50, corn 50, tomato 60, onion 25, lettuce 40, avocado 0.3, salsa 40, curd 40, cumin-powder 1, chilli-powder 0.5, coriander-leaves 4, lemon 0.25, salt 1.2',
    s: [
      'Cook brown rice with lime and coriander.',
      'Warm beans with cumin, chilli and salt.',
      'Build bowls with rice, beans, corn, lettuce, tomato-onion salsa, avocado and a spoon of yogurt.',
    ],
  },
  {
    ...MEX, id: 'chicken-fajitas', n: 'Chicken Fajitas', c: 'dinner', d: 'nonveg',
    t: [15, 15], tg: 'high-protein',
    p: '2 fajitas (130 g chicken)',
    i: 'chicken-breast 130, red-pepper 80, capsicum 50, onion 60, tortilla 2, oil 8, paprika 1, cumin-powder 1, chilli-powder 0.5, garlic 3, lemon 0.25, salsa 40, curd 30, salt 1.2',
    s: [
      'Toss sliced chicken with spices, garlic, lime and a little oil.',
      'Sear in a very hot pan; add peppers and onion and cook until charred but crisp.',
      'Serve in warm tortillas with salsa and yogurt.',
    ],
  },
  {
    ...MEX, id: 'black-bean-soup', n: 'Black Bean Soup', c: 'dinner lunch', d: 'vegan',
    t: [10, 25], adv: 'Cooked black beans', tg: 'soup high-fiber high-protein',
    p: '1 large bowl + ½ tortilla',
    i: 'black-beans 60, onion 50, red-pepper 40, garlic 4, tomato-puree 60, cumin-powder 1.5, chilli-powder 0.5, olive-oil 6, lemon 0.25, coriander-leaves 4, avocado 0.2, tortilla 0.5, salt 1.3',
    s: [
      'Sauté onion, pepper and garlic with cumin and chilli.',
      'Add beans, tomato and water; simmer 15 minutes and partly blend.',
      'Finish with lime and coriander; top with avocado and toasted tortilla strips.',
    ],
  },
  {
    ...MEX, id: 'chicken-tortilla-soup', n: 'Chicken Tortilla Soup', c: 'dinner', d: 'nonveg',
    t: [10, 25], tg: 'soup high-protein',
    p: '1 large bowl',
    i: 'chicken-breast 100, tomato-puree 100, onion 40, garlic 3, corn 40, black-beans 20, cumin-powder 1, chilli-powder 0.5, oil 5, tortilla 0.7, avocado 0.2, lemon 0.25, coriander-leaves 4, salt 1.3',
    s: [
      'Sauté onion and garlic with spices; add tomato and water.',
      'Poach chicken in the soup, then shred; add corn and beans.',
      'Serve topped with baked tortilla strips, avocado, lime and coriander.',
    ],
  },
  {
    ...GREEK, id: 'greek-chickpea-salad', n: 'Greek Salad with Chickpeas', c: 'lunch', d: 'veg',
    t: [10, 0], adv: 'Cooked chickpeas', tg: 'no-cook high-fiber',
    p: '1 large bowl',
    i: 'tomato 120, cucumber 100, capsicum 40, onion 20, olives 15, feta 30, chickpeas 35, olive-oil 8, vinegar 5, oregano 0.5, salt 0.8',
    s: [
      'Chop tomato, cucumber, pepper and onion into chunks.',
      'Add chickpeas and olives; dress with olive oil, vinegar, oregano and salt.',
      'Top with a slab of feta.',
    ],
  },
  {
    ...GREEK, id: 'chicken-souvlaki', n: 'Chicken Souvlaki with Tzatziki and Pita', c: 'dinner lunch', d: 'nonveg',
    t: [20, 12], adv: 'Marinate 1 h', tg: 'high-protein grilled',
    p: '2 skewers (150 g chicken) + pita + salad + tzatziki',
    i: 'chicken-breast 150, lemon 0.4, garlic 5, oregano 1, olive-oil 10, greek-yogurt 60, cucumber 80, mint 2, pita 1, tomato 60, onion 20, salt 1.5',
    s: [
      'Marinate chicken in lemon, garlic, oregano, olive oil and salt; thread on skewers.',
      'Grill 10–12 minutes, turning.',
      'Grate cucumber, squeeze dry and mix with yogurt, garlic, mint and salt.',
      'Serve with warm pita, tomato and onion.',
    ],
  },
  {
    ...MOROCCO, id: 'chickpea-tagine', n: 'Chickpea and Vegetable Tagine with Couscous', c: 'dinner', d: 'vegan',
    t: [15, 35], adv: 'Cooked chickpeas', tg: 'high-fiber one-pot',
    p: '1 bowl tagine + ½ cup couscous',
    i: 'chickpeas 40, sweet-potato 80, carrot 50, zucchini 50, onion 50, tomato-puree 80, garlic 4, ginger 3, cumin-powder 1, cinnamon 0.3, paprika 1, turmeric 0.3, raisins 8, olive-oil 8, couscous 45, coriander-leaves 4, salt 1.5',
    s: [
      'Sauté onion, garlic and ginger in olive oil with the spices.',
      'Add sweet potato, carrot, tomato and water; simmer 15 minutes.',
      'Add zucchini, chickpeas and raisins and simmer 10 more.',
      'Serve over fluffed couscous with coriander.',
    ],
  },
  {
    ...VIET, id: 'chicken-pho', n: 'Chicken Pho', c: 'dinner breakfast', d: 'nonveg',
    t: [15, 40], tg: 'soup high-protein',
    p: '1 large bowl',
    i: 'rice-noodles 60, chicken-breast 110, onion 50, ginger 8, cinnamon 0.5, cloves 0.1, fish-sauce 8, bean-sprouts 50, basil 4, mint 3, coriander-leaves 4, lemon 0.25, green-chilli 0.5, salt 1',
    s: [
      'Char onion and ginger; simmer in water with cinnamon and cloves and the chicken for 30 minutes.',
      'Remove and shred chicken; season the broth with fish sauce and salt.',
      'Pour hot broth over soaked noodles and chicken; serve with sprouts, herbs, lime and chilli.',
    ],
  },
  {
    ...INDO, id: 'nasi-goreng', n: 'Nasi Goreng', c: 'dinner lunch', d: 'egg',
    t: [10, 12], adv: 'Use day-old rice', tg: 'quick',
    p: '1 plate + fried egg + cucumber',
    i: 'rice 60, egg 1, shallots 25, garlic 4, dry-red-chilli 1, soy-sauce 10, jaggery 3, cabbage 40, carrot 30, oil 9, cucumber 60, tomato 40',
    s: [
      'Pound shallots, garlic and chilli into a paste and fry until fragrant.',
      'Add vegetables, then cold rice, sweet soy (soy + palm sugar); toss on high heat.',
      'Serve with a fried egg, cucumber and tomato.',
    ],
  },
  {
    ...INDO, id: 'gado-gado', n: 'Gado Gado', c: 'lunch', d: 'egg',
    t: [20, 15], tg: 'high-protein',
    p: '1 large plate',
    i: 'potato 80, green-beans 60, cabbage 60, bean-sprouts 40, cucumber 50, tofu 60, egg 1, peanut-butter 18, garlic 2, dry-red-chilli 0.5, jaggery 3, soy-sauce 5, lemon 0.25',
    s: [
      'Boil potato, green beans, cabbage and egg; blanch sprouts. Pan-sear tofu.',
      'Whisk peanut butter with garlic, chilli, palm sugar, soy, lime and warm water into a sauce.',
      'Arrange everything on a plate with cucumber; pour sauce over.',
    ],
  },
  {
    ...SPAIN, id: 'chicken-prawn-paella', n: 'Chicken and Prawn Paella', c: 'lunch dinner', d: 'nonveg',
    t: [15, 35], tg: 'festive one-pot high-protein',
    p: '1 plate (about 380 g)',
    i: 'rice 65, chicken 80, prawns 50, red-pepper 50, peas 30, tomato 60, onion 40, garlic 4, paprika 1.5, saffron 0.03, olive-oil 10, lemon 0.25, parsley 3, salt 1.5',
    s: [
      'Brown chicken in olive oil in a wide pan; add onion, garlic and pepper.',
      'Stir in grated tomato, paprika and saffron, then the rice.',
      'Add hot stock, do not stir, and simmer 18 minutes; nestle in prawns and peas for the last 6.',
      'Rest 5 minutes; serve with lemon and parsley.',
    ],
  },
  {
    ...SPAIN, id: 'gazpacho', n: 'Gazpacho with Toast', c: 'lunch snack', d: 'vegan',
    t: [15, 0], adv: 'Chill 1 h', tg: 'summer no-cook light',
    p: '1 large bowl + 1 slice toast',
    i: 'tomato 250, cucumber 80, red-pepper 50, onion 15, garlic 2, olive-oil 10, vinegar 8, ww-bread 1, salt 1',
    s: [
      'Blend ripe tomatoes, cucumber, pepper, onion, garlic, vinegar and olive oil until smooth.',
      'Season and chill well.',
      'Serve cold with toast and diced cucumber on top.',
    ],
  },
  {
    ...GREEK, st: 'Mediterranean', id: 'med-quinoa-salad', n: 'Mediterranean Quinoa Salad', c: 'lunch', d: 'veg',
    t: [10, 15], tg: 'high-fiber high-protein',
    p: '1 large bowl',
    i: 'quinoa 55, chickpeas 30, cucumber 80, tomato 80, red-pepper 40, olives 12, feta 25, parsley 8, lemon 0.4, olive-oil 8, salt 1',
    s: [
      'Cook quinoa and cool.',
      'Toss with chickpeas, chopped vegetables, olives and parsley.',
      'Dress with lemon, olive oil and salt; crumble feta on top.',
    ],
  },

  // ---------------- desserts
  {
    ...THAI, id: 'mango-sticky-rice', n: 'Mango Sticky Rice', c: 'dessert', d: 'vegan',
    t: [10, 25], adv: 'Soak glutinous rice 4 h', tg: 'festive gluten-free',
    p: '1 plate (½ mango)',
    i: 'rice 30, coconut-milk 40, sugar 12, mango 120, sesame-seeds 1, salt 0.3',
    s: [
      'Steam soaked sticky rice 20–25 minutes.',
      'Warm coconut milk with sugar and salt; pour most of it over the hot rice and rest 15 minutes.',
      'Serve with sliced mango, remaining coconut sauce and toasted sesame.',
    ],
  },
  {
    ...MOROCCO, id: 'orange-cinnamon-salad', n: 'Moroccan Orange Cinnamon Salad', c: 'dessert', d: 'vegan',
    t: [10, 0], tg: 'no-cook light gluten-free',
    p: '1 plate (1 orange)',
    i: 'orange 1.3, cinnamon 0.3, rose-water 2, mint 2, pistachios 5, dates 8',
    s: [
      'Peel oranges and slice into thin rounds.',
      'Sprinkle with cinnamon and orange blossom water.',
      'Top with mint, chopped pistachios and dates.',
    ],
  },
  {
    ...JAPAN, id: 'yaki-imo', n: 'Yaki Imo (Roasted Sweet Potato)', c: 'dessert snack', d: 'vegan',
    t: [2, 50], tg: 'baked no-sugar gluten-free',
    p: '1 medium sweet potato',
    i: 'sweet-potato 180',
    s: [
      'Wash sweet potato and wrap in foil.',
      'Roast at 180 °C for 50–60 minutes until caramelised and soft inside.',
    ],
  },
  {
    ...THAI, id: 'kluay-buat-chee', n: 'Bananas in Coconut Milk', c: 'dessert', d: 'vegan',
    t: [5, 10], tg: 'warming gluten-free',
    p: '1 small bowl',
    i: 'banana 1, coconut-milk 60, jaggery 8, salt 0.2, sesame-seeds 1',
    s: [
      'Simmer coconut milk with palm sugar and a pinch of salt.',
      'Add banana chunks and cook 3–4 minutes until soft.',
      'Serve warm with toasted sesame.',
    ],
  },
  {
    ...TURK, id: 'sutlac', n: 'Fırın Sütlaç (Baked Rice Pudding)', c: 'dessert', d: 'veg',
    t: [10, 35], adv: 'Chill 2 h', tg: 'baked gluten-free',
    p: '1 small bowl (about 150 g)',
    i: 'rice 15, milk 150, sugar 10, rice-flour 3, cinnamon 0.3',
    s: [
      'Cook rice in water until soft, then add milk and simmer.',
      'Thicken with rice flour mixed with milk; add sugar.',
      'Pour into ovenproof bowls and grill until browned on top; chill and dust with cinnamon.',
    ],
  },
]);
