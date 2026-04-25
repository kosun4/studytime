const URL = "あなたのGASのURL"; // ★ここに自分のURLを貼る

let startTime, timerInterval, elapsedTime = 0;
const timerDisplay = document.getElementById('timerDisplay');

async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    // 統計・ログ画面を開いたときに最新データを取得
    if (id !== 'page-timer') await fetchAndProcessData();
}

function formatTime(s) {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sc = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sc}`;
}

// 開始ボタン
document.getElementById('startButton').onclick = () => {
    if (timerInterval) return;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        timerDisplay.textContent = formatTime(Math.floor(elapsedTime / 1000));
    }, 100);
};

// 終了（保存・リセット）
document.getElementById('stopButton').onclick = async () => {
    if (elapsedTime < 1000) return;
    const finalTime = timerDisplay.textContent;
    
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    timerDisplay.textContent = "00:00:00";

    await fetch(URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "add", duration: finalTime })
    });
    alert("スプレッドシートに保存しました！");
};

// リセットボタン（中央）
document.getElementById('resetButton').onclick = () => {
    if(confirm("今の計測をリセットしますか？")) {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        timerDisplay.textContent = "00:00:00";
    }
};

// スプレッドシートからデータを読み込んで集計
async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    if(logList) logList.innerHTML = "読み込み中...";
    
    try {
        const response = await fetch(URL);
        const rawLogs = await response.json();

        let total = 0, today = 0, month = 0;
        const now = new Date();
        const tStr = now.toLocaleDateString();
        const mStr = now.getFullYear() + "/" + (now.getMonth() + 1);

        if(logList) logList.innerHTML = "";
        rawLogs.reverse().forEach(log => {
            const lDate = new Date(log.timestamp);
            const sec = log.duration.split(':').reduce((a, b) => a * 60 + +b, 0);
            
            total += sec;
            if (lDate.toLocaleDateString() === tStr) today += sec;
            if (lDate.getFullYear() + "/" + (lDate.getMonth() + 1) === mStr) month += sec;

            const div = document.createElement('div');
            div.className = 'log-card';
            div.innerHTML = `<div><small>${lDate.toLocaleString()}</small><div>${log.duration}</div></div>
                             <button onclick="deleteLog('${log.id}')" class="del-btn">削除</button>`;
            if(logList) logList.appendChild(div);
        });

        document.getElementById('statToday').textContent = formatTime(today);
        document.getElementById('statMonth').textContent = formatTime(month);
        document.getElementById('statTotal').textContent = formatTime(total);
    } catch (e) { 
        if(logList) logList.innerHTML = "データがありません"; 
    }
}

async function deleteLog(id) {
    if(!confirm("このログを削除しますか？")) return;
    await fetch(URL, { method: "POST", body: JSON.stringify({ action: "delete", id: id }) });
    await fetchAndProcessData(); // 削除後に再集計
}
