(function () {
    const API_URL = `http://${window.location.hostname}:3000/api`;

    document.addEventListener('DOMContentLoaded', () => {
        const name = localStorage.getItem('userName');
        if (name) {
            const staffSpan = document.getElementById('userName');
            if (staffSpan) staffSpan.innerText = "Staff: " + name;
        }

        loadTodayStats();
        loadLiveQueue();
        attachSearch();
        attachVitalsSubmit();

        setInterval(() => {
            loadTodayStats();
            loadLiveQueue();
        }, 10000);
    });

    /* ================= TODAY STATS ================= */
    async function loadTodayStats() {
        try {
            const res = await fetch(`${API_URL}/today-stats`);
            const data = await res.json();

            document.getElementById('totalToday').innerText = data.total || 0;
            document.getElementById('waitingCount').innerText = data.waiting || 0;
            document.getElementById('inProgressCount').innerText = data.in_progress || 0;
            document.getElementById('completedCount').innerText = data.completed || 0;
        } catch (err) {
            console.error("Stats error:", err);
        }
    }

    /* ================= LIVE QUEUE ================= */
    async function loadLiveQueue() {
        try {
            const res = await fetch(`${API_URL}/reception-queue`);
            const queue = await res.json();
            const liveQueue = document.getElementById('liveQueue');

            if (!liveQueue) return;

            if (queue.length === 0) {
                liveQueue.innerHTML = `<p style="padding:20px;color:gray;">No queue</p>`;
                return;
            }

            liveQueue.innerHTML = queue.map(q => `
                <div class="patient-card">
                    <strong>Token ${q.token_number}</strong>
                    <span>${q.full_name}</span>
                    <small>Dr. ${q.doctor_name}</small>
                    <span>${q.status}</span>
                </div>
            `).join('');
        } catch (err) {
            console.error("Queue error:", err);
        }
    }

    /* ================= SEARCH ================= */
    function attachSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');

        if (!searchInput || !searchResults) return;

        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();

            if (query.length < 2) {
                searchResults.innerHTML = "";
                return;
            }

            try {
                const res = await fetch(`${API_URL}/search-patients?query=${query}`);
                const patients = await res.json();

                searchResults.innerHTML = "";
                patients.forEach(p => {
                    const card = document.createElement("div");
                    card.classList.add("patient-card");
                    card.innerHTML = `
                        <strong>${p.full_name}</strong>
                        <span>${p.mobile}</span>
                    `;
                    card.addEventListener("click", () => {
                        window.openCheckIn(p);
                    });
                    searchResults.appendChild(card);
                });
            } catch (err) {
                console.error("Search error:", err);
            }
        });
    }

    /* ================= OPEN MODAL ================= */
    // Attached to window to maintain global access for HTML onclicks
    window.openCheckIn = async function (p) {
        const recordModal = document.getElementById('recordModal');
        const patientHeader = document.getElementById('patientHeader');
        const patientIdInput = document.getElementById('m_patientId');

        if (recordModal) recordModal.style.display = 'block';
        if (patientIdInput) patientIdInput.value = p.id;

        if (patientHeader) {
            patientHeader.innerHTML = `
                <h2>${p.full_name}</h2>
                <p>${p.mobile}</p>
            `;
        }

        await loadPatientHistory(p.id);
        await loadDoctors();
    };

    /* ================= LOAD HISTORY ================= */
    async function loadPatientHistory(patientId) {
        const historyDiv = document.getElementById('historyTimeline');
        if (!historyDiv) return;

        historyDiv.innerHTML = `<p style="padding:20px;color:gray;">Loading history...</p>`;

        try {
            const res = await fetch(`${API_URL}/patient-history/${patientId}`);
            const history = await res.json();

            if (!history.length) {
                historyDiv.innerHTML = `<p style="padding:20px;color:gray;">No previous visits found.</p>`;
                return;
            }

            historyDiv.innerHTML = history.map(visit => `
                <div style="border-left:3px solid #2563eb; padding:12px; margin-bottom:12px; background:#f9fafb;">
                    <strong>${new Date(visit.created_at).toLocaleDateString()}</strong><br>
                    <small>Dr. ${visit.doctor_name}</small><br>
                    <small>BP: ${visit.bp} | Weight: ${visit.weight}kg</small>
                    <p style="margin-top:6px;">${visit.notes || "No notes"}</p>
                </div>
            `).join('');
        } catch (err) {
            historyDiv.innerHTML = `<p style="color:red;padding:20px;">Failed to load history.</p>`;
        }
    }

    async function loadDoctors() {
        const doctorSelect = document.getElementById('m_doctorId');
        if (!doctorSelect) return;

        doctorSelect.innerHTML = `<option value="">Loading doctors...</option>`;

        try {
            const res = await fetch(`${API_URL}/users`);
            const doctors = await res.json();

            if (!doctors || doctors.length === 0) {
                doctorSelect.innerHTML = `<option value="">No doctors found</option>`;
                return;
            }

            doctorSelect.innerHTML = `<option value="">Select Doctor</option>` +
                doctors.map(d => `<option value="${d.id}">Dr. ${d.full_name}</option>`).join('');

        } catch (err) {
            console.error("Fetch Error:", err);
            doctorSelect.innerHTML = `<option value="">Failed to load doctors</option>`;
        }
    }

    /* ================= VITALS SUBMIT ================= */
    function attachVitalsSubmit() {
        const vitalsForm = document.getElementById('vitalsForm');
        if (!vitalsForm) return;

        vitalsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const patientId = document.getElementById('m_patientId').value;
            const doctorId = document.getElementById('m_doctorId').value;
            const weight = document.getElementById('m_weight').value;
            const height = document.getElementById('m_height').value;
            const bp = document.getElementById('m_bp').value;

            if (!doctorId) {
                alert("Please select a doctor.");
                return;
            }

            try {
                const res = await fetch(`${API_URL}/update-vitals`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patientId, doctorId, weight, height, bp })
                });

                const result = await res.json();

                if (result.success) {
                    alert("Patient added to queue successfully!");
                    document.getElementById('recordModal').style.display = 'none';
                    loadTodayStats();
                    loadLiveQueue();
                } else {
                    alert("Server error: " + result.message);
                }
            } catch (err) {
                console.error(err);
                alert("Backend not responding.");
            }
        });
    }
})();