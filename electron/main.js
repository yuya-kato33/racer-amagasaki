const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const net = require('net');

// main,js追加
const find = require('find-process');
const treeKill = require('tree-kill');
const { resolve } = require('dns');

let mainWindow;
let serverProcess = null;

function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1100,
        height: 800,

        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'launcher.html'));
}

// port確認関数
function isPortInUse(port) {
    return new Promise(resolve => {

        const tester = net.createServer()
            .once('error', () => {
                resolve(true);
            })

            .once('listening', () => {
                tester.once('close', () => resolve(false))
                    .close()
            })

            .listen(port);
    })
}

// ////////////////////////////////
// 8083 cleanUp
// //////////////////////////////////
async function cleanUpPort8083() {

    const list = await find('port', 8083);

    for (const proc of list) {

        console.log(`🛑 kill PID=${proc.pid} ${proc.name}`);

        await new Promise(resolve => {
            treeKill(proc.pid, 'SIGTERM', () => {
                resolve();
            });
        });
    }

}

app.whenReady().then(async () => {
    try {
        console.log(' 8083 cleanup 開始');
        await cleanUpPort8083();
        console.log(' cleanup 完了');
    } catch (err) {
        console.error(
            'cleanup失敗:',
            err.message
        );
    }
    createWindow();
});

////////////////////////////////////////////
// サーバ起動
/////////////////////////////////////////
ipcMain.handle('start-server', async () => {


    // apawn前
    mainWindow.webContents.send(
        'server-status',
        'starting'
    )

    const used = await isPortInUse(8083);

    if (used) {
        mainWindow.webContents.send(
            'server-status',
            'port-used'
        );

        return 'server already used';
    }

    serverProcess = spawn('node', ['server03.js'], {
        cwd: ROOT,
        shell: true
    });

    serverProcess.stdout.on('data', data => {

        const text = data.toString();

        if (text.includes('SERVER_READY')) {

            // サーバー状態表示
            mainWindow.webContents.send(
                'server-status',
                'running'
            );
        }
        mainWindow.webContents.send('log', text);
    })

    serverProcess.stderr.on('data', data => {
        mainWindow.webContents.send('log', data.toString());
    });

    // 追加
    serverProcess.on('close', code => {

        mainWindow.webContents.send(
            'log',
            `\n🛑 server03.js close code=${code}\n`
        );

        mainWindow.webContents.send(
            'server-status',
            'stopped'
        );
        serverProcess = null;
    })

    return 'server-started';
});

// ///////////////////////////////////////
// サーバー停止追加
// ///////////////////////////////////////
ipcMain.handle('stop-server', async () => {
    if (!serverProcess) {
        return 'server not running';
    }

    await new Promise(resolve => {

        treeKill(
            serverProcess.pid,
            'SIGTERM',
            () => resolve()
        );
    });

    mainWindow.webContents.send(
        'log',
        '\n🛑 サーバ停止要求\n'
    );

    setTimeout(async () => {

        const used = await isPortInUse(8083);

        const status = used ? 'still-running' : 'stopped'

        mainWindow.webContents.send(
            'server-status',
            status
        );

        mainWindow.webContents.send(
            'log',
            used ? '\n⚠ 8083 still running\n'
                : '\n✅ 8083 stopped\n'
        );

    }, 1000);
});

/////////////////////////////
// app3.js 実行
//////////////////////////////
ipcMain.handle('run-app3', async (event, args) => {

    const proc = spawn('node', [
        'app3.js',
        args.runMode,
        args.startDate,
        args.endDate,
        args.mode,
        args.jcd
    ], {
        cwd: ROOT,
        shell: true
    });

    proc.stdout.on('data', data => {
        mainWindow.webContents.send('log', data.toString());
    });

    proc.stderr.on('data', data => {
        mainWindow.webContents.send('log', data.toString());
    });

    proc.on('close', code => {

        mainWindow.webContents.send(
            'log',
            `\n☑ app3.js 終了 code = ${code}\n`
        );
    });

    return 'started';
});

// /////////////////////////////////////////////
// import_master.js 起動
// /////////////////////////////////////////////
ipcMain.handle(
    'run-import-master',

    async (event, args) => {

        const proc = spawn('node', [

            'import_master.js',

            args.startToban,
            args.endToban

        ], {
            cwd: ROOT,
            shell: true
        });

        proc.stdout.on('data', data => {
            mainWindow.webContents.send(
                'log',
                data.toString()
            );
        });

        proc.stderr.on('data', data => {
            mainWindow.webContents.send(
                'log',
                data.toString()
            );
        });

        proc.on('close', code => {
            mainWindow.webContents.send(
                'log',
                `\n☑ import_master.js 終了 code = ${code}\n`
            );
        });

        return 'started';
    }
);

// ///////////////////////////////
// Electron終了時
// ///////////////////////////////
app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();

        serverProcess = null;
    }
})