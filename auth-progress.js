// auth-progress.js (SIMPLE AUTH ONLY) — ES MODULE

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ✅ Paste your config EXACTLY from Firebase Console (CDN)
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

// ---- UI elements ----
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

// ---- Modal open/close ----
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

// ---- Auth buttons ----
btnSignup?.addEventListener("click", async () => {
  if (!emailEl || !passEl) return;
  if (msgEl) msgEl.textContent = "";
  try {
    await createUserWithEmailAndPassword(auth, emailEl.value.trim(), passEl.value);
    if (msgEl) msgEl.textContent = "Account created ✅";
  } catch (e) {
    if (msgEl) msgEl.textContent = e?.code || e?.message || "Signup failed";
  }
});

btnLogin?.addEventListener("click", async () => {
  if (!emailEl || !passEl) return;
  if (msgEl) msgEl.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, emailEl.value.trim(), passEl.value);
    if (msgEl) msgEl.textContent = "Logged in ✅";
  } catch (e) {
    if (msgEl) msgEl.textContent = e?.code || e?.message || "Login failed";
  }
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
});

// ---- Auth state ----
onAuthStateChanged(auth, (user) => {
  if (user) {
    authLoggedOut?.classList.add("hidden");
    authLoggedIn?.classList.remove("hidden");

    userEmailEl && (userEmailEl.textContent = user.email || "(no email)");
    const niceName = user.email ? user.email.split("@")[0] : "Student";

    profileName && (profileName.textContent = niceName);
    profileRole && (profileRole.textContent = "Student (Logged in)");
    welcomeName && (welcomeName.textContent = niceName);

    // optional: close modal after login
    modal?.classList.add("hidden");
  } else {
    authLoggedIn?.classList.add("hidden");
    authLoggedOut?.classList.remove("hidden");

    profileName && (profileName.textContent = "*your name");
    profileRole && (profileRole.textContent = "Student");
    welcomeName && (welcomeName.textContent = "*YOUR NAME");
  }
});