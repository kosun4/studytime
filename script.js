const URL = "あなたのGASのURL"; // ★ここに新しいURLを貼り付け！

async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    if(logList) logList.innerHTML = "同期中...";

    try {
        const response = await fetch(URL);
        const rawLogs = await response.json();

        let totalSec = 0, todaySec = 0, monthSec = 0;
        const now = new Date();
        const todayStr = now.toLocaleDateString();
        const monthStr = now.getFullYear() + "/" + (now.getMonth() + 1);

        if(logList) logList.innerHTML = "";

        // 新しい順に表示
        rawLogs.reverse().forEach(log => {
            const lDate = new Date(log.timestamp);
            const lDateStr = lDate.toLocaleDateString();
            const lMonthStr = lDate.getFullYear() + "/" + (lDate.getMonth() + 1);
            
            // 時間を秒に変換して加算
            const p = log.duration.split(':');
            const sec = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            
            totalSec += sec;
            if (lDateStr === todayStr) todaySec += sec;
            if (lMonthStr === monthStr) monthSeconds += sec; // ここが「今月合計」

            // ログの表示
            const div = document.createElement('div');
            div.className = 'log-card';
            div.innerHTML = `
                <div><small>${lDate.toLocaleString()}</small><div>${log.duration}</div></div>
                <button onclick="deleteLog('${log.id}')" class="del-btn">削除</button>`;
            if(logList) logList.appendChild(div);
        });

        // 統計画面への反映
        document.getElementById('statToday').textContent = formatTime(todaySec);
        document.getElementById('statMonth').textContent = formatTime(monthSec); // 今月
        document.getElementById('statTotal').textContent = formatTime(totalSec);

    } catch (e) {
        console.error("エラー:", e);
    }
}

// 秒を 00:00:00 に戻す
function formatTime(s) {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sc = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sc}`;
}
