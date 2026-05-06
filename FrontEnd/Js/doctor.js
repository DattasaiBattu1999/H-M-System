// const API_URL = `http://${window.location.hostname}:3000/api`;

document.addEventListener('DOMContentLoaded', () => {
    const name = localStorage.getItem('userName');
    const nameElement = document.getElementById('userName');
    
    if (name && nameElement) {
        nameElement.innerText = "Dr. " + name;
    }

    loadDoctorQueue();

    const refreshBtn = document.getElementById('refreshQueueBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDoctorQueue);
    }
});

/* =====================================================
   SHOW VITALS CHART + BMI
===================================================== */

async function showVitalsChart(patientId) {

    try {

        const res = await fetch(
            `${API_URL}/patient-vitals-chart/${patientId}`
        );

        const data = await res.json();

        if (!data.length) return;

        const ctx = document
            .getElementById('vitalsChart')
            ?.getContext('2d');

        if (!ctx) return;

        if (window.myChart) window.myChart.destroy();

        window.myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d =>
                    new Date(d.created_at).toLocaleDateString()
                ),
                datasets: [{
                    label: 'Weight (kg)',
                    data: data.map(d => d.weight),
                    borderColor: '#2563eb',
                    tension: 0.3
                }]
            }
        });

        // ===== BMI CALCULATION =====
        const latest = data[data.length - 1];

        if (latest.weight && latest.height) {

            const heightMeters = latest.height / 100;
            const bmi = (
                latest.weight /
                (heightMeters * heightMeters)
            ).toFixed(1);

            document.getElementById('bmiDisplay').innerHTML =
                `BMI: ${bmi}`;
        }

    } catch (err) {
        console.error("Chart error:", err);
    }
}

/* =====================================================
   LOAD DOCTOR QUEUE
===================================================== */

window.loadDoctorQueue = async function() {

    const email = localStorage.getItem('userEmail');
    const container = document.getElementById('queueResults');

    if (!email || !container) return;

    try {

        const res = await fetch(
            `${API_URL}/doctor-queue?email=${email}`
        );

        const queue = await res.json();

        if (!queue.length) {
            container.innerHTML =
                `<p style="padding:20px;color:gray;">No patients in queue</p>`;
            return;
        }

        container.innerHTML = queue.map(a => `
            <div class="patient-card">
                <div>
                    <strong>${a.patient_name}</strong>
                    <br>
                    <small>
                        BP: ${a.bp || "-"} |
                        Weight: ${a.weight || "-"} kg
                    </small>
                    <br>
                    <small style="color:${
                        a.status === 'waiting' ? 'orange' :
                        a.status === 'in_progress' ? 'blue' : 'green'
                    }">
                        ${a.status}
                    </small>
                </div>

                <button onclick="startConsultation(
                    ${a.id},
                    ${a.patient_id},
                    '${a.patient_name}'
                )">
                    Examine
                </button>
            </div>
        `).join('');

    } catch (err) {
        container.innerHTML =
            `<p style="color:red;padding:20px;">Failed to load queue</p>`;
    }
}

/* =====================================================
   START CONSULTATION
===================================================== */

window.startConsultation = async function(
    appointmentId,
    patientId,
    patientName
) {

    try {

        // 1️⃣ Mark as in_progress
        await fetch(
             `${API_URL}/start-consultation`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId })
            }
        );

        // 2️⃣ Open modal
        document.getElementById('notesModal').style.display = 'block';
        document.getElementById('activeAppointmentId').value =
            appointmentId;

        document.getElementById('consultationHeader').innerHTML =
            `<h2>Consulting: ${patientName}</h2>`;

        // 3️⃣ Load history
        await loadDoctorHistory(patientId);

        // 4️⃣ Load chart
        await showVitalsChart(patientId);

        // 5️⃣ Refresh queue (status updates visually)
        loadDoctorQueue();

    } catch (err) {
        alert("Failed to start consultation");
    }
};

/* =====================================================
   LOAD PATIENT HISTORY
===================================================== */

async function loadDoctorHistory(patientId) {

    const container = document.getElementById('doctorHistory');

    const res = await fetch(
        `${API_URL}/patient-history/${patientId}`
    );

    const history = await res.json();

    console.log("History response:", history); // 👈 ADD THIS

    if (!history.length) {
        container.innerHTML = "No previous visits.";
        return;
    }

    // Inside your loadDoctorHistory(patientId) function, update the mapping:

container.innerHTML = history.map(v => `
    <div style="border-left:4px solid #2563eb; padding:14px; margin-bottom:14px; background:#fff; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
        <div style="font-weight:600;">${new Date(v.created_at).toLocaleDateString()}</div>
        <div style="font-size:0.85rem; color:#475569;">Dr. ${v.doctor_name || "N/A"}</div>
        
        ${v.lab_reports && v.lab_reports.length > 0 ? `
            <div style="margin-top:10px; padding:8px; background:#f0fdf4; border-radius:6px; border:1px solid #bbf7d0;">
                <div style="font-weight:600; font-size:0.8rem; color:#166534;">
                    <i class="fas fa-file-medical"></i> Lab Reports Ready:
                </div>
                <ul style="padding-left:18px; margin-top:5px; font-size:0.8rem;">
                    ${v.lab_reports.map(report => `
                        <li>
                            <a href="http://${window.location.hostname}:3000/reports/${report.report_file}" target="_blank" style="color:#059669; text-decoration:none; font-weight:500;">
                                <i class="fas fa-download"></i> View ${report.test_name}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}

        <div style="margin-top:8px; font-size:0.85rem;">
            <strong>Notes:</strong> ${v.notes || 'No notes yet.'}
        </div>
    </div>
`).join('');
}

/* =====================================================
   COMPLETE CONSULTATION
===================================================== */

window.completeConsultation = async function() {

    const appointmentId =
        document.getElementById('activeAppointmentId').value;

    const notes =
        document.getElementById('clinicalNotes').value;

    const medRows =
        document.querySelectorAll('.med-row');

    const medicines = Array.from(medRows)
        .map(row => ({
            name: row.querySelector('.med-name').value,
            frequency: row.querySelector('.med-freq').value,
            duration: row.querySelector('.med-dur').value
        }))
        .filter(m => m.name !== "");

    try {

        await fetch(
             `${API_URL}/complete-consultation`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId,
                    notes,
                    medicines
                })
            }
        );

        alert("Consultation Completed");

        document.getElementById('notesModal').style.display = 'none';

        loadDoctorQueue();

    } catch (err) {
        alert("Error completing consultation");
    }
};

/* =====================================================
   ADD MEDICINE ROW
===================================================== */

window.addMedicineRow = function() {

    const container =
        document.getElementById('medicineContainer');

    const row = document.createElement('div');
    row.classList.add('med-row');

    row.innerHTML = `
        <input type="text"
               class="med-name"
               placeholder="Medicine name">

        <input type="text"
               class="med-freq"
               placeholder="Frequency">

        <input type="text"
               class="med-dur"
               placeholder="Days">
    `;

    container.appendChild(row);
};

window.closeNotes = async function() {

    const appointmentId =
        document.getElementById('activeAppointmentId').value;

    if (appointmentId) {
        await fetch(
            `${API_URL}/cancel-consultation/${appointmentId}`,
            { method: 'POST' }
        );
    }

    document.getElementById('notesModal').style.display = 'none';
    document.getElementById('clinicalNotes').value = '';

    loadDoctorQueue();
};

/* DOCTOR TO LAB TRANSFER */

let currentTests = [];

window.addTestRow = function() {
    const testInput = document.getElementById('testName');
    const testName = testInput.value.trim();
    
    if (testName) {
        currentTests.push(testName);
        const list = document.getElementById('prescribedTests');
        const li = document.createElement('li');
        li.textContent = testName;
        list.appendChild(li);
        testInput.value = ""; // Clear input
    }
};

/*  Doctor sends patient to lab with prescribed tests */
window.sendToLab = async function() {
    const appointmentId = document.getElementById('activeAppointmentId').value;
    const doctorEmail = localStorage.getItem('userEmail'); // Assuming doctor is logged in

    if (currentTests.length === 0) {
        alert("Please add at least one test.");
        return;
    }

    try {
        // First, we need the doctor's ID from their email
        // For simplicity, ensure your backend /api/send-to-lab handles lookup 
        // or pass the ID if stored in localStorage
        const res = await fetch( `${API_URL}/send-to-lab`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                appointmentId: appointmentId,
                tests: currentTests
                // Note: Ensure your backend extracts doctorId from session or token
            })
        });

        const result = await res.json();
        if (result.success) {
            alert("Patient sent to Lab successfully!");
            document.getElementById('notesModal').style.display = 'none';
            currentTests = []; // Reset local list
            document.getElementById('prescribedTests').innerHTML = "";
            loadDoctorQueue();
        }
    } catch (err) {
        console.error("Lab transfer error:", err);
        alert("Failed to send patient to lab.");
    }
};
/* add test row */
window.addMedRow = function() {
    const container = document.getElementById('medicineList');
    const row = document.createElement('div');
    row.className = 'med-row';
    row.style = "display:flex; gap:10px; margin-bottom:12px; align-items: center;";
    
    row.innerHTML = `
        <input type="text" placeholder="Medicine Name" class="med-input med-name" style="flex: 2.5; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
        <input type="text" placeholder="Freq" class="med-input med-freq" style="flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
        <input type="text" placeholder="Days" class="med-input med-dur" style="flex: 0.8; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
        <i class="fas fa-trash" style="color:#ef4444; cursor:pointer;" onclick="this.parentElement.remove()"></i>
    `;
    container.appendChild(row);
};
