// auth-google.js — Google Login + keeps your modal working

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/* ✅ PASTE YOUR CONFIG HERE */
const firebaseConfig = {
    apiKey: "AIzaSyAeL0PHa89X84UODVcSiLN4xVunb6LrnSc",
    authDomain: "projektveckan.firebaseapp.com",
    projectId: "projektveckan",
    storageBucket: "projektveckan.firebasestorage.app",
    messagingSenderId: "492002042687",
    appId: "1:492002042687:web:c51dce741d0c7cade8e98a",
    measurementId: "G-FRGZJTBWLZ"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* ---------- elements you already have ---------- */
const profileModal  = document.getElementById("profileModal");
const openProfile   = document.getElementById("openProfile");
const closeProfile  = document.getElementById("closeProfile");

const authLoggedOut = document.getElementById("authLoggedOut");
const authLoggedIn  = document.getElementById("authLoggedIn");
const authUserEmail = document.getElementById("authUserEmail");
const authMsg       = document.getElementById("authMsg");

const btnGoogle     = document.getElementById("btnGoogle");
const btnLogin      = document.getElementById("btnLogin");
const btnSignup     = document.getElementById("btnSignup");
const btnLogout     = document.getElementById("btnLogout");

const authEmail     = document.getElementById("authEmail");
const authPass      = document.getElementById("authPass");

/* profile display you already have */
const profileName   = document.getElementById("profileName");
const welcomeName   = document.getElementById("welcomeName");

/* ---------- modal open/close (same ids as your html) ---------- */
function openModal(){ profileModal?.classList.remove("hidden"); }
function closeModal(){ profileModal?.classList.add("hidden"); }

openProfile?.addEventListener("click", openModal);
closeProfile?.addEventListener("click", closeModal);

// click outside closes
profileModal?.addEventListener("click", (e) => {
  if (e.target === profileModal) closeModal();
});

/* ---------- helpers ---------- */
function setMsg(text = "", isError = false) {
  if (!authMsg) return;
  authMsg.textContent = text;
  authMsg.style.color = isError ? "#ff6aa3" : "";
}

function setUserUI(user) {
  if (!user) {
    authLoggedIn?.classList.add("hidden");
    authLoggedOut?.classList.remove("hidden");

    if (profileName) profileName.textContent = "*ditt namn";
    if (welcomeName) welcomeName.textContent = "*DITT NAMN";
    return;
  }

  authLoggedOut?.classList.add("hidden");
  authLoggedIn?.classList.remove("hidden");

  const display = user.displayName || (user.email ? user.email.split("@")[0] : "User");

  if (authUserEmail) authUserEmail.textContent = user.email || display;
  if (profileName) profileName.textContent = display;
  if (welcomeName) welcomeName.textContent = display;
}

/* ---------- Google login ---------- */
btnGoogle?.addEventListener("click", async () => {
  try {
    setMsg("");
    await signInWithPopup(auth, provider);
    closeModal();
  } catch (err) {
    console.error(err);
    setMsg(err?.message || "Google login failed", true);
  }
});

/* ---------- email/pass (keeps your current buttons working) ---------- */
btnLogin?.addEventListener("click", async () => {
  try {
    setMsg("");
    const email = authEmail.value.trim();
    const pass  = authPass.value.trim();
    await signInWithEmailAndPassword(auth, email, pass);
    closeModal();
  } catch (err) {
    console.error(err);
    setMsg(err?.message || "Login failed", true);
  }
});

btnSignup?.addEventListener("click", async () => {
  try {
    setMsg("");
    const email = authEmail.value.trim();
    const pass  = authPass.value.trim();
    await createUserWithEmailAndPassword(auth, email, pass);
    closeModal();
  } catch (err) {
    console.error(err);
    setMsg(err?.message || "Signup failed", true);
  }
});

/* ---------- logout ---------- */
btnLogout?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    closeModal();
  } catch (err) {
    console.error(err);
    setMsg(err?.message || "Logout failed", true);
  }
});

/* ---------- keep UI updated ---------- */
onAuthStateChanged(auth, (user) => setUserUI(user));