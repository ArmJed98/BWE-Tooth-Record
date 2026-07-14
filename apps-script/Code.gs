/**
 * BWE Record — Google Apps Script Web App
 * ───────────────────────────────────────────────
 * ตัวกลางสำหรับ "เขียน" ข้อมูลจากหน้า Dashboard กลับเข้า Google Sheet
 * (เว็บ static เขียน Google Sheet ตรง ๆ ไม่ได้ ต้องผ่าน Web App นี้)
 *
 * รองรับ 2 ชนิดข้อมูล แยกตามฟิลด์ `kind` ใน payload:
 *   • kind ว่าง / 'tooth'   → บันทึกฟัน  ต่อท้ายแท็บ `records`  (append อย่างเดียว)
 *   • kind = 'downtime'      → บันทึก Downtime แท็บ `downtime`
 *        action = 'add'      → เพิ่มแถวใหม่
 *        action = 'update'   → แก้ไขแถวที่มี id ตรงกัน
 *        action = 'delete'   → ลบแถวที่มี id ตรงกัน
 *
 * ติดตั้ง: ดู apps-script/README.md (Deploy เป็น Web app · Execute as Me · Access: Anyone)
 * แก้โค้ดแล้วต้อง Deploy → Manage deployments → ✏️ → New version → Deploy (URL เดิมใช้ต่อได้)
 */

var TOOTH_SHEET   = 'records';
var TOOTH_HEADERS = ['timestamp', 'id', 'date', 'machine', 'type', 'bucket', 'tooth', 'smu', 'issued', 'note'];

var DT_SHEET   = 'downtime';
var DT_HEADERS = ['id','date','shift','machine','location','loctype','dept','category','description','start','end','duration_hr','freq'];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.kind === 'downtime') return handleDowntime_(data);
    return handleTooth_(data);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// ───────── Tooth records (append-only, พฤติกรรมเดิม) ─────────
function handleTooth_(data) {
  var sheet = getOrCreateSheet_(TOOTH_SHEET, TOOTH_HEADERS);
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
  return json_({ ok: true, kind: 'tooth' });
}

// ───────── Downtime (add / update / delete by id) ─────────
function handleDowntime_(data) {
  var sheet = getOrCreateSheet_(DT_SHEET, DT_HEADERS);
  var action = data.action || 'add';
  var row = data.row || {};

  if (action === 'add') {
    sheet.appendRow(DT_HEADERS.map(function (h) { return row[h] != null ? row[h] : ''; }));
    return json_({ ok: true, kind: 'downtime', action: 'add', id: row.id });
  }

  if (action === 'update' || action === 'delete') {
    var target = findRowById_(sheet, row.id);
    if (target < 0) return json_({ ok: false, error: 'id not found: ' + row.id });
    if (action === 'delete') {
      sheet.deleteRow(target);
      return json_({ ok: true, kind: 'downtime', action: 'delete', id: row.id });
    }
    sheet.getRange(target, 1, 1, DT_HEADERS.length)
         .setValues([DT_HEADERS.map(function (h) { return row[h] != null ? row[h] : ''; })]);
    return json_({ ok: true, kind: 'downtime', action: 'update', id: row.id });
  }

  return json_({ ok: false, error: 'unknown action: ' + action });
}

// หาเลขแถวจาก id (คอลัมน์ A) — คืน -1 ถ้าไม่พบ
function findRowById_(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2 || id == null) return -1;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

// เปิดด้วยเบราว์เซอร์เพื่อตรวจว่า Web App ทำงาน
function doGet() {
  return json_({ ok: true, service: 'BWE record writer', sheets: [TOOTH_SHEET, DT_SHEET] });
}

function getOrCreateSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
