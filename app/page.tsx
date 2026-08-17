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

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Sprintline หน้าหลัก">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Sprintline</span>
        </a>
        <div className="top-actions">
          <span className="save-status"><i /> บันทึกอัตโนมัติ</span>
          <button className="primary-button" onClick={openAddProject}><span aria-hidden="true">＋</span> เพิ่มโปรเจกต์</button>
        </div>
      </header>

      <section className="intro-panel" id="top">
        <div>
          <p className="eyebrow"><span>14</span> วันต่อหนึ่ง Sprint</p>
          <h1>โฟกัสแผน<br />ทีละ<span>Sprint</span></h1>
          <p className="intro-copy">มองงานแค่รอบปัจจุบัน และเตรียมโปรเจกต์ล่วงหน้าได้อีก 1 Sprint เพื่อให้แผนชัดและทำงานได้จริง</p>
        </div>
        <aside className="scope-card">
          <p>PLANNING SCOPE</p>
          <strong>เพิ่มโปรเจกต์ได้<br />2 ช่วงเวลาเท่านั้น</strong>
          <div><span>Sprint {String(activeSprint + 1).padStart(2, "0")}</span><i>และ</i><span>Sprint {String(activeSprint + 2).padStart(2, "0")}</span></div>
          <small>รองรับงานที่ใช้เวลา 1.5–2 Sprint</small>
        </aside>
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
              <p id="board-title">SPRINT {String(activeSprint + 1).padStart(2, "0")}</p>
              <strong>{formatRange(sprintStart, sprintEnd)}</strong>
            </div>
            <button onClick={() => setActiveSprint((current) => current + 1)} aria-label="Sprint ถัดไป">→</button>
          </div>
          <button className="outline-button" onClick={() => { setTargetSprint("next"); setProjectStart(toISO(nextSprintStart)); setDuration(14); setProjectName(""); setShowForm(true); }}>
            วางแผน Sprint ถัดไป <span>→</span>
          </button>
        </div>

        <div className="scope-note">
          <span className="scope-dot" /> ขณะนี้เพิ่มโปรเจกต์ได้ใน <strong>Sprint {String(activeSprint + 1).padStart(2, "0")}</strong> หรือ <strong>Sprint {String(activeSprint + 2).padStart(2, "0")}</strong> เท่านั้น
        </div>

        <div className="board-scroll">
          <div className="sprint-board" role="table" aria-label={`ตาราง Sprint ${activeSprint + 1}`}>
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
                    {dates.map((date, index) => <span className={`grid-cell ${index === 7 ? "week-start" : ""}`} key={toISO(date)} />)}
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
        <span>Sprintline</span>
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
                <button type="button" className={targetSprint === "current" ? "selected" : ""} onClick={() => setTargetSprint("current")}>Sprint {String(activeSprint + 1).padStart(2, "0")}<small>รอบนี้</small></button>
                <button type="button" className={targetSprint === "next" ? "selected" : ""} onClick={() => setTargetSprint("next")}>Sprint {String(activeSprint + 2).padStart(2, "0")}<small>ล่วงหน้า 1 Sprint</small></button>
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
