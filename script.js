function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("シート1");
  
  // 送られてきた中身を解析
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch(err) {
    return createJsonResponse({result: "error", message: "JSON解析失敗"});
  }
  
  if (params.action === "add") {
    sheet.appendRow([
      "ID-" + Date.now(), 
      new Date(), 
      params.duration // ここに "00:00:03" が入る
    ]);
    return createJsonResponse({result: "success"});
  } 
  
  else if (params.action === "delete") {
    const data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === params.id) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return createJsonResponse({result: "success"});
  }
}

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("シート1");
  const values = sheet.getDataRange().getValues();
  const displays = sheet.getDataRange().getDisplayValues();
  const logs = [];
  for (var i = 1; i < displays.length; i++) {
    logs.push({id: displays[i][0], timestamp: values[i][1], duration: displays[i][2]});
  }
  return createJsonResponse(logs);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
