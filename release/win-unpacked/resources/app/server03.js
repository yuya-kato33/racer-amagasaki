// server.jsの内容　(基本API構成 + WebSocket + フロントサーバ専用)　(Express継続)

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

const { setIO, notifyClients } = require('./modules/notify');

const app = express();
const server = http.createServer(app) //ExpressとSocket.ioを共通サーバ

// サイネージAPI
const { getState, setState } = require('./modules/signageState');
const { getRaceSchedule, decideCurrentRace } = require('./modules/signageEngine');
const { fork } = require('child_process');
const { start } = require('repl');
const { error } = require('console');
const { type } = require('os');

// =========================================================
// 1️⃣ CORS（最優先）
// =========================================================
// CORS設定（Express + Socket.IO 共通）
const corsOptions = {
  origin: [
    "http://localhost:4200", //開発用
    "http://127.0.0.1:8081", //LAnアクセス
    "http://127.0.0.1:8083" //LAnアクセス用
  ],
  methods: ["GET", "POST"],
  credentials: true
};

// ✅ ExpressにCORSを適用（必ずapp定義後すぐ）
app.use(cors(corsOptions));

// 追加
app.use(express.json())

// =========================================================
// 2️⃣ Socket.IO 設定
// =========================================================
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

  socket.on('disconnect', () => {
    console.log('❌ クライアント切断:', socket.id);
  });
});


// =========================================================
// 3️⃣ DB接続（Promise）
// =========================================================
// DB接続時の再試行とハンドリング強化
function createDBConnection(retry = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function connect() {
      // DBファイルを指定
      const db = new sqlite3.Database('./db/program1.db', sqlite3.OPEN_READONLY, (err) => {
        if (!err) {
          console.log('🗃️ SQLite DB接続完了');
          resolve(db);
        } else {
          console.error(`❌ DB接続エラー: ${err.message}`);
          if (++attempts < retry) {
            console.log(`🔁 再接続を試行中 (${attempts}/${retry})...`);
            setTimeout(connect, delay);
          } else {
            reject(new Error('DB接続に失敗しました (再試行上限)'));
          }
        }
      });
    }
    connect();
  });
}

// ==============================================
// 4⃣当日開催場（raceheader.json)を返すAPI
// ===========================================-
// 日本時間で今日の日付を取得
function getTodayYMD() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10).replace(/-/g, '');
}

//==============================================
// youtubeLive系function
// ============================================-
function toYoutubeEmbedUrl(url) {
  if (!url) return '';

  try {
    const u = new URL(url);
    // youtube.com/watch?v=
    if (u.hostname.includes('youtube.com')
    ) {
      const v = u.searchParams.get('v');
      if (v) {
        return `https://www.youtube.com/embed/${v}?autoplay=1&mute=1`
      }
    }
    // youtu.be/xxxxx
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '');
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1`;
    }
    return url;
  } catch (err) {
    console.error('youtube url parse error', err);
    return '';
  }
}

// =========================================================
// 5️⃣ DB接続後 → API登録（最重要ブロック）
// =========================================================
// DB接続後ルーティング開始
let db;

createDBConnection().then(conn => {
  db = conn;

  // ルーティング分割の読み込み
  app.use('/api/racers', require('./routes/racers')(db));
  app.use('/api/series', require('./routes/series')(db));

  // 当日header
  app.get('/api/today-raceheader', (req, res) => {
    const today = getTodayYMD();
    const filepath = path.join(__dirname, 'xml', `${today}-raceHeader.json`);

    // ファイル存在チェック
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: `ファイルが見つかりません: ${filepath}` });
    }

    // JSONを読み込んで返す
    try {
      const json = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      res.json(json);
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  });

  // series_infoテーブルから開催情報(タイトル・グレード）を取得するAPI
  app.get('/api/today-series', (req, res) => {
    const today = getTodayYMD();
    const dbPath = path.join(__dirname, 'db', 'program1.db')

    const db2 = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('DB接続エラー:', err.message);
        return res.status(500).json({ error: 'DB接続失敗' });
      }
    });

    // 今日の日付が含まれる節（series_info.dates) を検索
    const sql = `
    SELECT jcd,jname,grade,title
    FROM series_info
    WHERE dates LIKE ?;
    `;

    db2.all(sql, [`%${today}%`], (err, rows) => {
      if (err) {
        console.error('DBクエリエラー:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
      db2.close();
    })
  });

  // レース情報APi
  app.use('/api/race', require('./routes/race')(db));

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

  // =========================================================
  // 6️⃣ 静的ファイル（LIVE画面）
  // =========================================================
  app.use(express.static(path.join(__dirname, 'public')));

  // ルートアクセスでLIVE画面を表示
  app.get('/live', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index2.html'))
  })

  // =========================================================
  // 8️⃣ サイネージAPI追加
  // =========================================================
  app.get('/api/signage-state', async (req, res) => {
    try {
      const state = getState();

      if (!state.hdate) {
        state.hdate = getTodayYMD();
      }

      let currentRace = state.currentRace;
      let schedule = [];

      if (state.mode === 'auto') {
        schedule = await getRaceSchedule(db, state.hdate, state.jcd);
        currentRace = decideCurrentRace(schedule, state.hdate, state.autoAdvanceMinutes);

        setState({ currentRace });
      }
      res.json({ ...getState(), currentRace, schedule });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // AUTO / MANUAL切替APIを追加
  app.post('/api/signage-control', async (req, res) => {
    try {
      const { mode, currentRace, jcd, autoAdvanceMinutes, youtubeLiveUrl } = req.body;

      const patch = {};

      const nextMode = mode || getState().mode;
      const nextHdate = getState().hdate || getTodayYMD();
      const nextJcd = jcd ? String(jcd).padStart(2, '0') : getState().jcd;

      const nextAutoAdvanceMinutes = autoAdvanceMinutes !== undefined
        ? Number(autoAdvanceMinutes) : getState().autoAdvanceMinutes;

      patch.mode = nextMode
      patch.hdate = nextHdate;
      patch.jcd = nextJcd;
      patch.autoAdvanceMinutes = nextAutoAdvanceMinutes;

      if (youtubeLiveUrl !== undefined) {
        patch.youtubeLiveUrl = toYoutubeEmbedUrl(youtubeLiveUrl);
      }

      // mode === 'auto' のときはDBの stime から現在Rを再計算します。
      if (nextMode === 'auto') {
        const schedule = await getRaceSchedule(db, nextHdate, nextJcd);
        patch.currentRace = decideCurrentRace(schedule, nextHdate, nextAutoAdvanceMinutes);
      } else {
        if (currentRace !== undefined) {
          patch.currentRace = Number(currentRace);
        }
      }

      const nextState = setState(patch);

      notifyClients({ type: 'signage-state', state: nextState });

      res.json(nextState);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 再読み込みAPi
  app.post('/api/signage-reload', express.json(), async (req, res) => {
    const today = getTodayYMD();
    const jcd = String(req.body.jcd || '13').padStart(2, '0');

    try {
      setState({ hdate: today, jcd, mode: 'auto', currentRace: 1 });
      const proc = fork(path.join(__dirname, 'app3.js'), [
        'now', today, today, 'reload', jcd
      ], { cwd: __dirname, silent: true });

      proc.stdout.on('data', data => {
        console.log(data.toString());
      });

      proc.stderr.on('data', data => {
        console.error(data.toString());
      });

      proc.on('close', code => {
        console.log(`signage reload app3.js close code=${code}`);

        notifyClients({ type: 'signage-reload-finished', state: getState() });
      });

      res.json({ ok: true, message: '再読み込みを開始しました', hdate: today, jcd });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // outputを静的公開
  app.use('/output', express.static(path.join(__dirname, 'output')));


  // =========================================================
  // 7️⃣ Angular（出場選手プロファイル dist）
  // =========================================================
  // Angularのdistを静的ファイルとして公開
  app.use(express.static(path.join(__dirname, 'angular', 'dist', 'browser')));

  // =========================================================
  // 8️⃣ Angular の catch-all（最下位ルート）
  // =========================================================
  // angular ルーティング対応 (リロード対策)
  app.get(/^\/(?!api|live).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'angular', 'dist', 'browser', 'index.html'));
  });

  // =========================================================
  // 9️⃣ サーバー起動
  // ========================================================
  const PORT = 8083;
  // サーバー起動 (Express + Socket.IO 両方)
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Webサーバー起動 → http://127.0.0.1:${PORT}`);
    console.log("🚀 API → 静的 → Angular の順序で完全動作中");
    console.log('SERVER_READY');
  });


}).catch(err => {
  console.error("⚠  最終的にDB接続できませんでした:", err.message);
  process.exit(1); // 致命的なエラーとして終了
});

// 動作確認　http://localhost:4200/api/racers?hdate=20250418&jcd=13

