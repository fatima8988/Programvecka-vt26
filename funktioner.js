

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



/* ---------- Tiny helpers ---------- */
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

function uid() {
  // simple unique id (good enough for localStorage)
  return "e_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}

function getSearchQuery() {
  return $("searchInput")?.value || "";
}

/* =========================
   Top date chip
   ========================= */
function renderTodayChip() {
  const el = $("todayChip");
  if (!el) return;

  const now = new Date();
  const options = { day: "2-digit", month: "long", year: "numeric", weekday: "long" };
  el.textContent = now.toLocaleDateString(undefined, options);
}

/* =========================
   Classes
   ========================= */
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

/* =========================
   Lessons table
   ========================= */
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


let calendarEvents = loadCalendarEvents();

function loadCalendarEvents() {
  const raw = localStorage.getItem("calendarEvents");
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) || {};

    // MIGRATION: if old format was array of strings, convert to [{id,text}]
    for (const key of Object.keys(parsed)) {
      if (Array.isArray(parsed[key])) {
        const arr = parsed[key];

        // string format
        if (arr.length > 0 && typeof arr[0] === "string") {
          parsed[key] = arr.map(str => ({ id: uid(), text: str }));
        }

        // object format but missing ids
        if (arr.length > 0 && typeof arr[0] === "object") {
          parsed[key] = arr.map(obj => ({
            id: obj.id || uid(),
            text: obj.text ?? ""
          }));
        }
      } else {
        parsed[key] = [];
      }
    }

    return parsed;
  } catch {
    return {};
  }
}

function saveCalendarEvents() {
  localStorage.setItem("calendarEvents", JSON.stringify(calendarEvents));
}

function formatReminderDate(isoKey) {
  const d = new Date(isoKey + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "long"
  });
}

function getCalendarReminders() {
  // Convert calendarEvents -> flat reminders list
  const out = [];
  for (const key in calendarEvents) {
    const events = calendarEvents[key] || [];
    for (const ev of events) {
      out.push({
        title: ev.text,
        sub: formatReminderDate(key),
        _dateKey: key,
        _id: ev.id
      });
    }
  }

  // sort by date (soonest first), then text
  out.sort((a, b) => a._dateKey.localeCompare(b._dateKey) || a.title.localeCompare(b.title));
  return out;
}

/* =========================
   Reminders (base + calendar)
   ========================= */
function renderReminders(filterText = "") {
  const list = $("reminderList");
  if (!list) return;

  list.innerHTML = "";

  const q = filterText.trim().toLowerCase();

  const combined = [
    ...baseReminders.map(r => ({ ...r, _type: "base" })),
    ...getCalendarReminders().map(r => ({ ...r, _type: "calendar" }))
  ];

  const filtered = combined.filter(r =>
    r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)
  );

  filtered.forEach(r => {
    const item = document.createElement("div");
    item.className = "reminder";

    // Buttons only for calendar reminders
    const actions =
      r._type === "calendar"
        ? `
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="btn btn-ghost small" data-action="edit" data-id="${r._id}">✏️ Edit</button>
            <button class="btn btn-ghost small" data-action="delete" data-id="${r._id}">🗑️ Delete</button>
          </div>
        `
        : "";

    item.innerHTML = `
      <div class="rem-title">🔔 ${safeText(r.title)}</div>
      <div class="rem-sub">${safeText(r.sub)}</div>
      ${actions}
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

  // One event listener for all reminder buttons (event delegation)
  list.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      if (!id) return;

      if (action === "edit") editCalendarEvent(id);
      if (action === "delete") deleteCalendarEvent(id);
    });
  });
}

/* =========================
   Calendar (month UI)
   ========================= */
let viewDate = new Date();      // month being displayed
let selectedDate = new Date();  // selected day

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
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

function dayHasEvents(d) {
  const key = dateKey(d);
  return (calendarEvents[key] && calendarEvents[key].length > 0);
}

function renderCalendar() {
  const title = $("calTitle");
  const grid = $("calGrid");
  if (!title || !grid) return;

  grid.innerHTML = "";

  const monthName = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  title.textContent = monthName;

  const first = startOfMonth(viewDate);

  const firstIndex = mondayFirstIndex(first.getDay()); // 0-6
  const totalCells = 42;

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

    // Color the day if it has events (NO DOT)
    if (dayHasEvents(d)) cell.classList.add("has-event");

    // If selected day has events, "selected" should visually win (optional)
    // If you want selected to override has-event, keep CSS ordering accordingly.

    cell.addEventListener("click", () => {
      selectedDate = d;

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

/* =========================
   Add / Edit / Delete calendar events
   ========================= */
function addCalendarEvent() {
  const input = $("eventInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const key = dateKey(selectedDate);
  if (!calendarEvents[key]) calendarEvents[key] = [];

  calendarEvents[key].push({ id: uid(), text });

  saveCalendarEvents();
  input.value = "";

  // refresh UI
  renderCalendar();
  renderReminders(getSearchQuery());
}

function findEventById(eventId) {
  for (const key in calendarEvents) {
    const arr = calendarEvents[key] || [];
    const index = arr.findIndex(ev => ev.id === eventId);
    if (index !== -1) {
      return { key, index, event: arr[index] };
    }
  }
  return null;
}

function editCalendarEvent(eventId) {
  const found = findEventById(eventId);
  if (!found) return;

  const current = found.event.text;
  const nextText = prompt("Edit reminder text:", current);

  if (nextText === null) return; // user cancelled
  const clean = nextText.trim();
  if (!clean) return;

  calendarEvents[found.key][found.index].text = clean;

  saveCalendarEvents();
  renderCalendar();
  renderReminders(getSearchQuery());
}

function deleteCalendarEvent(eventId) {
  const found = findEventById(eventId);
  if (!found) return;

  const ok = confirm("Delete this reminder?");
  if (!ok) return;

  calendarEvents[found.key].splice(found.index, 1);

  // If day becomes empty, remove the key (clean storage)
  if (calendarEvents[found.key].length === 0) {
    delete calendarEvents[found.key];
  }

  saveCalendarEvents();
  renderCalendar();
  renderReminders(getSearchQuery());
}

/* =========================
   Sidebar active state
   ========================= */
function wireSidebar() {
  const items = document.querySelectorAll(".nav-item");
  items.forEach(btn => {
    btn.addEventListener("click", () => {
      items.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

/* =========================
   Search (filters classes + lessons + reminders)
   ========================= */
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

/* =========================
   Init
   ========================= */
function init() {
  renderTodayChip();
  renderClasses();
  renderLessons();
  renderReminders();

  wireSidebar();
  wireSearch();
  wireCalendarControls();

  renderCalendar();

  const addBtn = $("addEventBtn");
  if (addBtn) addBtn.addEventListener("click", addCalendarEvent);

  // Press Enter to add event
  const eventInput = $("eventInput");
  if (eventInput) {
    eventInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addCalendarEvent();
    });
  }
}

document.addEventListener("DOMContentLoaded", init);


