// auth-progress.js (ES MODULE)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ---------------------------
   1) Firebase config (COPY FRESH from Firebase Console → CDN)
---------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyAM12PNCQr0ige1GS3iIkxIjNbmY94gcAg",
  authDomain: "projektvecka.firebaseapp.com",
  projectId: "projektvecka",
  storageBucket: "projektvecka.firebasestorage.app",
  messagingSenderId: "86535425017",
  appId: "1:86535425017:web:69c21f947c328708574b28"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ---------------------------
   2) Firestore refs
---------------------------- */
const progressDocRef = (uid) => doc(db, "users", uid, "progress", "main");
const dataDocRef = (uid) => doc(db, "users", uid, "data", "main");

/* ---------------------------
   3) Cloud save/load for calendarEvents (your reminders)
---------------------------- */
async function loadCalendarEventsFromCloud(uid) {
  const snap = await getDoc(dataDocRef(uid));
  if (!snap.exists()) return null;
  return snap.data()?.calendarEvents ?? null;
}

async function saveCalendarEventsToCloud(uid, calendarEvents) {
  await setDoc(
    dataDocRef(uid),
    { calendarEvents, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/* Expose a simple sync for funktioner.js */
window.StudyData = {
  async syncCalendarNow() {
    const user = window.StudyProgress?.currentUser;
    if (!user) return;

    const raw = localStorage.getItem("calendarEvents");
    let parsed;
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = {};
    }
    await saveCalendarEventsToCloud(user.uid, parsed);
  }
};

/* ---------------------------
   4) UI elements
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
   5) Modal open/close
---------------------------- */
function openModal() {
  modal?.classList.remove("hidden");
  if (msgEl) msgEl.textContent = "";
}
function closeModal() {
  modal?.classList.add("hidden");
  if (msgEl) msgEl.textContent = "";
}

openBtn?.addEventListener("click", openModal);
closeBtn?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

/* ---------------------------
   6) Auth buttons
---------------------------- */
btnSignup?.addEventListener("click", async () => {
  if (!emailEl || !passEl) return;
  if (msgEl) msgEl.textContent = "";
  try {
    await createUserWithEmailAndPassword(auth, emailEl.value.trim(), passEl.value);
    if (msgEl) msgEl.textContent = "Account created ✅";
  } catch (e) {
    if (msgEl) msgEl.textContent = e?.code ? `${e.code}` : (e?.message || "Signup failed");
  }
});

btnLogin?.addEventListener("click", async () => {
  if (!emailEl || !passEl) return;
  if (msgEl) msgEl.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, emailEl.value.trim(), passEl.value);
    if (msgEl) msgEl.textContent = "Logged in ✅";
  } catch (e) {
    if (msgEl) msgEl.textContent = e?.code ? `${e.code}` : (e?.message || "Login failed");
  }
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
});

/* ---------------------------
   7) Progress helpers (quizzes)
---------------------------- */
async function loadProgress(uid) {
  const snap = await getDoc(progressDocRef(uid));
  return snap.exists() ? snap.data() : { quizzes: {} };
}

async function saveProgress(uid, progress) {
  await setDoc(
    progressDocRef(uid),
    { ...progress, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

window.StudyProgress = {
  currentUser: null,
  progress: { quizzes: {} },

  async markOpened(quizId) {
    if (!this.currentUser) return;
    this.progress.quizzes ??= {};
    this.progress.quizzes[quizId] ??= {};
    this.progress.quizzes[quizId].opened = true;
    this.progress.quizzes[quizId].updatedAt = Date.now();
    await saveProgress(this.currentUser.uid, { quizzes: this.progress.quizzes });
  },

  async saveAnswers(quizId, answersObj) {
    if (!this.currentUser) return;
    this.progress.quizzes ??= {};
    this.progress.quizzes[quizId] ??= {};
    this.progress.quizzes[quizId].opened = true;
    this.progress.quizzes[quizId].answers = answersObj;
    this.progress.quizzes[quizId].updatedAt = Date.now();
    await saveProgress(this.currentUser.uid, { quizzes: this.progress.quizzes });
  },

  async markCompleted(quizId, scoreNumber = null) {
    if (!this.currentUser) return;
    this.progress.quizzes ??= {};
    this.progress.quizzes[quizId] ??= {};
    this.progress.quizzes[quizId].opened = true;
    this.progress.quizzes[quizId].completed = true;
    if (typeof scoreNumber === "number") this.progress.quizzes[quizId].lastScore = scoreNumber;
    this.progress.quizzes[quizId].updatedAt = Date.now();
    await saveProgress(this.currentUser.uid, { quizzes: this.progress.quizzes });
  }
};

function updateQuizCardsUI(progress) {
  const quizzes = progress?.quizzes || {};
  document.querySelectorAll("[data-quiz-id]").forEach((el) => {
    const id = el.getAttribute("data-quiz-id");
    const q = quizzes[id];
    el.classList.remove("quiz-opened", "quiz-done");
    if (q?.completed) el.classList.add("quiz-done");
    else if (q?.opened) el.classList.add("quiz-opened");
  });
}

/* ---------------------------
   8) Auth state (load progress + calendarEvents)
---------------------------- */
onAuthStateChanged(auth, async (user) => {
  window.StudyProgress.currentUser = user;

  if (user) {
    authLoggedOut?.classList.add("hidden");
    authLoggedIn?.classList.remove("hidden");

    userEmailEl && (userEmailEl.textContent = user.email || "(no email)");
    const niceName = user.displayName || (user.email ? user.email.split("@")[0] : "Student");
    profileName && (profileName.textContent = niceName);
    profileRole && (profileRole.textContent = "Student (Logged in)");
    welcomeName && (welcomeName.textContent = niceName);

    // 1) Load progress
    const p = await loadProgress(user.uid);
    window.StudyProgress.progress = p;
    updateQuizCardsUI(p);

    // 2) Load calendarEvents from cloud → localStorage → tell funktioner.js to refresh
    const cloudEvents = await loadCalendarEventsFromCloud(user.uid);
    if (cloudEvents) {
      localStorage.setItem("calendarEvents", JSON.stringify(cloudEvents));
      window.dispatchEvent(new Event("calendarEventsLoaded"));
    } else {
  // first time: upload local copy
  await window.StudyData.syncCalendarNow();
  window.dispatchEvent(new Event("calendarEventsLoaded"));
}
  } else {
    authLoggedIn?.classList.add("hidden");
    authLoggedOut?.classList.remove("hidden");

    profileName && (profileName.textContent = "*your name");
    profileRole && (profileRole.textContent = "Student");
    welcomeName && (welcomeName.textContent = "*YOUR NAME");

    window.StudyProgress.progress = { quizzes: {} };
    updateQuizCardsUI({ quizzes: {} });
  }
});