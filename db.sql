-- 建立資料庫
CREATE DATABASE IF NOT EXISTS habit_tracker;
USE habit_tracker;

-- 儲存項目 (例如 喝水、跑步)
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- 儲存紀錄 (每次按 +1 時新增一筆)
CREATE TABLE records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
