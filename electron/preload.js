const { contextBridge, ipcRenderer } = require('electron');
// const { runDownload } = require('../modules/download');

contextBridge.exposeInMainWorld('api', {

    startServer: () =>
        ipcRenderer.invoke('start-server'),

    runApp3: (args) =>
        ipcRenderer.invoke('run-app3', args),

    runImportMaster: (args) =>
        ipcRenderer.invoke('run-import-master', args),

    onLog: (callback) =>
        ipcRenderer.on('log', (_, data) => callback(data)),

    stopServer: () =>
        ipcRenderer.invoke('stop-server'),

    onServerStatus: (callback) =>
        ipcRenderer.on(
            'server-status', (_, status) => callback(status)
        ),
});