const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

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

app.whenReady().then(createWindow);

////////////////////////////////////////////
// サーバ起動
/////////////////////////////////////////
ipcMain.handle('start-server', async () => {

    if (serverProcess) {
        return 'server already running'
    }

    serverProcess = spawn('node', ['server03.js'], {
        cwd: ROOT,
        shell: true
    });

    serverProcess.stdout.on('data', data => {
        mainWindow.webContents.send('log', data.toString());
    })

    serverProcess.stderr.on('data', data => {
        mainWindow.webContents.send('log', data.toString());
    })

    return 'server-started';
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
            `\n☑ app3.js 終了 code=${code}\n`
        );
    });

    return 'started';
})

