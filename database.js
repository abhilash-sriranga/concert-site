const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'concerts.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS concerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist TEXT NOT NULL,
    venue TEXT NOT NULL,
    event_date TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    image_seed TEXT
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    concert_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (concert_id) REFERENCES concerts(id),
    UNIQUE(session_id, concert_id)
  );
`);

const existing = db.prepare('SELECT COUNT(*) as count FROM concerts').get();
if (existing.count === 0) {
  const insert = db.prepare(`
    INSERT INTO concerts (artist, venue, event_date, price, description, image_seed)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const concerts = [
    ['The Midnight Echoes', 'Neon Horizon Arena', '2026-09-12', 85.00,
      'The Midnight Echoes bring their signature synth-wave sound to the iconic Neon Horizon Arena. Expect an electrifying set spanning three decades of hits and brand new material from their upcoming album.', 'concert1'],
    ['Luna Vex', 'Starfall Amphitheater', '2026-09-20', 65.00,
      'Indie-pop sensation Luna Vex performs under the stars at the stunning Starfall Amphitheater. Known for her haunting vocals and dreamy production, this is a show you will not want to miss.', 'concert2'],
    ['Iron Compass', 'The Forge Stadium', '2026-10-03', 110.00,
      'Hard rock legends Iron Compass return to the stage after a five-year hiatus. The Forge Stadium will shake with their thunderous riffs and pyrotechnic spectacle.', 'concert3'],
    ['Sable & Gold', 'Velvet Room Live', '2026-10-18', 55.00,
      'Jazz-soul duo Sable & Gold create an intimate evening of improvised magic. The Velvet Room Live provides the perfect intimate setting for their emotionally charged performance.', 'concert4'],
    ['Prism Collective', 'Crystal Dome', '2026-11-01', 95.00,
      'Electronic music collective Prism Collective transforms Crystal Dome into a full sensory experience. Expect immersive visuals, cutting-edge sound design, and surprise guest appearances.', 'concert5'],
    ['Rosa Delmar', 'Mariposa Garden Stage', '2026-11-14', 72.00,
      'Latin pop star Rosa Delmar lights up the Mariposa Garden Stage with her vibrant energy. Her infectious rhythms and stunning choreography have sold out venues across three continents.', 'concert6'],
    ['Void Atlas', 'The Observatory Hall', '2026-11-29', 88.00,
      'Post-rock experimentalists Void Atlas push the boundaries of live performance at The Observatory Hall. Their cinematic soundscapes unfold like a journey through space and time.', 'concert7'],
    ['The Copper Kings', 'Redrock Pavilion', '2026-12-06', 60.00,
      'Country-blues outfit The Copper Kings bring their roots-inspired sound to the open air Redrock Pavilion. Fire pits, cold drinks, and soulful Americana make this a perfect winter evening.', 'concert8'],
    ['Zara Nightfall', 'Pinnacle Concert Hall', '2026-12-19', 120.00,
      'Global pop superstar Zara Nightfall closes out the year with a spectacular show at Pinnacle Concert Hall. Featuring elaborate set designs, world-class dancers, and a greatest hits setlist.', 'concert9'],
    ['Echo & The Tides', 'Harbor Light Theater', '2027-01-10', 50.00,
      'Beloved indie folk band Echo & The Tides ring in the new year with an acoustic evening at the intimate Harbor Light Theater. Warm harmonies and storytelling songs make this a true community gathering.', 'concert10'],
  ];

  for (const c of concerts) insert.run(...c);
}

module.exports = db;
