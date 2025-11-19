
// ✅ 24場の定義（JSON形式）
const raceVenues = [
    { code: "01", name: "桐生" },
    { code: "02", name: "戸田" },
    { code: "03", name: "江戸川" },
    { code: "04", name: "平和島" },
    { code: "05", name: "多摩川" },
    { code: "06", name: "浜名湖" },
    { code: "07", name: "蒲郡" },
    { code: "08", name: "常滑" },
    { code: "09", name: "津" },
    { code: "10", name: "三国" },
    { code: "11", name: "びわこ" },
    { code: "12", name: "住之江" },
    { code: "13", name: "尼崎" },
    { code: "14", name: "鳴門" },
    { code: "15", name: "丸亀" },
    { code: "16", name: "児島" },
    { code: "17", name: "宮島" },
    { code: "18", name: "徳山" },
    { code: "19", name: "下関" },
    { code: "20", name: "若松" },
    { code: "21", name: "芦屋" },
    { code: "22", name: "福岡" },
    { code: "23", name: "唐津" },
    { code: "24", name: "大村" },
];

const mascotMap = {
    "桐生": "kiryu",
    "戸田": "toda",
    "江戸川": "edogawa",
    "平和島": "heiwajima",
    "多摩川": "tamagawa",
    "浜名湖": "hamanako",
    "蒲郡": "gamagori",
    "常滑": "tokoname",
    "津": "tsu",
    "三国": "mikuni",
    "びわこ": "biwako",
    "住之江": "suminoe",
    "尼崎": "amagasaki",
    "鳴門": "naruto",
    "丸亀": "marugame",
    "児島": "kojima",
    "宮島": "miyajima",
    "徳山": "tokuyama",
    "下関": "shimonoseki",
    "若松": "wakamatsu",
    "芦屋": "ashiya",
    "福岡": "fukuoka",
    "唐津": "karatsu",
    "大村": "oomura"
};


// 超重要: ポート判定と相互補完URL設定
const HOST = "192.168.1.22";
const PORT = location.port;

// 8083 の racers API パス
const RACERS_API_PATH = "/api/series";

// ● 8081 → レース結果は自前、選手一覧は 8083 から取りに行く
// ● 8083 → レース結果は 8081 から取得、選手一覧は自前
const RESULT_BASE = `http://${HOST}:8081` // 8083→8081の結果を参照
const RACERS_BASE = `http://${HOST}:8083`   // 8083 → 自前

// socket.io 初期化
const socket = io(); // これだけでOK 
console.log(" LIVE socket.io 接続開始")

//ブラウザの強制ズーム が残る場合
document.addEventListener('gesturestart', e => e.preventDefault)
document.addEventListener('dblclick', e => e.preventDefault)

// HTMLにボタンを自動生成
const container = document.getElementById("button-container");
const frame = document.getElementById("liveFrame")
const liveInfo = document.getElementById("liveInfo");

let raceInfo = []; //series_infoのデータ核の用

// 今日の日付をYYYYMMDD形式で取得　（日本時間9
function getTodayYMD() {
    const now = new Date();
    const jst = new Date(now.getTime() + (9 * 60 * 60 * 1000)); //UTC→JSt変換
    return jst.toISOString().slice(0, 10).replace(/-/g, '');
}


// JSON から開催場を取得
async function loadRaceHeader() {
    try {
        const res = await fetch('/api/today-raceheader');
        if (!res.ok) throw new Error("開催情報の取得失敗");
        const activeData = await res.json();
        return activeData.map(item => item.place);
    } catch (err) {
        console.warn(" ⚠ 開催情報が取得できません", err.message);
        return []; // 非開催扱い
    }
}

// DB(series_info) から 開催情報 (グレード・タイトル) 取得
async function loadRaceInfo() {
    try {
        const res = await fetch('/api/today-series');
        if (!res.ok) throw new Error('開催情報の取得失敗');
        const data = await res.json();
        console.log(' 今日の開催情報:', data);
        return data;
    } catch (err) {
        console.warn('開催情報が取得できません:', err.message);
        return [];
    }
}

// グレード名からCSSクラスを判定
function getGradeClass(grade) {
    if (!grade) return "grade-normal";

    let grade2 = grade.replace('Ⅰ', '1').replace('Ⅱ', '2').replace('Ⅲ', '3');

    // 全角英字にも対応
    grade2 = grade2.replace("Ｇ", "G").replace("Ｓ", "S").replace("Ｐ", "p");

    // 部分一致で暮らす編艇
    if (grade2.includes("SG")) return "grade-sg"
    if (grade2.includes("G1")) return "grade-g1"
    if (grade2.includes("G2")) return "grade-g2"
    if (grade2.includes("G3")) return "grade-g3"
    return "grade-normal"
}

// ボタン生成 (グレード付き)
async function buildButtons() {
    const activePlaces = await loadRaceHeader();
    raceInfo = await loadRaceInfo();

    raceVenues.forEach(venue => {
        const btn = document.createElement("button");
        const info = raceInfo.find(race => race.jcd === venue.code);
        const gradeLabel = info ? info.grade : "";
        const gradeClass = getGradeClass(gradeLabel);

        // ボタン全体にグレードクラスを適用
        btn.classList.add(gradeClass);

        // マスコット画像パス (ファイルがあれば表示)
        const mascotKey = mascotMap[venue.name] || venue.name;
        const mascotPath = `mascots/${venue.code}_${mascotKey}.png`;

        // グレードに応じて色クラスを付与
        btn.innerHTML = `
        <div class="btn-inner">
        <img src="${mascotPath}" alt="${venue.name}" class="mascot-icon" onerror="this.style.display='none'">
        <div class="btn-text">
        ${venue.name}
        ${gradeLabel ? `<br><small>${gradeLabel}</small>` : ""}
        </div>
        </div>
        `;

        if (activePlaces.includes(venue.code)) {
            btn.classList.add("active-day"); //開催場
            btn.onclick = () => playLive(venue.code, btn);
        } else {
            btn.classList.add("inactive-day"); //非開催場
            btn.disabled = true;
        }
        container.appendChild(btn);
    });
}

// JS更新 
let currentView = 'live'; // 現在のtab
let currentPlace = null //   現在選択中の場コード

// タブ切替イベント登録・制御
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        updateView();

        // 出場選手tabが開かれたらロード
        if (currentView === 'racers' && currentPlace) {
            loadracers(currentPlace);
        }

        // 🆕 レース結果タブを開いたときだけロード
        if (currentView === 'result' && currentPlace) {

            const today = getTodayYMD();
            // ANgulrルートではなくHTMLを直に指定
            const url = `${RESULT_BASE}/results?date=${today}&jcd=${currentPlace}&live=true`; // live=true追加
            console.log(" レース結果URL:", url);
            document.getElementById('resultFrame').src = url;

        }
    })
})

// ===================================
// 結果 iframe の READY 検知
let resultFrameReady = false;

const resultFrame = document.getElementById("resultFrame");

resultFrame.onload = () => {
    console.log("結果iframe Ready!")
    resultFrameReady = true;
}


// 表示更新 (タブに応じてHTMLの表示を切り替え)
function updateView() {
    // すべて非表示（フェードアウト）
    const panels = document.querySelectorAll('.view-panel');
    panels.forEach(v => {
        if (v.id === `view-${currentView}`) {
            //フェードイン・
            v.classList.add('active-view');
        } else {
            // フェードアウト
            v.classList.remove('active-view');
        }
    });

    // 🟡 特殊ケース：レース結果タブの場合のみ iframe もフェード演出
    if (currentView === 'result') {
        const resultFrame = document.getElementById('resultFrame');
        if (resultFrame) {
            resultFrame.style.transition = 'opacity 0.3s ease';
            resultFrame.style.opacity = 1;
        }
    } else {
        const resultFrame = document.getElementById('resultFrame');
        if (resultFrame) {
            resultFrame.style.opacity = 0;
        }
    }
}

// =============================================
// 結果 iframe のロード状態管理
// =============================================

function updateResultFrame(newurl) {
    const frame = document.getElementById("resultFrame");
    resultFrameReady = false;

    // フェードアウト（背景はCSSで #0a1633）
    frame.classList.remove("loaded");

    // ★ 遅延して src を更新（白フラッシュ吸収）
    setTimeout(() => {
        frame.src = newurl;

        frame.onload = () => {
            resultFrameReady = true;
            frame.classList.add("loaded");
        };

    }, 250); // ← 遅延時間は 250〜400ms が最適
}

//　ボタンを押して 再生処理 (タイトル表示付き)
function playLive(joCode, btn) {
    // ボタンのアクティブ状態を切り替え
    currentPlace = joCode;

    //ボタン選択表示
    document.querySelectorAll("#button-container button").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");

    // レースタイトル
    const info = raceInfo.find(race => race.jcd === joCode);
    liveInfo.textContent = info
        ? `${info.jname} (${info.grade} ${info.title})`
        : `${joCode} - ライブ映像`

    // ライブiframe更新
    const frame = document.getElementById('liveFrame');
    const baseUrl = "https://race.boatcast.jp/boatcastpc/streamer/streamer.php";
    frame.src = `${baseUrl}?md=L&jo=${joCode}&_=${Date.now()}`;

    // 結果iframe再読み込み（フェードつき）
    const today = getTodayYMD();
    const newurl = `${RESULT_BASE}/results?date=${today}&jcd=${currentPlace}&live=true`;
    console.log("結果iframe 更新:", newurl);

    const resultFrame = document.getElementById('resultFrame');

    // フェードアウト（透過）
    resultFrame.style.opacity = 0;

    // ★ 遅延して about:blank を直接見せない
    setTimeout(() => {
        resultFrame.src = newurl;

        resultFrame.onload = () => {
            resultFrame.style.transition = "opacity 0.3s ease";
            resultFrame.style.opacity = 1;
        };

    }, 350);  // ← 300〜500msで効果が高い
}

// 結果iframe へ RESULT_UPDATE を安全に送る関数
function sendResultUpdate() {
    if (!resultFrameReady) {
        console.warn("iframe未準備 → 200ms後に再送");
        setTimeout(sendResultUpdate, 200);
        return;
    }
    try {
        resultFrame.contentWindow.postMessage({ type: "RESULT_UPDATE" }, "*");
        console.log("RESULT_UPDATE 送信成功");
    } catch (e) {
        console.warn("RESULT_UPDATE送信失敗:", e)
    }
}

// READY 受信用 listener
window.addEventListener("message", (event) => {
    if (event.data?.type === "RESULT_READY") {
        console.log(" Angular iframe READY を受信");
        resultFrameReady = true;
        sendResultUpdate();
    }
})

// サーバーから結果更新通知を受け取ったら結果iframeを更新
socket.on('update', (msg) => {
    console.log("🛰 結果更新通知:", msg);

    function trySend() {
        if (!resultFrameReady) {
            console.log("iframe未準備 → 再試行");
            setTimeout(trySend, 200);
            return;
        }

        const frame = document.getElementById("resultFrame");

        try {
            frame.contentWindow.postMessage({ type: "RESULT_UPDATE" }, "*");
            console.log("📨 Angular へ RESULT_UPDATE 送信");
        } catch (e) {
            console.warn("postMessage失敗:", e);
        }
    }

    trySend();
});


// 出場選手一覧dataを読み込んで表示 (ページ送り対応版)
let currentPage = 1;
let totalPages = 1;
let racersData = [];
let cardsPerPage = 18; //初期値

// 支部から全角スペースを削除する
function normalizeShibu(shibu) {
    if (!shibu) return '';
    return shibu.replace(/\s+/g, '').replace(/　/g, ''); // 半角・全角空白を削除
}

async function loadracers(joCode) {
    console.log("loadracers 実行:", joCode);
    const now = new Date();
    const jst = new Date(now.getTime() + (9 * 60 * 60 * 1000)); //UTC→JSt変換
    const today = jst.toISOString().slice(0, 10).replace(/-/g, '');

    const container = document.getElementById('racerListContainer');
    const indicator = document.getElementById('pageIndicator');
    container.innerHTML = `<p style="color:white;">読み込み中...</p>`

    try {
        const startDate = today;
        console.log("FETCH URL:", `${RACERS_BASE}/api/series/${startDate}/${joCode}/racers`);
        const res = await fetch(`${RACERS_BASE}/api/series/${startDate}/${joCode}/racers`);
        if (!res.ok) throw new Error('選手データの取得に失敗しました');
        racersData = await res.json();

        if (!racersData.length) {
            container.innerHTML = '<p style="color:white;">データがありません。</p>';
            indicator.textContent = '-';
            return;
        }

        // いったんすべてのカードを仮描画してサイズを計測
        container.innerHTML = `
          <div class="racer-card" style="visibility:hidden";>
            <img src="assets/placeholder.png" />
            <div class="racer-info"><strong>Dummy</strong></div>
          </div>
        `;
        await new Promise(r => setTimeout(r, 50)); //描画待ち

        const card = container.querySelector('.racer-card');
        const cardWidth = card.offsetWidth;
        const cardHeight = card.offsetHeight;

        const gridWidth = container.clientWidth;
        const gridHeight = document.getElementById('view-racers').clientHeight - 80; //ページャー分

        const cols = Math.floor(gridWidth / (cardWidth + 12)); //横何枚入るか
        const rows = 2; // 常に2段分を固定
        cardsPerPage = cols * rows;

        currentPage = 1;
        totalPages = Math.ceil(racersData.length / cardsPerPage); // 1ページあたり18人
        renderRacerPage();
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="color:white;">⚠ ${err.message}</p>`;
    }
}

function renderRacerPage() {
    const container = document.getElementById('racerListContainer');
    const indicator = document.getElementById('pageIndicator');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    const startIndex = (currentPage - 1) * cardsPerPage;
    const pageData = racersData.slice(startIndex, startIndex + cardsPerPage);

    container.innerHTML = pageData
        .map(
            (r) => `
            <div class="racer-card" >
              <img
              src="assets/racerphoto/${r.toban}.jpg"
              alt=${r.name}
              width="100" height = "120"
              onerror="this.src='assets/placeholder.png'"
            />
            <div class="racer-info">
              <strong>${r.name}</strong>
              <div>(${r.kyu || '-'}・${normalizeShibu(r.shibu) || '-'}支部)</div>
              <div>登録番号: ${r.toban}</div>
              <div>勝率: ${Number(r.zsyo).toFixed(2)}</div>
              <div>2連: ${r.z2ren || '-'}% / 3連: ${r.z3ren || '-'}%</div>
            </div>
          </div>`
        )
        .join('');

    indicator.textContent = `${currentPage} / ${totalPages}`;

    // ボタンの有効 / 無効制御
    if (currentPage === 1) {
        prevBtn.classList.add('disabled');
        prevBtn.disabled = true;
    } else {
        prevBtn.classList.remove('disabled');
        prevBtn.disabled = false;
    }

    if (currentPage === totalPages) {
        nextBtn.classList.add('disabled');
        nextBtn.disabled = true;
    } else {
        nextBtn.classList.remove('disabled');
        nextBtn.disabled = false;
    }
}

// ページ切り替えボタン
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderRacerPage();
    }
});
document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        renderRacerPage();
    }
});

// ウィンドウサイズ変更時にも再計算
window.addEventListener('resize', () => {
    if (racersData.length > 0) {
        const jo = currentPlace || null;
        if (jo) loadracers(jo);
    }
});

// 全画面風モードを疑似検知
function checkFullscreenMode() {
    const isLargeScreen = window.innerHeight > 800 & window.innerWidth > 1200;
    const rightPanel = document.querySelector(".right-panel");
    if (!rightPanel) return;

    if (isLargeScreen) {
        rightPanel.classList.add("expanded-view");
    } else {
        rightPanel.classList.remove("expanded-view");
    }
}

// 画面サイズ変化時に検知
window.addEventListener("resize", checkFullscreenMode)

// 初期化
checkFullscreenMode();

buildButtons();