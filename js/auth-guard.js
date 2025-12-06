// File: js/auth-guard.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);
const body = document.querySelector("body");

// 1. SAFETY FIRST: Ensure body is visible
body.style.display = "block";

console.log("Auth Guard: Active");

onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    const isLoginPage = path.includes("auth.html");
    const isAdminPage = path.includes("admin.html");

    console.log("User Status:", user ? user.email : "Logged Out");

    if (user) {
        // --- LOGGED IN ---
        if (isLoginPage) {
            // Redirect logged-in users away from login page
            if (user.email === "admin@sbtet.com") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "index.html";
            }
        } else if (isAdminPage && user.email !== "admin@sbtet.com") {
            // Protect Admin Page
            alert("Access Denied: Admins Only");
            window.location.href = "index.html";
        }
        // Otherwise, let them stay on the current page (index.html or admin.html)
    } else {
        // --- NOT LOGGED IN ---
        if (!isLoginPage) {
            // Kick to login if trying to access protected pages
            window.location.href = "auth.html";
        }
    }
});

// Global Error Handler
window.addEventListener('error', (e) => {
    console.error("Global Error:", e.message);
    // Uncomment the next line only if you want popups for every error
    // alert("System Error: " + e.message);
});
