// ---------- Demo data ----------
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

// ---------- Render: top date chip ----------
function renderTodayChip() {
  const el = document.getElementById("todayChip");
  const now = new Date();
  const options = { day: "2-digit", month: "long", year: "numeric", weekday: "long" };
  el.textContent = now.toLocaleDateString(undefined, options);
}

// ---------- Render: classes ----------
function renderClasses(filterText = "") {
  const grid = document.getElementById("classGrid");
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
      <div class="title">${c.title}</div>
      <div class="class-meta">
        <div class="meta-item">📄 <span>${c.files} Files</span></div>
        <div class="meta-item">🎬 <span>${c.lessons} Lessons</span></div>
      </div>
      <div class="teacher">${c.teacher}</div>
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

// ---------- Render: lessons table ----------
function renderLessons(filterText = "") {
  const wrap = document.getElementById("lessonRows");
  wrap.innerHTML = "";

  const q = filterText.trim().toLowerCase();
  const filtered = lessons.filter(l =>
    l.cls.toLowerCase().includes(q) ||
    l.teacher.toLowerCase().includes(q) ||
    l.payment.toLowerCase().includes(q)
  );

  filtered.forEach((l, idx) => {
    const row = document.createElement("div");
    row.className = "row";

    const payDotClass = l.payment.toLowerCase() === "done" ? "done" : "pending";

    row.innerHTML = `
      <div><span class="tag">${l.cls}</span></div>
      <div style="font-weight:900;">${l.teacher}</div>
      <div class="members">
        <div class="avatars">
          <div class="mini"></div>
          <div class="mini"></div>
          <div class="mini"></div>
        </div>
        <div style="color:#657195;font-weight:800;font-size:12px;">+${Math.max(0, l.members - 3)}</div>
      </div>
      <div style="color:#657195;font-weight:800;">${l.starting}</div>
      <div><a href="#" class="link" onclick="return false;">${l.material}</a></div>
      <div class="pill"><span class="dot2 ${payDotClass}"></span>${l.payment}</div>
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

// ---------- Render: reminders ----------
function renderReminders(filterText = "") {
  const list = document.getElementById("reminderList");
  list.innerHTML = "";

  const q = filterText.trim().toLowerCase();
  const filtered = reminders.filter(r =>
    r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)
  );

  filtered.forEach(r => {
    const item = document.createElement("div");
    item.className = "reminder";
    item.innerHTML = `
      <div class="rem-title">🔔 ${r.title}</div>
      <div class="rem-sub">${r.sub}</div>
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

// ---------- Calendar ----------
let calendarEvents =
  JSON.parse(localStorage.getItem("calendarEvents")) || {};
let viewDate = new Date(); // month being displayed
let selectedDate = new Date(); // selected day

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

function renderCalendar() {
  const title = document.getElementById("calTitle");
  const grid = document.getElementById("calGrid");
  grid.innerHTML = "";

  const monthName = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  title.textContent = monthName;

  const first = startOfMonth(viewDate);
  const last = endOfMonth(viewDate);

  // We want to fill a 6-week grid (42 cells) like most dashboards
  const firstIndex = mondayFirstIndex(first.getDay()); // 0-6
  const totalCells = 42;

  // Start date in grid = first day - firstIndex
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

    cell.addEventListener("click", () => {
      selectedDate = d;
      // If clicked day is from another month, navigate to it
      if (d.getMonth() !== viewDate.getMonth()) {
        viewDate = new Date(d.getFullYear(), d.getMonth(), 1);
      }
      renderCalendar();
    });

    grid.appendChild(cell);
  }
}

function wireCalendarControls() {
  document.getElementById("prevMonth").addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById("nextMonth").addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
  });
}

// ---------- Sidebar active state ----------
function wireSidebar() {
  const items = document.querySelectorAll(".nav-item");
  items.forEach(btn => {
    btn.addEventListener("click", () => {
      items.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

// ---------- Search (filters classes + lessons + reminders) ----------
function wireSearch() {
  const input = document.getElementById("searchInput");
  input.addEventListener("input", () => {
    const q = input.value;
    renderClasses(q);
    renderLessons(q);
    renderReminders(q);
  });
}

// ---------- Init ----------
renderTodayChip();
renderClasses();
renderLessons();
renderReminders();
wireCalendarControls();
renderCalendar();
wireSidebar();
wireSearch();
