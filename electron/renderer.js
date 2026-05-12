// GUI操作

const logArea = document.getElementById('logArea');

function appendLog(text) {

    logArea.value += text;
    logArea.scrollTop = logArea.scrollHeight;
}

window.api.onLog(data => {
    appendLog(data);
});

document
    .getElementById('serverBtn')
    .addEventListener('click', async () => {

        await window.api.startServer();
    });

// ==========================================-
// 自動サーバ起動
//============================================
window.api.onAutoStartServer(() => {
    appendLog('\n 自動サーバ起動開始\n');
    document.getElementById('serverBtn').click();
});

document
    .getElementById('runBtn')
    .addEventListener('click', async () => {

        const args = {

            runMode:
                document.getElementById('runMode').value,

            startDate:
                document.getElementById('startDate').value
                    .replaceAll('-', ''),

            endDate:
                document.getElementById('endDate').value
                    .replaceAll('-', ''),

            mode:
                document.getElementById('mode').value,

            jcd:
                document.getElementById('jcd').value
                    .split(' ')[0],
        };

        await window.api.runApp3(args);
    });

document.getElementById('masterBtn')
    .addEventListener('click', async () => {

        const startToban =
            document.getElementById('startToban').value;

        const endToban =
            document.getElementById('endToban').value;

        await window.api.runImportMaster({
            startToban,
            endToban
        });
    });

document.getElementById('stopServerBtn')
    .addEventListener('click', async () => {
        await window.api.stopServer();
    });

// サーバ状態情報
window.api.onServerStatus(status => {
    const banner = document.getElementById('serverBanner');
    const title = banner.querySelector('.server-title');
    const sub = banner.querySelector('.server-sub');
    const serverBtn = document.getElementById('serverBtn');
    banner.className = `server-banner ${status}`;

    // ボタン制御
    if (status === 'running') {
        setControlsEnabled(true);
        title.innerText = 'SERVER RUNNING';
        sub.innerText = 'http://127.0.0.1:8083';
        serverBtn.disabled = true;

    } else {
        setControlsEnabled(false);
    }

    if (status === 'starting') {
        title.innerText = 'SERVER STARTING...';
        sub.innerText = 'server03.jsを起動しています';
        serverBtn.disabled = true;
    }

    else if (status === 'stopped') {
        title.innerText = 'SERVER STOPPED';
        sub.innerText = 'server03.jsが停止しています';
        serverBtn.disabled = false;
    }

    else if (status === 'port-used') {
        title.innerText = 'PORT 8083 USED';
        sub.innerText = '既に server03.js が起動しています';
        serverBtn.disabled = false;
    }
});

// ボタン無効化（サーバー起動前）
function setControlsEnabled(enabled) {
    document.getElementById('runBtn').disabled = !enabled;
    document.getElementById('masterBtn').disabled = !enabled;
    document.getElementById('reloadSignageBtn').disabled = !enabled;
    document.getElementById('signageStateBtn').disabled = !enabled;
    document.getElementById('nextRaceBtn').disabled = !enabled;
    document.getElementById('prevRaceBtn').disabled = !enabled;
}

// 今日 - 明日 ボタン
async function setDate(offset = 0) {
    appendLog(`\n 日付ボタン押下 offset=${offset}\n`)

    const now = new Date();

    const jst = new Date(
        now.getTime() + (9 * 60 * 60 * 1000)
    );
    const today = jst.toISOString().slice(0, 10).replace(/-/g, '');

    appendLog(` getToday=${today}\n`)

    const y = Number(today.slice(0, 4));
    const m = Number(today.slice(4, 6));
    const d = Number(today.slice(6, 8));
    const date = new Date(y, m - 1, d)

    date.setDate(date.getDate() + offset);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1)
        .padStart(2, '0');
    const dd = String(date.getDate())
        .padStart(2, '0');

    const value = `${yyyy}-${mm}-${dd}`;

    appendLog(` set value=${value}\n`)

    document.getElementById('startDate').value = value;
    document.getElementById('endDate').value = value;

}

// 今日ボタン
document.getElementById('todayBtn')
    .addEventListener('click', () => {
        setDate(0);
    })

// 明日ボタン
document.getElementById('tomorrowBtn')
    .addEventListener('click', () => {
        setDate(1);
    });

// //////////////////////////////////////
// サイネージ進行管理系 
// //////////////////////////////////////
document.getElementById('signageStateBtn').addEventListener('click', async () => {
    const mode = document.getElementById('signageMode').value;
    const currentRace = Number(document.getElementById('currentRace').value);
    const autoAdvanceMinutes = Number(document.getElementById('autoAdvanceMinutes').value);
    const jcdRaw = document.getElementById('jcd').value;
    const jcd = jcdRaw.slice(0, 2)
    const youtubeLiveUrl = document.getElementById('youtubeLiveUrl').value;

    // AUTO / MANUALで分岐
    const body = { mode, jcd, autoAdvanceMinutes, youtubeLiveUrl };
    // MANUAL字だけ　currentraceを送る
    if (mode === 'manual') { body.currentRace = currentRace };

    const res = await fetch('http://127.0.0.1:8083/api/signage-control', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const json = await res.json();
    document.getElementById('signageStatus').textContent =
        `signage: ${json.mode} ${json.currentRace}R jcd=${json.jcd}`;
});

// 次レースボタン
document.getElementById('nextRaceBtn').addEventListener('click', async () => {
    const input = document.getElementById('currentRace');
    input.value = Math.min(12, Number(input.value) + 1);

    document.getElementById('signageMode').value = 'manual';
    document.getElementById('signageStateBtn').click();
})

// 前レース
document.getElementById('prevRaceBtn').addEventListener('click', async () => {
    const input = document.getElementById('currentRace');
    input.value = Math.max(1, Number(input.value) - 1);

    document.getElementById('signageMode').value = 'manual';
    document.getElementById('signageStateBtn').click();
})

// 再読み込みボタン
document.getElementById('reloadSignageBtn').addEventListener('click', async () => {
    const jcdRaw = document.getElementById('jcd').value;
    const jcd = jcdRaw.slice(0, 2);

    const res = await fetch('http://127.0.0.1:8083/api/signage-reload', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jcd })
    });

    const json = await res.json();

    document.getElementById('signageStatus').textContent =
        `再読み込み開始: jcd=${json.jcd}`;
})