// あなたの新しいGAS URLをここに貼り付け
const GAS_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec"; 

let startTime, elapsedTime = 0, timerInterval;
let logs = []; 

const display = document.getElementById('display');
const startStopBtn = document.getElementById('startStop');

// 起動時にデータを取得
async function loadLogsFromCloud() {
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        logs = data.filter(d => d.id).map(d => ({
            id: d.id, date: d.date, duration: Number(d.duration)
        })).reverse();
        updateStats();
        updateLogList();
    } catch (e) { console.log("Cloud load failed, using local."); }
}

// ページ切り替え
function showPage(pageId, element) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
    if(pageId === 'page-log') updateLogList();
    if(pageId === 'page-stats') updateStats();
}

// 開始・停止
startStopBtn.onclick = function() {
    if (this.innerText === "開始") {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            display.innerText = timeToString(elapsedTime);
        }, 100);
        this.innerText = "停止";
        this.classList.add("running");
    } else {
        clearInterval(timerInterval);
        this.innerText = "開始";
        this.classList.remove("running");
    }
};

// 終了（送信）
document.getElementById('finish').onclick = async () => {
    if (elapsedTime > 1000) {
        const newLog = { id: Date.now(), date: new Date().toISOString(), duration: elapsedTime };
        logs.unshift(newLog);
        updateLogList();
        updateStats();
        resetTimer();

        // GASへ送信 (no-corsモードで確実に実行)
        fetch(GAS_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(newLog)
        }).catch(e => console.error(e));
        
        alert("保存しました");
    } else { resetTimer(); }
};

function resetTimer() {
    clearInterval(timerInterval);
    elapsedTime = 0;
    display.innerText = "00:00:00";
    startStopBtn.innerText = "開始";
    startStopBtn.classList.remove("running");
}

function updateStats() {
    const now = new Date();
    let s = { today: 0, month: 0, total: 0 };
    logs.forEach(l => {
        const d = new Date(l.date);
        s.total += l.duration;
        if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
            s.month += l.duration;
            if (d.getDate() === now.getDate()) s.today += l.duration;
        }
    });
    document.getElementById('stat-today').innerText = formatDetailed(s.today);
    document.getElementById('stat-month').innerText = formatDetailed(s.month);
    document.getElementById('stat-total').innerText = formatDetailed(s.total);
}

function updateLogList() {
    const list = document.getElementById('log-list');
    list.innerHTML = logs.length ? logs.map(l => `
        <div class="log-item">
            <div><small>${new Date(l.date).toLocaleDateString()}</small><br><b>${formatDetailed(l.duration)}</b></div>
            <button class="delete-btn" onclick="deleteLog(${l.id})">×</button>
        </div>
    `).join('') : '<p style="text-align:center;color:#999">履歴なし</p>';
}

function deleteLog(id) {
    if (confirm("表示から削除しますか？")) {
        logs = logs.filter(l => l.id !== id);
        updateLogList();
        updateStats();
    }
}

function timeToString(t) {
    let h = Math.floor(t / 3600000), m = Math.floor((t % 3600000) / 60000), s = Math.floor((t % 60000) / 1000);
    return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

function formatDetailed(ms) {
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
    return `${h > 0 ? h + 'h ' : ''}${m > 0 || h > 0 ? m + 'm ' : ''}${s}s`;
}

loadLogsFromCloud();