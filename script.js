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

async function stopTimer() {
    if (elapsedTime < 1000) return;
    const timeStr = document.getElementById('timerDisplay').textContent;
    if (!confirm("記録しますか？")) return;

    clearInterval(timerInterval);
    timerInterval = null;

    // 送信
    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "add", duration: timeStr })
    });

    alert("送信しました（反映に数秒かかります）");
    elapsedTime = 0;
    document.getElementById('timerDisplay').textContent = "00:00:00";
}

async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "観測中...";
    try {
        const res = await fetch(API_URL);
        const logs = await res.json();
        logList.innerHTML = "";
        logs.reverse().forEach(log => {
            const card = document.createElement('div');
            card.className = 'star-card';
            card.innerHTML = `<small>${log.timestamp}</small><p>${log.duration}</p>`;
            logList.appendChild(card);
        });
    } catch (e) {
        logList.innerHTML = "データがありません。";
    }
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id !== 'page-timer') fetchAndProcessData();
}
