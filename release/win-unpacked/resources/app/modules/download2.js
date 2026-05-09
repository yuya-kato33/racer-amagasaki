// ファイルダウンロード処理 :403開催場を記録して次回再取得対象にする。

require('dotenv').config(); // .env 読み込み
const fs = require("fs");
const path = require('path');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth') // ステルス機能
const { writeLog } = require('./logger');

// Puppeteerにstealthプラグインを適用
puppeteerExtra.use(StealthPlugin());

//グローバル変数
// XML保存先のフォルダパス
const saveDir = path.resolve(__dirname, '..', 'xml');
// 保存フォルダがなければ作成
if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);

//差分検知・保存関数の追加 (ダウンロード時に内容同一ならスキップする処理)
function saveXmlWithCheck(savePath, newContent) {
  if (fs.existsSync(savePath)) {
    const oldContent = fs.readFileSync(savePath, 'utf8');
    if (oldContent === newContent) {
      console.log(`⚠️ スキップ (内容同一) : ${path.basename(savePath)}`);
      writeLog(`⚠️ スキップ (内容同一) : ${path.basename(savePath)}`);
      return false;
    }
  }
  fs.writeFileSync(savePath, newContent, 'utf8');
  console.log(`✅ XML保存: ${path.basename(savePath)}`);
  writeLog(`✅ XML保存: ${path.basename(savePath)}`);
  return true;
}

// スリープ関数 (msミリ秒待機)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 403失敗場リスト読み込み
function loadfailed403List(dateStr) {
  const failed403path = path.join(saveDir, 'temp', `failed403-${dateStr}.json`);
  const dirPath = path.dirname(failed403path);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  if (fs.existsSync(failed403path)) {
    try {
      return JSON.parse(fs.readFileSync(failed403path, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveFailed403List(list, dateStr) { // 403失敗場リスト保存
  const failed403path = path.join(saveDir, 'temp', `failed403-${dateStr}.json`);
  const dirPath = path.dirname(failed403path);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  fs.writeFileSync(failed403path, JSON.stringify([...new Set(list)].sort()), 'utf8'); //重複排除＆ソートして保存
}

// 本体関数
async function runDownload(targetDate, jcdOnly = null) {
  //--- 入力引数: 日付 (例: node boatDB.js 20250612) ====
  if (!targetDate || !/^\d{8}$/.test(targetDate)) {
    console.error('日付で指定してください 例:node app.js 20250616 both/ download/ database');
    return;
  }
  // allPlacesを作成する関数群
  const allPlaces = jcdOnly
    ? [jcdOnly] //指定があればその場だけ
    : Array.from({ length: 24 }, (_, i) => String(i + 1).padStart(2, '0'));
  const retry403Places = loadfailed403List(targetDate); //403場の記録
  let raceHeader = [];

  // Puppeteer起動(ヘッドレスモード)
  const browser = await puppeteerExtra.launch({
    headless: 'false', // ステルスの効果を最大化するためヘッドレス無効推奨
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  //毎回新しいブラウザコンテキストを作成して isolate する (キャッシュやCookieが効いているので、セッション衝突回避→分離)
  //createIncognitoBrowserContext は Puppeteer v20以降使えなくなったため、createBrowserContext を使う
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  /// Basic認証ヘッダーを作成
  // const auth = Buffer.from(`${username}:${password}`).toString('base64');
  // const auth= 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'); //Basicは半角スペース必要

  // Basic認証用のURLにアクセス (ログイン画面が出る場合)
  // 今回はBasic認証なので、URLにユーザー名・パスワードを埋め込む方法も使えます。
  // 例: https://username:password@xml-sv.boatrace.jp/....
  // ここでは明示的に認証画面に対処します。

  // ユーザー名とパスワードをセット .envから認証情報取得
  const username = process.env.BOATRACE_USER;
  const password = process.env.BOATRACE_PASS;

  if (!username || !password) {
    console.error("❌ .env に BOATRACE_USER と BOATRACE_PASS をセットしてください");
    process.exit(1);
  }
  // ユーザーエージェントを実ブラウザのものに設定する(安定化)
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');
  // 正規Refererを付与
  await page.setExtraHTTPHeaders({
    'Referer': 'https://www.boatrace.jp/' // 正規のRefererを指定
  });

  // URLのBasic認証を自動でクリア
  await page.authenticate({ username, password });
  console.log('Basic認証を完了\n');

  // 保存済の開催場リストを格納するJSONファイルパス
  const activeInfoFile = path.join(saveDir, `${targetDate}-raceHeader.json`);

  // xml配下の 「raceday」名のフォルダを作る
  const dateDir = path.join(saveDir, targetDate); //20250611 のように日付部分だけ
  if (!fs.existsSync(dateDir)) {
    fs.mkdirSync(dateDir, { recursive: true });
    console.log(`📂 フォルダ作成: ${dateDir}`);
  }

  // 開催場リストが既にあれば読み込み、なければ初回抽出
  if (fs.existsSync(activeInfoFile)) {
    try {
      const jsonStr = fs.readFileSync(activeInfoFile, 'utf8');
      raceHeader = JSON.parse(jsonStr);
      console.log(`📂 保存された開催情報を読み込み: ${raceHeader.map(p => p.place).join(', ')}`);
      writeLog(`📂 保存された開催情報を読み込み: ${raceHeader.map(p => p.place).join(', ')}`);
    } catch (err) {
      console.warn(`⚠️ 開催情報の読み込み失敗: ${err.message}`);
      writeLog(`⚠️ 開催情報の読み込み失敗: ${err.message}`);
    }
  }

  // 403で失敗した場のみ再取得を試みる処理 (先に実行)
  if (retry403Places.length > 0) {
    console.log(`♻️ 403再取得対象場: ${retry403Places.join(',')}`);
    for (const place of [...retry403Places]) { // コピー配列でループ
      try {
        // アクセス間隔をランダム化(1～3秒)
        const waitMs = 1000 + Math.floor(Math.random() * 2000);
        await sleep(waitMs);
        const url = `https://xml-sv.boatrace.jp/race/${targetDate}/${place}/race_header.xml`;
        const res = await page.goto(url, { waitUntil: 'networkidle2' });
        const status = res.status();

        if (status === 200) {
          const xml = await res.text();

          // 保存処理を追加する！！
          const savePath = path.join(dateDir, `${targetDate}-${place}.race_header.xml`);
          saveXmlWithCheck(savePath, xml);

          // raceHeaderに重複登録されないように既存場を除去
          raceHeader = raceHeader.filter(p => p.place !== place);
          raceHeader.push({ place });
          console.log(`✅ 403再取得成功: ${place}`);
          writeLog(`✅ 403再取得成功: ${place} `);
          // retry403placesから除外
          const idx = retry403Places.indexOf(place);
          if (idx !== -1) retry403Places.splice(idx, 1);
        } else if (status === 403) {
          console.log(`❌ 403再取得失敗継続: ${place}`);
          if (!retry403Places.includes(place)) retry403Places.push(place);
        } else {
          console.log(`❌ 非開催または他エラー（再取得）: ${place} (${status}`);
          const idx = retry403Places.indexOf(place);
          if (idx !== -1) retry403Places.splice(idx, 1) //ここを追加
        }
      } catch (err) {
        console.warn(`⚠️ 403再取得エラー: ${place} - ${err.message}`);
      }
    }
  }

  // もし開催場リストが空なら,race_header.xmlから抽出しファイル保存
  if (raceHeader.length === 0) {
    console.log("🤖 race_header.xml を元に開催場を確認中...");
    writeLog(`🤖 開催情報抽出: ${targetDate}`);

    for (const place of allPlaces) {
      try {
        const waitMs = 1000 + Math.floor(Math.random() * 2000);
        await sleep(waitMs);
        const url = `https://xml-sv.boatrace.jp/race/${targetDate}/${place}/race_header.xml`;
        const res = await page.goto(url, { waitUntil: 'networkidle2' });
        const status = res.status();

        if (status === 200) {
          const xml = await res.text();
          raceHeader.push({ place }); // 開催場として登録
          console.log(`✅ 開催場: ${place}`);
          //retry403Places から除外(もしリストにはいっていれば)
          const idx = retry403Places.indexOf(place);
          if (idx !== -1) retry403Places.splice(idx, 1);

          const savePath = path.join(dateDir, `${targetDate}-${place}.race_header.xml`);
          saveXmlWithCheck(savePath, xml)
        } else if (status === 403) {
          console.log(`❌ 403エラー: ${place}`)
          if (!retry403Places.includes(place)) retry403Places.push(place);
        } else {
          console.log(`❌ 非開催: ${place} (${status})`);

          // 🔽 403以外のときはリストから削除する
          const idx = retry403Places.indexOf(place);
          if (idx !== -1) retry403Places.splice(idx, 1);
        }
      } catch (err) {
        console.warn(`⚠️ 開催判定エラー: ${place} - ${err.message}`);
      }
    }
  }

  // 開催場情報を保存（更新されたretry403Placesも保存）
  fs.writeFileSync(activeInfoFile, JSON.stringify(raceHeader, null, 2), 'utf8');
  saveFailed403List(retry403Places, targetDate);
  writeLog(`💾 開催情報を保存しました: ${activeInfoFile}`);

  console.log(`🎯 開催場: ${raceHeader.map(p => p.place).join(' , ')}`);
  writeLog(`🎯 開催場No: ${raceHeader.map(p => p.place).join(' , ')}}`);

  // レース結果XMLダウンロードを開始
  console.log("🤖 出走表XMLをダウンロード開始..")
  writeLog(`🤖 出走表ダウンロード開始: ${targetDate}`)

  for (const { place } of raceHeader) {
    // 過去日も締め切り判定が正しく機能
    // ページを開く (XMLファイルURLにアクセスし、認証済みの状態でレスポンスを取得。)
    try {
      // アクセス間隔をランダム化 (1～3秒)
      const waitMs = 1000 + Math.floor(Math.random() * 2000);
      await sleep(waitMs);

      const url = `https://xml-sv.boatrace.jp/race/${targetDate}/${place}/program.xml`;
      const res = await page.goto(url, { waitUntil: `networkidle2` });
      // console.log('Response Headers:', response.headers()); //レスポンスヘッダー
      const status = res.status();

      if (status === 200) {
        const xml = await res.text();
        const savePath = path.join(dateDir, `${targetDate}-${place}.program.xml`)
        saveXmlWithCheck(savePath, xml);
      } else if (status === 404) {
        console.warn(`⚠️ HTTPエラー ${status} (${targetDate}-${place}) リトライ対象外`);
        writeLog(`⚠️ HTTPエラー ${status} (${targetDate}-${place}) リトライ対象外`);
        //何もしない (にいれない)
        // 取得成功した場合は403リストから除外
        const idx = retry403Places.indexOf(place);
        if (idx !== -1) retry403Places.splice(idx, 1);
      } else if (status === 403) {
        console.log(`✖ 403エラー発生: ${place}`);
        if (!retry403Places.includes(place)) retry403Places.push(place);
      }
    } catch (err) {
      console.warn(`⚠️ ダウンロードエラー: ${err.message} (${targetDate}-${place})`, err.message);
      writeLog(`✖ ダウンロードエラー: ${err.message} (${targetDate}-${place})`, err.message);
    }
  }

  saveFailed403List(retry403Places, targetDate) //403リストを更新保存

  await browser.close();
  console.log('✅ ダウンロード処理終了');
  writeLog('✅ ダウンロード処理終了');
}

module.exports = { runDownload };