import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "PASTE",
  authDomain: "PASTE",
  projectId: "PASTE",
  storageBucket: "PASTE",
  messagingSenderId: "PASTE",
  appId: "PASTE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById("profileBtn");
const logoutBtn = document.getElementById("logoutBtn");

loginBtn.onclick = () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Loggad in:", result.user);
    })
    .catch((error) => {
      console.error(error);
    });
};

if (logoutBtn) {
  logoutBtn.onclick = () => {
    signOut(auth);
  };
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Användaren är inloggad:", user.displayName);
    loginBtn.innerText = user.displayName;
  } else {
    loginBtn.innerText = "Login";
  }
});