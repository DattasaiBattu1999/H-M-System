// const API_URL = `http://${window.location.hostname}:3000/api`;

document.addEventListener('DOMContentLoaded', () => {
    const fullName = localStorage.getItem('userName');
    const nameDisplay = document.getElementById('patientName');

    if (fullName && fullName !== "undefined" && fullName !== "null") {
        nameDisplay.innerText = fullName;
    } else {
        // This is what you are seeing now
        nameDisplay.innerText = "Patient Profile"; 
    }

    loadPatientDashboard();
});

async function loadPatientDashboard() {
    const patientId = localStorage.getItem('userId');
    const container = document.getElementById('historyContainer');

    try {
        const res = await fetch(`${API_URL}/patient-history/${patientId}`);
        const history = await res.json();

        if (history.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:20px;">No medical records found.</p>`;
            return;
        }

        // Update Stats based on latest visit
        const latest = history[0];
        document.getElementById('totalVisits').innerText = history.length;
        document.getElementById('lastBP').innerText = latest.bp || '--';
        document.getElementById('lastWeight').innerText = (latest.weight || '--') + ' kg';

        // Build History List
        container.innerHTML = history.map(visit => `
            <div class="card" style="margin-bottom:20px; border-left: 5px solid #2563eb;">
                <div style="display:flex; justify-content:space-between; align-items:start; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">
                    <div>
                        <h4 style="margin:0; color:#1e293b;"><i class="far fa-calendar-alt"></i> ${new Date(visit.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</h4>
                        <small style="color:#64748b;">Consulted by Dr. ${visit.doctor_name}</small>
                    </div>
                    <button onclick="window.open( '${API_URL}/print-prescription/${visit.id}' )" class="btn-secondary" style="padding:5px 10px; font-size:0.75rem;">
                        <i class="fas fa-file-pdf"></i> Download Prescription
                    </button>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h5 style="color:#2563eb; margin-bottom:10px;"><i class="fas fa-pills"></i> Prescribed Medicines</h5>
                        <ul style="list-style:none; padding:0;">
                            ${visit.medicines && visit.medicines.length > 0 ? visit.medicines.map(m => `
                                <li style="background:#f8fafc; padding:8px; border-radius:6px; margin-bottom:5px; font-size:0.9rem; border:1px solid #e2e8f0;">
                                    <strong>${m.medicine_name}</strong><br>
                                    <span style="color:#64748b;"><i class="far fa-clock"></i> ${m.frequency} | <i class="fas fa-calendar-day"></i> ${m.duration} Days</span>
                                </li>
                            `).join('') : '<li style="color:#94a3b8;">No medicines prescribed.</li>'}
                        </ul>
                    </div>

                    <div>
                        <h5 style="color:#059669; margin-bottom:10px;"><i class="fas fa-microscope"></i> Lab Investigations</h5>
                        <ul style="list-style:none; padding:0;">
                            ${visit.lab_reports && visit.lab_reports.length > 0 ? visit.lab_reports.map(report => `
                                <li style="margin-bottom:8px;">
                                    <a href="http://${window.location.hostname}:3000/reports/${report.report_file}" target="_blank" 
                                       style="display:block; background:#ecfdf5; color:#065f46; padding:10px; border-radius:6px; text-decoration:none; border:1px solid #d1fae5; font-size:0.85rem; font-weight:600;">
                                        <i class="fas fa-file-download"></i> View ${report.test_name}
                                    </a>
                                </li>
                            `).join('') : '<li style="color:#94a3b8;">No lab tests for this visit.</li>'}
                        </ul>
                    </div>
                </div>

                <div style="margin-top:15px; padding:10px; background:#fff7ed; border-radius:6px; font-size:0.9rem; border:1px solid #ffedd5;">
                    <strong><i class="fas fa-user-edit"></i> Doctor's Advice:</strong>
                    <p style="margin:5px 0 0 0; color:#9a3412;">${visit.notes || 'No specific notes provided.'}</p>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("Error loading dashboard:", err);
        container.innerHTML = `<p style="color:red; text-align:center;">Failed to load health records. Please try again later.</p>`;
    }
}
