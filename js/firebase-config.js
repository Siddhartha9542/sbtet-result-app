// File: js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBA5TgzMm6jbJ2wWvkMZNFEOKrA1fakxPc",
  authDomain: "sbtet-result.firebaseapp.com",
  databaseURL: "https://sbtet-result-default-rtdb.firebaseio.com",
  projectId: "sbtet-result",
  storageBucket: "sbtet-result.firebasestorage.app",
  messagingSenderId: "566695565912",
  appId: "1:566695565912:web:1c5db71e3f979a0e85882d",
  measurementId: "G-LR51JJM812"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app };
