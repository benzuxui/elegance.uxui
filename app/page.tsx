"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Task = {
  id: number;
  title: string;
  sprint: number;
  done: boolean;
  type: "งาน" | "หมุดหมาย";
};

const DAY = 86_400_000;

const starterTasks: Task[] = [
  { id: 1, title: "สรุปโจทย์และเป้าหมาย", sprint: 1, done: true, type: "งาน" },
  { id: 2, title: "ยืนยันขอบเขตงาน", sprint: 1, done: false, type: "หมุดหมาย" },
  { id: 3, title: "ออกแบบและทำ Prototype", sprint: 2, done: false, type: "งาน" },
  { id: 4, title: "พัฒนาฟีเจอร์หลัก", sprint: 3, done: false, type: "งาน" },
  { id: 5, title: "ทดสอบกับผู้ใช้", sprint: 4, done: false, type: "หมุดหมาย" },
  { id: 6, title: "ปรับปรุงและเตรียมเปิดตัว", sprint: 5, done: false, type: "งาน" },
  { id: 7, title: "เปิดตัวเวอร์ชันแรก", sprint: 6, done: false, type: "หมุดหมาย" },
];

const thaiMonths = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function fromISO(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY);
}

function formatDate(date: Date) {
  return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
}

export default function Home() {
  const [projectName, setProjectName] = useState("เปิดตัวโปรดักต์ใหม่");
  const [startDate, setStartDate] = useState("2026-08-17");
  const [sprintCount, setSprintCount] = useState(6);
  const [tasks, setTasks] = useState<Task[]>(starterTasks);
  const [taskName, setTaskName] = useState("");
  const [taskSprint, setTaskSprint] = useState(1);
  const [taskType, setTaskType] = useState<Task["type"]>("งาน");
  const [showForm, setShowForm] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("sprintline-project");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setProjectName(data.projectName ?? "เปิดตัวโปรดักต์ใหม่");
        setStartDate(data.startDate ?? "2026-08-17");
        setSprintCount(data.sprintCount ?? 6);
        setTasks(data.tasks ?? starterTasks);
      } catch {
        // Keep the starter project when saved data cannot be read.
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(
      "sprintline-project",
      JSON.stringify({ projectName, startDate, sprintCount, tasks }),
    );
  }, [projectName, startDate, sprintCount, tasks, ready]);

  const sprints = useMemo(() => {
    const start = fromISO(startDate);
    return Array.from({ length: sprintCount }, (_, index) => ({
      number: index + 1,
      start: addDays(start, index * 14),
      end: addDays(start, index * 14 + 13),
    }));
  }, [startDate, sprintCount]);

  const endDate = sprints.at(-1)?.end;
  const completed = tasks.filter((task) => task.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  function addTask(event: FormEvent) {
    event.preventDefault();
    const title = taskName.trim();
    if (!title) return;
    setTasks((current) => [
      ...current,
      { id: Date.now(), title, sprint: taskSprint, done: false, type: taskType },
    ]);
    setTaskName("");
    setShowForm(false);
  }

  function changeSprintCount(value: number) {
    const next = Math.max(1, Math.min(12, value));
    setSprintCount(next);
    setTaskSprint((current) => Math.min(current, next));
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
          <button className="primary-button" onClick={() => setShowForm(true)}>
            <span aria-hidden="true">＋</span> เพิ่มงาน
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span>14</span> วันต่อหนึ่ง Sprint</div>
        <div className="hero-grid">
          <div>
            <h1>วางแผนใหญ่<br />ให้เห็นเป็น<span>ช่วงสั้น</span></h1>
            <p className="intro">
              สร้าง Timeline ของโปรเจกต์แบบ Sprint ละ 2 สัปดาห์
              เพื่อให้ทีมเห็นเป้าหมาย ระยะเวลา และจังหวะส่งมอบในหน้าเดียว
            </p>
          </div>
          <aside className="project-card" aria-label="ตั้งค่าโปรเจกต์">
            <label>
              ชื่อโปรเจกต์
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                aria-label="ชื่อโปรเจกต์"
              />
            </label>
            <div className="setting-row">
              <label>
                วันเริ่มต้น
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  aria-label="วันเริ่มต้น"
                />
              </label>
              <label>
                จำนวน Sprint
                <div className="stepper">
                  <button onClick={() => changeSprintCount(sprintCount - 1)} aria-label="ลดจำนวน Sprint">−</button>
                  <strong>{sprintCount}</strong>
                  <button onClick={() => changeSprintCount(sprintCount + 1)} aria-label="เพิ่มจำนวน Sprint">＋</button>
                </div>
              </label>
            </div>
            <div className="project-summary">
              <span>ระยะเวลารวม</span>
              <strong>{sprintCount * 2} สัปดาห์</strong>
              <small>{formatDate(fromISO(startDate))} — {endDate ? formatDate(endDate) : ""}</small>
            </div>
          </aside>
        </div>
      </section>

      <section className="timeline-section" aria-labelledby="timeline-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">PROJECT TIMELINE</p>
            <h2 id="timeline-title">{projectName || "โปรเจกต์ใหม่"}</h2>
          </div>
          <div className="progress-wrap" aria-label={`ความคืบหน้า ${progress}%`}>
            <div className="progress-copy"><span>ความคืบหน้า</span><strong>{progress}%</strong></div>
            <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
          </div>
        </div>

        <div className="timeline" role="list">
          {sprints.map((sprint, index) => {
            const sprintTasks = tasks.filter((task) => task.sprint === sprint.number);
            return (
              <article className="sprint-card" role="listitem" key={sprint.number}>
                <div className="sprint-rail" aria-hidden="true">
                  <span>{String(sprint.number).padStart(2, "0")}</span>
                  {index < sprints.length - 1 && <i />}
                </div>
                <div className="sprint-content">
                  <div className="sprint-head">
                    <div>
                      <p>SPRINT {String(sprint.number).padStart(2, "0")}</p>
                      <h3>{formatDate(sprint.start)} — {formatDate(sprint.end)}</h3>
                    </div>
                    <span className="duration">2 สัปดาห์</span>
                  </div>
                  <div className="task-list">
                    {sprintTasks.length === 0 ? (
                      <button className="empty-task" onClick={() => { setTaskSprint(sprint.number); setShowForm(true); }}>
                        ＋ เพิ่มงานใน Sprint นี้
                      </button>
                    ) : sprintTasks.map((task) => (
                      <div className={`task ${task.done ? "is-done" : ""}`} key={task.id}>
                        <button
                          className="check"
                          onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}
                          aria-label={`${task.done ? "ยกเลิกสถานะเสร็จของ" : "ทำเครื่องหมายว่าเสร็จ"} ${task.title}`}
                        >{task.done ? "✓" : ""}</button>
                        <span>{task.title}</span>
                        <em className={task.type === "หมุดหมาย" ? "milestone" : ""}>{task.type}</em>
                        <button
                          className="delete-task"
                          onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}
                          aria-label={`ลบ ${task.title}`}
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="finish-line">
          <span className="flag" aria-hidden="true">◆</span>
          <div><small>สิ้นสุดโปรเจกต์</small><strong>{endDate ? formatDate(endDate) : ""}</strong></div>
        </div>
      </section>

      <footer>
        <span>Sprintline</span>
        <p>เปลี่ยนแผนระยะยาว ให้เป็นความคืบหน้าทุก 2 สัปดาห์</p>
      </footer>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowForm(false)}>
          <form className="modal" onSubmit={addTask} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div><p>เพิ่มลง Timeline</p><h2>สร้างงานใหม่</h2></div>
              <button type="button" onClick={() => setShowForm(false)} aria-label="ปิด">×</button>
            </div>
            <label>
              ชื่องาน
              <input autoFocus value={taskName} onChange={(event) => setTaskName(event.target.value)} placeholder="เช่น ส่งมอบ Prototype" />
            </label>
            <div className="modal-fields">
              <label>
                Sprint
                <select value={taskSprint} onChange={(event) => setTaskSprint(Number(event.target.value))}>
                  {sprints.map((sprint) => <option value={sprint.number} key={sprint.number}>Sprint {sprint.number}</option>)}
                </select>
              </label>
              <label>
                ประเภท
                <select value={taskType} onChange={(event) => setTaskType(event.target.value as Task["type"])}>
                  <option>งาน</option>
                  <option>หมุดหมาย</option>
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => setShowForm(false)}>ยกเลิก</button>
              <button type="submit" className="primary-button">เพิ่มงาน</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
