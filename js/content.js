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
    // ---------- STAGE 0 : riddles -> letter lock ----------
    {
      id: 'riddles', place: 'republique', title: 'The Locked Banner', icon: '🔒',
      intro: "Place de la République. The zombies locked your march's banner in a box with a LETTER padlock. Each of you found a riddle. Solve them all: the FIRST LETTERS of the answers, in the order of the riddle numbers, open the lock.",
      answer: 'BANNER', lockSeconds: 20,
      riddles: [
        'What has a neck but no head?',
        'What goes up but never comes down?',
        'What has one eye but cannot see?',
        'What belongs to you, but other people use it more than you do?',
        'What has to be broken before you can use it?',
        'What has a mouth but never eats, and a bed but never sleeps?',
      ],
      hints: [
        'The answers are: a b_ttle, your a_e, a n_edle, your n_me, an e_g, a r_ver.',
        'Bottle, Age, Needle, Name, Egg, River → first letters!',
      ],
      reward: { icon: '🚩', text: 'République: you got your banner back. The padlock had SIX letters.' },
    },
    // ---------- STAGE 1 : emoji cipher -> digicode ----------
    {
      id: 'cipher', place: 'chatelet', title: 'The Zombie Radio', icon: '📻',
      intro: "Châtelet. The only way out is through the metro, but the gate has a 4-digit code. You intercepted a zombie radio message, written in emojis. Each of you has PART of the secret key: put your keys together and decode the message!",
      answer: '9185', lockSeconds: 20,
      message: 'THE GATE CODE IS NINE ONE EIGHT FIVE',
      key: { T: '🧟', H: '🎺', E: '⭐', G: '🥖', A: '🗼', C: '🎩', O: '🍷', D: '🐌', I: '🧀', S: '🚇', N: '🌙', F: '🔥', V: '🎨',
             B: '🐸', K: '🦆', L: '🍓', M: '🎈', P: '🥐', R: '🌹', W: '🚲' },
      cards: [['T', 'H', 'B'], ['E', 'G', 'K'], ['A', 'C', 'L'], ['O', 'D', 'M'], ['I', 'S', 'N', 'P'], ['F', 'V', 'R', 'W']],
      hints: ['The message starts with "THE ...". Each emoji is ONE letter.', 'The message says: "THE GATE CODE IS NINE ONE EIGHT FIVE".'],
      reward: { icon: '🚇', text: 'Châtelet: the metro gate code was 9185.' },
    },
    // ---------- STAGE 2 : six-seven, judged by the game master ----------
    {
      id: 'sixseven', place: 'pontneuf', title: 'Six… Seven!', icon: '🤲',
      intro: "Pont Neuf. A gang of zombie kids blocks the bridge. They will only let you pass if your WHOLE team does the SIX-SEVEN gesture perfectly. Stand up, face the board, and do it all together. The judge decides!",
      lockSeconds: 20,
      hints: ['Both hands up, palms to the sky, move them up and down like a scale: "Six… seven!"'],
      reward: { icon: '🤲', text: 'Pont Neuf: the zombie kids ran away. They only fear one number… SEVEN!' },
    },
    // ---------- STAGE 3 : pictionary ----------
    {
      id: 'pictionary', place: 'louvre', title: 'Artists Only', icon: '🎨',
      intro: "The Louvre. The zombie guard only lets ARTISTS in. One of you draws, the others guess what it is — in English! Find 2 drawings to get in.",
      rounds: 2, skipSeconds: 15,
      // red uses words[red], blue uses words[blue]; spares are used when the drawer skips
      words: {
        red: [{ w: 'a pyramid', ok: ['pyramid'] }, { w: 'the Mona Lisa', ok: ['monalisa'] }, { w: 'a snail', ok: ['snail'] }, { w: 'an umbrella', ok: ['umbrella'] }, { w: 'a ladder', ok: ['ladder'] }],
        blue: [{ w: 'a crown', ok: ['crown'] }, { w: 'The Scream (by Munch)', ok: ['scream'] }, { w: 'a moustache', ok: ['moustache', 'mustache'] }, { w: 'a ghost', ok: ['ghost'] }, { w: 'a ladder', ok: ['ladder'] }],
      },
      hints: ['Drawer: you can skip a word (it costs a few seconds of zombie attack).'],
      reward: { icon: '🎨', text: "Louvre: the zombie guard lets you in. 'Welcome, artists! This museum opened in 1793, you know.'" },
    },
    // ---------- STAGE 4 : final meta-puzzle ----------
    {
      id: 'bunker', place: 'elysee', title: 'The Zombie General', icon: '🪖',
      intro: "The Élysée bunker. The Zombie General — the biggest kepi in Paris — guards the door. He's so arrogant he gave away the code… in pieces. Each of you heard one piece. Use everything you collected on your way (🎒 Inventory).",
      answer: '6973', lockSeconds: 30,
      lines: [
        'The code has FOUR digits. Grrr. You will never find them.',
        "The first digit? How many letters were on your banner's padlock.",
        'The second digit? The FIRST digit of the Châtelet metro code.',
        'The third digit? The number my little zombie kids fear the most.',
        'The last digit? The year the Louvre opened… keep only its LAST digit.',
        'Every wrong code and my horde attacks you for 30 seconds. Hahaha!',
      ],
      hints: ['Open your inventory (🎒): each card hides one digit.', '6 letters · metro code 9185 → 9 · the kids fear 7 · 1793 → 3'],
      reward: { icon: '🏆', text: 'Élysée: the bunker is open. Paris is saved!' },
    },
  ],

  // ===== SYNCHRONISED DUELS (launched from the admin screen) =====
  raid: {
    place: 'marais', title: 'BRAV-M RAID IN THE MARAIS!', seconds: 45, penaltySeconds: 30,
    instructions: 'Swipe to slice the kepi zombies (+1). Do NOT slice the tourists (−3)!',
  },
  karaoke: {
    place: 'garnier', title: 'KARAOKE DUEL AT THE OPÉRA GARNIER', writeSeconds: 60, penaltySeconds: 30,
    // Jingle Bells is public domain. To use another song, replace title, lines and blanks
    // (and set `youtube` to a link of the music; it will open from the board).
    song: 'Jingle Bells', youtube: '',
    instructions: 'The zombie showman stole some words from the song! Find the missing words on your phones, then SING the whole chorus in front of everyone.',
    blanks: [{ id: 'b1', answer: 'way' }, { id: 'b2', answer: 'fun' }, { id: 'b3', answer: 'sleigh' }, { id: 'b4', answer: 'ride' }],
    lines: [
      'Jingle bells, jingle bells,',
      'Jingle all the {b1}!',
      'Oh what {b2} it is to {b4}',
      'In a one-horse open {b3}, hey!',
      'Jingle bells, jingle bells,',
      'Jingle all the {b1}!',
      'Oh what {b2} it is to {b4}',
      'In a one-horse open {b3}!',
    ],
    // one entry per line: [note, beats]
    melody: [
      [['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['E4', 1], ['E4', 2]],
      [['E4', 1], ['G4', 1], ['C4', 1.5], ['D4', 0.5], ['E4', 4]],
      [['F4', 1], ['F4', 1], ['F4', 1.5], ['F4', 0.5], ['F4', 1], ['E4', 1], ['E4', 1]],
      [['E4', 0.5], ['E4', 0.5], ['E4', 1], ['D4', 1], ['D4', 1], ['E4', 1], ['D4', 2], ['G4', 2]],
      [['E4', 1], ['E4', 1], ['E4', 2], ['E4', 1], ['E4', 1], ['E4', 2]],
      [['E4', 1], ['G4', 1], ['C4', 1.5], ['D4', 0.5], ['E4', 4]],
      [['F4', 1], ['F4', 1], ['F4', 1.5], ['F4', 0.5], ['F4', 1], ['E4', 1], ['E4', 1]],
      [['E4', 0.5], ['E4', 0.5], ['G4', 1], ['G4', 1], ['F4', 1], ['D4', 1], ['C4', 4]],
    ],
  },

  // ===== SECRET MISSIONS (one per player, bonus hint token if validated by the admin) =====
  missions: [
    'Get a player from the OTHER team to say the word "baguette".',
    'Speak with a strong British accent until the end of the next puzzle.',
    'Make the other team laugh while they do the six-seven gesture.',
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
