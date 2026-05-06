//const API_URL = `http://${window.location.hostname}:3000/api`;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Display Admin Name
    const name = localStorage.getItem('userName');
    const nameElement = document.getElementById('userName');
    if (name && nameElement) {
        nameElement.innerText = "Admin: " + name;
    }

    // 2. Load the initial user list
    loadUsers();

    // 3. Handle Account Creation
    // DEFINE createForm HERE inside the listener
    const createForm = document.getElementById("adminCreateForm");
    
    if (createForm) {
        createForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const payload = {
                role: document.getElementById("adminRole").value,
                full_name: document.getElementById("adminName").value,
                email: document.getElementById("adminEmail").value,
                mobile: document.getElementById("adminMobile").value,
                password: document.getElementById("adminPass").value
            };

            try {
                const res = await fetch(`${API_URL}/users`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();

                if (result.success) {
                    alert("Account created successfully!");
                    createForm.reset();
                    loadUsers(); // Refresh the list
                } else {
                    alert("Error: " + result.message);
                }
            } catch (err) {
                console.error("Fetch error:", err);
                alert("Check if server.js is running.");
            }
        });
    }
});

/* ================= LOAD USERS ================= */
async function loadUsers() {
    const userTableBody = document.getElementById("userTableBody");
    if (!userTableBody) return;

    try {
        const res = await fetch( `${API_URL}/admin/users`);
        const users = await res.json();

        if (users.length === 0) {
            userTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No users found</td></tr>`;
            return;
        }

        userTableBody.innerHTML = users.map(u => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${u.full_name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                    <span class="role-badge" style="background:#e2e8f0; padding:4px 8px; border-radius:4px; font-size:0.8rem;">
                        ${u.role.toUpperCase()}
                    </span>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${u.email}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    <button onclick="deleteUser(${u.id})" class="btn-logout" style="background:#ef4444; padding:5px 10px; font-size:0.8rem;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Load users error:", err);
        userTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Error connecting to server</td></tr>`;
    }
}

/* ================= DELETE USER ================= */
window.deleteUser = async function(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
        const res = await fetch(`${API_URL}/admin/delete-user/${id}`, {
            method: 'DELETE'
        });

        const result = await res.json();
        if (result.success) {
            alert("User deleted!");
            loadUsers();
        } else {
            alert("Delete failed: " + result.message);
        }
    } catch (err) {
        console.error("Delete error:", err);
        alert("Server error during deletion.");
    }
};
