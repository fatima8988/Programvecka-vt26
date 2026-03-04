// auth-progress.js (GOOGLE LOGIN ONLY) — ES MODULE
// Paste this entire file and replace firebaseConfig

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/* ---------------------------
   1) Firebase config
   (Firebase Console → Project settings → Your apps → Web app)
---------------------------- */
 const firebaseConfig = {
    apiKey: "AIzaSyBeuQ9TQ8FVTd6LfxhBpcoeOC5azlzffIw",
    authDomain: "vt26-ecb6e.firebaseapp.com",
    projectId: "vt26-ecb6e",
    storageBucket: "vt26-ecb6e.firebasestorage.app",
    messagingSenderId: "936209099054",
    appId: "1:936209099054:web:9e445447125f455c1fb2bf",
    measurementId: "G-SX8LP24F3J"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* ---------------------------
   2) Keep globals (so other JS won't break)
---------------------------- */
window.StudyProgress = window.StudyProgress || { currentUser: null, progress: { quizzes: {} } };
window.StudyData = window.StudyData || { async syncCalendarNow() { /* no-op */ } };

/* ---------------------------
   3) UI elements
---------------------------- */
const modal = document.getElementById("profileModal");
const openBtn = document.getElementById("openProfile");
const closeBtn = document.getElementById("closeProfile");

const authLoggedOut = document.getElementById("authLoggedOut");
const authLoggedIn = document.getElementById("authLoggedIn");

const msgEl = document.getElementById("authMsg");
const userEmailEl = document.getElementById("authUserEmail");

const profileName = document.getElementById("profileName");
const profileRole = document.getElementById("profileRole");
const welcomeName = document.getElementById("welcomeName");

// You must have this button in HTML:
const btnGoogle = document.getElementById("btnGoogle");

// You already have this in your HTML:
const btnLogout = document.getElementById("btnLogout");

/* ---------------------------
   4) Modal open/close
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

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ---------------------------
   5) Google login/logout
---------------------------- */
btnGoogle?.addEventListener("click", async () => {
  if (msgEl) msgEl.textContent = "";
  try {
    // Optional: force account chooser every time
    provider.setCustomParameters({ prompt: "select_account" });

    await signInWithPopup(auth, provider);
    if (msgEl) msgEl.textContent = "Logged in with Google ✅";
    modal?.classList.add("hidden");
  } catch (e) {
    if (msgEl) msgEl.textContent = e?.code || e?.message || "Google login failed";
  }
});

btnLogout?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (e) {
    // optional
    console.error(e);
  }
});

/* ---------------------------
   6) Auth state → update UI
---------------------------- */
function setLoggedInUI(user) {
  authLoggedOut?.classList.add("hidden");
  authLoggedIn?.classList.remove("hidden");

  const niceName =
    user.displayName ||
    (user.email ? user.email.split("@")[0] : "Student");

  if (userEmailEl) userEmailEl.textContent = user.email || "(no email)";
  if (profileName) profileName.textContent = niceName;
  if (profileRole) profileRole.textContent = "Student (Logged in)";
  if (welcomeName) welcomeName.textContent = niceName;
}

function setLoggedOutUI() {
  authLoggedIn?.classList.add("hidden");
  authLoggedOut?.classList.remove("hidden");

  if (profileName) profileName.textContent = "*your name";
  if (profileRole) profileRole.textContent = "Student";
  if (welcomeName) welcomeName.textContent = "*YOUR NAME";
}

onAuthStateChanged(auth, (user) => {
  // store lightweight user info for other scripts
  window.StudyProgress.currentUser = user
    ? {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || ""
      }
    : null;

  // notify other scripts if they listen to auth changes
  window.dispatchEvent(
    new CustomEvent("authChanged", { detail: { user: window.StudyProgress.currentUser } })
  );

  if (user) setLoggedInUI(user);
  else setLoggedOutUI();
});