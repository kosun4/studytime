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
    
    if (!confirm("保存しますか？")) return;

    clearInterval(timerInterval);
    timerInterval = null;

    // fetchで送るだけ（成否を気にしないno-corsモード）
    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ duration: timeStr })
    });

    alert("送信しました。反映されない場合はリロードしてください。");
    elapsedTime = 0;
    document.getElementById('timerDisplay').textContent = "00:00:00";
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
