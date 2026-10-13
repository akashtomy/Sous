import { cuisine } from '../dsl';

const CANTO = { st: 'Cantonese', rg: 'Southern China', o: 'Guangdong' } as const;
const SICHUAN = { st: 'Sichuan', rg: 'Western China', o: 'Sichuan' } as const;
const NORTH = { st: 'Northern Chinese', rg: 'Northern China', o: 'Beijing / Shandong' } as const;
const HOME = { st: 'Chinese home-style', rg: 'China', o: 'China' } as const;
const INDO = { st: 'Indo-Chinese', rg: 'India', o: 'Kolkata / Mumbai' } as const;

export const chinese = cuisine('chinese', [
  // ---------------- breakfast
  {
    ...CANTO, id: 'veg-egg-congee', n: 'Congee with Egg and Greens', c: 'breakfast dinner', d: 'egg',
    t: [5, 35], tg: 'light comfort gluten-free',
    p: '1 large bowl (about 400 g)',
    i: 'rice 40, egg 1, bok-choy 60, ginger 4, spring-onion 8, soy-sauce 5, sesame-oil 2, mushroom 30, peanuts 5, salt 1',
    s: [
      'Simmer rice with 8–10 parts water and sliced ginger, stirring occasionally, until creamy (30 minutes).',
      'Add sliced mushrooms and greens for the last 5 minutes.',
      'Swirl in a beaten egg or add a soft-boiled egg; finish with soy, sesame oil, spring onion and peanuts.',
    ],
  },
  {
    ...CANTO, id: 'chicken-ginger-congee', n: 'Chicken Ginger Congee', c: 'breakfast dinner', d: 'nonveg',
    t: [10, 40], tg: 'comfort high-protein gluten-free',
    p: '1 large bowl (about 420 g)',
    i: 'rice 40, chicken-breast 80, ginger 6, spring-onion 8, soy-sauce 5, sesame-oil 2, coriander-leaves 2, black-pepper 0.2, salt 1',
    s: [
      'Simmer rice with water and ginger until it breaks down.',
      'Add thinly sliced chicken marinated in a little soy and cook 6 minutes.',
      'Season and top with spring onion, coriander, pepper and sesame oil.',
    ],
  },
  {
    ...NORTH, id: 'scallion-pancake', n: 'Scallion Pancake with Soy Dip', c: 'breakfast snack', d: 'vegan',
    t: [20, 10], tg: 'comfort',
    p: '1 pancake (about 120 g)',
    i: 'maida 35, atta 15, spring-onion 20, oil 10, sesame-oil 2, soy-sauce 5, vinegar 3, salt 0.8',
    s: [
      'Mix flours with hot water into a soft dough; rest 20 minutes.',
      'Roll thin, brush with sesame oil, scatter spring onion and salt, roll up into a coil and flatten again.',
      'Pan-fry in a little oil until crisp and flaky; serve with soy-vinegar dip.',
    ],
  },
  {
    ...NORTH, id: 'jianbing', n: 'Jianbing (Egg Crepe)', c: 'breakfast', d: 'egg',
    t: [10, 10], tg: 'street high-protein',
    p: '1 folded crepe',
    i: 'atta 25, besan 10, egg 1, spring-onion 8, coriander-leaves 3, lettuce 20, chilli-paste 5, sesame-seeds 1, oil 4, salt 0.5',
    s: [
      'Whisk the flours with water into a thin batter.',
      'Spread thin on a hot pan, crack an egg over it, spread, and sprinkle spring onion, coriander and sesame.',
      'Flip, brush with chilli sauce, add lettuce and fold into a rectangle.',
    ],
  },
  {
    ...HOME, id: 'steamed-egg-custard', n: 'Steamed Egg Custard with Rice', c: 'breakfast dinner', d: 'egg',
    t: [5, 15], tg: 'light high-protein gluten-free',
    p: '1 custard bowl (2 eggs) + ½ cup rice + greens',
    i: 'egg 2, soy-sauce 4, sesame-oil 2, spring-onion 5, rice 40, bok-choy 80, garlic 2, oil 3, salt 0.5',
    s: [
      'Whisk eggs with 1.5 times their volume of warm water and salt; strain into a bowl.',
      'Cover and steam on low 12 minutes until just set.',
      'Drizzle soy and sesame oil, top with spring onion; serve with rice and garlicky bok choy.',
    ],
  },
  {
    ...CANTO, id: 'har-gow', n: 'Har Gow (Prawn Dumplings)', c: 'breakfast snack', d: 'nonveg',
    t: [40, 8], tg: 'dim-sum steamed high-protein',
    p: '5 dumplings',
    i: 'prawns 80, cornflour 20, maida 15, bamboo-shoot 15, ginger 2, sesame-oil 2, soy-sauce 3, salt 0.5',
    s: [
      'Chop prawns roughly; mix with diced bamboo shoot, ginger, sesame oil, soy and salt.',
      'Mix starch with boiling water into a translucent dough; roll small thin rounds.',
      'Fill and pleat; steam 6–7 minutes until translucent.',
    ],
  },
  {
    ...NORTH, id: 'veg-baozi', n: 'Vegetable Baozi', c: 'breakfast snack', d: 'vegan',
    t: [30, 15], adv: 'Dough rises 1 h', tg: 'steamed',
    p: '2 buns',
    i: 'maida 60, yeast 1, sugar 3, cabbage 50, mushroom 30, carrot 20, tofu 30, ginger 2, soy-sauce 5, sesame-oil 2, spring-onion 5, salt 0.5',
    s: [
      'Knead flour with yeast, sugar and warm water; let rise until doubled.',
      'Stir-fry finely chopped vegetables and crumbled tofu with ginger, soy and sesame oil; cool.',
      'Roll dough rounds, fill, pleat and rest 15 minutes; steam 12–15 minutes.',
    ],
  },

  // ---------------- lunch & dinner
  {
    ...HOME, id: 'tomato-egg-stirfry', n: 'Tomato Egg Stir-fry with Rice', c: 'lunch dinner', d: 'egg',
    t: [5, 10], tg: 'quick high-protein gluten-free',
    p: '1 plate (2 eggs) + 1 cup rice',
    i: 'egg 2, tomato 180, spring-onion 8, garlic 2, sugar 2, soy-sauce 3, oil 6, rice 60, salt 0.8',
    s: [
      'Scramble beaten eggs softly in half the oil; remove.',
      'Stir-fry tomato wedges with garlic until juicy; season with sugar, soy and salt.',
      'Return eggs, toss gently, and top with spring onion. Serve with rice.',
    ],
  },
  {
    ...SICHUAN, id: 'mapo-tofu', n: 'Mapo Tofu with Rice', c: 'dinner lunch', d: 'vegan',
    t: [10, 15], tg: 'spicy high-protein',
    p: '1 bowl tofu (150 g) + 1 cup rice',
    i: 'tofu 150, mushroom 40, chilli-paste 12, garlic 4, ginger 3, black-pepper 0.5, soy-sauce 5, cornflour 4, spring-onion 8, oil 7, rice 60, salt 0.3',
    s: [
      'Simmer cubed tofu in salted water 2 minutes; drain.',
      'Fry chilli bean paste in oil until red; add garlic, ginger and finely chopped mushrooms.',
      'Add water and soy, then tofu; simmer 5 minutes and thicken with cornflour slurry.',
      'Finish with ground Sichuan (or black) pepper and spring onion; serve with rice.',
    ],
  },
  {
    ...SICHUAN, id: 'kung-pao-chicken', n: 'Kung Pao Chicken with Rice', c: 'dinner lunch', d: 'nonveg',
    t: [15, 10], tg: 'high-protein spicy',
    p: '1 plate (150 g chicken) + 1 cup rice',
    i: 'chicken-breast 150, peanuts 15, dry-red-chilli 2, capsicum 50, spring-onion 15, garlic 4, ginger 3, soy-sauce 10, vinegar 5, sugar 4, cornflour 5, oil 8, rice 60, black-pepper 0.3',
    s: [
      'Marinate diced chicken with soy and cornflour.',
      'Mix soy, vinegar, sugar, a little cornflour and water for the sauce.',
      'Fry dried chillies and pepper briefly, add chicken and stir-fry until cooked; add garlic, ginger, capsicum and spring onion.',
      'Pour in sauce, toss until glossy, then stir in roasted peanuts.',
    ],
  },
  {
    ...CANTO, id: 'steamed-fish-ginger', n: 'Steamed Fish with Ginger and Scallion', c: 'dinner', d: 'nonveg',
    t: [10, 12], tg: 'light high-protein gluten-free',
    p: '1 fillet (160 g) + greens + ½ cup rice',
    i: 'fish 160, ginger 8, spring-onion 15, soy-sauce 10, sesame-oil 2, oil 5, bok-choy 100, garlic 2, rice 45',
    s: [
      'Lay fish on a plate over ginger slices and steam 8–10 minutes.',
      'Drain the liquid, top with shredded ginger and spring onion.',
      'Pour sizzling oil over and drizzle with soy and sesame oil; serve with blanched bok choy and rice.',
    ],
  },
  {
    ...HOME, id: 'garlic-bokchoy-tofu', n: 'Garlic Bok Choy with Crispy Tofu', c: 'lunch dinner', d: 'vegan',
    t: [10, 12], tg: 'light high-protein',
    p: '1 plate + ½ cup brown rice',
    i: 'bok-choy 200, tofu 120, garlic 6, soy-sauce 8, cornflour 4, oil 8, sesame-seeds 1, brown-rice 45, salt 0.3',
    s: [
      'Toss tofu cubes in cornflour and pan-sear until crisp.',
      'Stir-fry garlic briefly, add bok choy and a splash of water; cover 1 minute.',
      'Add tofu and soy, toss and sprinkle sesame. Serve with brown rice.',
    ],
  },
  {
    ...CANTO, id: 'chicken-broccoli', n: 'Chicken and Broccoli Stir-fry', c: 'dinner lunch', d: 'nonveg',
    t: [10, 10], tg: 'high-protein quick',
    p: '1 plate (140 g chicken) + 1 cup brown rice',
    i: 'chicken-breast 140, broccoli 150, garlic 4, ginger 3, soy-sauce 10, cornflour 5, oil 7, sesame-oil 2, brown-rice 55, honey 3',
    s: [
      'Slice chicken and coat with a little soy and cornflour.',
      'Blanch broccoli 1 minute.',
      'Stir-fry chicken until golden, add garlic, ginger and broccoli.',
      'Add soy, honey and a cornflour slurry; toss until glossy and finish with sesame oil.',
    ],
  },
  {
    ...SICHUAN, id: 'hot-sour-soup', n: 'Hot and Sour Soup', c: 'dinner lunch', d: 'egg',
    t: [10, 15], tg: 'soup light',
    p: '1 large bowl (about 400 ml)',
    i: 'tofu 80, mushroom 50, bamboo-shoot 30, carrot 20, egg 1, soy-sauce 10, vinegar 12, black-pepper 1, chilli-paste 4, cornflour 6, sesame-oil 2, spring-onion 8, salt 0.5',
    s: [
      'Simmer stock or water with sliced mushrooms, bamboo shoot, carrot and tofu.',
      'Season with soy, vinegar, pepper and chilli.',
      'Thicken with cornflour slurry, then drizzle in beaten egg while stirring.',
      'Finish with sesame oil and spring onion.',
    ],
  },
  {
    ...HOME, id: 'brown-egg-fried-rice', n: 'Brown Rice Egg Fried Rice', c: 'lunch dinner', d: 'egg',
    t: [10, 10], adv: 'Use day-old cooked rice', tg: 'quick',
    p: '1 plate (about 330 g)',
    i: 'brown-rice 65, egg 2, peas 30, carrot 30, spring-onion 12, garlic 3, soy-sauce 8, oil 8, sesame-oil 2, black-pepper 0.3',
    s: [
      'Scramble eggs in a hot wok; set aside.',
      'Stir-fry garlic, carrot and peas, then add cold rice and toss on high heat.',
      'Add soy, pepper and egg; finish with spring onion and sesame oil.',
    ],
  },
  {
    ...INDO, id: 'veg-hakka-noodles', n: 'Veg Hakka Noodles', c: 'dinner lunch', d: 'vegan',
    t: [10, 10], tg: 'quick',
    p: '1 plate (about 300 g)',
    i: 'noodles 65, cabbage 50, carrot 30, capsicum 40, spring-onion 15, garlic 4, soy-sauce 8, vinegar 4, chilli-paste 5, oil 8, black-pepper 0.3, salt 0.5',
    s: [
      'Boil noodles until just done, drain and toss with a little oil.',
      'Stir-fry garlic and julienned vegetables on very high heat.',
      'Add noodles, soy, vinegar, chilli sauce and pepper; toss and finish with spring onion.',
    ],
  },
  {
    ...INDO, id: 'chilli-paneer-dry', n: 'Chilli Paneer (Pan-tossed)', c: 'dinner snack', d: 'veg',
    t: [10, 15], tg: 'high-protein',
    p: '1 plate (100 g paneer) + ½ cup fried rice',
    i: 'paneer 100, capsicum 60, onion 50, garlic 4, ginger 3, green-chilli 1, soy-sauce 8, chilli-paste 8, vinegar 4, cornflour 8, oil 8, spring-onion 8, rice 35',
    s: [
      'Toss paneer cubes in cornflour and pan-sear until golden (no deep frying).',
      'Stir-fry garlic, ginger, chillies, onion and capsicum on high heat.',
      'Add soy, chilli sauce, vinegar and a little cornflour slurry; toss in paneer and spring onion.',
    ],
  },
  {
    ...INDO, id: 'gobi-manchurian', n: 'Gobi Manchurian', c: 'snack dinner', d: 'vegan',
    t: [15, 20], tg: 'fried',
    p: '1 bowl (about 200 g)',
    i: 'cauliflower 150, maida 20, cornflour 15, garlic 5, ginger 3, green-chilli 1, spring-onion 15, soy-sauce 10, chilli-paste 8, vinegar 4, oil 25, salt 0.8',
    s: [
      'Coat florets in a batter of maida, cornflour, salt and water; deep-fry until crisp.',
      'Stir-fry garlic, ginger, chilli and spring onion.',
      'Add soy, chilli sauce, vinegar and a little cornflour slurry; toss the gobi to coat.',
    ],
  },
  {
    ...INDO, id: 'veg-manchow-soup', n: 'Veg Manchow Soup', c: 'snack dinner', d: 'vegan',
    t: [10, 10], tg: 'soup spicy light',
    p: '1 bowl (about 350 ml)',
    i: 'cabbage 40, carrot 30, capsicum 30, green-beans 20, mushroom 30, garlic 5, ginger 4, coriander-leaves 4, soy-sauce 10, chilli-paste 4, vinegar 4, cornflour 7, oil 5, black-pepper 0.5, salt 0.5',
    s: [
      'Stir-fry garlic, ginger, coriander stems and finely chopped vegetables.',
      'Add water, soy, chilli sauce, vinegar and pepper; simmer 5 minutes.',
      'Thicken with cornflour slurry and finish with coriander.',
    ],
  },
  {
    ...SICHUAN, id: 'dan-dan-noodles', n: 'Dan Dan Noodles', c: 'lunch dinner', d: 'nonveg',
    t: [10, 15], tg: 'spicy',
    p: '1 bowl (about 350 g)',
    i: 'noodles 70, pork 70, bok-choy 60, tahini 10, soy-sauce 10, chilli-paste 8, vinegar 4, garlic 3, sugar 2, black-pepper 0.5, peanuts 6, spring-onion 8, oil 6',
    s: [
      'Stir-fry minced pork until crisp with a splash of soy.',
      'Whisk sesame paste, soy, chilli oil, vinegar, garlic, sugar and ground pepper in the serving bowl.',
      'Cook noodles and bok choy; add to bowl with a little noodle water.',
      'Top with pork, peanuts and spring onion; toss before eating.',
    ],
  },
  {
    ...SICHUAN, id: 'yu-xiang-eggplant', n: 'Yu Xiang Eggplant with Rice', c: 'dinner lunch', d: 'vegan',
    t: [10, 15], tg: 'spicy',
    p: '1 plate eggplant + 1 cup rice',
    i: 'brinjal 220, garlic 6, ginger 4, spring-onion 10, chilli-paste 10, soy-sauce 8, vinegar 6, sugar 4, cornflour 4, oil 10, rice 60',
    s: [
      'Cut eggplant into batons, salt for 10 minutes and pat dry; pan-sear until soft and golden.',
      'Fry chilli bean paste, garlic, ginger and spring onion whites.',
      'Add soy, vinegar, sugar and water; thicken, return eggplant and toss. Serve with rice.',
    ],
  },
  {
    ...SICHUAN, id: 'dry-fried-beans', n: 'Dry-fried Green Beans with Tofu', c: 'dinner lunch', d: 'vegan',
    t: [10, 12], tg: 'high-fiber',
    p: '1 plate + ½ cup rice',
    i: 'green-beans 200, tofu 80, garlic 5, ginger 3, dry-red-chilli 1, black-pepper 0.5, soy-sauce 8, oil 8, rice 45, salt 0.5',
    s: [
      'Blister beans in a hot wok with a little oil until wrinkled; set aside.',
      'Fry crumbled tofu until golden with garlic, ginger, chillies and pepper.',
      'Return beans, add soy and toss well. Serve with rice.',
    ],
  },
  {
    ...CANTO, id: 'char-siu-rice', n: 'Char Siu Pork with Rice and Greens', c: 'lunch dinner', d: 'nonveg',
    t: [15, 35], adv: 'Marinate pork 4 h', tg: 'high-protein roast',
    p: '120 g pork + 1 cup rice + greens',
    i: 'pork 120, honey 10, soy-sauce 10, garlic 4, cinnamon 0.2, cloves 0.05, paprika 0.5, rice 60, bok-choy 100, sesame-oil 2',
    s: [
      'Marinate pork strips in honey, soy, garlic, five-spice-style spices and paprika.',
      'Roast at 200 °C for 30–35 minutes, basting with marinade, until sticky and caramelised.',
      'Slice and serve with rice and blanched greens drizzled with sesame oil.',
    ],
  },
  {
    ...CANTO, id: 'sweet-sour-chicken', n: 'Sweet and Sour Chicken', c: 'dinner', d: 'nonveg',
    t: [15, 20], tg: 'fried',
    p: '1 plate (150 g chicken) + 1 cup rice',
    i: 'chicken-breast 150, cornflour 20, egg 0.3, pineapple 60, capsicum 50, onion 40, tomato-paste 15, vinegar 10, sugar 12, soy-sauce 5, oil 25, rice 60, salt 0.5',
    s: [
      'Coat chicken pieces in egg and cornflour; deep-fry until crisp.',
      'Stir-fry onion, capsicum and pineapple.',
      'Add ketchup or tomato paste, vinegar, sugar, soy and water; thicken and toss in chicken.',
    ],
  },
  {
    ...HOME, id: 'cashew-chicken', n: 'Cashew Chicken with Vegetables', c: 'dinner lunch', d: 'nonveg',
    t: [10, 12], tg: 'high-protein',
    p: '1 plate (130 g chicken) + 1 cup rice',
    i: 'chicken-breast 130, cashews 15, capsicum 50, carrot 30, onion 40, garlic 4, ginger 3, soy-sauce 10, cornflour 5, oil 7, rice 55, honey 3',
    s: [
      'Toast cashews in a dry wok; set aside.',
      'Stir-fry marinated chicken until golden; add garlic, ginger and vegetables.',
      'Add soy, honey and a little cornflour slurry; finish with cashews.',
    ],
  },
  {
    ...SICHUAN, id: 'szechuan-prawns', n: 'Szechuan Garlic Prawns', c: 'dinner', d: 'nonveg',
    t: [10, 10], tg: 'high-protein quick spicy',
    p: '1 plate (150 g prawns) + ½ cup rice + greens',
    i: 'prawns 150, garlic 6, ginger 3, dry-red-chilli 1, chilli-paste 8, soy-sauce 6, vinegar 3, spring-onion 10, oil 7, rice 45, broccoli 80',
    s: [
      'Stir-fry prawns on high heat until just pink; remove.',
      'Fry garlic, ginger and chillies, add chilli paste, soy and vinegar.',
      'Return prawns, toss with spring onion; serve with rice and steamed broccoli.',
    ],
  },
  {
    ...CANTO, id: 'wonton-soup', n: 'Wonton Soup', c: 'dinner lunch', d: 'nonveg',
    t: [30, 10], tg: 'soup',
    p: '8 wontons in broth with greens',
    i: 'pork 60, prawns 40, maida 35, egg 0.2, ginger 3, spring-onion 8, soy-sauce 8, sesame-oil 2, bok-choy 60, black-pepper 0.2, salt 0.8',
    s: [
      'Mix minced pork and prawns with ginger, spring onion, soy and sesame oil.',
      'Roll thin squares from a flour-egg dough (or use wrappers), fill and fold.',
      'Boil wontons until they float plus 2 minutes; serve in seasoned broth with greens.',
    ],
  },
  {
    ...INDO, id: 'sweet-corn-soup', n: 'Chicken Sweet Corn Soup', c: 'dinner snack', d: 'nonveg',
    t: [10, 15], tg: 'soup light',
    p: '1 bowl (about 350 ml)',
    i: 'corn 80, chicken-breast 60, egg 0.5, cornflour 7, ginger 2, soy-sauce 4, black-pepper 0.4, spring-onion 6, salt 0.8',
    s: [
      'Simmer shredded chicken and half the corn in water with ginger; blend the rest of the corn and add.',
      'Season with soy, salt and pepper; thicken with cornflour slurry.',
      'Drizzle in beaten egg and garnish with spring onion.',
    ],
  },
  {
    ...HOME, id: 'buddhas-delight', n: "Buddha's Delight (Mixed Veg with Tofu)", c: 'lunch dinner', d: 'vegan',
    t: [15, 12], tg: 'light high-fiber',
    p: '1 plate + ½ cup brown rice',
    i: 'tofu 80, mushroom 60, broccoli 60, carrot 40, bok-choy 60, bamboo-shoot 30, cabbage 40, garlic 4, ginger 3, soy-sauce 10, cornflour 4, oil 7, brown-rice 45',
    s: [
      'Sear tofu cubes until golden.',
      'Stir-fry garlic and ginger, add harder vegetables first, then leafy ones, with splashes of water.',
      'Add soy and a little cornflour slurry, return tofu and toss. Serve with rice.',
    ],
  },
  {
    ...NORTH, id: 'cold-sesame-noodles', n: 'Cold Sesame Noodles with Cucumber', c: 'lunch', d: 'vegan',
    t: [10, 8], tg: 'summer quick',
    p: '1 bowl (about 300 g)',
    i: 'noodles 65, cucumber 100, carrot 30, tahini 15, soy-sauce 10, vinegar 6, chilli-paste 4, garlic 3, jaggery 3, sesame-seeds 2, spring-onion 8, edamame 40',
    s: [
      'Cook noodles, rinse under cold water and drain.',
      'Whisk sesame paste, soy, vinegar, chilli oil, garlic and honey with a little water.',
      'Toss noodles with sauce, cucumber, carrot and edamame; top with sesame and spring onion.',
    ],
  },
  {
    ...HOME, id: 'tofu-edamame-fried-rice', n: 'Tofu and Edamame Fried Rice', c: 'lunch dinner', d: 'vegan',
    t: [10, 10], adv: 'Use day-old cooked rice', tg: 'high-protein quick',
    p: '1 plate (about 350 g)',
    i: 'brown-rice 60, tofu 80, edamame 50, carrot 30, spring-onion 12, garlic 3, ginger 3, soy-sauce 8, oil 8, sesame-oil 2',
    s: [
      'Crumble tofu and fry until golden.',
      'Add garlic, ginger, carrot and edamame, then cold rice on high heat.',
      'Season with soy, sesame oil and spring onion.',
    ],
  },

  // ---------------- desserts
  {
    ...CANTO, id: 'mango-pudding', n: 'Mango Pudding', c: 'dessert', d: 'veg',
    t: [10, 5], adv: 'Chill 3 h', tg: 'chilled gluten-free',
    p: '1 cup (about 140 g)',
    i: 'mango 80, milk 50, cornflour 6, sugar 6, greek-yogurt 20',
    s: [
      'Blend ripe mango until smooth.',
      'Cook milk with cornflour and sugar until it thickens; cool slightly.',
      'Whisk in mango purée and yogurt; pour into cups and chill to set.',
    ],
  },
  {
    ...CANTO, id: 'sweet-potato-ginger-soup', n: 'Sweet Potato Ginger Tong Sui', c: 'dessert', d: 'vegan',
    t: [5, 25], tg: 'warming gluten-free',
    p: '1 bowl (about 250 ml)',
    i: 'sweet-potato 120, ginger 10, jaggery 10',
    s: [
      'Simmer peeled sweet potato chunks with sliced ginger in water for 20 minutes.',
      'Add rock sugar or jaggery and simmer until dissolved. Serve warm.',
    ],
  },
  {
    ...CANTO, id: 'black-sesame-soup', n: 'Black Sesame Soup', c: 'dessert', d: 'vegan',
    t: [5, 10], tg: 'warming gluten-free',
    p: '1 small bowl (about 200 ml)',
    i: 'sesame-seeds 18, rice-flour 8, jaggery 10',
    s: [
      'Toast sesame seeds and grind finely with a little water.',
      'Simmer with more water, then thicken with rice-flour slurry and sweeten.',
    ],
  },
  {
    ...CANTO, id: 'egg-tarts', n: 'Hong Kong Egg Tarts', c: 'dessert', d: 'egg',
    t: [30, 20], tg: 'baked festive',
    p: '2 tarts',
    i: 'maida 40, butter 18, egg 0.7, milk 40, sugar 15',
    s: [
      'Rub flour with butter, bind with a little water and press into tart tins.',
      'Whisk eggs with warm milk and sugar; strain.',
      'Fill shells and bake at 200 °C for 15–20 minutes until just wobbly.',
    ],
  },
  {
    ...NORTH, id: 'almond-milk-pudding', n: 'Almond Milk Pudding with Fruit', c: 'dessert', d: 'veg',
    t: [10, 5], adv: 'Chill 3 h', tg: 'chilled gluten-free',
    p: '1 bowl (about 160 g)',
    i: 'milk 120, almonds 8, cornflour 6, sugar 6, orange 0.3, berries 30',
    s: [
      'Blend milk with soaked almonds; strain.',
      'Cook with cornflour and sugar until thick; set and chill.',
      'Cut into cubes and serve with orange segments and berries.',
    ],
  },
]);
