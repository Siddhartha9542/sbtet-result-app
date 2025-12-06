// File: js/script.js

let myChart = null;

const EXAM_CONFIG = {
    "23": { scheme: "9", sems: { "1": "75", "2": "78", "3": "85", "4": "91" } },
    "22": { scheme: "9", sems: { "1": "66", "2": "71", "3": "75", "4": "78", "5": "85", "6": "91" } },
    "24": { scheme: "11", sems: { "1": "85", "2": "91" } }
};

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("searchBtn");
    if (btn) btn.addEventListener("click", fetchResult);
    
    const resultPageBtn = document.getElementById("openResultPageBtn");
    if (resultPageBtn) {
        resultPageBtn.addEventListener("click", () => {
            window.location.href = "result.html";
        });
    }
});

// Helper for Swap Logic
async function fetchOne(pin, semId, examId, scheme) {
    try {
        // UPDATED URL: Relative path for Vercel
        const url = `/api/get_result?pin=${pin}&semYearId=${semId}&examMonthYearId=${examId}&schemeId=${scheme}`;
        const res = await fetch(url);
        const json = await res.json();
        
        // STRICT CHECK: Ensure we actually have subjects. 
        if (json && json.length > 0 && json[0].studentWiseReport && json[0].studentWiseReport.length > 0) {
            return json[0];
        }
    } catch (e) { return null; }
    return null;
}

async function fetchResult() {
    const pin = document.getElementById('pinInput').value.trim().toUpperCase();
    const btn = document.getElementById("searchBtn");

    if (!pin) return alert("Please Enter a PIN");

    btn.disabled = true;
    const originalText = btn.innerText;

    try {
        const batchYear = pin.substring(0, 2); 
        const config = EXAM_CONFIG[batchYear];
        if (!config) throw new Error(`Batch 20${batchYear} not supported.`);

        const scheme = config.scheme;
        const semKeys = Object.keys(config.sems).sort(); 

        let profileData = null;
        let allSemestersData = [];
        let graphData = [];
        let graphLabels = [];
        let latestOverallCgpa = "0.00"; 

        for (const semId of semKeys) {
            const primaryId = config.sems[semId];
            btn.innerText = `Scanning Sem ${semId}...`;

            // --- SWAP LOGIC ---
            let secondaryId = null;
            if (semId === "5") secondaryId = config.sems["6"];
            if (semId === "6") secondaryId = config.sems["5"];

            // 1. Try Primary ID
            let data = await fetchOne(pin, semId, primaryId, scheme);

            // 2. Fallback
            if (!data && secondaryId) {
                console.log(`Sem ${semId} not found in ExamID ${primaryId}. Checking Fallback ID ${secondaryId}...`);
                data = await fetchOne(pin, semId, secondaryId, scheme);
            }

            if (data) {
                if (!profileData && data.studentInfo) profileData = data.studentInfo[0];

                const rawText = JSON.stringify(data);
                const sgpaMatch = rawText.match(/"SGPA"\s*:\s*"?([0-9.]+)"?/i);
                const cgpaMatch = rawText.match(/"CGPA"\s*:\s*"?([0-9.]+)"?/i);

                let semSgpa = 0;
                if (sgpaMatch) semSgpa = parseFloat(sgpaMatch[1]);
                if (cgpaMatch) latestOverallCgpa = cgpaMatch[1];

                allSemestersData.push({
                    semId: semId,
                    subjects: data.studentWiseReport,
                    sgpa: semSgpa
                });

                graphData.push(semSgpa);
                graphLabels.push(`Sem ${semId}`);
            }
        }

        if (!profileData) throw new Error("No data found.");

        // Calculations
        let totalBacklogs = 0;
        allSemestersData.forEach(sem => {
            sem.subjects.forEach(sub => {
                const endMarks = parseInt(sub.EndSemMarks);
                if (sub.HybridGrade === "F" || sub.HybridGrade === "Ab" || (!isNaN(endMarks) && endMarks < 14)) {
                    totalBacklogs++;
                }
            });
        });

        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('studentName').innerText = profileData.StudentName;
        document.getElementById('studentPin').innerText = profileData.Pin;
        document.getElementById('studentBranch').innerText = profileData.BranchName;
        document.getElementById('studentCollege').innerText = profileData.CollegeCode;
        
        document.getElementById('avgCgpa').innerText = latestOverallCgpa;
        document.getElementById('backlogCount').innerText = totalBacklogs;

        renderChart(graphLabels, graphData);

        const sessionData = {
            profile: profileData,
            results: allSemestersData
        };
        sessionStorage.setItem("sbtetData", JSON.stringify(sessionData));

    } catch (e) {
        alert(e.message);
    } finally {
        btn.innerText = "Get Result";
        btn.disabled = false;
    }
}

function renderChart(labels, dataPoints) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'SGPA',
                data: dataPoints,
                borderColor: '#6c5ce7',
                backgroundColor: 'rgba(108, 92, 231, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 5,
                    max: 10,
                    ticks: { stepSize: 0.5 },
                    grid: { color: '#f0f0f0' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
