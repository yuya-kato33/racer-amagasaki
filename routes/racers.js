const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // GET /api/racers?hdate=20250418&jcd=13
    router.get('/', (req,res) => {
      const { hdate, jcd } = req.query;

      if(!hdate || !jcd) {
        return res.status(400).json( { error: 'hdateとjcdは必須です' });
      }
      
      const sql = `
        SELECT * FROM racer_programs
        WHERE hdate = ? AND jcd = ?
        ORDER BY toban
      `;

      db.all(sql, [hdate, jcd], (err, rows) => {
        if(err) {
           console.error('❌ SQLエラー:', err.message);
           return res.status(500).json({ error: 'DBエラー' });
        }

        res.json(rows);
      });
    });

    return router;
};