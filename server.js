const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public")); // 前端放在 public/

// 建立 MySQL 連線 (修改成你的帳號密碼)
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "yourpassword",
  database: "habit_tracker"
});

db.connect(err => {
  if (err) throw err;
  console.log("✅ MySQL 連線成功");
});

// 取得所有項目 + 各項目的「總/日/週/月」統計
app.get("/api/items", (req, res) => {
  const q = `
    SELECT 
      i.id,
      i.name,
      COALESCE(t_total.cnt, 0)   AS total,
      COALESCE(t_daily.cnt, 0)   AS daily,
      COALESCE(t_weekly.cnt, 0)  AS weekly,
      COALESCE(t_monthly.cnt, 0) AS monthly
    FROM items i
    LEFT JOIN (
      SELECT item_id, COUNT(*) cnt
      FROM records
      GROUP BY item_id
    ) t_total ON t_total.item_id = i.id
    LEFT JOIN (
      SELECT item_id, COUNT(*) cnt
      FROM records
      WHERE DATE(created_at) = CURDATE()
      GROUP BY item_id
    ) t_daily ON t_daily.item_id = i.id
    LEFT JOIN (
      SELECT item_id, COUNT(*) cnt
      FROM records
      WHERE YEARWEEK(created_at, 1) = YEARWEEK(NOW(), 1)
      GROUP BY item_id
    ) t_weekly ON t_weekly.item_id = i.id
    LEFT JOIN (
      SELECT item_id, COUNT(*) cnt
      FROM records
      WHERE YEAR(created_at) = YEAR(NOW())
        AND MONTH(created_at) = MONTH(NOW())
      GROUP BY item_id
    ) t_monthly ON t_monthly.item_id = i.id
    ORDER BY i.id DESC;
  `;
  db.query(q, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 新增項目
app.post("/api/items", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  db.query("INSERT INTO items (name) VALUES (?)", [name], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, name });
  });
});

// 點擊 +1 記錄
app.post("/api/items/:id/increment", (req, res) => {
  const { id } = req.params;
  db.query("INSERT INTO records (item_id) VALUES (?)", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 全站統計 (每天 / 每週 / 每月)
app.get("/api/stats", (req, res) => {
  const today = `CURDATE()`;
  const week = `YEARWEEK(created_at, 1) = YEARWEEK(NOW(), 1)`;
  const month = `YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())`;
  db.query(`SELECT COUNT(*) as daily FROM records WHERE DATE(created_at) = ${today}`, (err, daily) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query(`SELECT COUNT(*) as weekly FROM records WHERE ${week}`, (err, weekly) => {
      if (err) return res.status(500).json({ error: err.message });
      db.query(`SELECT COUNT(*) as monthly FROM records WHERE ${month}`, (err, monthly) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          daily: daily[0].daily,
          weekly: weekly[0].weekly,
          monthly: monthly[0].monthly
        });
      });
    });
  });
});

// 清空所有紀錄
app.post('/clear', (req, res) => {
  db.query('TRUNCATE TABLE records', (err) => {
    if (err) return res.status(500).send('Error clearing records');
    res.send('✅ 所有紀錄已清空');
  });
});

app.listen(PORT, () => console.log(`🚀 伺服器運行於 http://localhost:${PORT}`));
