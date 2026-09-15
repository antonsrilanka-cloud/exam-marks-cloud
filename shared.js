// ============================================================
// SHARED HELPERS — used by both admin.html and teacher.html
// ============================================================

export function esc(str){
  return (str||"").toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function uid(){ return 'id'+Math.random().toString(36).slice(2,10); }

// subjects: [{name, max}]  students: [{id,name,adm,marks:{subjectName:value},note}]
export function computeStats(subjects, students){
  const highest = {};
  subjects.forEach(s=>{
    let max = null;
    students.forEach(st=>{
      const v = st.marks ? st.marks[s.name] : undefined;
      if(v!==null && v!==undefined && v!=="" && !isNaN(v)){
        if(max===null || Number(v)>max) max = Number(v);
      }
    });
    highest[s.name] = max;
  });
  const rows = students.map(st=>{
    let total=0, count=0;
    subjects.forEach(s=>{
      const v = st.marks ? st.marks[s.name] : undefined;
      if(v!==null && v!==undefined && v!==""){ total += Number(v); count++; }
    });
    const avg = subjects.length>0 ? (total/subjects.length) : 0;
    return {...st, total, avg, count};
  });
  const sorted = [...rows].sort((a,b)=>b.total-a.total);
  let rank=0, prevTotal=null, seen=0;
  sorted.forEach(r=>{
    seen++;
    if(r.total!==prevTotal){ rank = seen; prevTotal = r.total; }
    r.rank = rank;
  });
  const rankMap = {};
  sorted.forEach(r=>rankMap[r.id]=r.rank);
  rows.forEach(r=>r.rank = rankMap[r.id]);
  return {highest, rows};
}

// ranges: [{min, max}]  — returns per-subject counts of students whose mark
// falls in each range, plus a "Total Sat" count per subject.
export function computeRangeAnalysis(subjects, students, ranges){
  const rows = (ranges||[]).map(r=>({
    min: r.min, max: r.max,
    label: `${String(r.min).padStart(2,'0')}-${String(r.max).padStart(2,'0')}`,
    counts: {}
  }));
  const totals = {};
  subjects.forEach(s=>{
    let total = 0;
    students.forEach(st=>{
      const v = st.marks ? st.marks[s.name] : undefined;
      if(v!==null && v!==undefined && v!==""){
        const num = Number(v);
        if(!isNaN(num)){
          total++;
          rows.forEach(row=>{
            if(num>=row.min && num<=row.max){
              row.counts[s.name] = (row.counts[s.name]||0) + 1;
            }
          });
        }
      }
    });
    totals[s.name] = total;
  });
  return {rows, totals};
}

function sheetHeaderHtml(school, extraLine){
  const logo = school.logo ? `<img src="${school.logo}">` : `🏫`;
  return `
    <div class="sheet-header">
      <div class="logo-box">${logo}</div>
      <div class="htext">
        <div class="sname">${esc(school.name)||"Your School Name"}</div>
        <div class="saddr">${esc(school.addr)||""}</div>
        <div class="sexam">${esc(school.exam)||"Term Examination"} ${school.year?("· "+esc(school.year)):""} ${extraLine?("· "+esc(extraLine)):""}</div>
      </div>
      <div class="logo-box rlogo" style="visibility:hidden;">${logo}</div>
    </div>`;
}

// Measures the actual rendered height of the school header (in px) and
// stores it as a CSS custom property, so the print stylesheet can push
// the table down by EXACTLY that much — instead of a fixed guess in mm,
// which was hiding rows behind the header when the guess ran a little
// short. Call this right before window.print() for a landscape sheet.
export function prepareLandscapePrintHeader(){
  const header = document.querySelector('.sheet-landscape .sheet-header');
  if(header){
    const heightPx = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--landscape-header-clear', (heightPx + 60) + 'px');
  }
}

export function renderClassSheetHtml(school, subjects, students, className, teacherName){
  const {highest, rows} = computeStats(subjects, students);
  const colspan = 3 + subjects.length + 3; // #, Name, Adm.No + subjects + Total, Average, Rank
  let columnRow = `<tr><th class="sn">#</th><th style="text-align:left;">Student Name</th><th>Adm.No</th>`;
  subjects.forEach(s=> columnRow += `<th>${esc(s.name)}</th>`);
  columnRow += `<th>Total</th><th>Average</th><th>Rank</th></tr>`;

  let tbody = rows.map((r,idx)=>{
    let row = `<tr><td class="sn">${idx+1}</td><td class="name">${esc(r.name)||"—"}</td><td>${esc(r.adm)||"—"}</td>`;
    subjects.forEach(s=>{
      const v = r.marks ? r.marks[s.name] : "";
      row += `<td>${v===""||v===undefined||v===null?"-":v}</td>`;
    });
    row += `<td class="total-col">${r.total}</td><td class="avg-col">${r.avg.toFixed(1)}</td><td class="rank-col ${r.rank===1?'rank1':''}">${r.rank}</td></tr>`;
    return row;
  }).join("");

  let tfoot = `<tr><td colspan="3" style="text-align:right;">Highest in Class →</td>`;
  subjects.forEach(s=> tfoot += `<td>${highest[s.name]===null?"-":highest[s.name]}</td>`);
  tfoot += `<td colspan="3"></td></tr>`;

  return `
    <div class="sheet-landscape">
      ${sheetHeaderHtml(school, className)}
      <table class="landscape-tbl">
        <thead>${columnRow}</thead>
        <tbody>${tbody || `<tr><td colspan="${colspan}" style="padding:20px;">No students yet</td></tr>`}</tbody>
        <tfoot>${tfoot}</tfoot>
      </table>
      <div class="sheet-footer">
        <span>Class: ${esc(className)||""} &nbsp;·&nbsp; Total Students: ${students.length}</span>
        <span>Generated: ${new Date().toLocaleDateString()}</span>
      </div>
      <div class="sig-line">
        <div>Class Teacher's Signature${teacherName? "<br><span style='font-size:10px;'>"+esc(teacherName)+"</span>":""}</div>
        <div>Principal's Signature${school.principal? "<br><span style='font-size:10px;'>"+esc(school.principal)+"</span>":""}</div>
      </div>
    </div>`;
}

export function individualReportHtml(school, subjects, row, highest, className){
  const logo = school.logo ? `<img src="${school.logo}">` : `🏫`;
  let tbody = subjects.map(s=>{
    const v = row.marks ? row.marks[s.name] : "";
    const mark = (v===""||v===undefined||v===null) ? "-" : v;
    const hi = highest[s.name]===null||highest[s.name]===undefined ? "-" : highest[s.name];
    return `<tr><td class="sname">${esc(s.name)}</td><td><b>${mark}</b></td><td class="hi-col">${hi}</td><td>${s.max}</td></tr>`;
  }).join("");

  return `
    <div class="sheet-portrait">
      <div class="p-header">
        <div class="logo-box">${logo}</div>
        <div class="htext">
          <div class="sname">${esc(school.name)||"Your School Name"}</div>
          <div class="saddr">${esc(school.addr)||""}</div>
          <div class="sexam">${esc(school.exam)||"Term Examination"} ${school.year?("· "+esc(school.year)):""}</div>
        </div>
        <div class="logo-box rlogo" style="visibility:hidden;">${logo}</div>
      </div>

      <div class="student-meta">
        <div><span class="k">Student Name</span><span class="v">${esc(row.name)||"—"}</span></div>
        <div><span class="k">Admission No.</span><span class="v">${esc(row.adm)||"—"}</span></div>
        <div><span class="k">Class</span><span class="v">${esc(className)||"—"}</span></div>
        <div><span class="k">Rank in Class</span><span class="v">${row.rank}</span></div>
      </div>

      <table class="report-tbl">
        <thead><tr><th style="text-align:left;">Subject</th><th>Marks Obtained</th><th>Highest in Class</th><th>Max Marks</th></tr></thead>
        <tbody>${tbody}</tbody>
        <tfoot><tr><td>Total</td><td colspan="3">${row.total} / ${subjects.reduce((a,s)=>a+Number(s.max),0)}</td></tr></tfoot>
      </table>

      <div class="summary-row">
        <div class="summary-box"><div class="lbl">Total Marks</div><div class="val">${row.total}</div></div>
        <div class="summary-box"><div class="lbl">Average</div><div class="val">${row.avg.toFixed(1)}</div></div>
        <div class="summary-box rank"><div class="lbl">Class Rank</div><div class="val">${row.rank}</div></div>
      </div>

      <div class="remarks-box"><b>Class Teacher's Special Note:</b><br>${row.note ? esc(row.note).replace(/\n/g,'<br>') : "&nbsp;"}</div>

      <div class="sig-row">
        <div>Class Teacher's Signature</div>
        <div>Parent / Guardian's Signature</div>
        <div>Principal's Signature${school.principal? "<br><span style='font-size:10px;'>"+esc(school.principal)+"</span>":""}</div>
      </div>

      <div class="p-footer">${esc(school.name)||"School"} · ${esc(school.exam)||"Term Examination"} ${school.year?("· "+esc(school.year)):""} · Generated ${new Date().toLocaleDateString()}</div>
    </div>`;
}

export function renderAnalysisHtml(school, subjects, students, ranges, className, teacherName){
  const {rows, totals} = computeRangeAnalysis(subjects, students, ranges);
  const colspan = 1 + subjects.length;
  let columnRow = `<tr><th style="text-align:left;">Marks Range</th>`;
  subjects.forEach(s=> columnRow += `<th>${esc(s.name)}</th>`);
  columnRow += `</tr>`;

  let tbody = rows.map(row=>{
    let r = `<tr><td class="name">${esc(row.label)}</td>`;
    subjects.forEach(s=>{
      r += `<td>${String(row.counts[s.name]||0).padStart(2,'0')}</td>`;
    });
    r += `</tr>`;
    return r;
  }).join("");

  let tfoot = `<tr><td style="text-align:left;">Total Sat</td>`;
  subjects.forEach(s=> tfoot += `<td>${totals[s.name]||0}</td>`);
  tfoot += `</tr>`;

  return `
    <div class="sheet-landscape">
      ${sheetHeaderHtml(school, className)}
      <table class="landscape-tbl">
        <thead>${columnRow}</thead>
        <tbody>${tbody || `<tr><td colspan="${colspan}" style="padding:20px;">No mark ranges set up yet</td></tr>`}</tbody>
        <tfoot>${tfoot}</tfoot>
      </table>
      <div class="sheet-footer">
        <span>Class: ${esc(className)||""} &nbsp;·&nbsp; Marks Analysis Report &nbsp;·&nbsp; Total Students: ${students.length}</span>
        <span>Generated: ${new Date().toLocaleDateString()}</span>
      </div>
      <div class="sig-line">
        <div>Class Teacher's Signature${teacherName? "<br><span style='font-size:10px;'>"+esc(teacherName)+"</span>":""}</div>
        <div>Principal's Signature${school.principal? "<br><span style='font-size:10px;'>"+esc(school.principal)+"</span>":""}</div>
      </div>
    </div>`;
}

export function setPageSize(size){
  let styleEl = document.getElementById('page-size-style');
  if(!styleEl){
    styleEl = document.createElement('style');
    styleEl.id = 'page-size-style';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `@media print { @page { size: A4 ${size}; margin: 0; } body{margin:0;} }`;
}

export async function downloadPdf(el, filename, orientation){
  const target = el.querySelector('.sheet-portrait, .sheet-landscape') || el;
  const pageWidthMm = orientation === 'landscape' ? 297 : 210;
  const canvas = await window.html2canvas(target, { scale:2, useCORS:true });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pageHeightMm = (canvas.height / canvas.width) * pageWidthMm;

  const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  const pdf = new jsPDFCtor({ unit:'mm', format:[pageWidthMm, pageHeightMm], orientation });
  pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm);
  pdf.save(filename);
}

// Combines two landscape sheets (the class marksheet, then the analysis
// report) into ONE downloaded PDF — the marksheet as page 1, the analysis
// report as page 2, each sized to fit its own content exactly. Since each
// page is captured and placed independently, this doesn't run into any
// of the native browser-print pagination issues that landscape sheets can
// hit when they span multiple physical A4 pages.
export async function downloadCombinedLandscapePdf(firstEl, secondEl, filename){
  const target1 = firstEl.querySelector('.sheet-landscape') || firstEl;
  const target2 = secondEl.querySelector('.sheet-landscape') || secondEl;
  const pageWidthMm = 297;

  const canvas1 = await window.html2canvas(target1, { scale:2, useCORS:true });
  const height1Mm = (canvas1.height / canvas1.width) * pageWidthMm;

  const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  const pdf = new jsPDFCtor({ unit:'mm', format:[pageWidthMm, height1Mm], orientation:'landscape' });
  pdf.addImage(canvas1.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, pageWidthMm, height1Mm);

  const canvas2 = await window.html2canvas(target2, { scale:2, useCORS:true });
  const height2Mm = (canvas2.height / canvas2.width) * pageWidthMm;
  pdf.addPage([pageWidthMm, height2Mm], 'landscape');
  pdf.addImage(canvas2.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, pageWidthMm, height2Mm);

  pdf.save(filename);
}

