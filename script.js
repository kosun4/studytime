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
    const sec = Math.floor(elapsedTime / 1000);
    if (sec < 1) return;
    const finalTime = document.getElementById('timerDisplay').textContent;
    
    if (!confirm(`記録しますか？ : ${finalTime}`)) return;

    clearInterval(timerInterval);
    timerInterval = null;

    try {
        // 送信データをオブジェクトにする
        const payload = {
            action: "add",
            duration: finalTime,
            seconds: sec // 数値としても送る
        };

        // GASへ送信
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors", // セキュリティブロック回避
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload)
        });

        alert("送信完了！反映されない場合はGASの承認を確認してください。");
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
    } catch (e) {
        alert("送信エラー:" + e);
    }
}

async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "観測中...";
    
    try {
        const response = await fetch(API_URL);
        const logs = await response.json();
        
        let total = 0, today = 0;
        const todayStr = new Date().toDateString();
        logList.innerHTML = "";

        logs.reverse().forEach(log => {
            // 文字列 "00:00:00" から秒数を復元
            const p = log.duration.split(':');
            const s = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            
            total += s;
            const lDate = new Date(log.timestamp);
            if (lDate.toDateString() === todayStr) today += s;

            const card = document.createElement('div');
            card.className = 'star-card';
            card.innerHTML = `<small>${lDate.toLocaleString()}</small><p>${log.duration}</p>`;
            logList.appendChild(card);
        });

        document.getElementById('statToday').textContent = formatTime(today);
        document.getElementById('statTotal').textContent = formatTime(total);
    } catch (e) {
        logList.innerHTML = "データが取得できません。";
        console.error(e);
    }
}

// ページ切り替え関数
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id !== 'page-timer') fetchAndProcessData();
}
