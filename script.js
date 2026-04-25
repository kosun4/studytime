// あなたのURLに書き換えてください
const API_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

let startTime, timerInterval, elapsedTime = 0;

// 時間の表示形式作成
function formatTime(s) {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sc = Math.floor(s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sc}`;
}

// タイマー開始
function startTimer() {
    if (timerInterval) return;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        document.getElementById('timerDisplay').textContent = formatTime(Math.floor(elapsedTime / 1000));
    }, 100);
}

// 【重要】スプレッドシートへ自動書き込み
async function stopTimer() {
    if (elapsedTime < 1000) return; // 1秒未満は無視
    
    const timeStr = document.getElementById('timerDisplay').textContent;
    if (!confirm(`航海を終了し、${timeStr} を記録しますか？`)) return;

    clearInterval(timerInterval);
    timerInterval = null;

    try {
        // GASへ送信
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors", // セキュリティ制限回避
            body: JSON.stringify({
                action: "add",
                duration: timeStr
            })
        });

        alert("星図に記録が刻まれました！");
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
    } catch (e) {
        alert("通信エラー：記録に失敗しました。");
    }
}

// リセット
function resetTimer() {
    if(!confirm("計測をリセットしますか？")) return;
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    document.getElementById('timerDisplay').textContent = "00:00:00";
}

// データの取得と反映
async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "天体観測中...";
    try {
        const res = await fetch(API_URL);
        const logs = await res.json();
        let totalSec = 0, todaySec = 0;
        const todayStr = new Date().toDateString();
        logList.innerHTML = "";

        [...logs].reverse().forEach(log => {
            const p = log.duration.split(':');
            const s = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            totalSec += s;
            const logDate = new Date(log.timestamp);
            if (logDate.toDateString() === todayStr) todaySec += s;

            const card = document.createElement('div');
            card.className = 'star-card';
            card.innerHTML = `
                <div style="text-align:left">
                    <small>${log.timestamp}</small>
                    <p style="font-size:20px; color:white; margin:0;">${log.duration}</p>
                </div>
                <button onclick="deleteLog('${log.id}')" class="btn-del">消去</button>`;
            logList.appendChild(card);
        });

        document.getElementById('statToday').textContent = formatTime(todaySec);
        document.getElementById('statTotal').textContent = formatTime(totalSec);
        document.getElementById('statMonth').textContent = formatTime(totalSec);
    } catch (e) {
        logList.innerHTML = "記録が見つかりません。";
    }
}

// ページ切り替え
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id !== 'page-timer') fetchAndProcessData();
}

// 削除処理
async function deleteLog(id) {
    if(!confirm("消去しますか？")) return;
    await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "delete", id: id })
    });
    setTimeout(fetchAndProcessData, 1000);
}
