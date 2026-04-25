const API_URL = "https://script.google.com/macros/s/AKfycbw6bfRGcEQDGdCECKNHvRQUfUIaW_BM3cmB9OACaR1tfwxlMPLwsEOHaGYwbynHM6Enuw/exec";

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

    // fetchでGASに送信
    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ 
            action: "add", 
            duration: timeStr 
        })
    });

    alert("送信しました。");
    elapsedTime = 0;
    document.getElementById('timerDisplay').textContent = "00:00:00";
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
}
