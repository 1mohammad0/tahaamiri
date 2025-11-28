// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// فایل دیتا
const DATA_FILE = path.join(__dirname, "data.json");

// اطمینان از وجود data.json
function ensureDB() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { likes: 0, dislikes: 0, comments: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

// خواندن DB
function loadDB() {
  ensureDB();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

// ذخیره DB
function saveDB(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

// سرو کردن فایل‌های استاتیک (frontend)
app.use(express.static(path.join(__dirname, "public")));

// --- API ها ---
// گرفتن همهٔ داده‌ها
app.get("/data", (req, res) => {
  try {
    const db = loadDB();
    res.json(db);
  } catch (e) {
    res.status(500).json({ error: "read_error" });
  }
});

// لایک
app.post("/like", (req, res) => {
  try {
    const db = loadDB();
    db.likes = (db.likes || 0) + 1;
    saveDB(db);
    res.json({ ok: true, likes: db.likes });
  } catch (e) {
    res.status(500).json({ error: "write_error" });
  }
});

// دیسلایک
app.post("/dislike", (req, res) => {
  try {
    const db = loadDB();
    db.dislikes = (db.dislikes || 0) + 1;
    saveDB(db);
    res.json({ ok: true, dislikes: db.dislikes });
  } catch (e) {
    res.status(500).json({ error: "write_error" });
  }
});

// ثبت نظر
app.post("/comment", (req, res) => {
  try {
    const text = (req.body.text || "").toString().trim();
    if (!text) return res.status(400).json({ error: "empty" });

    const db = loadDB();
    db.comments = db.comments || [];
    // ذخیرهٔ زمان برای هر نظر (اختیاری ولی مفید)
    db.comments.push({ text, createdAt: new Date().toISOString() });
    saveDB(db);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "write_error" });
  }
});

// حذف نظر بر اساس index
app.post("/delete-comment", (req, res) => {
  try {
    const index = Number(req.body.index);
    const db = loadDB();
    if (!Array.isArray(db.comments) || index < 0 || index >= db.comments.length) {
      return res.status(400).json({ error: "invalid_index" });
    }
    db.comments.splice(index, 1);
    saveDB(db);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "write_error" });
  }
});

// ویرایش نظر بر اساس index
app.post("/edit-comment", (req, res) => {
  try {
    const index = Number(req.body.index);
    const newText = (req.body.newText || "").toString().trim();
    if (!newText) return res.status(400).json({ error: "empty_newtext" });

    const db = loadDB();
    if (!Array.isArray(db.comments) || index < 0 || index >= db.comments.length) {
      return res.status(400).json({ error: "invalid_index" });
    }
    db.comments[index].text = newText;
    db.comments[index].editedAt = new Date().toISOString();
    saveDB(db);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "write_error" });
  }
});

// پورت و شروع
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
