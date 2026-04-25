function doPost(e) { 
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0];
    
    const data = JSON.parse(e.postData.contents);
    Logger.log(data);

    if (data.action === "add") {
      sheet.appendRow([
        new Date(), 
        data.duration
      ]);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log(err);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
