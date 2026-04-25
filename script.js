// 1. GASのURL設定
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

// 2. 変数の設定（HTMLのID名に合わせる必要があります）
let startTime;
let timerInterval;
let elapsedTime = 0;

const timerDisplay = document.getElementById('timerDisplay') || document.querySelector('.timer'); // タイマー表示部分
const startButton = document.getElementById('startButton'); // 開始ボタン
const stopButton = document.getElementById('stopButton');   // 終了ボタン

// 3. タイマー開始関数
function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateDisplay(elapsedTime);
    }, 1000);
    
    if(startButton) startButton.disabled = true;
}

// 4. タイマー停止＆データ送信関数
function stopTimer() {
    clearInterval(timerInterval);
    if(startButton) startButton.disabled = false;

    // 現在の表示時間を取得
    const durationText = timerDisplay.textContent;

    // ★ここでスプレッドシートに送信！
    sendDataToGAS(durationText);
}

// 5. 表示を更新する関数
function updateDisplay(time) {
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor((time / (1000 * 60 * 60)));

    const display = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if(timerDisplay) timerDisplay.textContent = display;
}

// 6. GASにデータを飛ばす魔法の関数
async function sendDataToGAS(durationText) {
    console.log("送信中...", durationText);
    try {
        await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                duration: durationText
            })
        });
        alert("スプレッドシートに保存しました！");
    } catch (error) {
        console.error("送信エラー:", error);
        alert("保存に失敗しました。");
    }
}

// 7. ボタンにクリックイベントを登録
if(startButton) startButton.addEventListener('click', startTimer);
if(stopButton) stopButton.addEventListener('click', stopTimer);
