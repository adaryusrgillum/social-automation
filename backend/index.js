const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'schedules.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT,
      content TEXT,
      media_path TEXT,
      scheduled_time DATETIME,
      status TEXT DEFAULT 'pending'
    )`);
  }
});

// Create a scheduled post
app.post('/schedule', (req, res) => {
  const { platform, content, media_path, scheduled_time } = req.body;
  if (!platform || (!content && !media_path) || !scheduled_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const stmt = db.prepare('INSERT INTO posts (platform, content, media_path, scheduled_time) VALUES (?, ?, ?, ?)');
  stmt.run([platform, content, media_path, scheduled_time], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Post scheduled successfully' });
  });
});

// Get all posts
app.get('/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY scheduled_time ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Update post status
app.patch('/posts/:id/status', (req, res) => {
  const { status } = req.body;
  db.run('UPDATE posts SET status = ? WHERE id = ?', [status, req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Status updated' });
  });
});

// Background job checking for posts to execute
cron.schedule('* * * * *', () => {
  console.log('Checking for scheduled posts...');
  const now = new Date().toISOString();
  db.all("SELECT * FROM posts WHERE status = 'pending' AND scheduled_time <= ?", [now], (err, rows) => {
    if (err) {
      console.error('Error fetching due posts:', err.message);
      return;
    }
    rows.forEach(post => {
      console.log(`Executing post ${post.id} for ${post.platform}...`);
      // Here we would typically notify the desktop controller or mobile app
      // For now, we just mark it as 'processing'
      db.run("UPDATE posts SET status = 'processing' WHERE id = ?", [post.id]);
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend scheduler running on port ${PORT}`);
});
