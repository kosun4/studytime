const API_URL = "ここにGASのexec URL";

let startTime, timerInterval, elapsedTime = 0;

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
        document.getElementById('timerDisplay').textContent =
            formatTime(Math.floor(elapsedTime / 1000));
    }, 100);
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    document.getElementById('timerDisplay').textContent = "00:00:00";
}

async function stopTimer() {
    if (elapsedTime < 1000) return;

    const timeStr = document.getElementById('timerDisplay').textContent;

    if (!confirm("保存しますか？")) return;

    clearInterval(timerInterval);
    timerInterval = null;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "add",
                duration: timeStr
            })
        });

        const data = await res.json();
        console.log(data);

        if (data.status === "ok") {
            alert("保存成功！");
        } else {
            alert("保存失敗：" + data.message);
        }

    } catch (err) {
        console.error(err);
        alert("通信エラー");
    }

    elapsedTime = 0;
    document.getElementById('timerDisplay').textContent = "00:00:00";
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
}
