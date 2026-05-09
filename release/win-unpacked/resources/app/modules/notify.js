// 通知機能用モジュール (socket.io関連)

let io = null;

function setIO(_io) {
    io = _io;
    console.log('✅ setIO が呼ばれ io をセットしました');
}

// DB更新時に呼び出す関数
function notifyClients(message = "データ更新") {
    if (io) {
     io.emit('update', message); //全クライアントに通知
     console.log('📣 通知送信:', message);
    }
}

module.exports = { setIO, notifyClients};


// Node.jsサーバ
// サーバ側でSocket.IOインスタンスを管理し、更新通知を全クライアントに送信するモジュール