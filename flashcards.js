/* =========================
   Flashcards / Quiz / Builder
   flashcards.js
   ========================= */

const QA_STORAGE_KEY = "studyQA_v1";

// State
let qaItems = loadQA();
let filteredIds = [];
let quizOrder = [];
let flashDeck = [];
let flashIndex = 0;
let flashFlipped = false;

// ---------- DOM helpers ----------
const $ = (id) => document.getElementById(id);

function uid() {
  return "qa_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- Storage ----------
function loadQA() {
  const raw = localStorage.getItem(QA_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(x => ({
      id: x.id || uid(),
      q: String(x.q ?? ""),
      a: String(x.a ?? ""),
      learned: Boolean(x.learned),
      createdAt: Number(x.createdAt || Date.now())
    }));
  } catch {
    return [];
  }
}

function saveQA() {
  localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(qaItems));
}

// ---------- Tabs ----------
function setView(viewId) {
  ["builderView", "quizView", "flashView"].forEach(id => {
    const el = $(id);
    if (el) el.style.display = (id === viewId) ? "block" : "none";
  });

  document.querySelectorAll(".tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });

  updateBuilderMeta();
  updateQuizMeta();
  rebuildFlashDeck();
  renderFlashcard();
}

function wireTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });
}

// ---------- Search ----------
function applySearch() {
  const q = ($("globalSearch")?.value || "").trim().toLowerCase();

  if (!q) {
    filteredIds = qaItems.map(x => x.id);
  } else {
    filteredIds = qaItems
      .filter(x => x.q.toLowerCase().includes(q) || x.a.toLowerCase().includes(q))
      .map(x => x.id);
  }

  renderQAList();
  updateBuilderMeta();
  updateQuizMeta();
  rebuildFlashDeck();
  renderFlashcard();
}

function wireSearch() {
  $("globalSearch")?.addEventListener("input", applySearch);
}

// ---------- Builder ----------
function updateBuilderMeta() {
  const el = $("builderMeta");
  if (!el) return;

  const total = qaItems.length;
  const shown = filteredIds.length || total;
  const learned = qaItems.filter(x => x.learned).length;

  el.textContent = `Totalt: ${total} • Visas: ${shown} • Lärda: ${learned}`;
}

function renderQAList() {
  const list = $("qaList");
  if (!list) return;

  list.innerHTML = "";

  const idSet = new Set(filteredIds.length ? filteredIds : qaItems.map(x => x.id));
  const items = qaItems.filter(x => idSet.has(x.id));

  if (items.length === 0) {
    list.innerHTML = `<div class="item"><div class="a">Inga frågor matchar sökningen 🙂</div></div>`;
    return;
  }

  items
    .sort((a,b) => b.createdAt - a.createdAt)
    .forEach(item => {
      const el = document.createElement("div");
      el.className = "item";

      el.innerHTML = `
        <div class="item-top">
          <div style="flex:1;">
            <div class="q">Fråga: ${escapeHtml(item.q)}</div>
            <div class="a">Svar: ${escapeHtml(item.a)}</div>
            <div class="a" style="margin-top:8px;">Status: <b>${item.learned ? "Lärd ✓" : "Ej lärd"}</b></div>
          </div>
          <div class="item-actions">
            <button class="btn btn-ghost small" data-action="toggle" data-id="${item.id}">${item.learned ? "↩︎" : "✓"}</button>
            <button class="btn btn-ghost small" data-action="edit" data-id="${item.id}">✏️</button>
            <button class="btn btn-ghost small" data-action="delete" data-id="${item.id}">🗑️</button>
          </div>
        </div>
      `;

      list.appendChild(el);
    });

  list.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === "delete") deleteQA(id);
      if (action === "edit") editQA(id);
      if (action === "toggle") toggleLearned(id);
    });
  });
}

function addQA() {
  const qEl = $("qInput");
  const aEl = $("aInput");

  const q = qEl.value.trim();
  const a = aEl.value.trim();
  if (!q || !a) return;

  qaItems.unshift({
    id: uid(),
    q,
    a,
    learned: false,
    createdAt: Date.now()
  });

  saveQA();
  qEl.value = "";
  aEl.value = "";
  applySearch();
}

function clearAllQA() {
  const ok = confirm("Vill du radera ALLA frågor?");
  if (!ok) return;
  qaItems = [];
  saveQA();
  applySearch();
}

function editQA(id) {
  const item = qaItems.find(x => x.id === id);
  if (!item) return;

  const newQ = prompt("Redigera fråga:", item.q);
  if (newQ === null) return;

  const newA = prompt("Redigera svar:", item.a);
  if (newA === null) return;

  item.q = newQ.trim();
  item.a = newA.trim();

  saveQA();
  applySearch();
}

function deleteQA(id) {
  const ok = confirm("Ta bort denna fråga?");
  if (!ok) return;

  qaItems = qaItems.filter(x => x.id !== id);
  saveQA();
  applySearch();
}

function toggleLearned(id) {
  const item = qaItems.find(x => x.id === id);
  item.learned = !item.learned;
  saveQA();
  applySearch();
}

// ---------- Quiz ----------
function updateQuizMeta() {
  const el = $("quizMeta");
  if (!el) return;

  const usable = (filteredIds.length ? filteredIds : qaItems.map(x => x.id)).length;
  el.textContent = `${usable} frågor tillgängliga för quiz`;
}

function startQuiz() {
  const wrap = $("quizWrap");
  const result = $("quizResult");

  wrap.innerHTML = "";
  if (result) result.style.display = "none";

  const sourceIds = filteredIds.length ? filteredIds : qaItems.map(x => x.id);
  const items = qaItems.filter(x => sourceIds.includes(x.id));

  if (items.length === 0) {
    wrap.innerHTML = `<div class="item"><div class="a">Inga frågor att quizza på. Lägg till frågor först 🙂</div></div>`;
    return;
  }

  quizOrder = items.map(x => x.id).sort(() => Math.random() - 0.5);

  quizOrder.forEach((id, idx) => {
    const item = qaItems.find(x => x.id === id);

    const qBox = document.createElement("div");
    qBox.className = "quizQ";

    qBox.innerHTML = `
      <div class="qtitle">${idx + 1}. ${escapeHtml(item.q)}</div>
      <input type="text" data-quiz-id="${item.id}" placeholder="Skriv ditt svar..." />
      <div class="tip">Tips: svaret behöver bara vara ungefär rätt.</div>
    `;

    wrap.appendChild(qBox);
  });
}

function submitQuiz() {
  const wrap = $("quizWrap");
  const result = $("quizResult");

  const inputs = wrap.querySelectorAll("input[data-quiz-id]");
  let correctCount = 0;

  inputs.forEach(inp => {
    const id = inp.getAttribute("data-quiz-id");
    const item = qaItems.find(x => x.id === id);

    const ok = isCloseEnough(inp.value, item.a);
    if (ok) correctCount++;

    inp.style.borderColor = ok ? "rgba(34,197,94,.6)" : "rgba(239,68,68,.55)";
  });

  result.style.display = "block";
  result.textContent = `Resultat: ${correctCount}/${inputs.length}`;
}

// ---------- Flashcards ----------
function rebuildFlashDeck() {
  const onlyUnlearned = $("onlyUnlearned")?.checked || false;
  const sourceIds = filteredIds.length ? filteredIds : qaItems.map(x => x.id);

  const base = qaItems.filter(x => sourceIds.includes(x.id));
  const final = onlyUnlearned ? base.filter(x => !x.learned) : base;

  flashDeck = final.map(x => x.id);

  if (flashIndex >= flashDeck.length) flashIndex = 0;
  updateFlashMeta();
}

function updateFlashMeta() {
  const el = $("flashMeta");

  if (flashDeck.length === 0) {
    el.textContent = "0 kort";
  } else {
    el.textContent = `Kort ${flashIndex + 1} / ${flashDeck.length}`;
  }
}

function renderFlashcard() {
  const side = $("cardSide");
  const title = $("flashTitle");
  const body = $("flashBody");

  if (flashDeck.length === 0) {
    side.textContent = "Fråga";
    title.textContent = "—";
    body.textContent = "Lägg in frågor i Frågebyggaren först 🙂";
    return;
  }

  const item = currentCard();

  side.textContent = flashFlipped ? "Svar" : "Fråga";
  title.textContent = item.learned ? "Lärd ✓" : "Ej lärd";
  body.textContent = flashFlipped ? item.a : item.q;

  updateFlashMeta();
}

// ---------- Init ----------
function init() {

  filteredIds = qaItems.map(x => x.id);

  wireTabs();
  wireSearch();
  wireBuilder();
  wireQuiz();
  wireFlash();
  wireImportExport();

  applySearch();
  setView("builderView");
}

document.addEventListener("DOMContentLoaded", init);