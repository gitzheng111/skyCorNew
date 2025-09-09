// routes/airportCode.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// 获取所有机场数据
router.get('/airportCode', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM airportCode');
    res.json(rows);
  } catch (err) {
    console.error('查询出错:', err);
    res.status(500).send('Error retrieving airport data');
  }
});

// 批量添加机场
router.post('/airportCode/add', async (req, res) => {
  const airports = req.body; // 应该是一个数组
  if (!Array.isArray(airports) || airports.length === 0) {
    return res.status(400).json({ message: 'Invalid input, expected non-empty array' });
  }

  try {
    const values = airports.map(a => [
      a.chineseName,
      a.englishName,
      a.IATACode,
      a.ICAOCode
    ]);

    const sql = `
      INSERT INTO airportCode (chineseName, englishName, IATACode, ICAOCode)
      VALUES ?
    `;

    await pool.query(sql, [values]);
    res.json({ message: `成功插入 ${airports.length} 条机场数据` });
  } catch (err) {
    console.error('批量插入出错:', err);
    res.status(500).send('Error inserting airport codes');
  }
});

export default router;
