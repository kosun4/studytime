// 【重要】ブラウザの更新（Ctrl+F5）を忘れずに行ってください
const API_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

let startTime, timerInterval, elapsedTime = 0;

// ページ切り替え
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    const navId = 'nav-' + id.replace('page-', '');
    if(document.getElementById(navId)) document.getElementById(navId).classList.add('active');
    
    // 記録・軌跡ページを開いた時に最新データを取得
    if (id !== 'page-timer') fetchAndProcessData();
}

// 時間のフォーマット (00:00:00)
function formatTime(s) {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sc = Math.floor(s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sc}`;
}

// タイマー開始
function startTimer() {
    if (timerInterval) return;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        document.getElementById('timerDisplay').textContent = formatTime(Math.floor(elapsedTime / 1000));
    }, 100);
}

// タイマー停止と保存
async function stopTimer() {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    if (totalSeconds < 1) return; // 1秒未満は保存しない
    
    const timeStr = document.getElementById('timerDisplay').textContent;
    if (!confirm(`今回の航海時間 ${timeStr} を星図に記録しますか？`)) return;

    clearInterval(timerInterval);
    timerInterval = null;

    try {
        // GASへデータを送信
        // mode: 'no-cors' は以前動いていたなら不要な場合が多いですが、
        // 確実に届けるために最もシンプルな構成にします
        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "add",
                duration: timeStr
            })
        });

        alert("星の軌跡を記録しました。");
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
    } catch (e) {
        console.error(e);
        alert("通信エラー：記録に失敗しました。");
    }
}

// リセット
function resetTimer() {
    if(!confirm("計測をリセットしますか？")) return;
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    document.getElementById('timerDisplay').textContent = "00:00:00";
}

// データ取得と統計表示
async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "<p style='text-align:center;'>天体観測中...</p>";
    
    try {
        const response = await fetch(API_URL);
        const logs = await response.json();
        
        let totalSec = 0, todaySec = 0;
        const now = new Date();
        const todayStr = now.toDateString();
        
        logList.innerHTML = "";
        
        // 逆順（新しい順）で表示
        [...logs].reverse().forEach(log => {
            // 文字列(00:00:00)から秒数を計算
            const parts = log.duration.split(':');
            const s = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
            
            totalSec += s;
            const logDate = new Date(log.timestamp);
            if (logDate.toDateString() === todayStr) todaySec += s;

            // ログカードの作成
            const card = document.createElement('div');
            card.className = 'star-card';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.innerHTML = `
                <div style="text-align:left">
                    <small style="color:var(--accent)">${logDate.toLocaleString()}</small>
                    <p style="font-size:20px; margin:0; color:white;">${log.duration}</p>
                </div>
                <button onclick="deleteLog('${log.id}')" class="btn-del">消去</button>
            `;
            logList.appendChild(card);
        });

        // 統計の反映
        document.getElementById('statToday').textContent = formatTime(todaySec);
        document.getElementById('statTotal').textContent = formatTime(totalSec);
        // 今月の計算（簡易版）
        document.getElementById('statMonth').textContent = formatTime(totalSec); 

    } catch (e) {
        logList.innerHTML = "<p style='text-align:center;'>記録が見つかりません</p>";
    }
}

// 削除
async function deleteLog(id) {
    if(!confirm("この星の軌跡を消去しますか？")) return;
    try {
        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "delete", id: id })
        });
        fetchAndProcessData();
    } catch(e) {
        alert("削除に失敗しました。");
    }
}
