const { contextBridge, ipcRenderer } = require('electron');
// const { runDownload } = require('../modules/download');

contextBridge.exposeInMainWorld('api', {

    startServer: () =>
        ipcRenderer.invoke('start-server'),

    runApp3: (args) =>
        ipcRenderer.invoke('run-app3', args),

    onLog: (callback) =>
        ipcRenderer.on('log', (_, data) => callback(data))
});