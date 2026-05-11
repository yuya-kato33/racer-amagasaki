// import-js -race_header.xmlとprogram.xml　の両方を処理するDB登録スクリプト
// ----------- DB登録処理 -----------------------------------

const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const { racerColumnDefs, racerInsertSQL, racerColumns, seriesColumnDefs, seriesInsertSQL, seriesColumns } = require('./db');
const { writeLog } = require('./logger');
const { notifyClients } = require('./notify');

//グローバル変数
// XML保存先のフォルダパス
const saveDir = path.join(__dirname, '..', 'xml',);

// 保存フォルダがなければ作成
if (!fs.existsSync(saveDir)) {
  fs.mkdirSync(saveDir);
}

async function runImport(targetDate, jcdOnly = null) {
  // XML保存先のフォルダパス
  const db = new sqlite3.Database(path.join(__dirname, '..', 'db', 'program1.db'));
  let insertCount = 0; // 新規登録件数カウント

  try {
    // テーブル作成 (racer_programs)
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS racer_programs (${racerColumnDefs})`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // テーブル作成 (racer_series_info)
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS series_info (${seriesColumnDefs})`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 日付フォルダを指定
    const dateDir = path.join(saveDir, targetDate.slice(0, 8));
    if (!fs.existsSync(dateDir)) {
      const msg = `XMLファイルフォルダが見つかりません: ${dateDir}`;
      console.log(msg);
      writeLog(msg);
      throw new Error(msg);
    }

    let xmlFiles = fs.readdirSync(dateDir)

    if (jcdOnly) {
      xmlFiles = xmlFiles.filter(f => f.includes(`-${jcdOnly}`))
    }

    if (xmlFiles.length === 0) {
      const msg = `XMLファイルが見つかりません: ${targetDate}`;
      console.log(msg);
      writeLog(msg);
      throw new Error(msg);
    }

    const headerFiles = xmlFiles.filter(f => f.endsWith('.race_header.xml'));
    const validJcds = [];

    const seriesInsertStmt = db.prepare(seriesInsertSQL);
    const racerInsertStmt = db.prepare(racerInsertSQL);

    // 各XMLファイルを順に処理 まずheaderファイル 
    for (const fileName of headerFiles) {
      if (jcdOnly && !fileName.includes(`-${jcdOnly}.`)) continue;

      const xmlPath = path.join(dateDir, fileName);
      const xml = fs.readFileSync(xmlPath);
      const result = await new Promise((resolve, reject) => {
        xml2js.parseString(xml, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });

      const records = result.boatrace?.table?.[0]?.record || [];
      if (!records) {
        console.warn(`データなしスキップ: ${fileName}`);
        writeLog(`データなしスキップ: ${fileName}`);
        continue;
      }

      // --------階層順に定義登録。(series_info →racer.programs) -------------------------
      for (const record of records) {
        const hdate_source = record.hdate?.[0];
        const jcd = record.jcd?.[0];
        const jname = record.jname?.[0];
        const grade = record.grade?.[0];
        const title = record.ktitl?.[0] || '';

        const extractDate = (node) => node?.[0]?._ ?? null;

        const startDate = extractDate(record.nidate1);

        const endDate = (() => {
          for (let i = 9; i >= 1; i--) {
            const d = extractDate(record[`nidate${i}`]);
            if (d) return d;
          }
          return startDate;
        })();

        const dates = Array.from({ length: 9 }, (_, i) => extractDate(record[`nidate${i + 1}`]))
          .filter(Boolean).join(',');
        const createdAt = new Date().toISOString();
        const seriesData = { hdate_source, jcd, jname, grade, title, start_date: startDate, end_date: endDate, dates, created_at: createdAt };

        const seriesValues = seriesColumns.map(k => seriesData[k]);

        // 🔁 insert: series_info
        await new Promise((resolve, reject) => {
          seriesInsertStmt.run(seriesValues, async function (err) {
            if (err) {
              // INSERT失敗時
              console.error(`✖ INSERTエラー (${fileName})`, err.message);
              writeLog(`✖ INSERTエラー (${fileName}): ${err.message}`);
              return reject(err);
            } else if (this.changes === 0) {
              // 重複スキップ時
              console.log(`スキップ(重複) : ${hdate_source} ${jcd}# ${jname} ${grade} ${title}`);
              writeLog(`スキップ(重複) : ${hdate_source} ${jcd}# ${jname} ${grade} ${title}`);
              return resolve();
            }
            console.log(`登録完了:${hdate_source} ${jcd}# ${jname} ${grade} ${title}`);
            writeLog(`登録完了: ${hdate_source} ${jcd}# ${jname} ${grade} ${title}`);
            insertCount++;

            // 🔁 ここで1場のみ対応する .program.xml を処理
            const programfile = xmlFiles.find(f => f.match(new RegExp(`-${jcd}.program\\.xml$`)));
            if (!programfile) {
              console.warn(`⚠ .program.xml が見つかりません: ${jcd}`);
              return resolve();
            }

            const programXml = fs.readFileSync(path.join(dateDir, programfile));
            const programResult = await new Promise((res, rej) => {
              xml2js.parseString(programXml, (e, r) => e ? rej(e) : res(r));
            });

            const records = programResult.boatrace?.table?.[0]?.record || [];
            for (const record of records) {
              const races = record.race || [];
              if (races.length === 0) {
                console.log(`⚠  raceデータなし: ${file}`);
                continue;
              }
              for (const race of races) {
                const rno = race.rno?.[0];
                const rsname = race.rsname?.[0];
                const rmei = race.rmei?.[0];
                const stime = race.stime?.[0];

                const entries = race.syussou || [];

                for (const rec of entries) {
                  const data = {
                    hdate: rec.hdate?.[0],
                    jcd: rec.jcd?.[0],
                    // 追加
                    rno: rno,
                    rsname: rsname,
                    rmei: rmei,
                    stime: stime,   // ←これ追加
                    teiban: rec.teiban?.[0],

                    // 既存
                    toban: rec.toban?.[0]?._, //（正しく「文字列値3807」を取得）
                    name: rec.name?.[0],
                    shibu: rec.syusin?.[0],
                    kyu: rec.kyu?.[0],
                    zsyo: rec.zsyo?.[0],
                    z2ren: rec.z2ren?.[0],
                    z3ren: rec.z3ren?.[0],
                  };
                  const racerValues = racerColumns.map(col => data[col]);

                  await new Promise((resolve, reject) => {
                    racerInsertStmt.run(racerValues, function (err) {
                      if (err) {
                        // INSERT失敗時
                        console.error(`✖ INSERTエラー (${fileName})`, err.message);
                        writeLog(`✖ INSERTエラー (${fileName}): ${err.message}`);
                        return reject(err);
                      } else if (this.changes === 0) {
                        // 重複スキップ時
                        console.log(`スキップ(重複) : ${data.hdate} ${data.jcd}# ${data.name} ${data.shibu}`);
                        writeLog(`スキップ(重複) : ${data.hdate} ${data.jcd}# ${data.name} ${data.shibu}`);
                        return resolve();
                      } else {
                        // 登録成功時
                        insertCount++; // カウント
                        console.log(`登録完了:${data.hdate} ${data.jcd}# ${data.name} ${data.shibu}`);
                        writeLog(`登録完了: ${data.hdate} ${data.jcd}# ${data.name} ${data.shibu}`);
                        return resolve();
                      }
                    });
                  });
                }
              }
            }

            return resolve();
          });
        });
      }
    }

    // ステートメント終了
    try {
      await Promise.all([
        new Promise((resolve, reject) => {
          seriesInsertStmt.finalize((err) => {
            if (err) {
              console.error('[series_info] ステートメントのクローズ失敗:', err.message);
              writeLog('[series_info] ステートメントのクローズ失敗: ' + err.message);
              return reject(err);
            } else {
              console.log('✅ [series_info] すべての登録完了');
              writeLog('✅ [series_info] すべての登録完了');
              return resolve();
            }
          });
        }),
        new Promise((resolve, reject) => {
          racerInsertStmt.finalize((err) => {
            if (err) {
              console.error('[racer_programs] ステートメントのクローズ失敗:', err.message);
              writeLog('[racer_programs] ステートメントのクローズ失敗: ' + err.message);
              return reject(err);
            } else {
              console.log('✅ [racer_programs] すべての登録完了');
              writeLog('✅ [racer_programs] すべての登録完了');
              return resolve();
            }
          });
        }),
      ]);
      console.log(' 全てのステートメントをクローズしました');
    } catch (err) {
      console.error('⛔ finalize エラー:', err.message);
      writeLog('⛔ finalize エラー: ' + err.message);
    }

  } catch (err) {
    console.error('DB処理エラー', err);
    writeLog('DB処理エラー: ' + err.message);
    throw err; // エラーが起きたら通知は送らない方が安全
  } finally {                                //db.close() を finally 節で実行して安全にクリーンアップ。
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          console.error('DBクローズ失敗:', err.message);
          writeLog('DBクローズ失敗: ' + err.message);
          return reject(err);
        } else {
          console.log('✅ DB接続をクローズしました');
          writeLog('✅ DB接続をクローズしました');
          return resolve();
        }
      });
    });

    // ここで通知を送る DB更新処理が完全に終わった後に必ず呼ぶ →クライアントは確実に最新のDB状態を取得できる
    if (insertCount > 0) {
      notifyClients("データ更新完了");
      console.log('📣 DB更新完了通知を送信しました');
    } else {
      console.log('ℹ️ 新規データなし、通知はスキップしました')
    }
  }
}

module.exports = { runImport };