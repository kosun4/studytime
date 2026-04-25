const API_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

let startTime, timerInterval, elapsedTime = 0;

async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.dock-item').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    const navId = 'nav-' + id.replace('page-', '');
    if (document.getElementById(navId)) document.getElementById(navId).classList.add('active');
    
    if (id !== 'page-timer') await fetchAndProcessData();
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
    if (!confirm(`${finalTime} を記録しますか？`)) return;

    clearInterval(timerInterval);
    timerInterval = null;

    try {
        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "add", duration: finalTime })
        });
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
        alert("保存完了！");
    } catch (e) {
        alert("保存失敗。通信環境を確認してください。");
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
    logList.innerHTML = "<p style='text-align:center; padding:20px; color:#86868b;'>読み込み中...</p>";
    
    try {
        const response = await fetch(API_URL);
        const logs = await response.json();
        
        let totalSec = 0, todaySec = 0, monthSec = 0;
        const now = new Date();
        const todayStr = now.toDateString();
        
        logList.innerHTML = "";
        
        // 1. 集計
        logs.forEach(log => {
            const p = log.duration.split(':');
            const sec = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            const lDate = new Date(log.timestamp);
            
            totalSec += sec;
            if (lDate.toDateString() === todayStr) todaySec += sec;
            if (lDate.getMonth() === now.getMonth() && lDate.getFullYear() === now.getFullYear()) monthSec += sec;
        });

        // 2. 履歴表示 (反転)
        [...logs].reverse().forEach(log => {
            const lDate = new Date(log.timestamp);
            const card = document.createElement('div');
            card.className = 'glass-card log-item';
            card.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;";
            card.innerHTML = `
                <div>
                    <small style="color:#86868b; font-size:11px;">${lDate.toLocaleString('ja-JP')}</small>
                    <p style="font-size:20px; font-weight:600; margin:0;">${log.duration}</p>
                </div>
                <button onclick="deleteLog('${log.id}')" class="btn-del">削除</button>
            `;
            logList.appendChild(card);
        });

        document.getElementById('statToday').textContent = formatTime(todaySec);
        document.getElementById('statMonth').textContent = formatTime(monthSec);
        document.getElementById('statTotal').textContent = formatTime(totalSec);
    } catch (e) {
        logList.innerHTML = "<p style='text-align:center; color:#ff3b30;'>取得失敗</p>";
    }
}

async function deleteLog(id) {
    if(!confirm("削除しますか？")) return;
    try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "delete", id: id }) });
        await fetchAndProcessData();
    } catch(e) {
        alert("削除失敗");
    }
}
