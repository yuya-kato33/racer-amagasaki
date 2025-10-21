// ログ系統

const fs = require('fs');
const path = require('path');

// ログ関数の定義
const logDir = path.join(__dirname, '..', 'log');
// 保存フォルダがなければ作成
if(!fs.existsSync(logDir)) fs.mkdirSync(logDir);

function writeLog(message) {
    const now = new Date();
    // now.toISOString().slice(0,10)は、yyyymmddを返す(日付部分のみ)
    const file = path.join(logDir,`${now.toISOString().slice(0,10)}.log`);
    const timestamp = now.toLocaleString();
    fs.appendFileSync(file, `[${timestamp}] ${message}\n`, 'utf8');
}

module.exports = { writeLog };