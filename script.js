// あなたのGASウェブアプリURL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby3pv5UxD6FwT3vv2g2HY_WRp8_QIYIp0ecVSC6U0fvHw0lDOJ8IPj_18P34DVCwdkc/exec";

// データをGASに送る関数（終了ボタンを押した時に実行されるようにします）
async function sendDataToGAS(subject, duration) {
    const data = {
        subject: subject,
        duration: duration,
        note: "アプリからの送信"
    };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "no-cors", // GASへの送信でよく使われる設定です
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        
        alert("学習記録を保存しました！");
    } catch (error) {
        console.error("Error:", error);
        alert("保存に失敗しました。");
    }
}

// あとは、終了ボタンのイベントリスナーの中で 
// sendDataToGAS("数学", "00:30:00"); 
// のように呼び出せばOKです。
