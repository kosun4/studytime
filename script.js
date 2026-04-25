const URL = "あなたのGASのURL"; // ★新しくデプロイしたURLに差し替え

let startTime, timerInterval, elapsedTime = 0;
const timerDisplay = document.getElementById('timerDisplay');

// ページ切り替え時にデータを最新にする
async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    // 統計またはログページを開いた時に自動更新
    if (id === 'page-stats' || id === 'page-log') {
        await fetchAllData();
    }
}

// データ取得・表示関数
async function fetchAllData() {
    const logList = document.getElementById('logList');
    if(logList) logList.innerHTML = "<p style='color:#86868b'>同期中...</p>";

    try {
        const response = await fetch(URL);
        const data = await response.json();

        // 統計の反映（秒単位）
        document.getElementById('statToday').textContent = data.today;
        document.getElementById('statTotal').textContent = data.total;

        // ログの反映
        if(logList) {
            logList.innerHTML = "";
            data.logs.forEach(log => {
                const div = document.createElement('div');
                div.className = 'log-card';
                div.innerHTML = `
                    <div>
                        <small style="color:#86868b; font-size:12px;">${log.date}</small>
                        <div style="font-size:18px; font-weight:600;">${log.duration}</div>
                    </div>
                    <button onclick="deleteLog('${log.id}')" class="del-btn">削除</button>
                `;
                logList.appendChild(div);
            });
        }
    } catch (e) {
        console.error("データ取得エラー:", e);
    }
}

// ログ削除関数
async function deleteLog(id) {
    if (!confirm("この記録を削除しますか？\n合計時間からも差し引かれます。")) return;

    // 削除ボタンを一時的に無効化
    event.target.innerText = "削除中...";
    event.target.disabled = true;

    try {
        await fetch(URL, {
            method: "POST",
            body: JSON.stringify({ action: "delete", id: id })
        });
        // ★重要: 削除が終わったらすぐにデータを再取得して時間を減らす
        await fetchAllData();
    } catch (e) {
        alert("削除に失敗しました。");
        await fetchAllData();
    }
}

// --- タイマー関連の既存コード ---
document.getElementById('startButton').onclick = () => {
    if (timerInterval) return;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        const totalSec = Math.floor(elapsedTime / 1000);
        const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(totalSec % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${h}:${m}:${s}`;
    }, 100);
};

document.getElementById('stopButton').onclick = async () => {
    if (elapsedTime < 1000) return;
    const finalTime = timerDisplay.textContent;
    
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    timerDisplay.textContent = "00:00:00";

    await fetch(URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "add", duration: finalTime })
    });
    alert("保存完了！統計を確認してください。");
};
