// 日付省略は今日

function getToday() {
    const now = new Date();
    const jst = new Date(now.getTime() + (9 * 60 * 60 * 1000)); //UTC→JSt変換
    return jst.toISOString().slice(0, 10).replace(/-/g, '');
}

module.exports = { getToday };