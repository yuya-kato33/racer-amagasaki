// API 節情報

const express = require('express');

module.exports = (db) => {
  const router = express.Router();

       // 日付関係のリスト(日付一覧)を取得
      router.get('/dates',(req,res) => {
        console.log('GET /api/dates called'); // 追加
        const query = `
          SELECT DISTINCT hdate_source FROM series_info ORDER BY hdate_source DESC
        `;
        db.all(query,[],(err, rows) => {
        if (err) {
          console.error('✖ 日付一覧取得失敗:', err.message); // 追加
          return res.status(500).json({ error: '日付一覧の取得に失敗しました' });
        }
        const dates = rows.map(row => row.hdate_source);
        res.json(dates);
      });
  });

  // GET /api/series/bydate/:date
  router.get('/bydate/:date',(req,res) => {
    const { date } = req.params;

    // 例: 20250419 → '%20250419%' の部分一致検索
    const queryday = `
      SELECT jcd, jname, grade, title, start_date, end_date
      FROM series_info
      WHERE dates LIKE?
      ORDER BY jcd
      `;

    db.all(queryday, [`%${date}%`], (err,rows) => {
      if(err) {
        console.error('✖ SQLエラー:', err.message);
        return res.status(500).json({ error: '節情報の取得に失敗しました' });
      }
      res.json(rows);
    });
  });

  // GET /api/series/:hdate_source/:jcd/racers
  router.get('/:hdate_source/:jcd/racers',(req,res) => {
    const { hdate_source, jcd } = req.params;

    const querySeries = `
      SELECT * FROM series_info
      WHERE hdate_source = ? AND jcd = ?
    `;

    db.get(querySeries, [hdate_source,jcd], (err,seriesRow) => {
      if(err || !seriesRow || !seriesRow.dates)  {
        return res.status(404).json({ error: '該当する節情報がみつかりません'});
      }

      const hdates = seriesRow.dates.split(',');
      const placeholders = hdates.map(() => '?').join(',');

      const queryRacers = `
        SELECT * FROM racer_programs
        WHERE jcd = ? AND hdate IN (${placeholders})
        GROUP BY toban
        ORDER BY toban
       `;
       
      db.all(queryRacers, [jcd, ...hdates],(err2,rows) => {
        if(err2) {
          console.error('❌ SQLエラー:', err2.message);
          return res.status(500).json({ error: '選手データの取得に失敗しました' });
        }
        res.json(rows);
      });
    });
  });

  return router;
}