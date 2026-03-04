/* =========================
   Dashboard JS (Calendar -> Reminders + Edit/Delete)
   LocalStorage only (no Firebase saving)
   ========================= */

/* ---------- Demo data ---------- */
const classes = [
  {
    title: "Religion - Abrahamitiska religioner",
    filer: 10,
    lektioner: 10,
    teacher: "Lärare: Aleyna Baser",
    gradient: "linear-gradient(135deg, #4f7cff, #7a96ff)"
  },
  {
    title: "Fysik - Kap 9",
    filer: 12,
    lektioner: 12,
    teacher: "Lärare: Marco Antonio Rosas Tello",
    gradient: "linear-gradient(135deg, #3d6be6, #52b7ff)"
  },
  {
    title: "Webbutveckling - slutprojekt",
    filer: 16,
    lektioner: 16,
    teacher: "Lärare: Saimon Lindblad",
    gradient: "linear-gradient(135deg, #ff7aa7, #ffb29b)"
  }
];

const lessons = [
  { cls: "RELREL01", teacher: "Aleyna Baser", members: 7, starting: "12.07.2022", material: "Download", payment: "Klart" },
  { cls: "WEUWEB02", teacher: "Saimon Lindberg", members: 8, starting: "17.07.2022", material: "Download", payment: "Pågående" },
  { cls: "FYSFYS02", teacher: "Marco Antonio Rosas Tello", members: 6, starting: "22.07.2022", material: "Download", payment: "Klart" }
];

const baseReminders = [
  { title: "Eng. - Vocabulary test", sub: "12 Dec 2022, Fredag" },
  { title: "Eng. - Essay", sub: "12 Dec 2022, Fredag" },
  { title: "Eng. - Speaking Class", sub: "12 Dec 2022, Fredag" }
];

/* ---------- Helpers ---------- */
function $(id) { return document.getElementById(id); }
function safeText(s) { return String(s ?? ""); }
function dateKey(d) { return d.toISOString().split("T")[0]; }
function uid() { return "e_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9); }
function getSearchQuery() { return $("searchInput")?.value || ""; }

/* =========================
   Top date chip
   ========================= */
function renderTodayChip() {
  const el = $("todayChip");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric", weekday: "long" });
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
    empty.textContent = "Inga klasser matchar din sökning.";
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
    empty.innerHTML = `<div style="color:#657195;font-weight:800;">Inga lektioner matchar din sökning.</div>`;
    wrap.appendChild(empty);
  }
}

/* =========================
   Calendar events (localStorage)
   ========================= */
let calendarEvents = loadCalendarEvents();

window.addEventListener("calendarEventsLoaded", () => {
  // safe: if something triggers this, we reload from localStorage
  calendarEvents = loadCalendarEvents();
  renderCalendar();
  renderReminders(getSearchQuery());
});

function loadCalendarEvents() {
  const raw = localStorage.getItem("calendarEvents");
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) || {};

    // migration: strings -> {id,text}
    for (const key of Object.keys(parsed)) {
      if (!Array.isArray(parsed[key])) parsed[key] = [];

      parsed[key] = parsed[key].map((x) => {
        if (typeof x === "string") return { id: uid(), text: x };
        if (typeof x === "object" && x) return { id: x.id || uid(), text: x.text ?? "" };
        return { id: uid(), text: "" };
      });
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
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric", weekday: "long" });
}

function getCalendarReminders() {
  const out = [];
  for (const key in calendarEvents) {
    for (const ev of (calendarEvents[key] || [])) {
      out.push({ title: ev.text, sub: formatReminderDate(key), _dateKey: key, _id: ev.id });
    }
  }
  out.sort((a, b) => a._dateKey.localeCompare(b._dateKey) || a.title.localeCompare(b.title));
  return out;
}

/* =========================
   Reminders
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

    const actions = r._type === "calendar"
      ? `
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="btn btn-ghost small" data-action="edit" data-id="${r._id}" type="button">✏️ Edit</button>
          <button class="btn btn-ghost small" data-action="delete" data-id="${r._id}" type="button">🗑️ Delete</button>
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

  // event delegation
  list.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      if (!id) return;
      if (action === "edit") editCalendarEvent(id);
      if (action === "delete") deleteCalendarEvent(id);
    });
  });
}

/* =========================
   Calendar UI
   ========================= */
let viewDate = new Date();
let selectedDate = new Date();

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function mondayFirstIndex(jsDay) { return (jsDay + 6) % 7; }
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function dayHasEvents(d) { return !!(calendarEvents[dateKey(d)] && calendarEvents[dateKey(d)].length); }

function renderCalendar() {
  const title = $("calTitle");
  const grid = $("calGrid");
  if (!title || !grid) return;

  grid.innerHTML = "";
  title.textContent = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const first = startOfMonth(viewDate);
  const firstIndex = mondayFirstIndex(first.getDay());
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

    if (d.getMonth() !== viewDate.getMonth()) cell.classList.add("muted");
    if (sameDay(d, today)) cell.classList.add("today");
    if (sameDay(d, selectedDate)) cell.classList.add("selected");
    if (dayHasEvents(d)) cell.classList.add("has-event");

    cell.addEventListener("click", () => {
      selectedDate = d;
      if (d.getMonth() !== viewDate.getMonth()) viewDate = new Date(d.getFullYear(), d.getMonth(), 1);
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
   Add / Edit / Delete events
   ========================= */
function addCalendarEvent() {
  const input = $("eventInput");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const key = dateKey(selectedDate);
  calendarEvents[key] ??= [];
  calendarEvents[key].push({ id: uid(), text });

  saveCalendarEvents();
  input.value = "";

  renderCalendar();
  renderReminders(getSearchQuery());
}

function findEventById(eventId) {
  for (const key in calendarEvents) {
    const arr = calendarEvents[key] || [];
    const index = arr.findIndex(ev => ev.id === eventId);
    if (index !== -1) return { key, index, event: arr[index] };
  }
  return null;
}

function editCalendarEvent(eventId) {
  const found = findEventById(eventId);
  if (!found) return;

  const nextText = prompt("Edit reminder text:", found.event.text);
  if (nextText === null) return;

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

  if (!confirm("Delete this reminder?")) return;

  calendarEvents[found.key].splice(found.index, 1);
  if (calendarEvents[found.key].length === 0) delete calendarEvents[found.key];

  saveCalendarEvents();
  renderCalendar();
  renderReminders(getSearchQuery());
}

/* =========================
   Sidebar + Search
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

  $("addEventBtn")?.addEventListener("click", addCalendarEvent);

  $("eventInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addCalendarEvent();
  });
}

document.addEventListener("DOMContentLoaded", init);
// ===== Mobile sidebar toggle (robust) =====
(function mobileMenu() {
  const sidebar = document.querySelector(".sidebar");
  const openBtn = document.getElementById("openMenu");

  if (!sidebar || !openBtn) return;

  // Create overlay if missing
  let overlay = document.getElementById("mobileOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "mobileOverlay";
    overlay.className = "mobile-overlay";
    document.body.appendChild(overlay);
  }

  function openMenu() {
    sidebar.classList.add("open");
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  openBtn.addEventListener("click", openMenu);
  overlay.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  sidebar.addEventListener("click", (e) => {
    const link = e.target.closest("a.nav-item");
    if (link) closeMenu();
  });
})();

  // Stäng med ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Bonus: stäng när man klickar på en nav-länk i sidebaren (t.ex. Quiz)
  sidebar.addEventListener("click", (e) => {
    const link = e.target.closest("a.nav-item");
    if (link) closeMenu();
  });