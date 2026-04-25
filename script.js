async function stopTimer() {
    if (elapsedTime < 1000) return;
    const timeStr = document.getElementById('timerDisplay').textContent;
    
    if (!confirm("保存しますか？")) return;

    clearInterval(timerInterval);
    timerInterval = null;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                action: "add", 
                duration: timeStr 
            })
        });

        const text = await res.text();
        console.log(text);

        alert("送信成功");
    } catch (err) {
        console.error(err);
        alert("送信失敗");
    }

    elapsedTime = 0;
    document.getElementById('timerDisplay').textContent = "00:00:00";
}
