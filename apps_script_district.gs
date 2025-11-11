/**
 * Google Apps Script – BKK ULQ by District (0–1)
 * Sheets ที่ต้องมี:
 * - 'Form Responses 1' (ตอบแบบสอบถาม)
 * - 'Normalized' (ค่าคะแนน 0–1 ต่อแถว)
 * - 'Aggregated' (ค่าเฉลี่ยราย DISTRICT พร้อมช่วงชั้น)
 *
 * ตั้งชื่อคอลัมน์:
 * - 'DISTRICT' = เขต
 * - Q1..Q30 = คำถาม 30 ข้อ (1–5)
 */

const FORM_SHEET = 'Form Responses 1';
const NORMALIZED_SHEET = 'Normalized';
const AGG_SHEET = 'Aggregated';

const DISTRICT_COL_NAME = 'DISTRICT';
const QUESTION_PREFIX = 'Q'; // Q1..Q30

function setupHeaders() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(NORMALIZED_SHEET)) ss.insertSheet(NORMALIZED_SHEET);
  if (!ss.getSheetByName(AGG_SHEET)) ss.insertSheet(AGG_SHEET);
  const ns = ss.getSheetByName(NORMALIZED_SHEET);
  const as = ss.getSheetByName(AGG_SHEET);
  ns.clear(); ns.appendRow(['Timestamp','DISTRICT','RAW_AVG_1_5','SCORE_0_1']);
  as.clear(); as.appendRow(['DISTRICT','SCORE','INTERVAL']);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('BKK-ULQ')
    .addItem('รีเซ็ตหัวตาราง', 'setupHeaders')
    .addItem('คำนวณใหม่ทั้งหมด', 'recomputeAll')
    .addToUi();
}

// Trigger: From spreadsheet – On form submit
function onFormSubmit(e) {
  if (!e || !e.namedValues) return;
  const row = e.namedValues;
  const district = (row[DISTRICT_COL_NAME] || [''])[0];
  let scores = [];
  for (let i=1;i<=30;i++){
    const key = QUESTION_PREFIX + i;
    const val = row[key] ? Number(row[key][0]) : NaN;
    if (!isNaN(val)) scores.push(val);
  }
  if (!scores.length) return;
  const avg15 = scores.reduce((a,b)=>a+b,0)/scores.length;
  const score01 = Math.max(0, Math.min(1, (avg15 - 1) / 4));
  const rounded = Math.round(score01*100)/100;

  const ns = SpreadsheetApp.getActive().getSheetByName(NORMALIZED_SHEET);
  ns.appendRow([new Date(), district, avg15, rounded]);
  recomputeAll();
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
