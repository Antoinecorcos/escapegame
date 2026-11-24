// ===== GAME CONFIG =====
// Leave `firebase: null` to play in LOCAL MODE (all tabs of one browser share the game: handy for testing).
// For the real game (phones + projector), paste your Firebase web config here (see README.md).
window.GAME_CONFIG = {
  gameId: 'main', // change it to start a fresh game space (e.g. 'group1', 'group2')
  durationMinutes: 30,
  firebase: null,
  // firebase: {
  //   apiKey: '...',
  //   authDomain: 'your-project.firebaseapp.com',
  //   databaseURL: 'https://your-project-default-rtdb.europe-west1.firebasedatabase.app',
  //   projectId: 'your-project',
  //   appId: '...',
  // },
};
