// auth-progress.js (NO FIREBASE) — keeps the same globals so other scripts don't break

/* ---------------------------
   "Globals" that other scripts may rely on
---------------------------- */
window.StudyProgress = window.StudyProgress || {
  currentUser: null,          // { email, uid } or null
  progress: { quizzes: {} }
};

window.StudyData = window.StudyData || {
  async syncCalendarNow() {
    // no-op: exists so funktioner.js can call it without crashing
    return;
  }
};

/* ---------------------------
   LocalStorage keys
---------------------------- */
const USERS_KEY = "ps_users_v1";      // { "email": { pass: "...", createdAt: ... } }
const SESSION_KEY = "ps_session_v1";  // { email: "..." }

/* ---------------------------
   Helpers
---------------------------- */
function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function setSession(email) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
function getSessionEmail() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const s = raw ? JSON.parse(raw) : null;
    return s?.email || null;
  } catch {
    return null;
  }
}
function simpleUidFromEmail(email) {
  // stable "uid" so other code can use it
  const str = String(email || "").toLowerCase().trim();
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return "uid_" + h.toString(16);
}
function setMsg(text = "") {
  if (msgEl) msgEl.textContent = text;
}

/* ---------------------------
   UI elements (same ids as your HTML)
---------------------------- */
const modal = document.getElementById("profileModal");
const openBtn = document.getElementById("openProfile");
const closeBtn = document.getElementById("closeProfile");

const authLoggedOut = document.getElementById("authLoggedOut");
const authLoggedIn = document.getElementById("authLoggedIn");

const emailEl = document.getElementById("authEmail");
const passEl = document.getElementById("authPass");

const btnLogin = document.getElementById("btnLogin");
const btnSignup = document.getElementById("btnSignup");
const btnLogout = document.getElementById("btnLogout");

const msgEl = document.getElementById("authMsg");
const userEmailEl = document.getElementById("authUserEmail");

const profileName = document.getElementById("profileName");
const profileRole = document.getElementById("profileRole");
const welcomeName = document.getElementById("welcomeName");

/* ---------------------------
   Modal open/close
---------------------------- */
function openModal() {
  modal?.classList.remove("hidden");
  setMsg("");
}
function closeModal() {
  modal?.classList.add("hidden");
  setMsg("");
}

openBtn?.addEventListener("click", openModal);
closeBtn?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

/* ---------------------------
   State -> UI
---------------------------- */
function applyAuthState(user) {
  window.StudyProgress.currentUser = user;

  // let other scripts react if they want
  window.dispatchEvent(new CustomEvent("authChanged", { detail: { user } }));

  if (user) {
    authLoggedOut?.classList.add("hidden");
    authLoggedIn?.classList.remove("hidden");

    userEmailEl && (userEmailEl.textContent = user.email);

    const niceName = user.email.split("@")[0];
    profileName && (profileName.textContent = niceName);
    profileRole && (profileRole.textContent = "Student (Logged in)");
    welcomeName && (welcomeName.textContent = niceName);

    modal?.classList.add("hidden");
  } else {
    authLoggedIn?.classList.add("hidden");
    authLoggedOut?.classList.remove("hidden");

    profileName && (profileName.textContent = "*your name");
    profileRole && (profileRole.textContent = "Student");
    welcomeName && (welcomeName.textContent = "*YOUR NAME");
  }
}

/* ---------------------------
   Signup / Login / Logout (LOCAL ONLY)
---------------------------- */
btnSignup?.addEventListener("click", () => {
  const email = emailEl?.value?.trim().toLowerCase();
  const pass = passEl?.value ?? "";

  if (!email || !pass) return setMsg("Fill in email + password");

  const users = loadUsers();
  if (users[email]) return setMsg("User already exists. Log in instead.");

  users[email] = { pass, createdAt: Date.now() };
  saveUsers(users);

  setMsg("Account created ✅ (local)");
});

btnLogin?.addEventListener("click", () => {
  const email = emailEl?.value?.trim().toLowerCase();
  const pass = passEl?.value ?? "";

  if (!email || !pass) return setMsg("Fill in email + password");

  const users = loadUsers();
  if (!users[email]) return setMsg("No account found. Click Sign up.");

  if (users[email].pass !== pass) return setMsg("Wrong password ❌");

  setSession(email);
  applyAuthState({ email, uid: simpleUidFromEmail(email) });
  setMsg("Logged in ✅");
});

btnLogout?.addEventListener("click", () => {
  clearSession();
  applyAuthState(null);
});

/* ---------------------------
   Init: restore session
---------------------------- */
(function initAuth() {
  const email = getSessionEmail();
  if (email) {
    applyAuthState({ email, uid: simpleUidFromEmail(email) });
  } else {
    applyAuthState(null);
  }
})();