require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { parseStringPromise } = require('xml2js');
const { masterColumns, masterColumnDefs, masterInsertSQL } = require('./modules/db');
const { writeLog } = require('./modules/logger');

puppeteer.use(StealthPlugin());

// DB接続
const dbPath = path.join(__dirname, 'db', 'program1.db');
const db = new sqlite3.Database(dbPath);

// 顔写真保存先
const imageDirs = [
  path.join(__dirname, 'boat-racer-profile', 'src', 'assets', 'racerphoto'),
  path.join(__dirname, 'public', 'assets', 'racerphoto')
];

// 各ディレクトリがばければ作成
imageDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
})

// コマンドライン引数
const [, , startToban, endToban] = process.argv;
if (!startToban || !endToban) {
  console.error('[エラー] 使用法: node import_master.js <開始toban> <終了toban>');
  writeLog('[エラー] 使用法: node import_master.js <開始toban> <終了toban>')
  process.exit(1);
}

let successCount = 0;
let skipCount = 0;
let failCount = 0;

// ランダムスリープ
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomsleep = async () => {
  const ms = 2000 + Math.floor(Math.random() * 1000); //2～3秒
  await sleep(ms);
};

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Basic認証
  await page.authenticate({
    username: process.env.BOATRACE_USER,
    password: process.env.BOATRACE_PASS
  });

  for (let toban = Number(startToban); toban <= Number(endToban); toban++) {
    const tobanStr = String(toban);
    console.log(`[情報] ${tobanStr} のXMLを取得中...`);
    writeLog(`[情報] ${tobanStr} のXMLを取得中...`)

    try {
      const url = `https://xml-sv.boatrace.jp/cms/profile/base/${tobanStr}.xml`;
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

      if (!response || response.status() !== 200) {
        const status = response && response.status();
        console.warn(`[警告] ${tobanStr} のXML取得に失敗 (HTTP ${status})`);
        writeLog(`[警告] ${tobanStr} のXML取得に失敗 (HTTP ${status})`)
        failCount++;

        // ４０３なら即終了
        if (status === 403) {
          console.error(`[致命的] HTTP 403 を検知したため処理を終了します。`);
          writeLog(`[致命的] HTTP 403 を検知したため処理を終了します。`);
          break
        }

        await randomsleep();
        continue;
      }

      const xml = await response.text();
      let profile;
      try {
        const result = await parseStringPromise(xml, { explicitArray: false });
        profile = result?.boatrace?.profile;
      } catch (parseErr) {
        console.error(`[エラー] ${tobanStr} のXMLパース失敗: ${parseErr.message}`);
        writeLog(`[エラー] ${tobanStr} のXMLパース失敗: ${parseErr.message}`)
        failCount++;
        await randomsleep();
        continue;
      }

      if (!profile) {
        console.warn(`[警告] ${tobanStr} のXMLに<profile>のノードがありません`);
        writeLog(`[警告] ${tobanStr} のXMLに<profile>のノードがありません`);
        failCount++;
        await randomsleep();
        continue;
      }

      // SQLite UPSERT
      const now = new Date().toISOString();
      const rowData = [
        tobanStr,
        profile.entry_period || '',
        profile.kyu || '',
        `${tobanStr}.jpg`,
        now
      ];

      await new Promise((resolve, reject) => {
        db.run(masterInsertSQL, rowData, (err) => {
          if (err) reject(err); else resolve();
        });
      });

      // 顔写真保存 (複数ディレクトリ対応)
      for (const dir of imageDirs) {
        const imagePath = path.join(dir, `${tobanStr}.jpg`);
        if (!fs.existsSync(imagePath)) {
          const imageUrl = `https://www.boatrace.jp/racerphoto/${tobanStr}.jpg`;
          const view = await page.goto(imageUrl, { timeout: 15000 });
          if (view && view.status() === 200) {
            const buffer = await view.buffer();
            fs.writeFileSync(imagePath, buffer);
            console.log(`[情報] ${tobanStr} の顔写真を保存しました`);
            writeLog(`[情報] ${tobanStr} の顔写真を保存しました`)
          } else {
            console.warn(`[警告] ${tobanStr} の顔写真が取得できませんでした`);
            writeLog(`[警告] ${tobanStr} の顔写真が取得できませんでした`)
          }
        } else {
          console.log(`[情報] ${tobanStr} の顔写真は${dir}に存在するためスキップしました`);
          writeLog(`[情報] ${tobanStr} の顔写真は${dir}に存在するためスキップしました`);
          skipCount++;
        }
      }

      successCount++;
    } catch (err) {
      console.error(`[エラー] ${tobanStr} の処理中に失敗: ${err.message}`);
      writeLog(`[エラー] ${tobanStr} の処理中に失敗: ${err.message}`);
      failCount++;
    }

    await randomsleep();
  }

  await browser.close();
  db.close();

  console.log(`[完了] 処理終了。成功:${successCount}件 / 失敗:${failCount}件 / 画像スキップ:${skipCount}件`);
  writeLog(`[完了] 処理終了。成功:${successCount}件 / 失敗:${failCount}件 / 画像スキップ:${skipCount}件`);
})();