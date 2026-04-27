// XMLファイルのダウンロード方法
require('dotenv').config(); // .env 読み込み
const schedule = require('node-schedule'); // ダウンロードを定時に繰り返す

const { runDownload } = require('./modules/download');
const { runImport } = require('./modules/import');
const { writeLog } = require('./modules/logger');
const { getToday } = require('./modules/utils');


// ====================実行系====================--
const runMode = process.argv[2] || 'now';      // 実行モード: now schedule
let cliDateStart = process.argv[3];
let cliDateEnd = process.argv[4]; // 実行日
const mode = process.argv[5] || 'both';        // 処理モード: download/ database/ both
const jcdOnly = process.argv[6] || null;       // 場コード: 指定有ればその場のみ対象

// 日付省略時は今日
if (!cliDateStart) cliDateStart = getToday();
if (!cliDateEnd) cliDateEnd = cliDateStart;

// 日付判定
function isValidDateStr(str) {
    if (!/^\d{8}$/.test(str)) return false;
    const y = parseInt(str.slice(0, 4), 10);
    const m = parseInt(str.slice(4, 6), 10);
    const d = parseInt(str.slice(6, 8), 10);

    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && (date.getMonth() + 1) === m && date.getDate() === d;
}

// 日付配列生成
function getDateRange(startDate, endDate) {
    const dates = [];
    let current = new Date(
        startDate.slice(0, 4), startDate.slice(4, 6) - 1, startDate.slice(6, 8)
    );
    const end = new Date(
        endDate.slice(0, 4), endDate.slice(4, 6) - 1, endDate.slice(6, 8)
    );
    while (current <= end) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        dates.push(`${y}${m}${d}`);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

// 通知API呼び出し
async function notifyUpdate() {
    const apiUrl = process.env.NOTIFY_API || 'http://localhost:8080/api/notify-update';
    try {
        console.log(`📤 通知API呼び出し: ${apiUrl}`);
        await fetch(apiUrl, { method: 'POST' });
    } catch (err) {
        console.error('⚠️ 通知APIエラー:', err.message);
    }
}

// 実行モード: now (即時実行)
if (runMode === 'now') {
    if (!isValidDateStr(cliDateStart) || !isValidDateStr(cliDateEnd)) {
        console.error('⛔ 日付はyyyymmdd 形式で入力してください');
        console.error('📌 実行例: node app4.js now 20250801 20250802 both');
        console.error('📌 実行例: node app4.js now 20250801 download 03');
        process.exit(1);
    }
    (async () => {
        const dates = getDateRange(cliDateStart, cliDateEnd);

        console.log(`🚀 即時実行: ${cliDateStart}〜${cliDateEnd} (${dates.length}日分, mode=${mode}, jcd=${jcdOnly || 'ALL'})`);
        writeLog(`🚀 即時実行: ${cliDateStart}～${cliDateEnd}(${dates.length}日分, mode=${mode}, jcd=${jcdOnly || 'ALL'})`);

        for (const targetDate of dates) {
            console.log(` 実行日付: ${targetDate}`);

            try {
                if (mode === 'download' || mode === 'both') { await runDownload(targetDate, jcdOnly); }
                if (mode === 'database' || mode === 'both') {
                    console.log("▶ runImport を実行します:", targetDate, jcdOnly);
                    await runImport(targetDate, jcdOnly);
                }
                await notifyUpdate();
                console.log(`✅ 即時実行完了 ${targetDate}`);
                writeLog(`✅ 即時実行完了 ${targetDate}`);
            } catch (err) {
                console.error(`⛔ 即時実行エラー: ${targetDate}`, err);
                writeLog(`⛔ 即時実行エラー: ${targetDate} ${err.message}`);
            }
        }
        console.log(' 全日程処理完了')
        writeLog(' 全日程処理完了')
    })();
}

// 実行モード: schedule ✅ 定時実行: 9:10～17:50を20分おきに実行
else if (runMode === 'schedule') {
    const scheduleRule = new schedule.RecurrenceRule();
    scheduleRule.minute = [10, 30, 50]
    scheduleRule.hour = new schedule.Range(9, 17);

    // 待機状態を維持するロジックは記載あり
    schedule.scheduleJob(scheduleRule, async () => {
        const now = new Date();
        const today = now.toISOString().slice(0, 10).replace(/-/g, '');
        console.log(`⏰ 定時実行: ${now.toLocaleString()} 対象日付: ${today}`);
        writeLog(`⏰ 定時実行: ${now.toLocaleString()} 対象日付: ${today}`);

        try {
            if (mode === 'download' || mode === 'both') await runDownload(today); // 完了まで待つ
            if (mode === 'download' || mode === 'both') await runImport(today);   //ダウンロード後にDB取り込みを完了まで待つ
            console.log('✅ 定時実行処理が完了しました');
            writeLog('✅ 定時実行処理が完了しました');
        } catch (err) {
            console.error('⚠ 定時実行処理でエラー:', err);
            writeLog('⚠ 定時実行処理でエラー:', err);
        }
    });

    console.log('🕓 スケジューラが起動しました');
    writeLog('🕓 スケジューラが起動しました');
};

// // 実行オプションについて
// 1⃣ node app.js // デフォルト mode = both, date = 当日 runDownload() + runImport()
// 2⃣ node app.js 20250623 //特定日用
// 3⃣ node app.js 20250623 download // XMLファイル ダウンロードのみ
// 4⃣ node app.js 20250623 database // DBに登録
// 5⃣ nodemon app.js ファイルを保存した際に、自動で再起動したい場合

// Shift + Alt + F（または右クリック → フォーマット）で自動整形