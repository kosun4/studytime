const API_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

let startTime, timerInterval, elapsedTime = 0;

function formatTime(s) {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sc = Math.floor(s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sc}`;
}

function startTimer() {
    if (timerInterval) return;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        document.getElementById('timerDisplay').textContent = formatTime(Math.floor(elapsedTime / 1000));
    }, 100);
}

// ★ここを修正：最も確実にデータを届ける書き方
async function stopTimer() {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    if (totalSeconds < 1) return; 
    
    const timeStr = document.getElementById('timerDisplay').textContent;
    if (!confirm(`記録しますか？ : ${timeStr}`)) return;

    clearInterval(timerInterval);
    timerInterval = null;

    try {
        // GASへ確実に届けるための設定
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors", // ブラウザの制限を回避
            headers: {
                "Content-Type": "text/plain" // GASで受け取りやすい形式
            },
            body: JSON.stringify({
                action: "add",
                duration: timeStr
            })
        });

        // 送信直後に「出たはず！」という合図
        alert("送信完了！数秒後に反映されます。");
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
    } catch (e) {
        alert("送信エラーが発生しました。");
    }
}

function resetTimer() {
    if(!confirm("リセットしますか？")) return;
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    document.getElementById('timerDisplay').textContent = "00:00:00";
}

async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "観測中...";
    try {
        const response = await fetch(API_URL);
        const logs = await response.json();
        let totalSec = 0, todaySec = 0;
        const todayStr = new Date().toDateString();
        logList.innerHTML = "";
        
        [...logs].reverse().forEach(log => {
            const parts = log.duration.split(':');
            const s = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
            totalSec += s;
            const logDate = new Date(log.timestamp);
            if (logDate.toDateString() === todayStr) todaySec += s;

            const card = document.createElement('div');
            card.className = 'star-card';
            card.innerHTML = `<small>${logDate.toLocaleString()}</small><p>${log.duration}</p>`;
            logList.appendChild(card);
        });
        document.getElementById('statToday').textContent = formatTime(todaySec);
        document.getElementById('statTotal').textContent = formatTime(totalSec);
    } catch (e) {
        logList.innerHTML = "データがありません。";
    }
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id !== 'page-timer') fetchAndProcessData();
}
