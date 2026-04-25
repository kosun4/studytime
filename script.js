// ★あなたのGAS URLに貼り替えてください
const URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

let startTime, timerInterval, elapsedTime = 0;

// ページ切り替え
async function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.dock-item').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById(id.replace('page', 'nav')).classList.add('active');
    
    // 計測ページ以外ではデータを読み込む
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
    if (timerInterval) return; // すでに動いていたら何もしない
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        // HTML上の timerDisplay を更新
        document.getElementById('timerDisplay').textContent = formatTime(Math.floor(elapsedTime / 1000));
    }, 100);
}

// タイマー終了・保存
async function stopTimer() {
    if (elapsedTime < 1000) return; // 1秒未満は保存しない
    const finalTime = document.getElementById('timerDisplay').textContent;
    
    // タイマーをリセット
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    document.getElementById('timerDisplay').textContent = "00:00:00";

    // 保存中であることを伝える（簡易版）
    console.log("Saving...");

    try {
        // ★ここを修正しました（CORSエラー対策）
        await fetch(URL, {
            method: "POST",
            mode: "no-cors", // Google側への一方通行送信モード
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "add",
                duration: finalTime
            })
        });
        // no-corsモードでは成功したかどうかの判定がブラウザ側でできないため、
        // 送信できた前提でメッセージを出します。
        alert("学習記録を送信しました。\nスプレッドシートを確認してください。");
    } catch (e) {
        console.error(e);
        alert("通信エラーが発生しました。");
    }
}

// タイマーリセット
function resetTimer() {
    if(confirm("計測時間をリセットしますか？")) {
        clearInterval(timerInterval);
        timerInterval = null;
        elapsedTime = 0;
        document.getElementById('timerDisplay').textContent = "00:00:00";
    }
}

// データ取得・集計
async function fetchAndProcessData() {
    const logList = document.getElementById('logList');
    logList.innerHTML = "<p style='text-align:center; color:#86868b;'>読み込み中...</p>";
    
    try {
        const response = await fetch(URL);
        const rawLogs = await response.json();
        let total = 0, today = 0, month = 0;
        const now = new Date();
        const tStr = now.toLocaleDateString(); // 今日
        const mStr = now.getFullYear() + "/" + (now.getMonth() + 1); // 今月

        logList.innerHTML = "";
        
        // 新しい順に表示
        rawLogs.reverse().forEach(log => {
            let sec = 0;
            // 1899年バグ回避処理
            if (typeof log.duration === 'string' && log.duration.includes(':')) {
                const p = log.duration.split(':');
                sec = parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
            }

            total += sec;
            const lDate = new Date(log.timestamp);
            // 今日・今月の集計
            if (lDate.toLocaleDateString() === tStr) today += sec;
            if (lDate.getFullYear() + "/" + (lDate.getMonth() + 1) === mStr) month += sec;

            // ログカードの作成
            const div = document.createElement('div');
            div.className = 'glass-card';
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.alignItems = "center";
            div.innerHTML = `
                <div>
                    <small style="color:#86868b; font-size:11px;">${lDate.toLocaleString()}</small>
                    <div style="font-size:18px; font-weight:600;">${formatTime(sec)}</div>
                </div>
                <button onclick="deleteLog('${log.id}')" class="del-btn">削除</button>
            `;
            logList.appendChild(div);
        });

        // 統計情報の更新
        document.getElementById('statToday').textContent = formatTime(today);
        document.getElementById('statMonth').textContent = formatTime(month);
        document.getElementById('statTotal').textContent = formatTime(total);
        
    } catch (e) {
        console.error(e);
        logList.innerHTML = "<p style='text-align:center; color:#86868b;'>データの取得に失敗しました。<n>デプロイ設定を確認してください。</p>";
    }
}

// ログ削除
async function deleteLog(id) {
    if(!confirm("このログを削除しますか？\n（合計時間も減少します）")) return;
    try {
        // 削除は no-cors を使わない（結果を受け取るため）
        await fetch(URL, { method: "POST", body: JSON.stringify({ action: "delete", id: id }) });
        await fetchAndProcessData(); // データを再読み込み
    } catch(e) {
        alert("削除に失敗しました。");
    }
}
