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

---

## 🛠️ โมดูล Downtime (แท็บ `downtime`)

หน้า Dashboard หัวข้อ **09 วิเคราะห์เวลาหยุดเครื่องจักร** และ **10 ฟอร์มบันทึก Downtime**
ใช้ **Google Sheet แท็บ `downtime` เป็นแหล่งข้อมูลหลัก** (อ่านสด + เขียนกลับ เพิ่ม/แก้/ลบได้ครบ)

### ตั้งค่าครั้งเดียว

1. **อัปเดต `Code.gs`** เป็นเวอร์ชันล่าสุดในโฟลเดอร์นี้ (รองรับทั้งฟันและ Downtime) แล้ว Deploy เวอร์ชันใหม่
2. **สร้างแท็บ + ใส่ข้อมูลตั้งต้น** ด้วยไฟล์ [`sheet-template/downtime_seed.csv`](../sheet-template/downtime_seed.csv)
   (1,716 เหตุการณ์ พ.ค.–15 ก.ย. 2568 จากไฟล์ Excel ที่ล้างข้อมูลแล้ว):
   - เปิด Google Sheet → **File → Import → Upload** เลือกไฟล์ `downtime_seed.csv`
   - **Import location**: *Insert new sheet(s)*  · **Separator**: *Detect automatically* → **Import**
   - เปลี่ยนชื่อแท็บที่ได้เป็น **`downtime`** (ตัวเล็กทั้งหมด · ตรงกับที่โค้ดอ่าน)
3. เปิด Dashboard → หัวข้อ Downtime จะแสดงข้อมูลจากแท็บนี้แบบ real-time

### คอลัมน์แท็บ `downtime` (13 คอลัมน์)

```
id · date · shift · machine · location · loctype · dept · category · description · start · end · duration_hr · freq
```

- `loctype` = จัดกลุ่มตำแหน่งอัตโนมัติ: `machine` (BWE1/BWE2) · `line` (สายพาน A1–A11) · `spreader` (SPD.A)
- `id` = รหัสอ้างอิงรายการ (เช่น `d20250501-01`) — ฟอร์มสร้างให้อัตโนมัติ ใช้ตอนแก้/ลบ **ห้ามแก้ค่านี้เอง**
- ตัด `filling index` (คอลัมน์ O ในไฟล์ต้นทาง) ออกแล้วตามที่ต้องการ

### ฟอร์มทำงานยังไง
- **＋ บันทึกเหตุการณ์** → `action:add` เพิ่มแถวใหม่ (id สร้างอัตโนมัติ)
- **✎ แก้ไข** แต่ละแถว → `action:update` แก้แถวที่ `id` ตรงกัน
- **✕ ลบ** → `action:delete` ลบแถวที่ `id` ตรงกัน
- คำนวณ `duration_hr` และ `loctype` ให้อัตโนมัติจากเวลาเริ่ม/สิ้นสุด และตำแหน่ง

> หน้าจออัปเดตทันที (optimistic) และรีเฟรชข้อมูลจริงจาก Sheet ทุก 5 นาที
> ถ้ายังไม่ตั้งค่าแท็บ ฟอร์มยังกรอกได้ (เขียนเข้า Sheet เมื่อเชื่อมแล้ว) และกราฟหัวข้อ 09 ใช้ยอดสรุปสำรองจาก `forms-history.js`
