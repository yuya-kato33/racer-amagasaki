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
                document.getElementById('startDate').value,

            endDate:
                document.getElementById('endDate').value,

            mode:
                document.getElementById('mode').value,

            jcd:
                document.getElementById('jcd').value,
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