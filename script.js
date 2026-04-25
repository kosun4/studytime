// ★あなたのGAS URLをここに貼り付けてください
const API_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

let startTime, timerInterval, elapsedTime = 0;

/**
 * ページ切り替え処理
 */
async function showPage(id) {
    // 全ページとナビ項目からactiveクラスを削除
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.dock-item').forEach(t => t.classList.remove('active'));
    
    // 対象のページを表示
    const targetPage = document.getElementById(id);
    if (targetPage) targetPage.classList.add('active');
    
    // ナビボタンのハイライト
    const navId = 'nav-' + id.replace('page-', '');
    const navElem = document.getElementById(navId);
    if (navElem) navElem.classList.add('active');
    
    // 計測ページ以外（統計・ログ）を開いた時はデータを最新にする
    if (id !== 'page-timer') {
        await fetchAndProcessData();
    }
}

/**
 * 秒数を HH:mm:ss 形式に変換
 */
function formatTime(s) {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sc = Math.floor(s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sc}`;
}

/**
 * タイマー開始
 */
function startTimer() {
    if (timerInterval) return; // 二重起動防止
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        document.getElementById('timerDisplay').textContent = formatTime(Math.floor(elapsedTime / 1000));
    }, 100);
}

/**
 * タイマー終了 & 保存
 */
async function stopTimer() {
    if (elapsedTime < 1000) return; // 1秒未満は無視
    const finalTime = document.getElementById('timerDisplay').textContent;
    
    if (!confirm(`${finalTime} の学習を記録しますか？`)) return;

    // タイマーを止める
    clearInterval(timerInterval);
    timerInterval = null;

    try {
        // 保存中であることを示す（任意でローディング表示など）
        await fetch(API_URL, {
            method: "POST",
            mode: "cors", // GASが許可していればcorsでOK
            body: JSON.stringify({ action: "add", duration: finalTime })
        });
        
        // 保存成功したらリセット
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
        alert("学習記録を保存しました✨");
    } catch (e) {
        console.error(e);
        alert("保存に失敗しました。URLや通信環境を確認してください。");
    }
}

/**
 * タイマーリセット
 */
function resetTimer() {
    if(confirm("計測をリセットしますか？")) {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
    }
}

/**
 * データの取得と統計の計算
 */
async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "<p style='text-align:center; padding:20px; color:var(--text-sub);'>読み込み中...</p>";
    
    try {
        const response = await fetch(API_URL);
        const logs = await response.json();
        
        if (!Array.isArray(logs)) throw new Error("データ形式が正しくありません");

        let totalSec = 0, todaySec = 0, monthSec = 0;
        const now = new Date();
        const todayStr = now.toDateString();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        logList.innerHTML = "";
        
        // 1. 集計処理
        logs.forEach(log => {
            const p = log.duration.split(':');
            const sec = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            const lDate = new Date(log.timestamp);
            
            totalSec += sec;
            if (lDate.toDateString() === todayStr) todaySec += sec;
            if (lDate.getMonth() === currentMonth && lDate.getFullYear() === currentYear) monthSec += sec;
        });

        // 2. ログ一覧の表示 (新しい順に反転してループ)
        [...logs].reverse().forEach(log => {
            const lDate = new Date(log.timestamp);
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.style.marginBottom = '16px';
            
            card.innerHTML = `
                <div>
                    <small style="color:var(--text-sub); font-size:11px;">${lDate.toLocaleString('ja-JP')}</small>
                    <p style="font-size:22px; font-weight:600; margin:4px 0 0; color:var(--text-main);">${log.duration}</p>
                </div>
                <button onclick="deleteLog('${log.id}')" class="btn-del">削除</button>
            `;
            logList.appendChild(card);
        });

        // 3. 統計数値の反映
        document.getElementById('statToday').textContent = formatTime(todaySec);
        document.getElementById('statMonth').textContent = formatTime(monthSec);
        document.getElementById('statTotal').textContent = formatTime(totalSec);

    } catch (e) {
        console.error(e);
        logList.innerHTML = "<p style='text-align:center; color:#ff3b30;'>データの読み込みに失敗しました</p>";
    }
}

/**
 * ログの削除
 */
async function deleteLog(id) {
    if(!confirm("この記録を削除しますか？")) return;
    try {
        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "delete", id: id })
        });
        // 削除完了後に再描画
        await fetchAndProcessData();
    } catch(e) {
        console.error(e);
        alert("削除に失敗しました");
    }
}
