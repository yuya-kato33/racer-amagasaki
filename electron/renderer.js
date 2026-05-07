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

// サーバ状態
window.api.onServerStatus(status => {
    document.getElementById('serverStatus')
        .innerText = `server: ${status}`;
});

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