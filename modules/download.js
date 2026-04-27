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

// 本体関数
async function runDownload(targetDate, jcdOnly = null) {

  // 固定場コード
  const place = '13'

  //--- 入力引数: 日付 (例: node boatDB.js 20250612) ====
  if (!targetDate || !/^\d{8}$/.test(targetDate)) {
    console.error('日付で指定してください 例:node app.js 20250616 both/ download/ database');
    return;
  }

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

  // xml配下の 「raceday」名のフォルダを作る
  const dateDir = path.join(saveDir, targetDate); //20250611 のように日付部分だけ
  if (!fs.existsSync(dateDir)) {
    fs.mkdirSync(dateDir, { recursive: true });
    console.log(`📂 フォルダ作成: ${dateDir}`);
  }

  try {
    const waitMs = 1000 + Math.floor(Math.random() * 2000);
    await sleep(waitMs);
    const url = `https://xml-sv.boatrace.jp/race/${targetDate}/${place}/race_header.xml`;
    const res = await page.goto(url, { waitUntil: 'networkidle2' });
    const status = res.status();

    if (status === 200) {
      const xml = await res.text();
      console.log(`✅ 開催場: ${place}`);

      const savePath = path.join(dateDir, `${targetDate}-${place}.race_header.xml`);
      saveXmlWithCheck(savePath, xml)
    } else {
      console.log(`❌ 非開催: ${place} (${status})`);
    }
  } catch (err) {
    console.warn(`⚠️ 開催判定エラー: ${place} - ${err.message}`);
  }

  // 出走表XMLダウンロードを開始
  console.log("🤖 出走表XMLをダウンロード開始..")
  writeLog(`🤖 出走表ダウンロード開始: ${targetDate}`)


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
    }
  } catch (err) {
    console.warn(`⚠️ ダウンロードエラー: ${err.message} (${targetDate}-${place})`, err.message);
    writeLog(`✖ ダウンロードエラー: ${err.message} (${targetDate}-${place})`, err.message);
  }

  await browser.close();
  console.log('✅ ダウンロード処理終了');
  writeLog('✅ ダウンロード処理終了');
}

module.exports = { runDownload };