/* =========================
   Flashcards / Quiz / Builder
   flashcards.js
   ========================= */

const QA_STORAGE_KEY = "studyQA_v1"; // same key across pages if you want

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

// ---------- Global search ----------
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

  el.textContent = `Totalt: ${total} • Visas: ${shown} • Inlärda: ${learned}`;
}

function renderQAList() {
  const list = $("qaList");
  if (!list) return;

  list.innerHTML = "";

  const idSet = new Set(filteredIds.length ? filteredIds : qaItems.map(x => x.id));
  const items = qaItems.filter(x => idSet.has(x.id));

  if (items.length === 0) {
    list.innerHTML = `<div class="item"><div class="a">Inga frågor matchar sökningen. 🙂</div></div>`;
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
            <div class="q">F: ${escapeHtml(item.q)}</div>
            <div class="a">S: ${escapeHtml(item.a)}</div>
            <div class="a" style="margin-top:8px;">Status: <b>${item.learned ? "Inlärd ✓" : "Ej inlärd"}</b></div>
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
      if (!id) return;

      if (action === "delete") deleteQA(id);
      if (action === "edit") editQA(id);
      if (action === "toggle") toggleLearned(id);
    });
  });
}

function addQA() {
  const qEl = $("qInput");
  const aEl = $("aInput");
  if (!qEl || !aEl) return;

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
  const ok = confirm("Vill du rensa ALLA frågor?");
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
  if (!item) return;
  item.learned = !item.learned;
  saveQA();
  applySearch();
}

// ---------- Quiz ----------
function updateQuizMeta() {
  const el = $("quizMeta");
  if (!el) return;

  const usable = (filteredIds.length ? filteredIds : qaItems.map(x => x.id)).length;
  el.textContent = `${usable} frågor tillgängliga för quiz (baserat på sökning)`;
}

function normalizeAnswer(s) {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:()"]/g, "");
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length) || 1;
  return 1 - dist / maxLen;
}

function isCloseEnough(user, correct) {
  const u = normalizeAnswer(user);
  const c = normalizeAnswer(correct);
  if (!u) return false;
  if (u === c) return true;
  if (u.includes(c) || c.includes(u)) return true;
  return similarity(u, c) >= 0.72;
}

function startQuiz() {
  const wrap = $("quizWrap");
  const result = $("quizResult");
  if (!wrap) return;

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
    if (!item) return;

    const qBox = document.createElement("div");
    qBox.className = "quizQ";
    qBox.innerHTML = `
      <div class="qtitle">${idx + 1}. ${escapeHtml(item.q)}</div>
      <input type="text" data-quiz-id="${item.id}" placeholder="Skriv ditt svar..." />
      <div class="tip">Tips: vi kollar “nästan rätt”.</div>
    `;
    wrap.appendChild(qBox);
  });
}

function submitQuiz() {
  const wrap = $("quizWrap");
  const result = $("quizResult");
  if (!wrap || !result) return;

  const inputs = wrap.querySelectorAll("input[data-quiz-id]");
  if (inputs.length === 0) return;

  let correctCount = 0;

  inputs.forEach(inp => {
    const id = inp.getAttribute("data-quiz-id");
    const item = qaItems.find(x => x.id === id);
    if (!item) return;

    const ok = isCloseEnough(inp.value, item.a);
    if (ok) correctCount++;

    inp.style.borderColor = ok ? "rgba(34,197,94,.6)" : "rgba(239,68,68,.55)";
    inp.style.background = ok ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.06)";
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

  if (flashIndex >= flashDeck.length) flashIndex = Math.max(0, flashDeck.length - 1);
  if (flashDeck.length === 0) {
    flashIndex = 0;
    flashFlipped = false;
  }
  updateFlashMeta();
}

function updateFlashMeta() {
  const el = $("flashMeta");
  if (!el) return;

  if (flashDeck.length === 0) {
    el.textContent = "0 kort";
  } else {
    el.textContent = `Kort ${flashIndex + 1} / ${flashDeck.length}`;
  }
}

function currentCard() {
  const id = flashDeck[flashIndex];
  return qaItems.find(x => x.id === id) || null;
}

function renderFlashcard() {
  const side = $("cardSide");
  const title = $("flashTitle");
  const body = $("flashBody");
  if (!side || !title || !body) return;

  if (flashDeck.length === 0) {
    side.textContent = "Fråga";
    title.textContent = "—";
    body.textContent = "Lägg in frågor i Question Builder först 🙂";
    updateFlashMeta();
    return;
  }

  const item = currentCard();
  if (!item) return;

  side.textContent = flashFlipped ? "Svar" : "Fråga";
  title.textContent = item.learned ? "Inlärd ✓" : "Ej inlärd";
  body.textContent = flashFlipped ? item.a : item.q;

  updateFlashMeta();
}

function nextCard() {
  if (flashDeck.length === 0) return;
  flashIndex = (flashIndex + 1) % flashDeck.length;
  flashFlipped = false;
  renderFlashcard();
}

function prevCard() {
  if (flashDeck.length === 0) return;
  flashIndex = (flashIndex - 1 + flashDeck.length) % flashDeck.length;
  flashFlipped = false;
  renderFlashcard();
}

function flipCard() {
  if (flashDeck.length === 0) return;
  flashFlipped = !flashFlipped;
  renderFlashcard();
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