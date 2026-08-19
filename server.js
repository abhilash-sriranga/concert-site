const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const { init, all, get, run } = require('./database');

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
  const concerts = all('SELECT * FROM concerts ORDER BY event_date ASC');
  res.json(concerts);
});

app.get('/api/concerts/:id', (req, res) => {
  const concert = get('SELECT * FROM concerts WHERE id = ?', [req.params.id]);
  if (!concert) return res.status(404).json({ error: 'Concert not found' });
  res.json(concert);
});

app.get('/api/cart', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  const items = all(`
    SELECT ci.id as cart_item_id, ci.quantity, ci.concert_id,
           c.artist, c.venue, c.event_date, c.price, c.image_seed
    FROM cart_items ci
    JOIN concerts c ON ci.concert_id = c.id
    WHERE ci.session_id = ?
    ORDER BY ci.added_at ASC
  `, [sessionId]);
  res.json(items);
});

app.get('/api/cart/count', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  const rows = all('SELECT id FROM cart_items WHERE session_id = ?', [sessionId]);
  res.json({ count: rows.length });
});

app.post('/api/cart', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  const { concert_id, quantity = 1 } = req.body;

  if (!concert_id) return res.status(400).json({ error: 'concert_id required' });

  const concert = get('SELECT id FROM concerts WHERE id = ?', [concert_id]);
  if (!concert) return res.status(404).json({ error: 'Concert not found' });

  run(`
    INSERT INTO cart_items (session_id, concert_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(session_id, concert_id)
    DO UPDATE SET quantity = quantity + excluded.quantity
  `, [sessionId, concert_id, quantity]);

  const rows = all('SELECT id FROM cart_items WHERE session_id = ?', [sessionId]);
  res.json({ success: true, cart_count: rows.length });
});

app.delete('/api/cart/:concertId', (req, res) => {
  const sessionId = getOrCreateSessionId(req, res);
  run('DELETE FROM cart_items WHERE session_id = ? AND concert_id = ?', [sessionId, req.params.concertId]);

  const rows = all('SELECT id FROM cart_items WHERE session_id = ?', [sessionId]);
  res.json({ success: true, cart_count: rows.length });
});

(async () => {
  await init();
  app.listen(PORT, () => {
    console.log(`Concert site running at http://localhost:${PORT}`);
  });
})();
