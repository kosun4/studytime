const WEB_APP_URL = "あなたのGASのURL";

let startTime, timerInterval, elapsedTime = 0;
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startButton');

function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateDisplay(elapsedTime);
    }, 1000);
    startBtn.disabled = true;
}

function updateDisplay(time) {
    const s = Math.floor((time / 1000) % 60).toString().padStart(2, '0');
    const m = Math.floor((time / (1000 * 60)) % 60).toString().padStart(2, '0');
    const h = Math.floor((time / (1000 * 60 * 60))).toString().padStart(2, '0');
    timerDisplay.textContent = `${h}:${m}:${s}`;
}

async function stopTimer() {
    clearInterval(timerInterval);
    const durationText = timerDisplay.textContent;
    
    // データ送信
    const response = await fetch(WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify({ duration: durationText })
    });
    
    // リセット処理
    resetTimer();
    
    // 統計の更新（GASから返ってきたデータを入れる）
    // ※no-corsだとレスポンスが取れないため、今回は送信のみ。反映は次回リロード時か、fetch設定変更が必要
    alert("保存してリセットしました！");
}

function resetTimer() {
    clearInterval(timerInterval);
    elapsedTime = 0;
    timerDisplay.textContent = "00:00:00";
    startBtn.disabled = false;
}

document.getElementById('startButton').addEventListener('click', startTimer);
document.getElementById('stopButton').addEventListener('click', stopTimer);
document.getElementById('resetButton').addEventListener('click', resetTimer);
