// カラム定義やSQL構文を集約 (databaseアクセス関係)

// ----------------1⃣baseテーブル: 出場選手カード作成関係------------------------------

// ✅ 管理しやすいようにカラム名を配列で定義　(順番が大事)
const racerColumns = [
    'hdate','jcd',
    'toban', 'name', 'shibu', 'kyu',
    'zsyo', 'z2ren', 'z3ren'
];

// CREATE TABLE 文を自動生成 (列が増えても保守が楽) 
const racerColumnDefs = `
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 ${racerColumns.map(col => `${col} TEXT`).join(',\n ')},
 UNIQUE(toban) 
 `;

//プレースホルダを生成 
const racerPlaceholders = racerColumns.map(() => '?').join(',');

// ON CONFLICT(hdate, toban) による条件付き上書き (同日・同選手番でなければ上書き)
const racerInsertSQL = `INSERT INTO racer_programs (${racerColumns.join(', ')}) 
                   VALUES (${racerPlaceholders})
                   ON CONFLICT(toban) DO UPDATE SET 
                     ${racerColumns
                       .filter(col => col !== 'toban') //主キー以外を更新対象に
                       .map(col => `${col} = excluded.${col}`)
                       .join(',\n    ')}
                  `;

// ----------------2⃣節管理テーブル: 出場選手カード作成関係------------------------------

// ✅ 管理しやすいようにカラム名を配列で定義　(順番が大事)
const seriesColumns = [
    'hdate_source','jcd', 'jname',
    'grade','title',
    'start_date','end_date','dates','created_at'
];

// CREATE TABLE 文を自動生成 (列が増えても保守が楽) 
const seriesColumnDefs = `
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 ${seriesColumns.map(col => `${col} TEXT`).join(',\n ')},
 UNIQUE(jcd,start_date) 
 `;

//プレースホルダを生成 
const seriesPlaceholders = seriesColumns.map(() => '?').join(',');

// ON CONFLICT(jcd, start_date) による条件付き上書き (同日・同選手番でなければ上書き)
const seriesInsertSQL = `INSERT INTO series_info (${seriesColumns.join(', ')}) 
                   VALUES (${seriesPlaceholders})
                   ON CONFLICT(jcd,start_date) DO UPDATE SET 
                     ${seriesColumns
                       .filter(col => col !== 'jcd' && col !== 'start_date') //主キー以外を更新対象に
                       .map(col => `${col} = excluded.${col}`)
                       .join(',\n    ')}
                  `;

// ---------------------3⃣登録選手マスター: 半期に一度更新する全選手基本情報----------------------------
const masterColumns = [
  'toban','entry_period',
  'kyu','img','updated_at'
];

const masterColumnDefs = `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ${masterColumns.map(col => `${col} TEXT`).join(',\n')},
  UNIQUE(toban)
  `;

const masterPlaceholders = masterColumns.map(() => '?').join(',');

const masterInsertSQL = `INSERT INTO racer_master (${masterColumns.join(', ')})
VALUES (${masterPlaceholders})
ON CONFLICT(toban) DO UPDATE SET
  ${masterColumns
    .filter(col => col !== 'toban')
    .map(col => `${col} = excluded.${col}`)
    .join(',\n  ')}`;

module.exports = { racerColumns, racerColumnDefs, racerInsertSQL,
                   seriesColumns,seriesColumnDefs,seriesInsertSQL,
                   masterColumns,masterColumnDefs,masterInsertSQL };