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

---

## 📋 โมดูล Production (แท็บ `production`)

หัวข้อ **11 ฟอร์มบันทึกการผลิตประจำวัน** — ใช้ **แท็บ `production` เป็นแหล่งข้อมูลหลัก** เช่นกัน
**1 แถวต่อ 1 วัน** (ไม่ใช่ event-based แบบ Downtime) — บันทึกซ้ำวันเดิมจะ *แก้ไขแถวเดิม* ให้อัตโนมัติ (upsert)

### ตั้งค่าครั้งเดียว

1. อัปเดต `Code.gs` เวอร์ชันล่าสุด (schema `production` มี `smu_b1`/`smu_b2` เพิ่มแล้ว) → Deploy เวอร์ชันใหม่ (ขั้นตอนเดียวกับ Downtime — ทุกครั้งที่ `Code.gs` เปลี่ยน ต้อง Deploy ใหม่เสมอ ไม่งั้นแท็บจะไม่อัปเดต)
2. Import [`sheet-template/production_seed.csv`](../sheet-template/production_seed.csv)
   (10 วันที่มีข้อมูลจริงจากไฟล์ Excel — ก.ย. 2568) → **Insert new sheet(s)** → เปลี่ยนชื่อแท็บเป็น **`production`**
   > ถ้าเคย import เวอร์ชันเก่า (17 คอลัมน์ ไม่มี smu_b1/smu_b2) ไว้แล้ว ให้ลบแท็บเดิมแล้ว import ใหม่ทับ (ข้อมูลแค่ 10 แถวตัวอย่าง ไม่เสียดาย)

### คอลัมน์แท็บ `production` (19 คอลัมน์)

```
date · by · blast_pattern · step_b1 · step_b2 · smu_b1 · smu_b2 ·
day_b1_lt · day_b1_vol · day_b2_lt · day_b2_vol · day_a9 · day_lost ·
night_b1_lt · night_b1_vol · night_b2_lt · night_b2_vol · night_a9 · night_lost
```

### เรื่อง SMU ที่เคยสับสน — แก้แล้ว

ก่อนหน้านี้ฟอร์มมีช่อง "SMU A9" ช่องเดียวที่ไม่ชัดว่าเป็น SMU ของอะไร ตรวจสอบกับไฟล์ Excel ต้นทาง (sheet `Plan Presentation`) แล้วพบว่าจริงๆ มี **2 ค่าคนละความหมาย**:

| | ที่มา | ตัวอย่าง (1 ก.ย. 68) |
|---|---|---|
| **SMU เครื่องจักร** (ตัว BWE เอง) | **กรอกเองจากมิเตอร์จริง** (`smu_b1`/`smu_b2`) — มีทศนิยม ไม่ต้องบวก Day+Night เอง เพราะบางทีมิเตอร์จริงไม่ตรงกับ Load Time ที่บันทึก | กรอกตามหน้าปัดเครื่อง เช่น 6.15 |
| **SMU สายพาน Line A9** | คำนวณอัตโนมัติ = A9 Day + Night (คนละอุปกรณ์กับตัวเครื่อง) | 1.26+6.42 = **7.68 ชม.** (ตรงกับคอลัมน์ "SMU : A9" ในไฟล์ต้นฉบับเป๊ะ) |

ฟอร์มโชว์ผลรวม Load Time (`Load Time รวม X ชม.`) เป็นตัวช่วยเทียบข้างๆ ช่อง SMU เครื่องจักรด้วย เผื่อค่าจากมิเตอร์ต่างจาก Load Time มากจะได้สังเกตเห็น — แต่ไม่บังคับให้ตรงกัน

### กันข้อมูลหาย ถ้า Sheet เขียนไม่ติด

ทั้ง Downtime และ Production เก็บสำเนาไว้ใน **localStorage ของเบราว์เซอร์** ทุกครั้งที่กดบันทึกด้วย (ไม่ได้พึ่ง Google Sheet อย่างเดียว) — ดังนั้นต่อให้ Apps Script ยังไม่ได้ deploy เวอร์ชันล่าสุด หรือชื่อแท็บผิด ข้อมูลที่กรอกจะยัง**ดูย้อนหลังได้ในเครื่องเดิม**เสมอ ไม่หายไปไหน (แต่จะไม่ sync ไปเครื่องอื่น/ไม่ backup จริงจนกว่าจะเชื่อม Sheet ได้สำเร็จ)

ฟอร์มใหม่เลยแยกเป็น **3 ช่องอัตโนมัติชัดเจน** ในกรอบ "สรุป SMU": `SMU เครื่องจักร BWE1` / `BWE2` / `SMU สายพาน Line A9` — คำนวณจากช่อง Load Time และ A9 ที่กรอกอยู่แล้ว ไม่ต้องกรอกซ้ำ
