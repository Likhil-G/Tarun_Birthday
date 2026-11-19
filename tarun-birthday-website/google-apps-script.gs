/**
 * THE TARUN TIMES — GOOGLE SHEETS KEEPSAKE RECEIVER & API
 * 
 * Target Sheet Name: "Birthday Answers"
 * Each completed interview generates exactly 27 individual rows with columns:
 * 1. Submission_ID
 * 2. Respondent_Name
 * 3. Submitted_At
 * 4. Question_Number
 * 5. Question
 * 6. Answer
 * 
 * Deployment Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions -> Apps Script.
 * 3. Replace all code in Code.gs with this file.
 * 4. Deploy -> New deployment -> Web app:
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone  <-- CRITICAL: Must be "Anyone", NOT "Only myself"
 * 5. Copy the Web App URL (/exec) into .env as GOOGLE_APPS_SCRIPT_URL.
 */

const SHEET_NAME = "Birthday Answers";
// Passphrase must match SHARED_SECRET in .env
const SHARED_SECRET = "oTuIh$Fx3N&B5*GLNr4MU0QDZmuNFf6mgr0!tEAghN*f4kUi";

const HEADERS = [
  "Submission_ID",
  "Respondent_Name",
  "Submitted_At",
  "Question_Number",
  "Question",
  "Answer"
];

/**
 * Handle POST requests (Save 27 Questions & Answers)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 30 seconds for concurrent requests
  const hasLock = lock.tryLock(30000);
  if (!hasLock) {
    return jsonResponse_({
      ok: false,
      error: "Server busy. Could not acquire lock, please try again."
    }, 429);
  }

  try {
    // 1. Parse incoming payload
    var payload;
    try {
      var rawContent = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
      if (!rawContent && e && e.parameter && e.parameter.payload) {
        rawContent = e.parameter.payload;
      }
      payload = JSON.parse(rawContent || "{}");
    } catch (parseErr) {
      return jsonResponse_({
        ok: false,
        error: "Malformed JSON payload: " + parseErr.message
      }, 400);
    }

    // 2. Validate Authentication Token
    var token = payload.token || (e && e.parameter && e.parameter.token);
    if (!token || token !== SHARED_SECRET) {
      return jsonResponse_({
        ok: false,
        error: "Unauthorized: Invalid or missing authentication token."
      }, 401);
    }

    // 3. Validate Questions and Answers
    if (!Array.isArray(payload.questions) || payload.questions.length !== 27) {
      return jsonResponse_({
        ok: false,
        error: "Validation error: Exactly 27 questions are required. Received: " + (payload.questions ? payload.questions.length : 0)
      }, 400);
    }

    if (!Array.isArray(payload.answers) || payload.answers.length !== 27) {
      return jsonResponse_({
        ok: false,
        error: "Validation error: Exactly 27 answers are required. Received: " + (payload.answers ? payload.answers.length : 0)
      }, 400);
    }

    // 4. Reject empty or whitespace-only answers
    for (var i = 0; i < 27; i++) {
      var ans = String(payload.answers[i] || "").trim();
      if (!ans) {
        return jsonResponse_({
          ok: false,
          error: "Validation error: Question " + (i + 1) + " ('" + payload.questions[i] + "') has an empty answer. All 27 answers are required."
        }, 400);
      }
    }

    // 5. Generate or use unique Submission_ID
    var now = new Date();
    var submissionId = payload.submissionId || (
      "TT-" + Utilities.formatDate(now, "UTC", "yyyyMMdd-HHmmss") + "-" + Utilities.getUuid().slice(0, 8)
    );
    var respondent = String(payload.respondent || "Tarun Chandra").trim();
    var submittedAt = payload.submittedAt || now.toISOString();

    // 6. Access or Create Sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#F6E5E5");
      headerRange.setFontColor("#873B4B");
      sheet.setFrozenRows(1);
    }

    // 7. Prepare 27 individual rows
    var rowsToInsert = [];
    for (var q = 0; q < 27; q++) {
      rowsToInsert.push([
        submissionId,
        respondent,
        submittedAt,
        q + 1,
        String(payload.questions[q] || "").trim(),
        String(payload.answers[q] || "").trim()
      ]);
    }

    // 8. Batch write all 27 rows atomically
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rowsToInsert.length, 6).setValues(rowsToInsert);
    SpreadsheetApp.flush(); // Force immediate write

    // 9. Verify write was successful
    var endRow = sheet.getLastRow();
    if (endRow < startRow + 26) {
      throw new Error("Write verification failed: Expected 27 rows to be written, but last row is " + endRow);
    }

    // Auto-fit columns 1 to 4 for clean presentation
    try {
      sheet.autoResizeColumn(1);
      sheet.autoResizeColumn(2);
      sheet.autoResizeColumn(3);
      sheet.autoResizeColumn(4);
    } catch (ignore) {}

    // Return structured success response
    return jsonResponse_({
      ok: true,
      submissionId: submissionId,
      respondent: respondent,
      submittedAt: submittedAt,
      rowsWritten: 27,
      startRow: startRow,
      endRow: endRow,
      message: "Successfully stored all 27 question-answer records in '" + SHEET_NAME + "'."
    });

  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: "Internal Server Error: " + err.toString()
    }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle GET requests (Health Check, Verification, and Record Reading)
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || "ping";

    // 1. Health check (ping)
    if (action === "ping") {
      return jsonResponse_({
        ok: true,
        service: "The Tarun Times Keepsake Receiver",
        status: "online",
        sheetName: SHEET_NAME,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Verification of a specific submission
    if (action === "verify") {
      var subId = params.submissionId;
      var token = params.token;
      if (!token || token !== SHARED_SECRET) {
        return jsonResponse_({ ok: false, error: "Unauthorized" }, 401);
      }
      if (!subId) {
        return jsonResponse_({ ok: false, error: "Missing submissionId" }, 400);
      }

      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet || sheet.getLastRow() <= 1) {
        return jsonResponse_({ ok: true, found: false, count: 0, rows: [] });
      }

      var data = sheet.getDataRange().getValues();
      var matches = [];
      for (var r = 1; r < data.length; r++) {
        if (data[r][0] === subId) {
          matches.push({
            rowNumber: r + 1,
            submissionId: data[r][0],
            respondent: data[r][1],
            submittedAt: data[r][2],
            questionNumber: data[r][3],
            question: data[r][4],
            answer: data[r][5]
          });
        }
      }

      return jsonResponse_({
        ok: true,
        found: matches.length > 0,
        count: matches.length,
        expectedCount: 27,
        isComplete: matches.length === 27,
        submissionId: subId,
        records: matches
      });
    }

    // 3. Count total records
    if (action === "stats") {
      var token = params.token;
      if (!token || token !== SHARED_SECRET) {
        return jsonResponse_({ ok: false, error: "Unauthorized" }, 401);
      }

      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(SHEET_NAME);
      var totalRows = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
      return jsonResponse_({
        ok: true,
        sheetName: SHEET_NAME,
        totalRows: totalRows,
        totalInterviews: Math.floor(totalRows / 27)
      });
    }

    return jsonResponse_({
      ok: false,
      error: "Unknown action: " + action
    }, 400);

  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: "GET Error: " + err.toString()
    }, 500);
  }
}

/**
 * Helper to build JSON output with CORS support
 */
function jsonResponse_(obj, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
