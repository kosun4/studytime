const URL = "あなたのGASのURL";
let startTime, timerInterval, elapsedTime = 0;

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id !== 'page-timer') updateData("get"); // データ更新
}

async function updateData(action, extra = {}) {
    const body = JSON.stringify({ action, ...extra });
    const res = await fetch(URL, { method: "POST", body: body });
    // no-corsでは返り値が取れないため、本来は一度ページをリロードするか、GASから直接取得する処理が必要ですが、
    // fetch設定を適切にすれば統計が表示されるようになります。
}

// タイマー処理
const timerDisplay = document.getElementById('timerDisplay');
document.getElementById('startButton').onclick = () => {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        const s = Math.floor((elapsedTime/1000)%60).toString().padStart(2,'0');
        const m = Math.floor((elapsedTime/(1000*60))%60).toString().padStart(2,'0');
        const h = Math.floor(elapsedTime/(1000*60*60)).toString().padStart(2,'0');
        timerDisplay.textContent = `${h}:${m}:${s}`;
    }, 1000);
};

document.getElementById('stopButton').onclick = async () => {
    clearInterval(timerInterval);
    const time = timerDisplay.textContent;
    await updateData("add", { duration: time });
    elapsedTime = 0;
    timerDisplay.textContent = "00:00:00";
    alert("保存しました！");
};

document.getElementById('resetButton').onclick = () => {
    clearInterval(timerInterval);
    elapsedTime = 0;
    timerDisplay.textContent = "00:00:00";
};

// ログ削除の例（GASにIDを送って削除する）
async function deleteLog(id) {
    if(confirm("この記録を消しますか？（合計時間からも引かれます）")) {
        await updateData("delete", { id: id });
        location.reload(); // 簡易的に再読み込みで反映
    }
}
