const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function getOrCreateSessionId(req, res) {
  let sessionId = req.cookies.session_id;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie('session_id', sessionId, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
    });
  }
  return sessionId;
}

app.get('/api/concerts', (req, res) => {
  const concerts = db.prepare('SELECT * FROM concerts ORDER BY event_date ASC').all();
  res.json(concerts);
});

app.get('/api/concerts/:id', (req, res) => {
  const concert = db.prepare('SELECT * FROM concerts WHERE id = ?').get(req.params.id);
  if (!concert) return res.status(404).json({ error: 'Concert not found' });
  res.json(concert);
});

app.get('/api/cart', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  const items = db.prepare(`
    SELECT ci.id as cart_item_id, ci.quantity, ci.concert_id,
           c.artist, c.venue, c.event_date, c.price, c.image_seed
    FROM cart_items ci
    JOIN concerts c ON ci.concert_id = c.id
    WHERE ci.session_id = ?
    ORDER BY ci.added_at ASC
  `).all(sessionId);
  res.json(items);
});

app.post('/api/cart', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  const { concert_id, quantity = 1 } = req.body;

  if (!concert_id) return res.status(400).json({ error: 'concert_id required' });

  const concert = db.prepare('SELECT id FROM concerts WHERE id = ?').get(concert_id);
  if (!concert) return res.status(404).json({ error: 'Concert not found' });

  db.prepare(`
    INSERT INTO cart_items (session_id, concert_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(session_id, concert_id)
    DO UPDATE SET quantity = quantity + excluded.quantity
  `).run(sessionId, concert_id, quantity);

  const count = db.prepare(
    'SELECT SUM(quantity) as total FROM cart_items WHERE session_id = ?'
  ).get(sessionId);

  res.json({ success: true, cart_count: count.total || 0 });
});

app.delete('/api/cart/:concertId', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  db.prepare(
    'DELETE FROM cart_items WHERE session_id = ? AND concert_id = ?'
  ).run(sessionId, req.params.concertId);

  const count = db.prepare(
    'SELECT SUM(quantity) as total FROM cart_items WHERE session_id = ?'
  ).get(sessionId);

  res.json({ success: true, cart_count: count.total || 0 });
});

app.get('/api/cart/count', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  const count = db.prepare(
    'SELECT SUM(quantity) as total FROM cart_items WHERE session_id = ?'
  ).get(sessionId);
  res.json({ count: count.total || 0 });
});

app.listen(PORT, () => {
  console.log(`Concert site running at http://localhost:${PORT}`);
});
