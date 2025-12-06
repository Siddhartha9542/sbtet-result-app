// File: js/setup_db.js
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { app } from "./firebase-config.js";

const db = getFirestore(app);

// Your specific data from the screenshot
const data = {
    "batch_23": {
        scheme: 9,
        "1": "75", "2": "78", "3": "85", "4": "91"
    },
    "batch_22": {
        scheme: 9,
        "1": "66", "2": "71", "3": "75", "4": "78", "5": "85", "6": "91"
    },
    "batch_24": {
        scheme: 11, // Note: Scheme 11
        "1": "85", "2": "91"
    }
};

async function uploadData() {
    console.log("Starting Data Upload...");
    try {
        await setDoc(doc(db, "exam_config", "batch_23"), data.batch_23);
        await setDoc(doc(db, "exam_config", "batch_22"), data.batch_22);
        await setDoc(doc(db, "exam_config", "batch_24"), data.batch_24);
        alert("✅ Database Loaded with Batch 22, 23, 24 Data!");
    } catch (e) {
        console.error("Error:", e);
        alert("Error uploading data check console");
    }
}

// Auto-run when file loads (Remove this file after use)
uploadData();
