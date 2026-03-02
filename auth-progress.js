// auth-progress.js
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
   1) Firebase config
   Firebase Console → Project settings → Your apps → Web app
---------------------------- */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ---------------------------
   2) Modal / UI wiring
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

function openModal() { modal.classList.remove("hidden"); msgEl.textContent = ""; }
function closeModal() { modal.classList.add("hidden"); msgEl.textContent = ""; }

openBtn?.addEventListener("click", openModal);
closeBtn?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

btnSignup?.addEventListener("click", async () => {
  msgEl.textContent = "";
  try {
    await createUserWithEmailAndPassword(auth, emailEl.value.trim(), passEl.value);
    msgEl.textContent = "Account created ✅";
  } catch (e) {
    msgEl.textContent = e.message;
  }
});

btnLogin?.addEventListener("click", async () => {
  msgEl.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, emailEl.value.trim(), passEl.value);
    msgEl.textContent = "Logged in ✅";
  } catch (e) {
    msgEl.textContent = e.message;
  }
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
});

/* ---------------------------
   3) Progress model (important)
   We'll store per user:
   users/{uid}/progress/main
   {
     quizzes: {
       quiz1: { opened: true, completed: false, lastScore: 3, answers: {...}, updatedAt: ... },
       quiz2: ...
     }
   }
---------------------------- */
function progressDocRef(uid) {
  // "main" doc keeps it simple
  return doc(db, "users", uid, "progress", "main");
}

async function loadProgress(uid) {
  const snap = await getDoc(progressDocRef(uid));
  return snap.exists() ? snap.data() : { quizzes: {} };
}

async function saveProgress(uid, progress) {
  await setDoc(progressDocRef(uid), {
    ...progress,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/* ---------------------------
   4) Public helpers YOU can call from your quiz code
   window.StudyProgress.* so it’s easy to use anywhere
---------------------------- */
window.StudyProgress = {
  currentUser: null,
  progress: { quizzes: {} },

  // call when a student opens a quiz page/modal
  async markOpened(quizId) {
    if (!this.currentUser) return;
    this.progress.quizzes ??= {};
    this.progress.quizzes[quizId] ??= {};
    this.progress.quizzes[quizId].opened = true;
    this.progress.quizzes[quizId].updatedAt = Date.now();
    await saveProgress(this.currentUser.uid, { quizzes: this.progress.quizzes });
  },

  // call when they save answers mid-quiz
  async saveAnswers(quizId, answersObj) {
    if (!this.currentUser) return;
    this.progress.quizzes ??= {};
    this.progress.quizzes[quizId] ??= {};
    this.progress.quizzes[quizId].opened = true;
    this.progress.quizzes[quizId].answers = answersObj; // store their work
    this.progress.quizzes[quizId].updatedAt = Date.now();
    await saveProgress(this.currentUser.uid, { quizzes: this.progress.quizzes });
  },

  // call when they submit/finish the quiz
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

/* ---------------------------
   5) Sync UI on login + load progress
---------------------------- */
onAuthStateChanged(auth, async (user) => {
  window.StudyProgress.currentUser = user;

  if (user) {
    authLoggedOut.classList.add("hidden");
    authLoggedIn.classList.remove("hidden");

    userEmailEl.textContent = user.email || "(no email)";
    const niceName = user.displayName || (user.email ? user.email.split("@")[0] : "Student");
    profileName.textContent = niceName;
    profileRole.textContent = "Student (Logged in)";

    // Load saved progress
    const data = await loadProgress(user.uid);
    window.StudyProgress.progress = data;

    // OPTIONAL: automatically update your UI “quiz cards” if you add data attributes
    updateQuizCardsUI(data);
  } else {
    authLoggedIn.classList.add("hidden");
    authLoggedOut.classList.remove("hidden");
    profileName.textContent = "*your name";
    profileRole.textContent = "Student";
    window.StudyProgress.progress = { quizzes: {} };

    updateQuizCardsUI({ quizzes: {} });
  }
});

/* ---------------------------
   6) OPTIONAL: UI marking (done/opened/not opened)
   Add data-quiz-id="quiz1" on each quiz card button/link.
---------------------------- */
function updateQuizCardsUI(progress) {
  const quizzes = progress?.quizzes || {};
  document.querySelectorAll("[data-quiz-id]").forEach((el) => {
    const id = el.getAttribute("data-quiz-id");
    const q = quizzes[id];

    // reset
    el.classList.remove("quiz-opened", "quiz-done");

    if (q?.completed) el.classList.add("quiz-done");
    else if (q?.opened) el.classList.add("quiz-opened");
  });
}