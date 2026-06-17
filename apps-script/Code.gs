/**
 * BWE Tooth Record — Google Apps Script Web App
 * ───────────────────────────────────────────────
 * รับข้อมูลรายการบันทึก (Data Entry) จากหน้า Dashboard แล้ว "เพิ่มแถว" ลงในแท็บ `records`
 * ของ Google Sheet โดยอัตโนมัติ
 *
 * วิธีติดตั้งแบบย่อ (ดูละเอียดใน apps-script/README.md):
 *   1. เปิด Google Sheet ของคุณ → เมนู Extensions → Apps Script
 *   2. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดนี้แทน → บันทึก
 *   3. Deploy → New deployment → ประเภท "Web app"
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. คัดลอก Web app URL ที่ได้ ไปวางในไฟล์ index.html ที่ตัวแปร SHEET_CONFIG.writeUrl
 */

var SHEET_NAME = 'records';
var HEADERS = ['timestamp', 'id', 'date', 'machine', 'type', 'bucket', 'tooth', 'smu', 'issued', 'note'];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet_();
    sheet.appendRow([
      new Date(),
      data.id || '',
      data.date || '',
      data.machine || '',
      data.type || '',
      data.bucket || '',
      data.tooth || '',
      (data.smu == null ? '' : data.smu),
      data.issued || 0,
      data.note || ''
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// ทดสอบเปิดด้วยเบราว์เซอร์ได้ (ตรวจว่า Web App ทำงาน)
function doGet() {
  return json_({ ok: true, service: 'BWE Tooth Record writer', sheet: SHEET_NAME });
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
