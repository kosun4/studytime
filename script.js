const URL = "あなたのGASのURL"; // ★必ず最新のURLに書き換えてください

let startTime, timerInterval, elapsedTime = 0;
const timerDisplay = document.getElementById('timerDisplay');

// 画面切り替え時に自動更新
async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'page-stats' || id === 'page-log') {
        await fetchAndProcessData();
    }
}

// データを読み込んで「日ごと」「月ごと」に集計
async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    if(logList) logList.innerHTML = "<p>同期中...</p>";

    try {
        const response = await fetch(URL);
        const rawLogs = await response.json();

        let totalSeconds = 0;
        let todaySeconds = 0;
        let monthSeconds = 0;
        
        const now = new Date();
        const todayStr = now.toLocaleDateString();
        const monthStr = now.getFullYear() + "/" + (now.getMonth() + 1);

        const logsHtml = [];

        rawLogs.reverse().forEach(log => {
            const logDate = new Date(log.timestamp);
            const lDateStr = logDate.toLocaleDateString();
            const lMonthStr = logDate.getFullYear() + "/" + (logDate.getMonth() + 1);
            
            const sec = timeToSeconds(log.duration);
            totalSeconds += sec;
            
            if (lDateStr === todayStr) todaySeconds += sec;
            if (lMonthStr === monthStr) monthSeconds += sec;

            // ログのHTML作成
            logsHtml.push(`
                <div class="log-card">
                    <div>
                        <small>${logDate.toLocaleString()}</small>
                        <div style="font-size:18px; font-weight:600;">${log.duration}</div>
                    </div>
                    <button onclick="deleteLog('${log.id}')" class="del-btn">削除</button>
                </div>
            `);
        });

        // 統計の表示更新
        document.getElementById('statToday').textContent = secondsToTime(todaySeconds);
        document.getElementById('statTotal').textContent = secondsToTime(totalSeconds);
        // 月間合計を表示したい場合はここに追加
        if(document.getElementById('statMonth')) {
            document.getElementById('statMonth').textContent = secondsToTime(monthSeconds);
        }

        if(logList) logList.innerHTML = logsHtml.join('');

    } catch (e) {
        console.error("読み込みエラー:", e);
    }
}

function timeToSeconds(t) {
    const p = String(t).split(':');
    if (p.length !== 3) return 0;
    return parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
}

function secondsToTime(s) {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sc = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sc}`;
}

async function deleteLog(id) {
    if (!confirm("削除しますか？")) return;
    await fetch(URL, { method: "POST", body: JSON.stringify({ action: "delete", id: id }) });
    await fetchAndProcessData(); // 削除後に再計算して表示
}

// --- タイマー機能 (既存) ---
document.getElementById('startButton').onclick = () => {
    if (timerInterval) return;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        timerDisplay.textContent = secondsToTime(Math.floor(elapsedTime / 1000));
    }, 100);
};

document.getElementById('stopButton').onclick = async () => {
    if (elapsedTime < 1000) return;
    const time = timerDisplay.textContent;
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    timerDisplay.textContent = "00:00:00";
    await fetch(URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ action: "add", duration: time }) });
    alert("保存しました。");
};
