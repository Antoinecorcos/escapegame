// ===== ALL GAME TEXTS LIVE HERE =====
// Edit freely: stages, clues, answers, missions, karaoke lyrics...
window.CONTENT = {
  title: 'The March of the Dead',
  tagline: 'Paris is falling to the kepi zombies. Lead your march to the Élysée bunker before time runs out!',

  teams: {
    red: { name: 'Red March', color: '#e5484d', emoji: '🟥' },
    blue: { name: 'Blue March', color: '#3e7bfa', emoji: '🟦' },
  },

  // Map coordinates (admin screen, viewBox 1000x560)
  places: {
    republique: { label: 'République', x: 790, y: 120 },
    marais: { label: 'Le Marais', x: 700, y: 235 },
    chatelet: { label: 'Châtelet', x: 575, y: 285 },
    pontneuf: { label: 'Pont Neuf', x: 487, y: 352 },
    louvre: { label: 'Louvre', x: 405, y: 285 },
    garnier: { label: 'Opéra Garnier', x: 410, y: 130 },
    elysee: { label: 'Élysée', x: 170, y: 175 },
  },

  stages: [
    // ---------- STAGE 0 ----------
    {
      id: 'fanfare', place: 'republique', title: 'The Lost Fanfare', icon: '🎺',
      intro: "Place de la République. Your march is ready, but the fanfare is a mess: six musicians and nobody knows who plays when. Each of you holds a musician's card. Talk, put them in the right order… and their notes will spell the password that starts the march.",
      answer: 'FACADE', lockSeconds: 20,
      musicians: [
        { name: 'Trumpet', emoji: '🎺', note: 'F4', freq: 349.23, wave: 'sawtooth', clue: 'I always lead the march. Nobody plays before me!' },
        { name: 'Trombone', emoji: '📯', note: 'A4', freq: 440.0, wave: 'sawtooth', clue: 'Only ONE musician plays before me. Funny thing: the clarinet and I play the same note.' },
        { name: 'Tuba', emoji: '🎺', note: 'C5', freq: 261.63, wave: 'square', clue: 'There are exactly two musicians between me and the piccolo.',
          memo: "Bandleader's sticky note: in English, notes are letters. On the lines (bottom to top): Every Good Boy Deserves Fun. In the spaces… just read the FACE." },
        { name: 'Clarinet', emoji: '🎶', note: 'A4', freq: 440.0, wave: 'triangle', clue: "I play right before the saxophone. And please, don't put me next to the trombone!" },
        { name: 'Saxophone', emoji: '🎷', note: 'D5', freq: 587.33, wave: 'sawtooth', clue: 'Right after my solo, one last musician closes the march.' },
        { name: 'Piccolo', emoji: '🪈', note: 'E5', freq: 659.25, wave: 'sine', clue: "I'm the smallest, so they always put me at the very end." },
      ],
      hints: [
        'Notes are letters in English. Lines from the bottom: E G B D F. Spaces from the bottom: F A C E.',
        'The order is: Trumpet, Trombone, Tuba, Clarinet, Saxophone, Piccolo. Now read their notes!',
      ],
      reward: { icon: '🎺', text: 'République: SIX musicians led your march out of the square.' },
    },
    // ---------- STAGE 1 ----------
    {
      id: 'witnesses', place: 'chatelet', title: 'Street Interviews', icon: '🎙️',
      intro: "Châtelet. Total chaos. You need to cross the Seine, but kepi zombies block the bridges. Each of you interviewed one passer-by: listen, report to your team, and choose the ONLY safe bridge. Careful… one of the witnesses has already been bitten.",
      lockSeconds: 30,
      bridges: ['Pont des Arts', 'Pont Neuf', 'Pont au Change', 'Pont Notre-Dame', "Pont d'Arcole"],
      answer: 'Pont Neuf',
      witnesses: [
        { name: 'Margaret', who: 'retired teacher', lang: 'en-GB', pitch: 1.1, rate: 0.95,
          text: "Oh dear, it was dreadful. A whole platoon of zombies in kepis marched onto the Pont d'Arcole, heading for Notre-Dame. Don't go anywhere near it, darling." },
        { name: 'Brad', who: 'tourist from Texas', lang: 'en-US', pitch: 1, rate: 1.05,
          text: "Dude. I tried to take a selfie on the Pont Notre-Dame, then on the Pont au Change. Both totally packed with zombies. Like, hundreds. I lost my phone, man." },
        { name: 'Kylie', who: 'skater from Sydney', lang: 'en-AU', pitch: 1.2, rate: 1.05,
          text: "Pont des Arts? No way, mate. The zombies are eating all the love padlocks on the railings. Crunch, crunch. Super weird. Stay away." },
        { name: 'Siobhan', who: 'street musician from Dublin', lang: 'en-IE', pitch: 1, rate: 0.95,
          text: "If you want to get across, take the oldest bridge in Paris. Funny thing is, its name says it's brand new. There's a king on a horse in the middle, and nobody else." },
        { name: 'Gary', who: 'man in a yellow raincoat', lang: 'en-GB', pitch: 0.55, rate: 0.85,
          text: "Hello there! Lovely yellow raincoat, isn't it? Listen… whatever you do, don't take the Pont Neuf. It's full of zombies. Trust me. Grrr… sorry. I have a cold." },
        { name: 'Priya', who: 'TV journalist', lang: 'en-IN', pitch: 1.05, rate: 1,
          text: "I've been filming all day and I noticed something odd: the man in the yellow raincoat was bitten an hour ago. He's turning. Whatever he tells you, do the opposite." },
      ],
      hints: [
        'Write down the 5 bridges and cross out every bridge a witness calls dangerous… but first decide who you can trust.',
        "Gary (yellow raincoat) is a zombie. Siobhan's 'brand new' bridge, in French, is… Pont NEUF.",
      ],
      reward: { icon: '🎙️', text: 'Châtelet: six witnesses — FIVE told the truth, one was a zombie.' },
    },
    // ---------- STAGE 2 ----------
    {
      id: 'sixseven', place: 'pontneuf', title: 'Six or Seven?', icon: '🧒',
      intro: "Pont Neuf. A gang of zombie kids blocks the bridge! They only understand two numbers: SIX and SEVEN. Answer their questions as fast as you can. EACH of you must get 4 right to get the team across. Wrong answer? They bite you (5 seconds).",
      perPlayer: 4, biteSeconds: 5,
      riddles: [
        ['How many legs does an insect have?', 6], ['How many days are there in a week?', 7],
        ['How many sides does a hexagon have?', 6], ['How many dwarfs live with Snow White?', 7],
        ['How many colours are there in a rainbow?', 7], ['How many strings are there on a standard guitar?', 6],
        ['How many continents are there (the usual count)?', 7], ['How many faces does a dice have?', 6],
        ['How many wives did Henry VIII have?', 6], ['How many Harry Potter books are there?', 7],
        ['How many players does a volleyball team have on the court?', 6], ['How many deadly sins are there?', 7],
        ['How many points does a snowflake usually have?', 6], ['How many seas do pirates sail, in the expression?', 7],
        ['James Bond is agent 00…?', 7], ['Half a dozen zombies is how many zombies?', 6],
        ['How many musicians play in a sextet?', 6], ['How many wonders of the ancient world are there?', 7],
        ['How many letters are there in the word ZOMBIE?', 6],
        ['One zombie bites 3 people. Each of them bites 1 more person. How many zombies now, the first one included?', 7],
        ['How many main characters are there in the TV show Friends?', 6],
        ['How many different notes are there in a major scale?', 7],
        ['How many players per team are on the ice in hockey, goalie included?', 6],
      ],
      hints: ['Shout your questions to your teammates: someone always knows!', 'Most questions about "the week", "sins", "seas", "wonders" are SEVEN.'],
      reward: { icon: '🧒', text: "Pont Neuf: the zombie kids ran away screaming: 'Not SEVEN! Anything but SEVEN!'" },
    },
    // ---------- STAGE 3 ----------
    {
      id: 'gartic', place: 'louvre', title: 'The Stolen Masterpiece', icon: '🎨',
      intro: "The Louvre. The zombies have hidden the most famous painting of a revolution among other masterpieces. Only ONE of you will see it. Pass it along in silence — words, then drawings, then words… — and the last player must recognise it. No talking, no showing screens!",
      lockSeconds: 20, describeSeconds: 60, drawSeconds: 75, maxChain: 6,
      forbidden: ['delacroix', 'liberty', 'liberté', 'liberte', 'leading the people'],
      answer: 'liberty',
      paintings: [
        { id: 'liberty', title: 'Liberty Leading the People', artist: 'Eugène Delacroix, 1830',
          commons: 'Eugène Delacroix - La liberté guidant le peuple.jpg',
          desc: 'A woman in a red cap holds the French flag high and leads armed men over a barricade of bodies; smoke everywhere, a boy with two pistols at her side, Notre-Dame far away.' },
        { id: 'medusa', title: 'The Raft of the Medusa', artist: 'Théodore Géricault, 1819',
          commons: 'JEAN LOUIS THÉODORE GÉRICAULT - La Balsa de la Medusa (Museo del Louvre, 1818-19).jpg',
          desc: 'Desperate, dying men on a broken wooden raft in a stormy sea; one man waves a cloth at a tiny ship on the horizon.' },
        { id: 'sardanapalus', title: 'The Death of Sardanapalus', artist: 'Eugène Delacroix, 1827',
          commons: 'Eugène Delacroix - La Mort de Sardanapale.jpg',
          desc: 'A king lies on a huge red bed, watching calmly while his servants kill women and horses all around him. Chaos, red and gold.' },
        { id: 'horatii', title: 'Oath of the Horatii', artist: 'Jacques-Louis David, 1784',
          commons: 'Jacques-Louis David - Oath of the Horatii - Google Art Project.jpg',
          desc: 'Three brothers in Roman helmets raise their arms towards their father, who holds up three swords; crying women sit on the right.' },
        { id: 'coronation', title: 'The Coronation of Napoleon', artist: 'Jacques-Louis David, 1807',
          commons: 'Jacques-Louis David, The Coronation of Napoleon edit.jpg',
          desc: 'In a huge church, Napoleon in a red and gold cloak lifts a crown to put it on the head of Josephine, who kneels before him; a crowd watches.' },
        { id: 'monalisa', title: 'Mona Lisa', artist: 'Leonardo da Vinci, c. 1503',
          commons: 'Mona Lisa, by Leonardo da Vinci, from C2RMF retouched.jpg',
          desc: 'A woman with dark hair and folded hands smiles mysteriously; a misty landscape behind her.' },
      ],
      hints: ['Look for: a crowd, a barricade, a flag held high.', 'It was painted by Delacroix.'],
      reward: { icon: '🎨', text: "Louvre: 'Liberty Leading the People' by Delacroix, painted to celebrate the July Revolution of 1830." },
    },
    // ---------- STAGE 4 ----------
    {
      id: 'bunker', place: 'elysee', title: 'The Zombie General', icon: '🪖',
      intro: "The Élysée bunker. The Zombie General — the biggest kepi in Paris — guards the door. He's so arrogant he gave away the code… in pieces. Each of you heard one piece. Use everything you collected on your way (🎒).",
      answer: '6570', lockSeconds: 30,
      lines: [
        'The code has FOUR digits. Grrr. You will never find them.',
        'The first digit? The number of musicians who led your march.',
        'The second digit? How many witnesses told you the truth at Châtelet.',
        'The third digit? The number my little zombie kids fear the most.',
        'The last digit? Take the year of the revolution in that famous painting… and keep only its LAST digit.',
        'Every wrong code and my horde attacks you for 30 seconds. Hahaha!',
      ],
      hints: ['Open your inventory (🎒): each card hides one digit.', '6 musicians · 5 honest witnesses · the kids fear 7 · 1830 → 0'],
      reward: { icon: '🏆', text: 'Élysée: the bunker is open. Paris is saved!' },
    },
  ],

  // ===== SYNCHRONISED DUELS (launched from the admin screen) =====
  raid: {
    place: 'marais', title: 'BRAV-M RAID IN THE MARAIS!', seconds: 45, penaltySeconds: 30,
    instructions: 'Swipe to slice the kepi zombies (+1). Do NOT slice the tourists (−3)!',
  },
  karaoke: {
    place: 'garnier', title: 'KARAOKE DUEL AT THE OPÉRA GARNIER', writeSeconds: 120, penaltySeconds: 30,
    song: 'When the Saints Go Marching In (traditional)',
    instructions: 'The zombie showman wants a song! Rewrite the chorus to turn the zombies back into humans, then SING it in front of everyone.',
    blanks: [
      { id: 'b1', label: 'Who is marching in? (plural)', example: 'zombies' },
      { id: 'b2', label: 'I want to be in that… (one word)', example: 'number' },
      { id: 'b3', label: 'Who / what? (plural)', example: 'kepis' },
      { id: 'b4', label: '…begin to (verb)', example: 'dance' },
    ],
    lines: [
      'Oh when the {b1} go marching in,',
      'Oh when the {b1} go marching in,',
      'Oh Lord, I want to be in that {b2},',
      'When the {b1} go marching in!',
      'Oh when the {b3} begin to {b4},',
      'Oh when the {b3} begin to {b4},',
      'Oh Lord, I want to be in that {b2},',
      'When the {b3} begin to {b4}!',
    ],
  },

  // ===== SECRET MISSIONS (one per player, bonus hint token if validated by the admin) =====
  missions: [
    'Get a player from the OTHER team to say the word "baguette".',
    'Speak with a strong British accent until the end of the next puzzle.',
    'Make your whole team do the "six seven" gesture at the same time.',
    'Hum a fanfare tune every time your team solves a puzzle.',
    'Salute like a soldier every time someone says "zombie".',
    'Convince a teammate to walk like a zombie for 10 seconds.',
    'Compliment the teacher in English at least twice.',
    'Use the expression "piece of cake" in a sentence without anyone noticing.',
    'Get the other team to ask you for help.',
    'Say "Liberty, Equality, Fraternity!" dramatically at least once.',
    'Make someone laugh during the karaoke duel.',
    'Narrate what your team does like a nature documentary for 20 seconds.',
  ],
};
