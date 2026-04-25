// 読み込みチェック
window.onload = () => {
    console.log("Stellar Focus JS Loaded.");
    alert("システム起動：星空との同期を開始します"); 
};

const API_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

let startTime, timerInterval, elapsedTime = 0;

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    const navId = 'nav-' + id.replace('page-', '');
    if(document.getElementById(navId)) document.getElementById(navId).classList.add('active');
    if (id !== 'page-timer') fetchAndProcessData();
}

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

async function stopTimer() {
    if (elapsedTime < 1000) return;
    const finalTime = document.getElementById('timerDisplay').textContent;
    if (!confirm("記録を星図に書き込みますか？")) return;

    clearInterval(timerInterval);
    timerInterval = null;

    try {
        // GAS送信
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "add", duration: finalTime })
        });
        
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
        alert("星の軌跡を記録しました。");
    } catch (e) {
        alert("通信失敗：星空に届きませんでした。");
    }
}

function resetTimer() {
    if(!confirm("計測をリセットしますか？")) return;
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
        let totalSec = 0, todaySec = 0, monthSec = 0;
        const now = new Date();
        logList.innerHTML = "";
        
        [...logs].reverse().forEach(log => {
            const p = log.duration.split(':');
            const sec = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            const lDate = new Date(log.timestamp);
            totalSec += sec;
            if (lDate.toDateString() === now.toDateString()) todaySec += sec;
            if (lDate.getMonth() === now.getMonth()) monthSec += sec;

            const card = document.createElement('div');
            card.className = 'star-card';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.innerHTML = `<div><small>${lDate.toLocaleString()}</small><p>${log.duration}</p></div>
                             <button onclick="deleteLog('${log.id}')" class="btn-del">消去</button>`;
            logList.appendChild(card);
        });
        document.getElementById('statToday').textContent = formatTime(todaySec);
        document.getElementById('statMonth').textContent = formatTime(monthSec);
        document.getElementById('statTotal').textContent = formatTime(totalSec);
    } catch (e) {
        logList.innerHTML = "データがありません。";
    }
}

async function deleteLog(id) {
    if(!confirm("消去しますか？")) return;
    await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ action: "delete", id: id }) });
    setTimeout(fetchAndProcessData, 1000);
}
