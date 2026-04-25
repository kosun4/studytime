// ★デプロイ後のURL
const API_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

let startTime, timerInterval, elapsedTime = 0;

// ページ切り替え
async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.dock-item').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // ナビゲーションのID不一致を防ぐための微修正
    const navId = 'nav-' + id.replace('page-', '');
    const navElem = document.getElementById(navId);
    if (navElem) navElem.classList.add('active');
    
    if (id !== 'page-timer') await fetchAndProcessData();
}

// 時間フォーマット (00:00:00)
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

// タイマー終了・保存
async function stopTimer() {
    if (elapsedTime < 1000) return;
    const finalTime = document.getElementById('timerDisplay').textContent;
    
    if (!confirm(`${finalTime} を記録しますか？`)) return;

    // UIを停止
    clearInterval(timerInterval);
    timerInterval = null;

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "cors", // 明示的に指定
            body: JSON.stringify({ action: "add", duration: finalTime })
        });
        
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
        alert("保存完了しました！");
    } catch (e) {
        console.error(e);
        alert("保存に失敗しました。ネット接続を確認してください。");
    }
}

// タイマーリセット
function resetTimer() {
    if(confirm("リセットしますか？")) {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
    }
}

// データの取得と統計の算出
async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "<p style='text-align:center; padding:20px; color:#86868b;'>読み込み中...</p>";
    
    try {
        const response = await fetch(API_URL);
        const logs = await response.json();
        
        if (!Array.isArray(logs)) throw new Error("Invalid format");

        let totalSec = 0, todaySec = 0, monthSec = 0;
        const now = new Date();
        const todayStr = now.toDateString();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        logList.innerHTML = "";
        
        // 1. まず全データの集計を行う（元の順番で）
        logs.forEach(log => {
            const p = log.duration.split(':');
            const sec = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            
            // 日付を確実にパース
            const lDate = new Date(log.timestamp);
            
            totalSec += sec;
            if (lDate.toDateString() === todayStr) todaySec += sec;
            if (lDate.getMonth() === currentMonth && lDate.getFullYear() === currentYear) monthSec += sec;
        });

        // 2. 表示用にコピーして反転、リスト生成
        [...logs].reverse().forEach(log => {
