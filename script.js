const URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

let startTime, timerInterval, elapsedTime = 0;

async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.dock-item').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById(id.replace('page', 'nav')).classList.add('active');
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
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    document.getElementById('timerDisplay').textContent = "00:00:00";

    // 保存開始（ユーザーに通知）
    console.log("Saving to spreadsheet...");
    try {
        await fetch(URL, {
            method: "POST",
            mode: "no-cors", // Google側への一方通行送信
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "add", duration: finalTime })
        });
        alert("学習記録を保存しました！");
    } catch (e) {
        alert("通信エラー：保存に失敗しました。電波を確認してください。");
    }
}

function resetTimer() {
    if(confirm("リセットしますか？")) {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
    }
}

async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "<p style='text-align:center'>Loading...</p>";
    try {
        const response = await fetch(URL);
        const rawLogs = await response.json();
        let total = 0, today = 0, month = 0;
        const now = new Date();
        const tStr = now.toLocaleDateString();
        const mStr = now.getFullYear() + "/" + (now.getMonth() + 1);

        logList.innerHTML = "";
        rawLogs.reverse().forEach(log => {
            let sec = 0;
            // 1899年バグ回避
            if (typeof log.duration === 'string' && log.duration.includes(':')) {
                const p = log.duration.split(':');
                sec = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            } else {
                const d = new Date(log.duration);
                if (!isNaN(d.getTime())) sec = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
            }

            total += sec;
            const lDate = new Date(log.timestamp);
            if (lDate.toLocaleDateString() === tStr) today += sec;
            if (lDate.getFullYear() + "/" + (lDate.getMonth() + 1) === mStr) month += sec;

            const div = document.createElement('div');
            div.className = 'glass-card';
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.alignItems = "center";
            div.innerHTML = `<div><small>${lDate.toLocaleString()}</small><div><b>${formatTime(sec)}</b></div></div>
                             <button onclick="deleteLog('${log.id}')" style="color:#ff3b30; background:none; border:none; font-weight:600;">削除</button>`;
            logList.appendChild(div);
        });

        document.getElementById('statToday').textContent = formatTime(today);
        document.getElementById('statMonth').textContent = formatTime(month);
        document.getElementById('statTotal').textContent = formatTime(total);
    } catch (e) {
        logList.innerHTML = "データが取得できません。デプロイ設定を確認してください。";
    }
}

async function deleteLog(id) {
    if(!confirm("削除しますか？")) return;
    await fetch(URL, { method: "POST", body: JSON.stringify({ action: "delete", id: id }) });
    await fetchAndProcessData();
}
