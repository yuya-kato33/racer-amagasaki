module.exports = (db) => {

    const express = require('express');
    const router = express.Router();

    router.get('/', (req, res) => {
        const { hdate, jcd, rno } = req.query;

        if (!hdate || !jcd || !rno) {
            return res.status(400).json({ error: 'パラメータ不足' });
        }

        const sql = `
            SELECT *
            FROM racer_programs
            WHERE hdate = ?
              AND jcd = ?
              AND rno = ?
            ORDER BY teiban
        `;

        db.all(sql, [hdate, jcd, rno], (err, rows) => {
            if (err) {
                console.error('DBエラー:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        });
    });

    return router;
}