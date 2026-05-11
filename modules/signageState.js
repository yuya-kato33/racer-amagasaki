// サイネージ状態ファイル
const state = {
    mode: 'auto', //auto / manual
    hdate: null,
    jcd: '13',
    currentRace: 1,
    autoAdvanceMinutes: 10,
    updatedAt: null
};

function getState() {
    return { ...state };
}

function setState(patch) {
    Object.assign(state, patch, {
        updatedAt: new Date().toISOString()
    });
    return getState()
}

module.exports = {
    getState, setState
};