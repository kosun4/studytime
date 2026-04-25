const URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec"; // ★ここに新しいURLを必ず貼ってください！

let startTime, timerInterval, elapsedTime = 0;
const timerDisplay = document.getElementById('timerDisplay');

// ページ切り替え
async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    // 統計・ログページを開いたときに最新データを取得
    if (id !== 'page-timer') await fetchAndProcessData();
}

// 00:00:00 形式に変換
function formatTime(s) {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sc = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sc}`;
}

// 開始
function startTimer() {
    if (timerInterval) return;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        timerDisplay.textContent = formatTime(Math.floor(elapsedTime / 1000));
    }, 100);
}

// 終了（スプレッドシートへ保存）
async function stopTimer() {
    if (elapsedTime < 1000) return;
    const finalTime = timerDisplay.textContent;
    
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    timerDisplay.textContent = "00:00:00";

    try {
        await fetch(URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ action: "add", duration: finalTime })
        });
        alert("保存完了！");
    } catch (e) {
        alert("保存に失敗しました: " + e);
    }
}

// リセット
function resetTimer() {
    if(confirm("今の計測をリセットしますか？")) {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        timerDisplay.textContent = "00:00:00";
    }
}

// スプレッドシートから読み取って集計
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
            const p = log.duration.split(':');
            const sec = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            
            total += sec;
            if (lDate.toLocaleDateString() === tStr) today += sec;
            if (lDate.getFullYear() + "/" + (lDate.getMonth() + 1) === mStr) month += sec;

            const div = document.createElement('div');
            div.className = 'log-card';
            div.innerHTML = `<div><small>${lDate.toLocaleString()}</small><div><b>${log.duration}</b></div></div>
                             <button onclick="deleteLog('${log.id}')" class="del-btn">削除</button>`;
            if(logList) logList.appendChild(div);
        });

        document.getElementById('statToday').textContent = formatTime(today);
        document.getElementById('statMonth').textContent = formatTime(month);
        document.getElementById('statTotal').textContent = formatTime(total);
    } catch (e) {
        if(logList) logList.innerHTML = "データが取得できませんでした";
    }
}

// 削除機能
async function deleteLog(id) {
    if(!confirm("削除しますか？")) return;
    await fetch(URL, { method: "POST", body: JSON.stringify({ action: "delete", id: id }) });
    await fetchAndProcessData();
}
