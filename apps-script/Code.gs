/**
 * BWE Record — Google Apps Script Web App
 * ───────────────────────────────────────────────
 * ตัวกลางสำหรับ "เขียน" ข้อมูลจากหน้า Dashboard กลับเข้า Google Sheet
 * (เว็บ static เขียน Google Sheet ตรง ๆ ไม่ได้ ต้องผ่าน Web App นี้)
 *
 * รองรับ 3 ชนิดข้อมูล แยกตามฟิลด์ `kind` ใน payload:
 *   • kind ว่าง / 'tooth'   → บันทึกฟัน  ต่อท้ายแท็บ `records`  (append อย่างเดียว)
 *   • kind = 'downtime'      → บันทึก Downtime แท็บ `downtime` (event-based, 1 แถว/เหตุการณ์)
 *        action = 'add'      → เพิ่มแถวใหม่
 *        action = 'update'   → แก้ไขแถวที่มี id ตรงกัน
 *        action = 'delete'   → ลบแถวที่มี id ตรงกัน
 *   • kind = 'production'    → บันทึกการผลิต แท็บ `production` (1 แถว/วัน — key คือ date)
 *        action = 'add'/'update' → upsert แถวของวันนั้น (มีอยู่แล้ว = แก้, ยังไม่มี = เพิ่ม)
 *        action = 'delete'   → ลบแถวของวันที่ระบุ
 *
 * ติดตั้ง: ดู apps-script/README.md (Deploy เป็น Web app · Execute as Me · Access: Anyone)
 * แก้โค้ดแล้วต้อง Deploy → Manage deployments → ✏️ → New version → Deploy (URL เดิมใช้ต่อได้)
 */

var TOOTH_SHEET   = 'records';
var TOOTH_HEADERS = ['timestamp', 'id', 'date', 'machine', 'type', 'bucket', 'tooth', 'smu', 'issued', 'note'];

var DT_SHEET   = 'downtime';
var DT_HEADERS = ['id','date','shift','machine','location','loctype','dept','category','description','start','end','duration_hr','freq'];

// การผลิต: 1 แถวต่อวัน (key = date) · smu_b1/smu_b2 = SMU เครื่องจักรกรอกจากมิเตอร์จริง (อาจไม่ตรงกับ Load Time) · SMU Line A9 = day_a9 + night_a9 (คำนวณฝั่ง Dashboard)
var PR_SHEET   = 'production';
var PR_HEADERS = ['date','by','blast_pattern','step_b1','step_b2','smu_b1','smu_b2',
  'day_b1_lt','day_b1_vol','day_b2_lt','day_b2_vol','day_a9','day_lost',
  'night_b1_lt','night_b1_vol','night_b2_lt','night_b2_vol','night_a9','night_lost'];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.kind === 'downtime') return handleDowntime_(data);
    if (data.kind === 'production') return handleProduction_(data);
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

// ───────── Production (upsert by date; 1 แถวต่อวัน) ─────────
function handleProduction_(data) {
  var sheet = getOrCreateSheet_(PR_SHEET, PR_HEADERS);
  var action = data.action || 'add';
  var row = data.row || {};
  if (!row.date) return json_({ ok: false, error: 'missing date' });

  if (action === 'delete') {
    var target = findRowByCol1_(sheet, row.date);
    if (target < 0) return json_({ ok: false, error: 'date not found: ' + row.date });
    sheet.deleteRow(target);
    return json_({ ok: true, kind: 'production', action: 'delete', date: row.date });
  }

  // add / update ทั้งคู่คือ upsert ตามวันที่ (กันข้อมูลซ้ำถ้ากดบันทึกวันเดิมสองรอบ)
  var values = PR_HEADERS.map(function (h) { return row[h] != null ? row[h] : ''; });
  var existing = findRowByCol1_(sheet, row.date);
  if (existing < 0) {
    sheet.appendRow(values);
  } else {
    sheet.getRange(existing, 1, 1, PR_HEADERS.length).setValues([values]);
  }
  return json_({ ok: true, kind: 'production', action: existing < 0 ? 'add' : 'update', date: row.date });
}

// หาเลขแถวจาก id (คอลัมน์ A) — คืน -1 ถ้าไม่พบ
function findRowById_(sheet, id) {
  return findRowByCol1_(sheet, id);
}

// หาเลขแถวจากค่าคอลัมน์ A (ใช้ร่วมกันได้ทั้ง id ของ downtime และ date ของ production) — คืน -1 ถ้าไม่พบ
function findRowByCol1_(sheet, key) {
  var last = sheet.getLastRow();
  if (last < 2 || key == null) return -1;
  var keys = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i][0]) === String(key)) return i + 2;
  }
  return -1;
}

// เปิดด้วยเบราว์เซอร์เพื่อตรวจว่า Web App ทำงาน
function doGet() {
  return json_({ ok: true, service: 'BWE record writer', sheets: [TOOTH_SHEET, DT_SHEET, PR_SHEET] });
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
