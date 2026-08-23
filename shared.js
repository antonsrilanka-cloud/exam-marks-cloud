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

export function renderClassSheetHtml(school, subjects, students, className){
  const {highest, rows} = computeStats(subjects, students);
  let thead = `<tr><th class="sn">#</th><th style="text-align:left;">Student Name</th><th>Adm.No</th>`;
  subjects.forEach(s=> thead += `<th>${esc(s.name)}</th>`);
  thead += `<th>Total</th><th>Average</th><th>Rank</th></tr>`;

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
        <thead>${thead}</thead>
        <tbody>${tbody || `<tr><td colspan="${3+subjects.length+3}" style="padding:20px;">No students yet</td></tr>`}</tbody>
        <tfoot>${tfoot}</tfoot>
      </table>
      <div class="sheet-footer">
        <span>Class: ${esc(className)||""} &nbsp;·&nbsp; Total Students: ${students.length}</span>
        <span>Generated: ${new Date().toLocaleDateString()}</span>
      </div>
      <div class="sig-line">
        <div>Class Teacher's Signature</div>
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

export function setPageSize(size){
  let styleEl = document.getElementById('page-size-style');
  if(!styleEl){
    styleEl = document.createElement('style');
    styleEl.id = 'page-size-style';
    document.head.appendChild(styleEl);
  }
  // The report sheets are already built to exact A4 dimensions with their own
  // internal spacing baked in (see .sheet-portrait / .sheet-landscape). Adding
  // any extra @page margin here on top of that pushes the content past one
  // physical page, which is what was causing the page-setup problem.
  styleEl.textContent = `@media print { @page { size: A4 ${size}; margin: 0; } body{margin:0;} }`;
}

export function downloadPdf(el, filename, orientation){
  // Rather than forcing a strict A4 height and letting any overflow spill
  // onto an awkward, near-empty second page, measure the sheet's actual
  // rendered size and build the PDF page to match it exactly. This
  // guarantees a single-sheet report or marksheet always comes out as one
  // clean page, regardless of small rendering differences between browsers.
  const pageWidthMm = orientation === 'landscape' ? 297 : 210;
  const rect = el.getBoundingClientRect();
  const pxPerMm = rect.width / pageWidthMm;
  const pageHeightMm = Math.round((rect.height / pxPerMm) * 100) / 100;

  const opt = {
    margin: 0,
    filename,
    image:{ type:'jpeg', quality:0.98 },
    html2canvas:{ scale:2, useCORS:true },
    jsPDF:{ unit:'mm', format:[pageWidthMm, pageHeightMm], orientation }
  };
  return window.html2pdf().set(opt).from(el).save();
}
