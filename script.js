const URL = "あなたのGASのURL"; // ★ここに自分のURLを貼る

let startTime, timerInterval, elapsedTime = 0;
const timerDisplay = document.getElementById('timerDisplay');

async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id !== 'page-timer') await fetchAndProcessData();
}

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const sc = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sc}`;
}

function startTimer() {
    if (timerInterval) return;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        timerDisplay.textContent = formatTime(Math.floor(elapsedTime / 1000));
    }, 100);
}

async function stopTimer() {
    if (elapsedTime < 1000) return;
    const finalTime = timerDisplay.textContent;
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    timerDisplay.textContent = "00:00:00";
    try {
        await fetch(URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ action: "add", duration: finalTime }) });
        alert("保存しました");
    } catch (e) { alert("エラーが発生しました"); }
}

function resetTimer() {
    if(confirm("リセットしますか？")) {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        timerDisplay.textContent = "00:00:00";
    }
}

async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    if(logList) logList.innerHTML = "読み込み中...";
    try {
        const response = await fetch(URL);
        const rawLogs = await response.json();
        let total = 0, today = 0, month = 0;
        const now = new Date();
        const todayStr = now.toLocaleDateString();
        const monthStr = now.getFullYear() + "/" + (now.getMonth() + 1);

        if(logList) logList.innerHTML = "";
        
        rawLogs.reverse().forEach(log => {
            let sec = 0;
            
            // --- 【修正の核心】スプレッドシートの1899年バグを完全回避する処理 ---
            if (typeof log.duration === 'string' && log.duration.includes(':')) {
                // 文字列 "00:00:03" として届いた場合
                const p = log.duration.split(':');
                sec = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            } else {
                // 日付オブジェクトとして届いた場合（1899/12/30...）
                const d = new Date(log.duration);
                if (!isNaN(d.getTime())) {
                    // 日付（年・月・日）を無視して、時・分・秒だけを秒数に変換
                    sec = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
                }
            }

            total += sec;
            const lDate = new Date(log.timestamp);
            if (lDate.toLocaleDateString() === todayStr) today += sec;
            if (lDate.getFullYear() + "/" + (lDate.getMonth() + 1) === monthStr) month += sec;

            const div = document.createElement('div');
            div.className = 'log-card';
            div.innerHTML = `<div><small>${lDate.toLocaleString()}</small><div><b>${formatTime(sec)}</b></div></div>
                             <button onclick="deleteLog('${log.id}')" class="del-btn">削除</button>`;
            if(logList) logList.appendChild(div);
        });

        document.getElementById('statToday').textContent = formatTime(today);
        document.getElementById('statMonth').textContent = formatTime(month);
        document.getElementById('statTotal').textContent = formatTime(total);
    } catch (e) { 
        console.error(e);
        if(logList) logList.innerHTML = "データの取得に失敗しました"; 
    }
}

async function deleteLog(id) {
    if(!confirm("削除しますか？")) return;
    await fetch(URL, { method: "POST", body: JSON.stringify({ action: "delete", id: id }) });
    await fetchAndProcessData();
}
