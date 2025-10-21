// XMLファイルのダウンロード方法
require('dotenv').config(); // .env 読み込み
const schedule = require('node-schedule'); // ダウンロードを定時に繰り返す

const { runDownload } = require('./modules/download');
const { runImport } = require('./modules/import');
const { writeLog } = require('./modules/logger');
const { getToday } = require('./modules/utils');


// ====================実行系====================--
const cliDate = process.argv[2];               // 実行日
const runMode = process.argv[3] || 'now';      // 実行モード: now schedule
const mode = process.argv[4] || 'both';        // 処理モード: download/ database/ both
const jcdOnly = process.argv[5] || null;       // 場コード: 指定有ればその場のみ対象

// 実行モード: now (即時実行)
if (runMode === 'now') {
    (async () => {
        const targetDate = cliDate && /^\d{8}$/.test(cliDate)
            ? cliDate
            : new Date().toISOString().slice(0, 10).replace(/-/g, '');

        console.log(`🚀 即時実行: ${targetDate}`);
        writeLog(`🚀 即時実行: ${targetDate}`);

        if (mode === 'download' || mode === 'both') { await runDownload(targetDate,jcdOnly); }
        if (mode === 'database' || mode === 'both') 
            { console.log("▶ runImport を実行します:", targetDate, jcdOnly);
            await runImport(targetDate,jcdOnly); }
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
// 4⃣ node app.js 20250623 database // DBに登録用

// 5⃣ nodemon app.js ファイルを保存した際に、自動で再起動したい場合

// Shift + Alt + F（または右クリック → フォーマット）で自動整形