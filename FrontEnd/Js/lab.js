const API_URL = `http://${window.location.hostname}:3000/api`;

document.addEventListener('DOMContentLoaded', () => {
    // Display Username
    const name = localStorage.getItem('userName');
    if (name) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) userNameElement.innerText = "Lab Tech: " + name;
    }

    loadQueue();
    // Auto-refresh every 60 seconds
    setInterval(loadQueue, 60000);
});

async function loadQueue() {
    const table = document.getElementById("labQueue");
    if (!table) return;

    try {
        const res = await fetch(`${API_URL}/lab-queue`);
        const data = await res.json();

        if (data.length === 0) {
            table.innerHTML = "<tr><td colspan='4'>No pending tests</td></tr>";
            return;
        }

        table.innerHTML = data.map(row => `
            <tr>
                <td>${row.patient_name}</td>
                <td>${row.test_name}</td>
                <td><span class="badge badge-pending">Pending</span></td>
                <td>
                    <div class="actions">
                        <input type="file" id="file-${row.id}">
                        <button class="btn btn-upload" onclick="uploadReport(${row.id})">
                            <i class="fa fa-upload"></i> Upload
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        table.innerHTML = "<tr><td colspan='4' style='color:red;'>Failed to load queue</td></tr>";
    }
}

async function uploadReport(id) {
    const fileInput = document.getElementById(`file-${id}`);

    if (!fileInput || !fileInput.files[0]) {
        alert("Please select a file first.");
        return;
    }

    const formData = new FormData();
    formData.append("report", fileInput.files[0]);

    try {
        const res = await fetch(`${API_URL}/upload-report/${id}`, {
            method: "POST",
            body: formData
        });

        const result = await res.json();
        if (result.success) {
            alert("Upload Successful!");
            loadQueue();
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        console.error("Upload failed:", err);
        alert("Failed to reach the server.");
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}
