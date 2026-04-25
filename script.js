const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

let startTime;
let timerInterval;
let elapsedTime = 0;

const timerDisplay = document.getElementById('timerDisplay');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

// タイマー開始
function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        const s = Math.floor((elapsedTime / 1000) % 60).toString().padStart(2, '0');
        const m = Math.floor((elapsedTime / (1000 * 60)) % 60).toString().padStart(2, '0');
        const h = Math.floor((elapsedTime / (1000 * 60 * 60))).toString().padStart(2, '0');
        timerDisplay.textContent = `${h}:${m}:${s}`;
    }, 1000);
    startButton.disabled = true;
}

// タイマー停止 ＆ スプレッドシートへ送信
async function stopTimer() {
    clearInterval(timerInterval);
    startButton.disabled = false;
    const durationText = timerDisplay.textContent;

    // GASにデータを送る
    try {
        await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "no-cors", // GAS連携の必須設定
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ duration: durationText })
        });
        alert("スプレッドシートに保存しました！");
    } catch (e) {
        console.error(e);
        alert("エラーが発生しました");
    }
}

// ボタンにクリックイベントを登録
startButton.addEventListener('click', startTimer);
stopButton.addEventListener('click', stopTimer);
