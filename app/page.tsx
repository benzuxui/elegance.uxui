"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Project = {
  id: number;
  name: string;
  startDate: string;
  duration: number;
  color: string;
};

const DAY = 86_400_000;
const FIRST_SPRINT_NUMBER = 20;
const COLORS = ["#EDCEC5", "#C9DDE0", "#D9E8C6", "#E5D7EE", "#F3DFAD", "#F2C8B6"];
const THAI_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const starterProjects: Project[] = [
  { id: 1, name: "Saas CL: Gold Trading System V. 1.0.0", startDate: "2026-08-17", duration: 5, color: COLORS[0] },
  { id: 2, name: "Ausiris Silver", startDate: "2026-08-17", duration: 3, color: COLORS[1] },
  { id: 3, name: "Marketing x ABAC V 1.0.0", startDate: "2026-08-20", duration: 1, color: COLORS[2] },
];

function fromISO(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dayDiff(from: Date, to: Date) {
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / DAY);
}

function formatShortDate(date: Date) {
  return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]}`;
}

function formatRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${start.getDate()}–${end.getDate()} ${THAI_MONTHS[end.getMonth()]} ${end.getFullYear() + 543}`
    : `${formatShortDate(start)} – ${formatShortDate(end)} ${end.getFullYear() + 543}`;
}

function concatBytes(parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function pdfFromJpeg(jpegDataUrl: string, width: number, height: number) {
  const encoder = new TextEncoder();
  const imageBinary = atob(jpegDataUrl.split(",")[1]);
  const image = new Uint8Array(Array.from(imageBinary, (character) => character.charCodeAt(0)));
  const text = (value: string) => encoder.encode(value);
  const object = (id: number, chunks: Uint8Array[]) => concatBytes([text(`${id} 0 obj\n`), ...chunks, text("\nendobj\n")]);
  const content = text(`q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ`);
  const objects = [
    object(1, [text("<< /Type /Catalog /Pages 2 0 R >>")]),
    object(2, [text("<< /Type /Pages /Kids [3 0 R] /Count 1 >>")]),
    object(3, [text(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`)]),
    object(4, [text(`<< /Length ${content.length} >>\nstream\n`), content, text("\nendstream")]),
    object(5, [text(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`), image, text("\nendstream")]),
  ];
  const header = text("%PDF-1.4\n");
  const offsets: number[] = [];
  let position = header.length;
  objects.forEach((entry) => { offsets.push(position); position += entry.length; });
  const xref = text(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${position}\n%%EOF`);
  return concatBytes([header, ...objects, xref]);
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

export default function Home() {
  const [planningStart, setPlanningStart] = useState("2026-08-17");
  const [activeSprint, setActiveSprint] = useState(0);
  const [projects, setProjects] = useState<Project[]>(starterProjects);
  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [targetSprint, setTargetSprint] = useState<"current" | "next">("current");
  const [projectStart, setProjectStart] = useState("2026-08-17");
  const [duration, setDuration] = useState(14);
  const [ready, setReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const sprintStart = useMemo(
    () => addDays(fromISO(planningStart), activeSprint * 14),
    [planningStart, activeSprint],
  );
  const sprintEnd = useMemo(() => addDays(sprintStart, 13), [sprintStart]);
  const nextSprintStart = useMemo(() => addDays(sprintStart, 14), [sprintStart]);
  const nextSprintEnd = useMemo(() => addDays(nextSprintStart, 13), [nextSprintStart]);
  const dates = useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(sprintStart, index)), [sprintStart]);
  const formSprintStart = targetSprint === "current" ? sprintStart : nextSprintStart;
  const formSprintEnd = targetSprint === "current" ? sprintEnd : nextSprintEnd;

  useEffect(() => {
    const saved = window.localStorage.getItem("sprintline-sprint-board-v2");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPlanningStart(data.planningStart ?? "2026-08-17");
        setProjects(data.projects ?? starterProjects);
      } catch {
        // Use the illustrated starter board when local data is unavailable.
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem("sprintline-sprint-board-v2", JSON.stringify({ planningStart, projects }));
  }, [planningStart, projects, ready]);

  useEffect(() => {
    setProjectStart(toISO(formSprintStart));
  }, [targetSprint, activeSprint, planningStart, formSprintStart]);

  const visibleProjects = useMemo(() => projects.filter((project) => {
    const start = fromISO(project.startDate);
    const end = addDays(start, project.duration - 1);
    return start <= sprintEnd && end >= sprintStart;
  }), [projects, sprintStart, sprintEnd]);

  function openAddProject() {
    setTargetSprint("current");
    setProjectStart(toISO(sprintStart));
    setDuration(14);
    setProjectName("");
    setShowForm(true);
  }

  function addProject(event: FormEvent) {
    event.preventDefault();
    const name = projectName.trim();
    if (!name) return;
    const start = fromISO(projectStart);
    if (start < formSprintStart || start > formSprintEnd) return;
    setProjects((current) => [
      ...current,
      {
        id: Date.now(),
        name,
        startDate: projectStart,
        duration,
        color: COLORS[current.length % COLORS.length],
      },
    ]);
    setShowForm(false);
  }

  function downloadSprintPdf() {
    setIsExporting(true);
    window.setTimeout(() => {
      const width = 1600;
      const height = 900;
      const margin = 54;
      const tableWidth = width - margin * 2;
      const projectColumn = 420;
      const dayWidth = (tableWidth - projectColumn) / 14;
      const tableTop = 194;
      const weekHeight = 56;
      const dateHeight = 76;
      const rowTop = tableTop + weekHeight + dateHeight;
      const rowHeight = Math.max(46, Math.min(78, (height - rowTop - 72) / Math.max(visibleProjects.length, 3)));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) { setIsExporting(false); return; }

      const font = "Arial, 'Noto Sans Thai', sans-serif";
      const projectText = (name: string) => {
        context.font = `600 ${Math.min(19, rowHeight * .3)}px ${font}`;
        let value = name;
        while (context.measureText(value).width > projectColumn - 82 && value.length > 2) value = `${value.slice(0, -2)}…`;
        return value;
      };
      const durationText = (days: number) => days < 7 ? `${days} วัน` : days === 7 ? "1 สัปดาห์" : days === 21 ? "1.5 Sprint" : `${days / 14} Sprint`;

      context.fillStyle = "#fffaf8";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#c87e72";
      context.font = `800 22px ${font}`;
      context.letterSpacing = "2px";
      context.fillText(`SPRINT ${String(FIRST_SPRINT_NUMBER + activeSprint).padStart(2, "0")}`, margin, 67);
      context.letterSpacing = "0px";
      context.fillStyle = "#3d3634";
      context.font = `700 38px ${font}`;
      context.fillText(formatRange(sprintStart, sprintEnd), margin, 113);
      context.fillStyle = "#887a75";
      context.font = `500 18px ${font}`;
      context.fillText("Craftline · ตารางแผนงาน 2 สัปดาห์", margin, 146);

      roundedRect(context, margin, tableTop, tableWidth, weekHeight + dateHeight + rowHeight * Math.max(visibleProjects.length, 1), 18);
      context.fillStyle = "#ffffff";
      context.fill();
      context.strokeStyle = "#eadbd5";
      context.lineWidth = 1;
      context.stroke();

      context.fillStyle = "#fff8f6";
      context.fillRect(margin, tableTop, projectColumn, weekHeight + dateHeight);
      context.fillStyle = "#f8e3de";
      context.fillRect(margin + projectColumn, tableTop, dayWidth * 7, weekHeight);
      context.fillStyle = "#eee6f4";
      context.fillRect(margin + projectColumn + dayWidth * 7, tableTop, dayWidth * 7, weekHeight);
      context.strokeStyle = "#eadbd5";
      context.beginPath();
      context.moveTo(margin + projectColumn, tableTop);
      context.lineTo(margin + projectColumn, tableTop + weekHeight + dateHeight + rowHeight * Math.max(visibleProjects.length, 1));
      context.moveTo(margin, tableTop + weekHeight);
      context.lineTo(margin + tableWidth, tableTop + weekHeight);
      context.moveTo(margin, tableTop + weekHeight + dateHeight);
      context.lineTo(margin + tableWidth, tableTop + weekHeight + dateHeight);
      context.stroke();

      context.fillStyle = "#5b4d49";
      context.font = `700 18px ${font}`;
      context.fillText("โปรเจกต์", margin + 22, tableTop + 34);
      context.font = `700 23px ${font}`;
      context.textAlign = "center";
      context.fillText("สัปดาห์ 1", margin + projectColumn + dayWidth * 3.5, tableTop + 35);
      context.fillText("สัปดาห์ 2", margin + projectColumn + dayWidth * 10.5, tableTop + 35);

      dates.forEach((date, index) => {
        const x = margin + projectColumn + dayWidth * index;
        context.strokeStyle = index === 7 ? "#dfc7bf" : "#f0e2dd";
        context.beginPath();
        context.moveTo(x, tableTop + weekHeight);
        context.lineTo(x, tableTop + weekHeight + dateHeight + rowHeight * Math.max(visibleProjects.length, 1));
        context.stroke();
        context.fillStyle = "#faebe6";
        roundedRect(context, x + dayWidth / 2 - 18, tableTop + weekHeight + 13, 36, 22, 11);
        context.fill();
        context.fillStyle = "#927c76";
        context.font = `700 13px ${font}`;
        context.fillText(THAI_DAYS[date.getDay()], x + dayWidth / 2, tableTop + weekHeight + 29);
        context.fillStyle = "#4b3f3c";
        context.font = `700 25px ${font}`;
        context.fillText(String(date.getDate()), x + dayWidth / 2, tableTop + weekHeight + 62);
      });
      context.textAlign = "left";

      visibleProjects.forEach((project, projectIndex) => {
        const y = rowTop + projectIndex * rowHeight;
        const start = fromISO(project.startDate);
        const end = addDays(start, project.duration - 1);
        const visibleStart = start < sprintStart ? sprintStart : start;
        const visibleEnd = end > sprintEnd ? sprintEnd : end;
        const startDay = dayDiff(sprintStart, visibleStart);
        const endDay = dayDiff(sprintStart, visibleEnd);
        context.strokeStyle = "#f0e2dd";
        context.beginPath();
        context.moveTo(margin, y + rowHeight);
        context.lineTo(margin + tableWidth, y + rowHeight);
        context.stroke();
        context.fillStyle = project.color;
        context.beginPath();
        context.arc(margin + 27, y + rowHeight / 2, 7, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#514440";
        context.font = `600 ${Math.min(19, rowHeight * .3)}px ${font}`;
        context.fillText(projectText(project.name), margin + 46, y + rowHeight / 2 + 7);
        const barX = margin + projectColumn + startDay * dayWidth + 6;
        const barWidth = Math.max(44, (endDay - startDay + 1) * dayWidth - 12);
        const barHeight = Math.min(42, rowHeight - 20);
        roundedRect(context, barX, y + (rowHeight - barHeight) / 2, barWidth, barHeight, 11);
        context.fillStyle = project.color;
        context.fill();
        context.fillStyle = "#5c4641";
        context.font = `800 14px ${font}`;
        context.fillText(durationText(project.duration), barX + 12, y + rowHeight / 2 + 5);
      });
      if (visibleProjects.length === 0) {
        context.fillStyle = "#887a75";
        context.font = `500 18px ${font}`;
        context.textAlign = "center";
        context.fillText("ยังไม่มีโปรเจกต์ใน Sprint นี้", margin + tableWidth / 2, rowTop + rowHeight / 2 + 7);
        context.textAlign = "left";
      }
      context.fillStyle = "#887a75";
      context.font = `500 14px ${font}`;
      context.fillText("Exported from Craftline", margin, height - 36);

      const pdf = pdfFromJpeg(canvas.toDataURL("image/jpeg", .94), width, height);
      const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `sprint-${FIRST_SPRINT_NUMBER + activeSprint}-${toISO(sprintStart)}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setIsExporting(false);
    }, 0);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Craftline หน้าหลัก">
          <span>Craftline</span>
        </a>
        <div className="top-actions">
          <span className="save-status"><i /> บันทึกอัตโนมัติ</span>
          <button className="primary-button" onClick={openAddProject}><span aria-hidden="true">＋</span> เพิ่มโปรเจกต์</button>
        </div>
      </header>

      <section className="intro-panel hero-art" id="top" aria-label="พื้นที่วางแผนงานออกแบบ Craftline">
        <img src="hero-design.svg?v=4" alt="ภาพประกอบพื้นที่ทำงาน UX/UI ที่มี wireframe, user flow และหน้าจอออกแบบ" />
      </section>

      <section className="board-section" aria-labelledby="board-title">
        <div className="board-toolbar">
          <div className="start-control">
            <label htmlFor="planning-start">วันเริ่มต้นของแผน</label>
            <input id="planning-start" type="date" value={planningStart} onChange={(event) => { setPlanningStart(event.target.value); setActiveSprint(0); }} />
          </div>
          <div className="sprint-switcher">
            <button onClick={() => setActiveSprint((current) => Math.max(0, current - 1))} disabled={activeSprint === 0} aria-label="Sprint ก่อนหน้า">←</button>
            <div>
              <p id="board-title">SPRINT {String(FIRST_SPRINT_NUMBER + activeSprint).padStart(2, "0")}</p>
              <strong>{formatRange(sprintStart, sprintEnd)}</strong>
            </div>
            <button onClick={() => setActiveSprint((current) => current + 1)} aria-label="Sprint ถัดไป">→</button>
          </div>
          <div className="toolbar-actions">
            <button className="pdf-button" onClick={downloadSprintPdf} disabled={isExporting}>
              {isExporting ? "กำลังสร้าง PDF…" : "↓ ดาวน์โหลด PDF"}
            </button>
            <button className="outline-button" onClick={() => { setTargetSprint("next"); setProjectStart(toISO(nextSprintStart)); setDuration(14); setProjectName(""); setShowForm(true); }}>
              วางแผน Sprint ถัดไป <span>→</span>
            </button>
          </div>
        </div>

        <div className="board-scroll">
          <div className="sprint-board" role="table" aria-label={`ตาราง Sprint ${FIRST_SPRINT_NUMBER + activeSprint}`}>
            <div className="week-row" role="row">
              <div className="project-heading" role="columnheader">โปรเจกต์</div>
              <div className="week-label week-one" role="columnheader">สัปดาห์ 1</div>
              <div className="week-label week-two" role="columnheader">สัปดาห์ 2</div>
            </div>
            <div className="date-row" role="row">
              <div className="date-spacer" />
              {dates.map((date, index) => (
                <div className={`date-cell ${index === 7 ? "week-start" : ""}`} role="columnheader" key={toISO(date)}>
                  <span>{THAI_DAYS[date.getDay()]}</span><strong>{date.getDate()}</strong>
                </div>
              ))}
            </div>
            <div className="project-rows" role="rowgroup">
              {visibleProjects.map((project) => {
                const projectStartDate = fromISO(project.startDate);
                const projectEndDate = addDays(projectStartDate, project.duration - 1);
                const visibleStart = projectStartDate < sprintStart ? sprintStart : projectStartDate;
                const visibleEnd = projectEndDate > sprintEnd ? sprintEnd : projectEndDate;
                const startDay = dayDiff(sprintStart, visibleStart);
                const endDay = dayDiff(sprintStart, visibleEnd);
                const continuesBefore = projectStartDate < sprintStart;
                const continuesAfter = projectEndDate > sprintEnd;
                return (
                  <div className="project-row" role="row" key={project.id}>
                    <div className="project-name" role="rowheader">
                      <span className="color-dot" style={{ background: project.color }} />
                      <span>{project.name}</span>
                      <button onClick={() => setProjects((current) => current.filter((item) => item.id !== project.id))} aria-label={`ลบ ${project.name}`}>×</button>
                    </div>
                    {dates.map((date, index) => (
                      <span
                        className={`grid-cell ${index === 7 ? "week-start" : ""}`}
                        style={{ gridColumn: index + 2 }}
                        key={toISO(date)}
                      />
                    ))}
                    <div
                      className={`project-bar ${continuesBefore ? "continues-before" : ""} ${continuesAfter ? "continues-after" : ""}`}
                      style={{ gridColumn: `${startDay + 2} / ${endDay + 3}`, background: project.color }}
                      title={`${project.name}: ${formatRange(projectStartDate, projectEndDate)}`}
                    >
                      {continuesBefore && <span aria-hidden="true">‹</span>}
                      <b>{project.duration >= 14 ? `${Math.round(project.duration / 7 * 10) / 10} สัปดาห์` : `${project.duration} วัน`}</b>
                      {continuesAfter && <span aria-hidden="true">›</span>}
                    </div>
                  </div>
                );
              })}
              {visibleProjects.length === 0 && (
                <div className="empty-row">
                  <span>ยังไม่มีโปรเจกต์ใน Sprint นี้</span>
                  <button onClick={openAddProject}>＋ เพิ่มโปรเจกต์</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="board-footer">
          <span><i className="legend-square" /> ระยะเวลาดำเนินการ</span>
          <span><i className="legend-arrow">›</i> งานต่อเนื่องไป Sprint ถัดไป</span>
          <p>แสดงเฉพาะ Sprint ละ 14 วัน</p>
        </div>
      </section>

      <footer>
        <span>Craftline</span>
        <p>เปลี่ยนแผนระยะยาว ให้เป็นจังหวะที่ทีมลงมือทำได้</p>
      </footer>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowForm(false)}>
          <form className="modal" onSubmit={addProject} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div><p>เพิ่มลงแผนงาน</p><h2>สร้างโปรเจกต์</h2></div>
              <button type="button" onClick={() => setShowForm(false)} aria-label="ปิด">×</button>
            </div>
            <label>
              ชื่อโปรเจกต์
              <input autoFocus value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="เช่น ระบบรายงานยอดขาย" />
            </label>
            <div className="sprint-choice">
              <span>เริ่มงานใน</span>
              <div>
                <button type="button" className={targetSprint === "current" ? "selected" : ""} onClick={() => setTargetSprint("current")}>Sprint {String(FIRST_SPRINT_NUMBER + activeSprint).padStart(2, "0")}<small>รอบนี้</small></button>
                <button type="button" className={targetSprint === "next" ? "selected" : ""} onClick={() => setTargetSprint("next")}>Sprint {String(FIRST_SPRINT_NUMBER + activeSprint + 1).padStart(2, "0")}<small>ล่วงหน้า 1 Sprint</small></button>
              </div>
            </div>
            <div className="modal-fields">
              <label>
                วันเริ่มงาน
                <input type="date" min={toISO(formSprintStart)} max={toISO(formSprintEnd)} value={projectStart} onChange={(event) => setProjectStart(event.target.value)} />
              </label>
              <label>
                ระยะเวลาดำเนินการ
                <select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
                  <option value={1}>1 วัน</option>
                  <option value={2}>2 วัน</option>
                  <option value={3}>3 วัน</option>
                  <option value={4}>4 วัน</option>
                  <option value={5}>5 วัน</option>
                  <option value={7}>1 สัปดาห์</option>
                  <option value={14}>1 Sprint (2 สัปดาห์)</option>
                  <option value={21}>1.5 Sprint (3 สัปดาห์)</option>
                  <option value={28}>2 Sprint (4 สัปดาห์)</option>
                </select>
              </label>
            </div>
            <p className="form-hint">เริ่มโปรเจกต์ได้เฉพาะใน Sprint ปัจจุบันหรือ Sprint ถัดไป และกำหนดระยะงานได้สูงสุด 2 Sprint</p>
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => setShowForm(false)}>ยกเลิก</button>
              <button type="submit" className="primary-button">เพิ่มโปรเจกต์</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
