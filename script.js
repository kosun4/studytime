const URL = "あなたのGASのURL"; // ★必ず自分のGAS URLに書き換えてください

let startTime, timerInterval, elapsedTime = 0;
const timerDisplay = document.getElementById('timerDisplay');

// 画面切り替え
async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id !== 'page-timer') fetchAllData();
}

// 秒数への変換・フォーマット用
function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// タイマー開始
document.getElementById('startButton').onclick = () => {
    if (timerInterval) return;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        timerDisplay.textContent = formatTime(Math.floor(elapsedTime / 1000));
    }, 100);
};

// 終了ボタン（保存 ＋ 強制リセット）
document.getElementById('stopButton').onclick = async () => {
    if (elapsedTime < 1000) return;
    const finalTime = timerDisplay.textContent;
    
    // 即座に止めてリセット（ユーザーを待たせない）
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    timerDisplay.textContent = "00:00:00";

    // 裏でデータを送信
    try {
        await fetch(URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ action: "add", duration: finalTime })
        });
        alert("学習記録を保存しました！");
    } catch (e) {
        console.error(e);
    }
};

// 保存せずにリセット
document.getElementById('resetButton').onclick = () => {
    if(confirm("今の計測を破棄してリセットしますか？")) {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        timerDisplay.textContent = "00:00:00";
    }
};

// データの取得と統計・ログの描画
async function fetchAllData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "<p style='color:#86868b'>読み込み中...</p>";
    
    try {
        const res = await fetch(URL);
        const data = await res.json();
        
        document.getElementById('statToday').textContent = data.today;
        document.getElementById('statTotal').textContent = data.total;
        
        logList.innerHTML = "";
        data.logs.forEach(log => {
            const div = document.createElement('div');
            div.className = 'log-card';
            div.innerHTML = `
                <div><small style="color:#86868b">${log.date}</small><div style="font-size:18px; font-weight:600">${log.duration}</div></div>
                <button onclick="deleteLog('${log.id}')" class="del-btn">削除</button>`;
            logList.appendChild(div);
        });
    } catch (e) {
        logList.innerHTML = "データの取得に失敗しました。";
    }
}

// ログ削除
async function deleteLog(id) {
    if(!confirm("このログを削除しますか？\n合計時間からも差し引かれます。")) return;
    await fetch(URL, { method: "POST", body: JSON.stringify({ action: "delete", id: id }) });
    fetchAllData(); // 削除後に再描画
}
