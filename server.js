// server.jsの内容　(基本API構成 + WebSocket + フロントサーバ専用)　(Express継続)

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const { setIO,notifyClients } = require('./modules/notify');

const app = express();
const server = http.createServer(app) //ExpressとSocket.ioを共通サーバ

// CORS設定（Express + Socket.IO 共通）
const corsOptions = {
  origin: "http://localhost:4200",
  methods: ["GET", "POST"],
  credentials: true
};

// ✅ ExpressにCORSを適用（必ずapp定義後すぐ）
app.use(cors(corsOptions));

// ✅ Socket.IO にも同じCORS設定を適用
const io = socketIO(server, {
  cors: corsOptions
});

// ⭐ページ更新なしで、DB更新時に自動で表が更新（行追加)の機能
// ☑　Socket.ioインスタンスを notify.jsをセット
setIO(io)

// ☑　ソケット接続イベント定義
io.on('connection', (socket) => {
  console.log('📡 クライアント接続: ', socket.id);
  // 例: 更新通知 (明示的に emit)
  socket.emit('update', '初回接続通知');

  socket.on('disconnect',() => {
    console.log('❌ クライアント切断:', socket.id);
  });
});

// Angularのdistを静的ファイルとして公開
app.use(express.static(path.join(__dirname, 'boat-racer-profile', 'dist', 'browser')));

// DB接続時の再試行とハンドリング強化
function createDBConnection(retry = 3, delay = 1000) {
    return new Promise((resolve,reject) => {
        let attempts = 0;

        function connect(){
            // DBファイルを指定
          const db = new sqlite3.Database('./db/program1.db', sqlite3.OPEN_READONLY, (err) => { 
        if(!err) {
            console.log('🗃️ SQLite DB接続完了');
            resolve(db);
        } else {
          console.error(`❌ DB接続エラー: ${err.message}`);
          if(++attempts < retry) {
            console.log(`🔁 再接続を試行中 (${attempts}/${retry})...`);
            setTimeout(connect,delay);
          } else {
            reject(new Error('DB接続に失敗しました (再試行上限)'));
          }
          }
    });
}
connect();
    });
}

//---------apiを構成するsqLiteサーバーの構築--------------

// DB更新通知API (app.js からたたくよう)
app.post('/api/notify-update', (req, res) => {
  console.log('🛎️ 通知API リクエスト受信');  // ← 必須ログ
  try {
    notifyClients("APIからの通知");
    res.status(200).json({ message: '通知送信完了' });
  } catch (err) {
    console.error('❌ notifyClients 呼び出しエラー:', err);
    res.status(500).json({ error: err.message });
  }
});

// angular ルーティング対応 (リロード対策)
app.get(/^\/(?!api).*/,(req,res) => {
  res.sendFile(path.join(__dirname, 'boat-racer-profile', 'dist', 'browser','index.html'));
});

const PORT  = 4200;

// DB接続後ルーティング開始
let db;

createDBConnection().then(conn => {
    db = conn;

    // ルーティング分割の読み込み
app.use('/api/racers',require('./routes/racers')(db));
app.use('/api/series',require('./routes/series')(db));

// サーバー起動 (Express + Socket.IO 両方)
server.listen(PORT, '0.0.0.0',() => {
    console.log(`🌐 Webサーバー起動中 → http://localhost:${PORT}`);
});


}).catch(err => {
    console.error("⚠  最終的にDB接続できませんでした:", err.message);
    process.exit(1); // 致命的なエラーとして終了
});

// 動作確認　http://localhost:4200/api/racers?hdate=20250418&jcd=13