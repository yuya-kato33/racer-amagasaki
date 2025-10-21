 // place_masterテーブル
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/program1.db');

   // 🎯 place_master 初期データ
    const placeMaster = [
    ['01', '桐生'], ['02', '戸田'], ['03', '江戸川'], ['04', '平和島'],
    ['05', '多摩川'], ['06', '浜名湖'], ['07', '蒲郡'], ['08', '常滑'],
    ['09', '津'], ['10', '三国'], ['11', 'びわこ'], ['12', '住之江'],
    ['13', '尼崎'], ['14', '鳴門'], ['15', '丸亀'], ['16', '児島'],
    ['17', '宮島'], ['18', '徳山'], ['19', '下関'], ['20', '若松'],
    ['21', '芦屋'], ['22', '福岡'], ['23', '唐津'], ['24', '大村']
  ];

  db.serialize(() => {
    // DROPしない IF NOT EXISTS で安全に作成
    db.run(`
        CREATE TABLE place_master (
          jcd TEXT PRIMARY KEY,
          jname TEXT NOT NULL
        )
      `, (err) => {
        if(err) {
        console.error("× place_master テーブル作成失敗:", err.message);
      } else {
        console.log("☑ place_master テーブル作成確認 / 作成済");

        // 既存jcdがなければINSERTする
        const stmt = db.prepare("INSERT OR IGNORE INTO place_master (jcd,jname) VALUES (?, ?)");
        for (const [jcd,jname] of placeMaster) {
          stmt.run(jcd,jname);
        }
        stmt.finalize(() => {
            console.log("✅ place_master 初期データ登録完了 (重複無視) ");
            db.close();
        });
      }
    });
  });    