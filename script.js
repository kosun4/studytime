function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("シート1");
  const params = JSON.parse(e.postData.contents);
  const now = new Date();

  // 1. データの追加
  if (params.action === "add") {
    const id = Utilities.getUuid(); // 削除用に固有IDを作る
    sheet.appendRow([id, Utilities.formatDate(now, "JST", "yyyy/MM/dd HH:mm:ss"), params.duration]);
  } 
  // 2. データの削除
  else if (params.action === "delete") {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === params.id) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
  }

  // 3. 最新の統計とログを計算して返す
  const allData = sheet.getDataRange().getValues();
  let totalSec = 0, todaySec = 0;
  let logs = [];
  const todayStr = Utilities.formatDate(now, "JST", "yyyy/MM/dd");

  for (let i = 1; i < allData.length; i++) {
    const id = allData[i][0];
    const dateStr = Utilities.formatDate(new Date(allData[i][1]), "JST", "yyyy/MM/dd");
    const durationStr = allData[i][2];
    const sec = timeToSeconds(durationStr);

    totalSec += sec;
    if (dateStr === todayStr) todaySec += sec;

    logs.unshift({ id: id, date: allData[i][1], duration: durationStr }); // 新しい順
  }

  return ContentService.createTextOutput(JSON.stringify({
    today: secondsToTime(todaySec),
    total: secondsToTime(totalSec),
    logs: logs.slice(0, 20) // 最新20件
  })).setMimeType(ContentService.MimeType.JSON);
}

function timeToSeconds(t) {
  const p = t.split(':');
  return parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseInt(p[2]);
}

function secondsToTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}
