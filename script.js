const URL = "あなたのGASのURL"; // ★ここに自分のURLを貼る！

let startTime, timerInterval, elapsedTime = 0;
const timerDisplay = document.getElementById('timerDisplay');

async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id !== 'page-timer') fetchAllData();
}

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
    
    // 即座に止めてリセット
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    timerDisplay.textContent = "00:00:00";

    // 裏で送信
    await fetch(URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "add", duration: finalTime })
    });
    alert("保存しました！");
};

document.getElementById('resetButton').onclick = () => {
    if(confirm("リセットしますか？")) {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        timerDisplay.textContent = "00:00:00";
    }
};

async function fetchAllData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "読み込み中...";
    const res = await fetch(URL);
    const data = await res.json();
    
    document.getElementById('statToday').textContent = data.today;
    document.getElementById('statTotal').textContent = data.total;
    
    logList.innerHTML = "";
    data.logs.forEach(log => {
        const div = document.createElement('div');
        div.className = 'log-card';
        div.innerHTML = `<div><small>${log.date}</small><div>${log.duration}</div></div>
                         <button onclick="deleteLog('${log.id}')" class="del-btn">削除</button>`;
        logList.appendChild(div);
    });
}

async function deleteLog(id) {
    if(!confirm("削除しますか？")) return;
    await fetch(URL, { method: "POST", body: JSON.stringify({ action: "delete", id: id }) });
    fetchAllData();
}
