const API_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

let startTime, timerInterval, elapsedTime = 0;

// ページ切り替え
async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    const navId = 'nav-' + id.replace('page-', '');
    if (document.getElementById(navId)) {
        document.getElementById(navId).classList.add('active');
    }
    
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

// ★修正ポイント：保存処理を強化
async function stopTimer() {
    if (elapsedTime < 1000) return;
    const finalTime = document.getElementById('timerDisplay').textContent;
    if (!confirm("今回の航海（学習）を記録しますか？")) return;

    clearInterval(timerInterval);
    timerInterval = null;

    try {
        // GASはPOST時にリダイレクトが発生するため、mode: 'no-cors' を使うか
        // または text/plain で送信するのが最も安定します
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors", // これを追加
            headers: {
                "Content-Type": "text/plain"
            },
            body: JSON.stringify({ action: "add", duration: finalTime })
        });

        // 保存完了の演出
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
        alert("星の軌跡を記録しました。");
    } catch (e) {
        console.error("Save Error:", e);
        alert("記録に失敗しました。");
    }
}

function resetTimer() {
    if(confirm("計測をリセットしますか？")) {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
    }
}

// データの取得と統計
async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "<p style='text-align:center;'>観測中...</p>";
    
    try {
        const response = await fetch(API_URL);
        const logs = await response.json();
        
        let totalSec = 0, todaySec = 0, monthSec = 0;
        const now = new Date();
        logList.innerHTML = "";
        
        if (!logs || logs.length === 0) {
            logList.innerHTML = "<p style='text-align:center;'>まだ記録がありません。</p>";
            return;
        }
        
        // 統計計算用にコピーを作って処理
        [...logs].reverse().forEach(log => {
            const p = log.duration.split(':');
            const sec = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            const lDate = new Date(log.timestamp);
            
            totalSec += sec;
            if (lDate.toDateString() === now.toDateString()) todaySec += sec;
            if (lDate.getMonth() === now.getMonth() && lDate.getFullYear() === now.getFullYear()) monthSec += sec;

            const card = document.createElement('div');
            card.className = 'star-card';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.innerHTML = `
                <div style="text-align:left">
                    <small style="color:var(--accent)">${lDate.toLocaleString('ja-JP')}</small>
                    <p style="font-size:20px; margin:0; color:white;">${log.duration}</p>
                </div>
                <button onclick="deleteLog('${log.id}')" class="btn-del">消去</button>
            `;
            logList.appendChild(card);
        });

        document.getElementById('statToday').textContent = formatTime(todaySec);
        document.getElementById('statMonth').textContent = formatTime(monthSec);
        document.getElementById('statTotal').textContent = formatTime(totalSec);
    } catch (e) {
        console.error("Fetch Error:", e);
        logList.innerHTML = "<p>観測（データ取得）に失敗しました</p>";
    }
}

// 削除処理
async function deleteLog(id) {
    if(!confirm("この記録を消去しますか？")) return;
    try {
        await fetch(API_URL, { 
            method: "POST", 
            mode: "no-cors", // これを追加
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: "delete", id: id }) 
        });
        alert("消去の命令を送信しました。");
        // 削除反映のため少し待ってから再読み込み
        setTimeout(fetchAndProcessData, 1000);
    } catch(e) {
        alert("削除失敗");
    }
}
