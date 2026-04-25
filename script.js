// ★重要：あなたのGASのURLをここに貼り付けてください
const URL = "あなたのGASのURL"; 

let startTime, timerInterval, elapsedTime = 0;
const timerDisplay = document.getElementById('timerDisplay');

// 1. ページ切り替え機能
async function showPage(id) {
    // 全ページを非表示にして対象だけ表示
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // 統計・ログページを開いたときはスプレッドシートから最新データを取得
    if (id === 'page-stats' || id === 'page-log') {
        await fetchAndProcessData();
    }
}

// 2. 時間を 00:00:00 形式に変換する関数
function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// 3. タイマー開始
function startTimer() {
    if (timerInterval) return; // 二重起動防止
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        timerDisplay.textContent = formatTime(Math.floor(elapsedTime / 1000));
    }, 100);
}

// 4. タイマー終了（保存 ＋ 強制リセット）
async function stopTimer() {
    if (elapsedTime < 1000) {
        alert("1秒以上計測してください");
        return;
    }
    
    const finalTime = timerDisplay.textContent;
    
    // 画面上はすぐにリセットして快適な操作感にする
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    timerDisplay.textContent = "00:00:00";

    // スプレッドシートへ送信（バックグラウンド処理）
    try {
        await fetch(URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ action: "add", duration: finalTime })
        });
        alert("学習記録を保存しました！");
    } catch (e) {
        console.error("保存失敗:", e);
        alert("保存に失敗しました。ネット環境を確認してください。");
    }
}

// 5. タイマーリセット（中央のボタン）
function resetTimer() {
    if(confirm("現在の計測を破棄してリセットしますか？")) {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        timerDisplay.textContent = "00:00:00";
    }
}

// 6. スプレッドシートからデータを取得して集計（日・月・合計）
async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    if(logList) logList.innerHTML = "<p style='color:#86868b'>同期中...</p>";
    
    try {
        const response = await fetch(URL);
        const rawLogs = await response.json(); // スプレッドシートの全行を取得

        let totalSeconds = 0;
        let todaySeconds = 0;
        let monthSeconds = 0;
        
        const now = new Date();
        const todayStr = now.toLocaleDateString(); // "2024/3/20" 形式
        const monthStr = now.getFullYear() + "/" + (now.getMonth() + 1);

        if(logList) logList.innerHTML = "";

        // ログを逆順（新しい順）に処理
        rawLogs.reverse().forEach(log => {
            const logDate = new Date(log.timestamp);
            const lDateStr = logDate.toLocaleDateString();
            const lMonthStr = logDate.getFullYear() + "/" + (logDate.getMonth() + 1);
            
            // "00:00:00" を秒数に変換して計算
            const p = log.duration.split(':');
            const sec = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            
            totalSeconds += sec;
            if (lDateStr === todayStr) todaySeconds += sec;
            if (lMonthStr === monthStr) monthSeconds += sec;

            // ログカードの作成
            const div = document.createElement('div');
            div.className = 'log-card';
            div.innerHTML = `
                <div>
                    <small style="color:#86868b; font-size:11px;">${logDate.toLocaleString()}</small>
                    <div style="font-size:18px; font-weight:600;">${log.duration}</div>
                </div>
                <button onclick="deleteLog('${log.id}')" class="del-btn">削除</button>
            `;
            if(logList) logList.appendChild(div);
        });

        // 統計画面の数字を更新
        document.getElementById('statToday').textContent = formatTime(todaySeconds);
        document.getElementById('statMonth').textContent = formatTime(monthSeconds);
        document.getElementById('statTotal').textContent = formatTime(totalSeconds);

    } catch (e) {
        console.error("読み込みエラー:", e);
        if(logList) logList.innerHTML = "<p>データが取得できませんでした。</p>";
    }
}

// 7. ログ削除
async function deleteLog(id) {
    if(!confirm("このログを削除しますか？\n削除すると合計時間も自動で減ります。")) return;

    try {
        await fetch(URL, {
            method: "POST",
            body: JSON.stringify({ action: "delete", id: id })
        });
        // 削除成功したらデータを再読み込みして時間を更新
        await fetchAndProcessData();
    } catch (e) {
        alert("削除に失敗しました。");
    }
}
