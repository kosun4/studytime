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

// ここが自動書き込みの心臓部
async function stopTimer() {
    if (elapsedTime < 1000) return;
    const timeStr = document.getElementById('timerDisplay').textContent;
    
    if (!confirm(`記録を保存しますか？ : ${timeStr}`)) return;

    clearInterval(timerInterval);
    timerInterval = null;

    // fetchの代わりに、最も原始的で確実な「フォーム送信」に近い形式で送る
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors", // Google側でエラーを出させない魔法
            cache: "no-cache",
            headers: { "Content-Type": "text/plain" }, // JSONではなくテキストとして送りつける
            body: JSON.stringify({ action: "add", duration: timeStr })
        });

        // 成功を信じてアラートを出す
        alert("星図へ信号を送りました！反映をお待ちください。");
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
    } catch (e) {
        alert("送信に失敗しました");
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
    logList.innerHTML = "データ通信中...";
    try {
        const res = await fetch(API_URL);
        const logs = await res.json();
        let totalSec = 0;
        logList.innerHTML = "";

        [...logs].reverse().forEach(log => {
            const p = log.duration.split(':');
            totalSec += parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            
            const card = document.createElement('div');
            card.className = 'star-card';
            card.innerHTML = `<small>${log.timestamp}</small><p style="font-size:20px; color:white;">${log.duration}</p>`;
            logList.appendChild(card);
        });
        document.getElementById('statTotal').textContent = formatTime(totalSec);
    } catch (e) {
        logList.innerHTML = "まだ記録がありません。";
    }
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id !== 'page-timer') fetchAndProcessData();
}
