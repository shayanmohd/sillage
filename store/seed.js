(() => {
  const K = 'sillage.v1';
  if (localStorage.getItem(K)) return;
  const DAY = 86400000, now = Date.now();
  const d = n => now - n * DAY;
  const yearAgo = () => { const x = new Date(); x.setFullYear(x.getFullYear() - 1); return x.getTime(); };
  const twoYearsAgo = () => { const x = new Date(); x.setFullYear(x.getFullYear() - 2); x.setDate(x.getDate() - 2); return x.getTime(); };

  const E = (id, at, text, anchor, tags, feeling, place, people, bottleId) =>
    ({ id, at, text, anchor, tags, feeling, place, people: people || [], bottleId: bottleId || null });

  const entries = [
    E('e1', yearAgo(),
      'Creosote off the harbour fence, sun-hot, with wet rope and old salt underneath it.',
      'Like the fence at Nan\'s, but with salt in it and nobody home.',
      ['creosote', 'wet-rope', 'sea-salt', 'tar'], 'melancholy', 'Whitby', ['Sarah']),
    E('e2', twoYearsAgo(),
      'The first cold morning of the year: wet leaves, and someone burning garden waste two streets over.',
      'Nine parts wet soil, one part burnt toast, and the cold going up your nose first.',
      ['wet-soil', 'campfire', 'cold-air', 'petrichor'], 'calm', 'Bristol', []),
    E('e3', d(2),
      'Rain hitting the hot pavement outside the bakery, with butter and yeast coming out of the door underneath it.',
      'Wet concrete and hot butter, arriving in that order, about four seconds apart.',
      ['petrichor', 'wet-concrete', 'fresh-bread', 'butter'], 'joy', 'Rua da Bica, Lisbon', ['Ines']),
    E('e4', d(5),
      'My father\'s pipe tobacco in the drawer under the stairs. Unlit, still sweet, still exactly the same.',
      'Hay left in a jar of rum for fifteen years.',
      ['pipe-tobacco', 'tobacco-leaf', 'hay', 'rum'], 'longing', 'The house in Leeds', []),
    E('e5', d(9),
      'The lily in the hallway went over today and turned into something animal and slightly rotten. Better, honestly.',
      'It is like jasmine, but with the sweetness taken out and something warm left behind.',
      ['madonna-lily', 'indole', 'indolic', 'pollen'], 'unease', 'Home', []),
    E('e6', d(14),
      'Sawdust and hot metal in the workshop, and the tea he keeps in an unwashed cup.',
      'Pencil shavings and rust, warmer than either would be alone.',
      ['sawdust', 'rust', 'pencil-shavings', 'tea-note'], 'comfort', 'Dad\'s workshop', ['Dad']),
    E('e7', d(21),
      'A market stall of green cardamom pods split open in the sun. Eucalyptus first, then lemon, then something almost soapy.',
      'Cold at the front and warm at the back, which should not be possible.',
      ['cardamom', 'camphoraceous', 'lemon', 'soap-accord'], 'alert', 'Borough Market', []),
    E('e8', d(31),
      'Salt drying on my arm on the walk back up from the beach, with sun cream on top of it.',
      'Sea salt and coconut, but with the sugar taken out of the coconut.',
      ['sea-salt', 'coconut', 'sand', 'brine'], 'joy', 'Porthcurno', ['Ines', 'Tom'], 'b1'),
    E('e9', d(44),
      'The tannery smell on the road out of the old town: sweet, thick, faintly bloody, absolutely not unpleasant.',
      'Warm hide and honey, with iron somewhere underneath it.',
      ['hide', 'leather-accord', 'honey', 'blood-note'], 'alert', 'Fez', []),
    E('e10', d(63),
      'Church at my grandmother\'s funeral. Frankincense over cold stone and old paper, and the candles going out afterwards.',
      'Lemon and dust set on fire, in a room that has been cold for two hundred years.',
      ['frankincense', 'incense-smoke', 'wet-stone', 'candle-snuff', 'paper'], 'melancholy', 'Vilnius', ['Mum']),
    E('e11', d(88),
      'Fig tree in the courtyard at four in the afternoon. Mostly leaf, mostly milk, barely any fruit at all.',
      'Coconut left out in the sun on a green stem.',
      ['fig-leaf', 'fig', 'coconut', 'green-note'], 'calm', 'Seville', [], 'b7'),
    E('e12', d(120),
      'Wet dog and woodsmoke in the pub after the walk, and somebody\'s whisky two tables over.',
      'Wool that has been rained on, over a fire that is nearly out.',
      ['wool', 'campfire', 'whisky', 'peat'], 'comfort', 'Hathersage', ['Tom'])
  ];

  const B = (id, name, house, sizeMl, status, acqDays, price, notes, sil, seasons, take, story) =>
    ({ id, name, house, sizeMl, status, acquiredAt: d(acqDays), addedAt: d(acqDays), price,
       notes, sillage: sil, seasons, take, story: story || '' });

  const bottles = [
    B('b1', 'Salt Ledger', 'Fenwick and Grieve', 100, 'bottle', 420, 96,
      ['sea-salt', 'brine', 'ambroxan', 'driftwood'], 'arm', ['spring', 'summer'],
      { opening: 'Grapefruit peel and something like a wet stone, cold for four minutes.',
        heart: 'Salt and a thin, papery wood underneath.',
        drydown: 'Ambroxan and dry driftwood, close to the skin by hour six.' },
      'Bought in a shop in Rome on the day it rained the whole day.'),
    B('b2', 'Cendre Verte', 'Maison Oriel', 50, 'bottle', 300, 138,
      ['galbanum', 'violet-leaf', 'oakmoss', 'vetiver'], 'room', ['spring', 'autumn'],
      { opening: 'Galbanum, which is to say a hedge being cut down.',
        heart: 'Violet leaf and something metallic behind it.',
        drydown: 'Oakmoss and vetiver, bitter and dry, for hours.' },
      'A birthday present that took me two years to understand.'),
    B('b3', 'Hinoki Bath', 'Kuroda', 100, 'bottle', 260, 74,
      ['hinoki', 'cypress', 'lemon', 'wet-wood'], 'intimate', ['summer', 'winter'],
      { opening: 'Lemon over damp wood, almost medicinal.',
        heart: 'Cypress, cold and clean.',
        drydown: 'Wet wood and a little soap. Gone in four hours and worth it.' },
      ''),
    B('b4', 'Peat Smoke No 4', 'Ardnave', 30, 'decant', 180, 28,
      ['peat', 'birch-tar', 'lapsang', 'leather-accord'], 'announcement', ['winter'],
      { opening: 'Birch tar. No introduction, no apology.',
        heart: 'Smoked tea and a leather that has been rained on.',
        drydown: 'Peat and ash, still there the next morning on the collar.' },
      'A decant from Tom, who wanted somebody else to suffer with him.'),
    B('b5', 'Iris Cendre', 'Maison Oriel', 50, 'bottle', 150, 172,
      ['orris', 'orris-butter', 'powdery', 'carrot-seed'], 'intimate', ['autumn', 'winter'],
      { opening: 'Cold root, almost raw pastry.',
        heart: 'Orris doing the only thing orris does, beautifully.',
        drydown: 'Powder and a faint smoke. It smells like a coat in a cold hallway.' },
      'The expensive one. Worn on eleven days in a year and worth every one.'),
    B('b6', 'Neroli Ordinaire', 'Maison Oriel', 100, 'bottle', 110, 68,
      ['neroli', 'petitgrain', 'orange-blossom', 'soap-accord'], 'arm', ['spring', 'summer'],
      { opening: 'Neroli, green and slightly metallic.',
        heart: 'Petitgrain and a soapiness that stays the right side of clean.',
        drydown: 'Faint orange blossom and warm skin.' },
      ''),
    B('b7', 'Fig Bench', 'Casa Lima', 100, 'bottle', 95, 84,
      ['fig-leaf', 'fig', 'coconut', 'green-note'], 'arm', ['summer'],
      { opening: 'Green leaf and milk.',
        heart: 'Fig flesh, barely sweet.',
        drydown: 'Coconut and dry wood. The most summer thing on the shelf.' },
      ''),
    B('b8', 'Wet Iron', 'Fenwick and Grieve', 10, 'sample', 60, 9,
      ['rust', 'flint', 'blood-note', 'wet-stone'], 'intimate', ['winter'],
      { opening: 'Struck flint and cold water.',
        heart: 'Iron, and something faintly bloody.',
        drydown: 'Mineral and quiet. A strange, good thing.' },
      'A sample that has outlasted two full bottles.'),
    B('b9', 'Vetiver Bureau', 'Fenwick and Grieve', 100, 'bottle', 500, 88,
      ['vetiver', 'papyrus', 'grapefruit', 'cashmeran'], 'room', ['autumn', 'winter'],
      { opening: 'Grapefruit and dry paper.',
        heart: 'Vetiver, Haitian rather than Javanese.',
        drydown: 'Smoke and a soft wood. The one I reach for without thinking.' },
      '')
  ];

  // A wear log with real shape: a few bottles carry most of the year, one is neglected.
  const wears = [];
  let wi = 1;
  const wear = (bid, daysAgo, contexts, sprays) =>
    wears.push({ id: 'w' + (wi++), bottleId: bid, at: d(daysAgo), contexts, sprays: sprays || null });

  const plan = [
    ['b9', [1, 4, 8, 11, 15, 18, 22, 26, 30, 36, 42, 48, 55, 63, 71, 80, 92, 104, 118, 133, 150, 168, 190, 214], ['work'], 3],
    ['b1', [3, 17, 24, 33, 40, 51, 88, 96, 110, 124, 140, 158, 176, 196], ['everyday'], 4],
    ['b5', [6, 29, 58, 87, 116, 145, 174, 203, 232, 261, 290], ['evening'], 2],
    ['b2', [10, 25, 45, 68, 99, 129, 161, 199, 238, 277], ['occasion'], 3],
    ['b3', [13, 31, 49, 66, 84, 101, 119, 137, 155], ['home'], 4],
    ['b7', [20, 34, 47, 61, 74, 90, 107], ['travel'], 5],
    ['b4', [12, 39, 76, 113, 149], ['evening'], 1],
    ['b6', [7, 21, 38, 57, 79, 103, 128, 154, 181], ['work'], 4]
  ];
  for (const [bid, days, ctx, sprays] of plan) for (const n of days) wear(bid, n, ctx, sprays);
  wear('b9', 0, ['work'], 3);
  wear('b1', 2, ['everyday'], 4);
  // b8 is the neglected one: worn twice, a long time ago.
  wear('b8', 240, ['home'], 1);
  wear('b8', 255, ['home'], 1);

  // Training: fourteen sessions, getting better, with real misses recorded.
  const S = (i, daysAgo, track, sessionId, kind, results, durationS, note) => ({
    id: 's' + i, at: d(daysAgo), track, sessionId, kind, results,
    correct: results.filter(r => r.ok).length, total: results.length, durationS, note: note || ''
  });
  const R = (mat, ok, guess) => ({ mat, ok, guess: guess || null });

  const sessions = [
    S(1, 152, 'foundations', 'f1', 'attend', [], 92, ''),
    S(2, 150, 'foundations', 'f2', 'describe', [], 260, 'Coffee is three smells, not one. Sour first, then burnt, then something close to cocoa.'),
    S(3, 147, 'foundations', 'f3', 'describe', [], 190, ''),
    S(4, 144, 'foundations', 'f4', 'id',
      [R('coffee-ground', true), R('lemon-peel', false, 'mint-dried'), R('clove-whole', false, 'lemon-peel'), R('mint-dried', true)], 240, ''),
    S(5, 141, 'foundations', 'f5', 'ladder', [], 220, ''),
    S(6, 137, 'foundations', 'f6', 'recall', [R('orange-peel', false, 'lemon-peel')], 60, 'Sixty seconds and three citrus is much harder than it sounds.'),
    S(7, 133, 'foundations', 'f7', 'describe', [], 200, 'Rosemary reads as camphor before it reads as herb. Mint is the other way round.'),
    S(8, 128, 'foundations', 'f8', 'id',
      [R('coffee-ground', true), R('lemon-peel', false, 'mint-dried'), R('clove-whole', true), R('mint-dried', false, 'lemon-peel'), R('cinnamon-stick', true)], 300, ''),
    S(9, 122, 'foundations', 'f9', 'describe', [], 210, ''),
    S(10, 115, 'foundations', 'f10', 'recall', [R('cardamom-pod', true)], 90, 'Ninety seconds is fine. It is the warm spices overlapping that gets me, not the gap.'),
    S(11, 108, 'foundations', 'f11', 'ladder', [], 230, ''),
    S(12, 101, 'foundations', 'f12', 'id',
      [R('coffee-ground', true), R('lemon-peel', true), R('clove-whole', true), R('mint-dried', false, 'rosemary-sprig'), R('cinnamon-stick', false, 'clove-whole'), R('cardamom-pod', true)], 420, ''),
    S(13, 94, 'foundations', 'f13', 'describe', [], 260, ''),
    S(14, 86, 'foundations', 'f14', 'id',
      [R('coffee-ground', true), R('lemon-peel', true), R('clove-whole', true), R('mint-dried', true),
       R('cinnamon-stick', false, 'clove-whole'), R('cardamom-pod', true), R('vanilla-extract', true), R('rosemary-sprig', false, 'mint-dried')], 480,
      'Compared with day four this is a different nose. It is mostly that I now know what to listen for.'),
    S(15, 74, 'conservatory', 'cpeel1', 'id',
      [R('lemon-peel', true), R('orange-peel', true), R('lime-peel', false, 'grapefruit-peel'), R('grapefruit-peel', true)], 260, ''),
    S(16, 66, 'conservatory', 'cherb1', 'id',
      [R('thyme-dried', true), R('rosemary-sprig', true), R('bay', false, 'thyme-dried'), R('mint-dried', true)], 250, ''),
    S(17, 57, 'conservatory', 'cwarm1', 'id',
      [R('cinnamon-stick', true), R('clove-whole', true), R('nutmeg-whole', false, 'allspice-berry'), R('cardamom-pod', true)], 240, ''),
    S(18, 48, 'conservatory', 'cseed1', 'id',
      [R('cumin-seed', true), R('coriander-whole', true), R('fennel-whole', true), R('caraway-seed', false, 'fennel-whole')], 280, ''),
    S(19, 40, 'conservatory', 'cpeel2', 'id',
      [R('lemon-peel', true), R('orange-peel', true), R('lime-peel', true), R('grapefruit-peel', true),
       R('earl-grey', true), R('mandarin-peel', false, 'orange-peel')], 400, ''),
    S(20, 32, 'conservatory', 'croast1', 'id',
      [R('coffee-bean', true), R('coffee-ground', true), R('cocoa-powder', true), R('black-tea', false, 'green-tea-leaf')], 240,
      'Whole beans and ground coffee are genuinely two different smells. I would have argued about that a year ago.'),
    S(21, 24, 'conservatory', 'cherb2', 'id',
      [R('thyme-dried', true), R('rosemary-sprig', true), R('bay', true), R('mint-dried', true),
       R('basil-leaf', true), R('oregano-dried', false, 'thyme-dried')], 380, ''),
    S(22, 16, 'conservatory', 'cwarm2', 'id',
      [R('cinnamon-stick', true), R('clove-whole', true), R('nutmeg-whole', true), R('cardamom-pod', true),
       R('ginger-ground', true), R('allspice-berry', true)], 360, 'Six out of six on the shelf that beat me twice.'),
    S(23, 9, 'conservatory', 'csweet1', 'id',
      [R('vanilla-extract', true), R('honey-jar', true), R('maple-syrup', true), R('brown-sugar', false, 'maple-syrup')], 250, ''),
    S(24, 3, 'conservatory', 'cferment1', 'id',
      [R('white-vinegar', true), R('balsamic', true), R('soy-sauce', true), R('fish-sauce', true)], 230, '')
  ];

  localStorage.setItem(K, JSON.stringify({
    entries, bottles, wears, sessions,
    settings: { remindOn: true, remindTime: '07:00', remindEvery: 1, resurfaceOn: true,
                hemisphere: 'north', currency: '$', showPrices: true },
    onboarded: true, installed: d(520)
  }));
})()
