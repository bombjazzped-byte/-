const intervals=[
  {label:'แย่มาก',min:0.00,max:0.20,color:'#d73027'},
  {label:'แย่',min:0.20,max:0.40,color:'#fc8d59'},
  {label:'ปานกลาง',min:0.40,max:0.60,color:'#fee08b',text:'#111'},
  {label:'ดี',min:0.60,max:0.80,color:'#91cf60'},
  {label:'ดีมาก',min:0.80,max:1.01,color:'#1a9850'}
];
function findInterval(v){for(const itv of intervals){if(v>=itv.min && v<itv.max) return itv;}return intervals[0];}
function formatScore(v){if(v==null || Number.isNaN(v)) return '-'; return Number(v).toFixed(2);}

function csvToArray(text){
  const rows=text.trim().split(/\r?\n/);
  const header=rows.shift().split(',').map(h=>h.trim());
  return rows.map(line=>{
    const parts=line.split(',').map(s=>s.trim());
    const o={}; header.forEach((h,i)=>o[h]=parts[i]); return o;
  });
}
async function loadCSV(url){
  const res=await fetch(url);
  if(!res.ok) throw new Error('HTTP '+res.status);
  const text=await res.text();
  return csvToArray(text);
}

function renderLegend(){
  const ul=document.getElementById('legend');
  ul.innerHTML='';
  intervals.forEach(itv=>{
    const li=document.createElement('li');
    const txtColor=itv.text || '#fff';
    li.innerHTML=`<span class="badge" style="background:${itv.color};color:${txtColor};width:70px;display:inline-block;text-align:center">${itv.label}</span>
    <span style="margin-left:8px">${itv.min.toFixed(2)}–${(itv.max-0.01).toFixed(2)}</span>`;
    ul.appendChild(li);
  });
}

let bar;
function renderTableAndChart(rows){
  rows.sort((a,b)=> Number(b.SCORE)-Number(a.SCORE));
  const tbody=document.querySelector('#scoreTable tbody'); tbody.innerHTML='';
  const labels=[], data=[], colors=[];
  rows.forEach(r=>{
    const score=Number(r.SCORE||0); const itv=findInterval(score);
    labels.push(r.DISTRICT||'-'); data.push(Number(score.toFixed(2))); colors.push(itv.color);
    const tr=document.createElement('tr');
    const txtColor=itv.text || '#fff';
    tr.innerHTML=`<td>${r.DISTRICT||'-'}</td><td>${formatScore(score)}</td><td><span class="badge" style="background:${itv.color};color:${txtColor}">${itv.label}</span></td>`;
    tbody.appendChild(tr);
  });
  const ctx=document.getElementById('barChart').getContext('2d');
  if(bar) bar.destroy();
  bar=new Chart(ctx,{
    type:'bar',
    data:{labels, datasets:[{label:'คะแนน (0–1)', data, backgroundColor:colors}]},
    options:{responsive:true, scales:{y:{beginAtZero:true, max:1}}}
  });
}

async function refresh(url){
  try{
    const rows=await loadCSV(url);
    renderTableAndChart(rows);
  }catch(e){
    alert('โหลดข้อมูลไม่สำเร็จ: '+e.message+'\nตรวจสอบว่าเป็นลิงก์ Publish to the web (CSV) ของชีต Aggregated หรือไม่');
    console.error(e);
  }
}

document.getElementById('loadBtn').addEventListener('click',()=>{
  const url=document.getElementById('csvUrl').value.trim();
  if(!url) return alert('กรุณาวาง URL CSV');
  refresh(url);
});

renderLegend();
// demo
refresh('data-sample.csv');
