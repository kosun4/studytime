/**
 * データの保存 (POST)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // 10秒間のロックを取得（同時書き込みによるデータ破損防止）
    lock.waitLock(10000);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("シート1");
    if (!sheet) throw new Error("シートが見つかりません");

    let params;
    try {
      params = JSON.parse(e.postData.contents);
    } catch(err) {
      return createJsonResponse({result: "error", message: "JSON解析失敗"});
    }

    // --- 追加処理 ---
    if (params.action === "add") {
      const id = "ID-" + Utilities.getUuid().split("-")[0];
      const now = new Date();
      
      sheet.appendRow([id, now, params.duration]);

      // スプレッドシート側で「時間」として認識させる
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 3).setNumberFormat("HH:mm:ss");

      return createJsonResponse({result: "success", id: id});
    } 

    // --- 削除処理 ---
    else if (params.action === "delete") {
      const data = sheet.getDataRange().getDisplayValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][0] === params.id) {
          sheet.deleteRow(i + 1);
          return createJsonResponse({result: "success"});
        }
      }
      return createJsonResponse({result: "error", message: "ID未検出"});
    }

    return createJsonResponse({result: "error", message: "無効なアクション"});

  } catch (err) {
    return createJsonResponse({result: "error", message: err.toString()});
  } finally {
    lock.releaseLock();
  }
}

/**
 * データの取得 (GET)
 */
function doGet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("シート1");
    if (!sheet) return createJsonResponse([]);
    
    const values = sheet.getDataRange().getValues();
    const displays = sheet.getDataRange().getDisplayValues();
    const logs = [];

    for (var i = 1; i < displays.length; i++) {
      logs.push({
        id: displays[i][0], 
        timestamp: values[i][1], // Dateオブジェクトのまま送信
        duration: displays[i][2]  // "00:00:00"形式
      });
    }
    return createJsonResponse(logs);
  } catch (e) {
    return createJsonResponse({result: "error", message: e.toString()});
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
