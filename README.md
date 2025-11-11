
# โครงการ BKK ULQ – รายเขต (ไม่มีงบ / ใช้เครื่องมือฟรี)

สแตกฟรีและยั่งยืน:
- Google Forms → ให้ประชาชนกรอกแบบ
- Google Sheets → เก็บคำตอบ
- Google Apps Script → คำนวณคะแนน 0–1 และสรุปราย **เขต**
- Google Sheets (Publish to the web → CSV) → ลิงก์ข้อมูลสาธารณะ
- GitHub Pages → โฮสต์เว็บ static ฟรี (ไฟล์ในโฟลเดอร์นี้)

## ทำตามทีละขั้น

### 1) สร้าง Google Form
- ใช้ `form_questions.txt` (30 ข้อ) → ตั้งชื่อ Q1..Q30 (Linear scale 1→5)
- เพิ่มคำถาม Dropdown **เขต** (DISTRICT) – รายชื่อ 50 เขต
- เชื่อมฟอร์มกับ Google Sheet (Responses → ไอคอนสีเขียว)

### 2) วาง Apps Script
- เปิดชีต → Extensions → Apps Script
- วางโค้ดจาก `apps_script_district.gs`
- กด Run ฟังก์ชัน `setupHeaders()` 1 ครั้ง (สร้างชีต `Normalized` และ `Aggregated`)

### 3) สร้าง Trigger
- ใน Apps Script → Triggers (ไอคอนนาฬิกา)
- **From spreadsheet – On form submit** ให้เรียก `onFormSubmit`
- เพิ่มอีกตัว **Time-driven** (ทุกชั่วโมง) เรียก `recomputeAll`

### 4) เผยแพร่ชีต Aggregated เป็น CSV
- ที่ Google Sheet → เปิดชีต `Aggregated`
- File → Share → Publish to the web → เลือกเฉพาะชีต `Aggregated` และชนิด **CSV**
- คัดลอก URL ที่ได้ (ลงท้ายด้วย `output=csv`)

### 5) เปิดเว็บ (ไฟล์นี้)
- อัปโหลดไฟล์ทั้งหมดไปยัง GitHub repo (Public)
- เปิด Settings → Pages → Deploy from branch (main / root)
- เปิดลิงก์เว็บ แล้วแปะ URL CSV ในกล่อง → กด **โหลดข้อมูล**

> ถ้าเปิดไฟล์ `index.html` จากเครื่อง (เริ่มด้วย `file:///`) แล้วขึ้น **Failed to fetch**
> ให้แก้โดย **โฮสต์บน GitHub Pages** ก่อน เพราะบางครั้งเบราว์เซอร์บล็อก request จาก file://

### โครงสร้าง CSV ที่เว็บต้องการ
```
DISTRICT,SCORE,INTERVAL
บางรัก,0.72,ดี
...
```
- `SCORE` ปัด 2 ตำแหน่ง อยู่ในช่วง 0–1
- `INTERVAL` แบ่ง 5 ระดับ: แย่มาก/แย่/ปานกลาง/ดี/ดีมาก

### สูตรคำนวณ 0–1
- จากคำตอบ 1–5: เอาค่าเฉลี่ย `avg15`
- แปลง 0–1 = `(avg15 - 1) / 4`
- ปัดทศนิยม 2 ตำแหน่ง
- จัดช่วงชั้น:
  - 0.00–0.20 แย่มาก
  - >0.20–0.40 แย่
  - >0.40–0.60 ปานกลาง
  - >0.60–0.80 ดี
  - >0.80–1.00 ดีมาก
