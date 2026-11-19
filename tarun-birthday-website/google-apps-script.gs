/*
  THE TARUN TIMES — Google Sheets receiver
  1. Create a Google Sheet.
  2. Extensions → Apps Script.
  3. Paste this entire file into Code.gs.
  4. Replace CHANGE_THIS_TO_A_LONG_RANDOM_SECRET with the same secret in config.js.
  5. Deploy → New deployment → Web app.
     Execute as: Me
     Who has access: Anyone
  6. Copy the Web App URL ending in /exec into config.js.

  Each completed interview is stored as one row in "Birthday Answers".
*/
const SHEET_NAME = "Birthday Answers";
const SHARED_SECRET = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET";

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (!data.token || data.token !== SHARED_SECRET) {
      return json_({ ok: false, error: "Unauthorized" });
    }
    if (!Array.isArray(data.questions) || !Array.isArray(data.answers) ||
        data.questions.length !== 27 || data.answers.length !== 27 ||
        data.answers.some(a => !String(a || "").trim())) {
      return json_({ ok: false, error: "All 27 answers are required." });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    const headers = ["Submitted At", "Respondent"].concat(
      data.questions.map((q, i) => "Q" + (i + 1) + ": " + q)
    );
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }

    const row = [
      data.submittedAt ? new Date(data.submittedAt) : new Date(),
      data.respondent || "Tarun Chandra"
    ].concat(data.answers.map(a => String(a)));
    sheet.appendRow(row);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setWrap(true);
    sheet.autoResizeColumn(1);
    sheet.autoResizeColumn(2);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: "The Tarun Times birthday keepsake receiver" });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
