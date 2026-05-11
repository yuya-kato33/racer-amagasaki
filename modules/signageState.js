// / サイネージ状態ファイル

const fs = require('fs');
const path = require('path');

const stateFile = path.join(
    __dirname, '..', 'data', 'signage-state.json'
);

// 日本時間で今日の日付を取得
function getTodayYMD() {
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return jst.toISOString().slice(0, 10).replace(/-/g, '');
}

// 初期値
let state = {
    mode: 'auto', //auto / manual
    hdate: null,
    jcd: '13',
    currentRace: 1,
    autoAdvanceMinutes: 10,
    updatedAt: null,
    youtubeLiveUrl: ''
};

// ===============================
// state読み込み
// ===============================
function loadState() {
    try {
        if (fs.existsSync(stateFile)) {
            const json = fs.readFileSync(stateFile, 'utf-8');

            state = JSON.parse(json);

            console.log(' signage-state loaded:', state);
        }
    } catch (err) {
        console.error('✖ signage-state load error:', err)
    }
}

// =====================================
// satte保存
// =====================================
function saveState() {
    try {
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
        console.error('✖ signage-state save error:', err);
    }
}

// ================================
// state取得
// ================================
function getState() {
    return { ...state };
}

// ================================
// state更新
// ================================
function setState(patch) {
    state = { ...state, ...patch, updatedAt: new Date().toISOString() };
    saveState();
    return getState();
}

// 起動時読み込み
loadState();

// ========================================
// 日付補正
// ==========================================\
const today = getTodayYMD();

if (state.hdate !== today) {
    state.hdate = today;

    // 翌日なら1Rへ戻す
    state.currentRace = 1;
    saveState();
    console.log(' hdate updated:', today);
}

module.exports = {
    getState, setState
};