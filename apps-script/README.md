# บันทึกข้อมูลจาก Dashboard กลับเข้า Google Sheet (Apps Script)

หน้า Dashboard อ่านข้อมูลจาก Google Sheet ได้อยู่แล้ว (ผ่าน gviz)
แต่การ **เขียน/บันทึก** กลับเข้า Sheet ต้องใช้ตัวกลางคือ **Google Apps Script Web App**
(เพราะเว็บ static เขียน Google Sheet ตรง ๆ ไม่ได้)

ทำตาม 5 ขั้นตอนนี้ครั้งเดียว ใช้เวลา ~2 นาที

---

## ขั้นตอนติดตั้ง

### 1) เปิด Apps Script
- เปิด **Google Sheet** ของคุณ (ไฟล์เดียวกับที่ Dashboard ดึงข้อมูล)
- เมนูบนสุด → **Extensions** → **Apps Script**

### 2) วางโค้ด
- ลบโค้ดเดิมในไฟล์ `Code.gs` ทั้งหมด
- คัดลอกเนื้อหาจากไฟล์ [`Code.gs`](Code.gs) ในโฟลเดอร์นี้ ไปวางแทน
- กด **บันทึก** (ไอคอนแผ่นดิสก์ หรือ Ctrl+S)

### 3) Deploy เป็น Web App
- มุมขวาบน → **Deploy** → **New deployment**
- กดรูปเฟือง ⚙️ ข้าง "Select type" → เลือก **Web app**
- ตั้งค่า:
  - **Description**: `BWE writer` (อะไรก็ได้)
  - **Execute as**: **Me** (อีเมลคุณ)
  - **Who has access**: **Anyone**  ← สำคัญ ต้องเป็น Anyone
- กด **Deploy**

### 4) อนุญาตสิทธิ์
- ครั้งแรกจะขออนุญาตเข้าถึง Sheet → กด **Authorize access**
- เลือกบัญชี Google ของคุณ → ถ้าขึ้น "Google hasn't verified this app"
  ให้กด **Advanced** → **Go to (ชื่อโปรเจกต์) (unsafe)** → **Allow**
  (ปลอดภัย เพราะเป็นสคริปต์ของคุณเอง)

### 5) คัดลอก URL ไปใส่ใน Dashboard
- หลัง Deploy จะได้ **Web app URL** หน้าตาประมาณ:
  ```
  https://script.google.com/macros/s/AKfycb..................../exec
  ```
- เปิดไฟล์ `index.html` → ค้นหา `writeUrl` แล้วใส่ URL นี้:
  ```js
  const SHEET_CONFIG = {
    ...
    writeUrl: 'https://script.google.com/macros/s/AKfycb..../exec',  // ← วางตรงนี้
    ...
  };
  ```
- Commit/บันทึก แล้ว push ขึ้น GitHub

---

## เสร็จแล้วใช้งานยังไง

1. เข้า Dashboard → หน้า **บันทึกข้อมูล** → กรอกฟอร์ม → กด **＋ บันทึกรายการ**
2. ข้อมูลจะถูก:
   - เก็บในเครื่อง (เหมือนเดิม) — ใช้สรุปในหน้า "สรุปรายวัน"
   - **ส่งเข้า Google Sheet แท็บ `records`** อัตโนมัติ (เพิ่มทีละแถว)
3. มุมขวาบนของฟอร์มจะแจ้งสถานะ `ส่งเข้า Google Sheet แล้ว ✓`

> แท็บ `records` จะถูกสร้างให้อัตโนมัติครั้งแรกที่มีการบันทึก
> คอลัมน์: `timestamp · id · date · machine · type · bucket · tooth · smu · issued · note`

---

## ทดสอบว่า Web App ทำงาน

เปิด Web app URL ในเบราว์เซอร์ ควรเห็นข้อความ JSON:
```json
{"ok":true,"service":"BWE Tooth Record writer","sheet":"records"}
```

## แก้ไขโค้ดภายหลัง
ถ้าแก้ `Code.gs` ต้อง **Deploy → Manage deployments → ✏️ (แก้ไข) → Version: New version → Deploy**
(URL เดิมจะใช้ได้ต่อ ไม่ต้องเปลี่ยนใน index.html)
