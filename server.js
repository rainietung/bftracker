const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static("public")); // 前端放在 public/

// 建立 MySQL 連線 (修改成你的帳號密碼)
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "abcd1234",
  database: "habit_tracker"
});

db.connect(err => {
  if (err) throw err;
  console.log("✅ MySQL 連線成功");
});

// 取得所有項目
app.get("/api/items", (req, res) => {
  db.query("SELECT * FROM items", (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

// 新增項目
app.post("/api/items", (req, res) => {
  const { name } = req.body;
  db.query("INSERT INTO items (name) VALUES (?)", [name], (err, result) => {
    if (err) throw err;
    res.json({ id: result.insertId, name });
  });
});

// 點擊 +1 記錄
app.post("/api/items/:id/increment", (req, res) => {
  const { id } = req.params;
  db.query("INSERT INTO records (item_id) VALUES (?)", [id], (err) => {
    if (err) throw err;
    res.json({ success: true });
  });
});

// 統計 (每天 / 每週 / 每月)
app.get("/api/stats", (req, res) => {
  const today = `CURDATE()`;
  const week = `YEARWEEK(created_at, 1) = YEARWEEK(NOW(), 1)`;
  const month = `YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())`;

  db.query(`SELECT COUNT(*) as daily FROM records WHERE DATE(created_at) = ${today}`, (err, daily) => {
    db.query(`SELECT COUNT(*) as weekly FROM records WHERE ${week}`, (err, weekly) => {
      db.query(`SELECT COUNT(*) as monthly FROM records WHERE ${month}`, (err, monthly) => {
        res.json({
          daily: daily[0].daily,
          weekly: weekly[0].weekly,
          monthly: monthly[0].monthly
        });
      });
    });
  });
});

app.post('/clear', (req, res) => {
  db.query('TRUNCATE TABLE records', (err) => {
    if (err) return res.status(500).send('Error clearing records');
    res.send('✅ 所有紀錄已清空');
  });
});



app.listen(PORT, () => console.log(`🚀 伺服器運行於 http://localhost:${PORT}`));
