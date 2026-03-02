/* =========================
   Learnthru Dashboard JS
   Complete script.js
   ========================= */

/* ---------- Demo data ---------- */
const classes = [
  {
    title: "English - UNIT III",
    files: 10,
    lessons: 10,
    teacher: "Teacher: Leena Jimenez",
    gradient: "linear-gradient(135deg, #4f7cff, #7a96ff)"
  },
  {
    title: "English - UNIT I",
    files: 12,
    lessons: 12,
    teacher: "Teacher: Cole Chandler",
    gradient: "linear-gradient(135deg, #3d6be6, #52b7ff)"
  },
  {
    title: "UNIT I",
    files: 16,
    lessons: 16,
    teacher: "Teacher: Cole Chandler",
    gradient: "linear-gradient(135deg, #ff7aa7, #ffb29b)"
  }
];

const lessons = [
  { cls: "A1", teacher: "Bernard Carr", members: 7, starting: "12.07.2022", material: "Download", payment: "Done" },
  { cls: "A1", teacher: "Henry Poole", members: 8, starting: "17.07.2022", material: "Download", payment: "Pending" },
  { cls: "A1", teacher: "Helena Lowe", members: 6, starting: "22.07.2022", material: "Download", payment: "Done" }
];

const reminders = [
  { title: "Eng. - Vocabulary test", sub: "12 Dec 2022, Friday" },
  { title: "Eng. - Essay", sub: "12 Dec 2022, Friday" },
  { title: "Eng. - Speaking Class", sub: "12 Dec 2022, Friday" }
];

/* ---------- Helpers ---------- */
function $(id) {
  return document.getElementById(id);
}

function safeText(s) {
  return String(s ?? "");
}

function dateKey(d) {
  // "YYYY-MM-DD"
  return d.toISOString().split("T")[0];
}

/* ---------- Render: top date chip ---------- */
function renderTodayChip() {
  const el = $("todayChip");
  if (!el) return;

  const now = new Date();
  const options = { day: "2-digit", month: "long", year: "numeric", weekday: "long" };
  el.textContent = now.toLocaleDateString(undefined, options);
}

/* ---------- Render: classes ---------- */
function renderClasses(filterText = "") {
  const grid = $("classGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const q = filterText.trim().toLowerCase();
  const filtered = classes.filter(c =>
    c.title.toLowerCase().includes(q) || c.teacher.toLowerCase().includes(q)
  );

  filtered.forEach(c => {
    const card = document.createElement("div");
    card.className = "class-card";
    card.style.background = c.gradient;

    card.innerHTML = `
      <div class="title">${safeText(c.title)}</div>
      <div class="class-meta">
        <div class="meta-item">📄 <span>${c.files} Files</span></div>
        <div class="meta-item">🎬 <span>${c.lessons} Lessons</span></div>
      </div>
      <div class="teacher">${safeText(c.teacher)}</div>
    `;

    grid.appendChild(card);
  });

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.style.padding = "14px";
    empty.style.color = "#657195";
    empty.textContent = "No classes match your search.";
    grid.appendChild(empty);
  }
}

/* ---------- Render: lessons table ---------- */
function renderLessons(filterText = "") {
  const wrap = $("lessonRows");
  if (!wrap) return;

  wrap.innerHTML = "";

  const q = filterText.trim().toLowerCase();
  const filtered = lessons.filter(l =>
    l.cls.toLowerCase().includes(q) ||
    l.teacher.toLowerCase().includes(q) ||
    l.payment.toLowerCase().includes(q)
  );

  filtered.forEach(l => {
    const row = document.createElement("div");
    row.className = "row";

    const payDotClass = l.payment.toLowerCase() === "done" ? "done" : "pending";

    row.innerHTML = `
      <div><span class="tag">${safeText(l.cls)}</span></div>
      <div style="font-weight:900;">${safeText(l.teacher)}</div>
      <div class="members">
        <div class="avatars">
          <div class="mini"></div>
          <div class="mini"></div>
          <div class="mini"></div>
        </div>
        <div style="color:#657195;font-weight:800;font-size:12px;">+${Math.max(0, l.members - 3)}</div>
      </div>
      <div style="color:#657195;font-weight:800;">${safeText(l.starting)}</div>
      <div><a href="#" class="link" onclick="return false;">${safeText(l.material)}</a></div>
      <div class="pill"><span class="dot2 ${payDotClass}"></span>${safeText(l.payment)}</div>
    `;

    wrap.appendChild(row);
  });

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "row";
    empty.style.gridTemplateColumns = "1fr";
    empty.innerHTML = `<div style="color:#657195;font-weight:800;">No lessons match your search.</div>`;
    wrap.appendChild(empty);
  }
}

/* ---------- Render: reminders ---------- */
function renderReminders(filterText = "") {
  const list = $("reminderList");
  if (!list) return;

  list.innerHTML = "";

  const q = filterText.trim().toLowerCase();
  const filtered = reminders.filter(r =>
    r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)
  );

  filtered.forEach(r => {
    const item = document.createElement("div");
    item.className = "reminder";
    item.innerHTML = `
      <div class="rem-title">🔔 ${safeText(r.title)}</div>
      <div class="rem-sub">${safeText(r.sub)}</div>
    `;
    list.appendChild(item);
  });

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "reminder";
    empty.style.color = "#657195";
    empty.style.fontWeight = "800";
    empty.textContent = "No reminders found.";
    list.appendChild(empty);
  }
}

/* =========================
   Calendar + Add Events
   ========================= */

// saved events: { "YYYY-MM-DD": ["event1", "event2"] }
let calendarEvents = JSON.parse(localStorage.getItem("calendarEvents")) || {};

let viewDate = new Date();      // month being displayed
let selectedDate = new Date();  // selected day

function saveCalendarEvents() {
  localStorage.setItem("calendarEvents", JSON.stringify(calendarEvents));
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// Monday-first index: Mon=0 ... Sun=6
function mondayFirstIndex(jsDay) {
  // JS: Sun=0..Sat=6
  return (jsDay + 6) % 7;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function addCalendarEvent() {
  const input = $("eventInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const key = dateKey(selectedDate);

  if (!calendarEvents[key]) calendarEvents[key] = [];
  calendarEvents[key].push(text);

  saveCalendarEvents();
  input.value = "";

  renderCalendar();
}

function renderCalendar() {
  const title = $("calTitle");
  const grid = $("calGrid");
  if (!title || !grid) return;

  grid.innerHTML = "";

  const monthName = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  title.textContent = monthName;

  const first = startOfMonth(viewDate);

  // We want a 6-week grid (42 cells)
  const firstIndex = mondayFirstIndex(first.getDay()); // 0-6
  const totalCells = 42;

  // Grid starts: first day - firstIndex
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - firstIndex);

  const today = new Date();

  for (let i = 0; i < totalCells; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);

    const cell = document.createElement("div");
    cell.className = "day";
    cell.textContent = d.getDate();

    const isCurrentMonth = d.getMonth() === viewDate.getMonth();
    if (!isCurrentMonth) cell.classList.add("muted");
    if (sameDay(d, today)) cell.classList.add("today");
    if (sameDay(d, selectedDate)) cell.classList.add("selected");

    // Event dot indicator
    const key = dateKey(d);
    if (calendarEvents[key] && calendarEvents[key].length > 0) {
      cell.style.position = "relative";
      const dot = document.createElement("div");
      dot.style.width = "6px";
      dot.style.height = "6px";
      dot.style.borderRadius = "50%";
      dot.style.background = "#ff6aa3";
      dot.style.position = "absolute";
      dot.style.bottom = "6px";
      dot.style.left = "50%";
      dot.style.transform = "translateX(-50%)";
      cell.appendChild(dot);
    }

    cell.addEventListener("click", () => {
      selectedDate = d;

      // If clicked date is not in current month, jump month
      if (d.getMonth() !== viewDate.getMonth()) {
        viewDate = new Date(d.getFullYear(), d.getMonth(), 1);
      }
      renderCalendar();
    });

    grid.appendChild(cell);
  }
}

function wireCalendarControls() {
  const prev = $("prevMonth");
  const next = $("nextMonth");
  if (!prev || !next) return;

  prev.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
  });

  next.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
  });
}

/* ---------- Sidebar active state ---------- */
function wireSidebar() {
  const items = document.querySelectorAll(".nav-item");
  items.forEach(btn => {
    btn.addEventListener("click", () => {
      items.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

/* ---------- Search (filters classes + lessons + reminders) ---------- */
function wireSearch() {
  const input = $("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const q = input.value;
    renderClasses(q);
    renderLessons(q);
    renderReminders(q);
  });
}

/* ---------- Init (safe) ---------- */
function init() {
  renderTodayChip();
  renderClasses();
  renderLessons();
  renderReminders();

  wireCalendarControls();
  wireSidebar();
  wireSearch();

  renderCalendar();

  const addBtn = $("addEventBtn");
  if (addBtn) addBtn.addEventListener("click", addCalendarEvent);

  // Optional: press Enter to add event
  const eventInput = $("eventInput");
  if (eventInput) {
    eventInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addCalendarEvent();
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
