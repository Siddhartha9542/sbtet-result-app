// File: js/admin.js

const DEFAULT_CONFIG = {
    "23": { scheme: "9", sems: { "1": "75", "2": "78", "3": "85", "4": "91" } },
    "22": { scheme: "9", sems: { "1": "66", "2": "71", "3": "75", "4": "78", "5": "85", "6": "91" } },
    "24": { scheme: "11", sems: { "1": "85", "2": "91" } }
};

let EXAM_CONFIG = {};
let fetchedStudents = [];

document.addEventListener("DOMContentLoaded", () => {
    loadConfig();
    renderConfigTable();
    document.getElementById('bulkFetchBtn').addEventListener('click', startBulkFetch);
    document.getElementById('downloadExcelBtn').addEventListener('click', downloadExcel);
    document.getElementById('sortBtn').addEventListener('click', sortBySgpa);
    document.getElementById('saveBatchBtn').addEventListener('click', saveNewBatch);
});

function loadConfig() {
    const saved = localStorage.getItem("sbtetConfig");
    EXAM_CONFIG = saved ? JSON.parse(saved) : DEFAULT_CONFIG;
}

function renderConfigTable() {
    const tbody = document.getElementById('configTableBody');
    tbody.innerHTML = "";
    for (const [batch, data] of Object.entries(EXAM_CONFIG)) {
        let examIds = "";
        for (const [sem, id] of Object.entries(data.sems)) {
            examIds += `<b>S${sem}:</b> ${id} &nbsp; `;
        }
        const row = `<tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px;">${batch}</td>
            <td style="padding:10px;">${data.scheme}</td>
            <td style="padding:10px;">${examIds}</td>
        </tr>`;
        tbody.innerHTML += row;
    }
}

function saveNewBatch() {
    const batch = document.getElementById('newBatch').value.trim();
    const scheme = document.getElementById('newScheme').value.trim();
    const semsRaw = document.getElementById('newSems').value.trim();

    if (!batch || !scheme || !semsRaw) return alert("Fill all fields");

    let sems = {};
    try {
        semsRaw.split(',').forEach(pair => {
            const [k, v] = pair.split(':');
            if (k && v) sems[k.trim()] = v.trim();
        });
    } catch (e) { return alert("Invalid Sem Format"); }

    EXAM_CONFIG[batch] = { scheme, sems };
    localStorage.setItem("sbtetConfig", JSON.stringify(EXAM_CONFIG));
    renderConfigTable();
    alert("Saved!");
}

// --- UPDATED LOGIC FOR BULK FETCH ---

async function fetchOne(pin, semId, examId, scheme) {
    try {
        // UPDATED URL: Relative path for Vercel
        const url = `/api/get_result?pin=${pin}&semYearId=${semId}&examMonthYearId=${examId}&schemeId=${scheme}`;
        const res = await fetch(url);
        const json = await res.json();
        
        // STRICT CHECK
        if (json && json.length > 0 && json[0].studentWiseReport && json[0].studentWiseReport.length > 0) {
            return json[0];
        }
    } catch (e) { return null; }
    return null;
}

async function startBulkFetch() {
    const startPin = document.getElementById('startPin').value.trim().toUpperCase();
    const stopPin = document.getElementById('stopPin').value.trim().toUpperCase();
    const btn = document.getElementById('bulkFetchBtn');
    const status = document.getElementById('statusText');
    const bar = document.getElementById('progressBar');
    
    if (!startPin || !stopPin) return alert("Please enter both PINs");

    const batchYear = startPin.substring(0, 2);
    const config = EXAM_CONFIG[batchYear];
    
    if (!config) return alert(`Batch 20${batchYear} Config missing!`);
    
    const semKeys = Object.keys(config.sems).sort(); 
    setupTableHeaders(semKeys);
    
    const prefix = startPin.substring(0, startPin.lastIndexOf('-') + 1); 
    const startNum = parseInt(startPin.split('-').pop());
    const endNum = parseInt(stopPin.split('-').pop());
    const totalStudents = endNum - startNum + 1;

    fetchedStudents = [];
    document.getElementById('bulkTableBody').innerHTML = "";
    btn.disabled = true;
    document.getElementById('downloadExcelBtn').style.display = 'none';

    for (let i = 0; i < totalStudents; i++) {
        const currentNum = startNum + i;
        const pinSuffix = currentNum.toString().padStart(3, '0');
        const pin = prefix + pinSuffix;

        const percent = ((i / totalStudents) * 100).toFixed(0);
        bar.style.width = `${percent}%`;
        status.innerText = `Fetching ${pin} (${i+1}/${totalStudents})...`;

        let studentRecord = {
            name: "Unknown",
            pin: pin,
            semData: {},
            totalCredits: 0,
            avgSgpa: 0,
            validSems: 0
        };

        for (const semId of semKeys) {
            const primaryId = config.sems[semId];
            const scheme = config.scheme;
            
            // --- SWAP LOGIC ---
            let secondaryId = null;
            if (semId === "5") secondaryId = config.sems["6"];
            if (semId === "6") secondaryId = config.sems["5"];

            // 1. Try Primary ID
            let data = await fetchOne(pin, semId, primaryId, scheme);

            // 2. Fallback
            if (!data && secondaryId) {
                data = await fetchOne(pin, semId, secondaryId, scheme);
            }

            if (data) {
                if (studentRecord.name === "Unknown" && data.studentInfo && data.studentInfo.length > 0) {
                    studentRecord.name = data.studentInfo[0].StudentName;
                }

                const rawText = JSON.stringify(data);
                const sgpaMatch = rawText.match(/"SGPA"\s*:\s*"?([0-9.]+)"?/i);
                const credMatch = rawText.match(/"TotalCreditsEarned"\s*:\s*"?([0-9.]+)"?/i);

                let sgpa = 0;
                if (sgpaMatch) sgpa = parseFloat(sgpaMatch[1]);
                
                let credits = 0;
                if (credMatch) credits = parseFloat(credMatch[1]);

                studentRecord.semData[semId] = sgpa;
                studentRecord.totalCredits += credits;
                if (sgpa > 0) studentRecord.validSems++;
            }
        }

        if (studentRecord.validSems > 0) {
            studentRecord.avgSgpa = (Object.values(studentRecord.semData).reduce((a, b) => a + b, 0) / studentRecord.validSems).toFixed(2);
        }

        fetchedStudents.push(studentRecord);
        addTableRow(studentRecord, semKeys);
    }

    status.innerText = "Done!";
    bar.style.width = "100%";
    btn.disabled = false;
    document.getElementById('downloadExcelBtn').style.display = 'block';
}

function setupTableHeaders(semKeys) {
    const headRow = document.getElementById('tableHead').firstElementChild;
    headRow.innerHTML = `<th style="padding:10px;">Name</th><th style="padding:10px;">PIN</th>`;
    semKeys.forEach(sem => headRow.innerHTML += `<th style="padding:10px;">Sem ${sem}</th>`);
    headRow.innerHTML += `<th style="padding:10px; color:var(--primary);">Avg SGPA</th><th style="padding:10px;">Credits</th>`;
}

function addTableRow(student, semKeys) {
    const tbody = document.getElementById('bulkTableBody');
    let semCells = "";
    semKeys.forEach(sem => {
        const val = student.semData[sem] || "-";
        semCells += `<td style="padding:10px; text-align:center;">${val}</td>`;
    });
    const row = `<tr>
        <td style="padding:10px; font-weight:500;">${student.name}</td>
        <td style="padding:10px;">${student.pin}</td>
        ${semCells}
        <td style="padding:10px; font-weight:bold; color:var(--primary); text-align:center;">${student.avgSgpa}</td>
        <td style="padding:10px; text-align:center;">${student.totalCredits}</td>
    </tr>`;
    tbody.innerHTML += row;
}

function sortBySgpa() {
    fetchedStudents.sort((a, b) => b.avgSgpa - a.avgSgpa);
    const tbody = document.getElementById('bulkTableBody');
    tbody.innerHTML = "";
    if(fetchedStudents.length === 0) return;
    const batchYear = fetchedStudents[0].pin.substring(0, 2);
    const semKeys = Object.keys(EXAM_CONFIG[batchYear].sems).sort();
    fetchedStudents.forEach(s => addTableRow(s, semKeys));
}

function downloadExcel() {
    const excelData = fetchedStudents.map(s => {
        let row = { Name: s.name, PIN: s.pin };
        for (const [sem, sgpa] of Object.entries(s.semData)) row[`Sem ${sem}`] = sgpa;
        row['Avg SGPA'] = s.avgSgpa;
        row['Total Credits'] = s.totalCredits;
        return row;
    });
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "SBTET_Bulk.xlsx");
}
