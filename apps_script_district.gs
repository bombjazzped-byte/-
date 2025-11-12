/**
 * BKK ULQ – Mapping Sheet Version (ไม่ต้องแก้หัวคอลัมน์เป็น Q1..Q30)
 * Sheets:
 *  - 'Form Responses 1' = คำตอบจากฟอร์ม
 *  - 'Mapping'          = ตาราง CODE ↔ HEADER_TH
 *  - 'Normalized'       = ค่า 0–1 ต่อแถว
 *  - 'Aggregated'       = ค่าเฉลี่ยราย DISTRICT + ช่วงชั้น
 */

const FORM_SHEET = 'Form Responses 1';
const MAPPING_SHEET = 'Mapping';
const NORMALIZED_SHEET = 'Normalized';
const AGG_SHEET = 'Aggregated';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('BKK-ULQ')
    .addItem('1) สร้างชีต Normalized/Aggregated', 'setupHeaders')
    .addItem('2) คำนวณใหม่ทั้งหมด', 'recomputeAll')
    .addToUi();
}

function setupHeaders() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(NORMALIZED_SHEET)) ss.insertSheet(NORMALIZED_SHEET);
  if (!ss.getSheetByName(AGG_SHEET)) ss.insertSheet(AGG_SHEET);
  const ns = ss.getSheetByName(NORMALIZED_SHEET);
  const as = ss.getSheetByName(AGG_SHEET);
  ns.clear(); ns.appendRow(['Timestamp','DISTRICT','RAW_AVG_1_5','SCORE_0_1']);
  as.clear(); as.appendRow(['DISTRICT','SCORE','INTERVAL']);
}

/** อ่าน Mapping: คืน { DISTRICT: 'เขต', Q1: 'หัวภาษาไทยข้อ1', ... } */
function readMapping() {
  const sh = SpreadsheetApp.getActive().getSheetByName(MAPPING_SHEET);
  if (!sh) throw new Error('ไม่พบชีต "Mapping"');
  const values = sh.getDataRange().getValues();
  const header = values[0];
  const idxCode = header.indexOf('CODE');
  const idxHead = header.indexOf('HEADER_TH');
  if (idxCode === -1 || idxHead === -1) {
    throw new Error('ชีต Mapping ต้องมีคอลัมน์ CODE และ HEADER_TH');
  }
  const map = {};
  for (let i=1; i<values.length; i++) {
    const code = String(values[i][idxCode] || '').trim();
    const head = String(values[i][idxHead] || '').trim();
    if (code && head) map[code] = head;
  }
  // ตรวจขั้นต่ำ
  if (!map['DISTRICT']) throw new Error('ใน Mapping ต้องระบุแถว DISTRICT ด้วย HEADER_TH = ชื่อคอลัมน์เขต (เช่น "เขต")');
  for (let i=1;i<=30;i++){
    if (!map['Q'+i]) throw new Error('ใน Mapping ยังขาด Q'+i+' → โปรดใส่ HEADER_TH ให้ครบ');
  }
  return map;
}

/** Trigger: From spreadsheet – On form submit */
function onFormSubmit(e) {
  const map = readMapping();
  if (!e || !e.namedValues) return;
  const row = e.namedValues; // keyed by original Thai headers

  // อ่าน DISTRICT
  const districtHeader = map['DISTRICT'];
  const district = (row[districtHeader] || [''])[0];

  // อ่าน Q1..Q30 แบบอิงหัวภาษาไทยจาก Mapping
  let scores = [];
  for (let i=1;i<=30;i++){
    const h = map['Q'+i];
    const val = row[h] ? Number(row[h][0]) : NaN;
    if (!isNaN(val)) scores.push(val);
  }
  if (!scores.length) return;

  // Normalize 0–1
  const avg15 = scores.reduce((a,b)=>a+b,0)/scores.length;
  const score01 = Math.max(0, Math.min(1, (avg15 - 1) / 4));
  const rounded = Math.round(score01*100)/100;

  const ns = SpreadsheetApp.getActive().getSheetByName(NORMALIZED_SHEET);
  ns.appendRow([new Date(), district, avg15, rounded]);

  recomputeAll(); // อัปเดตสรุปรายเขตทุกครั้งที่มีคำตอบใหม่
}

function recomputeAll() {
  const ss = SpreadsheetApp.getActive();
  const ns = ss.getSheetByName(NORMALIZED_SHEET) || ss.insertSheet(NORMALIZED_SHEET);
  const as = ss.getSheetByName(AGG_SHEET) || ss.insertSheet(AGG_SHEET);

  const data = ns.getDataRange().getValues();
  if (data.length <= 1) return;
  const header = data[0];
  const idxD = header.indexOf('DISTRICT');
  const idxS = header.indexOf('SCORE_0_1');

  // รวมค่าเฉลี่ยรายเขต
  const byD = {};
  for (let i=1; i<data.length; i++){
    const row = data[i];
    const d = row[idxD];
    const s = row[idxS];
    if (d === '' || s === '') continue;
    if (!byD[d]) byD[d]=[];
    byD[d].push(Number(s));
  }

  const out = [['DISTRICT','SCORE','INTERVAL']];
  for (const d in byD){
    const avg = byD[d].reduce((a,b)=>a+b,0)/byD[d].length;
    const score = Math.round(avg*100)/100;
    out.push([d, score, toInterval(score)]);
  }
  as.clear();
  as.getRange(1,1,out.length,out[0].length).setValues(out);
}

function toInterval(v){
  if (v <= 0.20) return 'แย่มาก';
  if (v <= 0.40) return 'แย่';
  if (v <= 0.60) return 'ปานกลาง';
  if (v <= 0.80) return 'ดี';
  return 'ดีมาก';
}
