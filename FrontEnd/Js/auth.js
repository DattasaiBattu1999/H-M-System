const API_URL = `http://${window.location.hostname}:3000/api`;

document.addEventListener('DOMContentLoaded', () => {

    /* ================= 1. ROUTE GUARDS ================= */
    const userRole = localStorage.getItem('userRole');
    const path = window.location.pathname.toLowerCase();
    const isPage = (name) => path.endsWith(name.toLowerCase());

    // Consolidated guards to prevent repetition
    if (isPage('admin.html') && userRole !== 'admin') window.location.href = "login.html";
    if (isPage('doctor.html') && userRole !== 'doctor') window.location.href = "login.html";
    if (isPage('lab.html') && userRole !== 'lab') window.location.href = "login.html";
    if (isPage('patient.html') && userRole !== 'patient') window.location.href = "login.html";
    if (isPage('reception.html') && !['staff', 'admin'].includes(userRole)) window.location.href = "login.html";

    /* ================= 2. LOGIN LOGIC ================= */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            try {
                const res = await fetch( `${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const result = await res.json();

                if (result.success) {
    // Store all user details
    localStorage.setItem('userRole', result.user.role);
    localStorage.setItem('userId', result.user.id);
    localStorage.setItem('userEmail', result.user.email);
    localStorage.setItem('userName', result.user.full_name);

    // CHECK FOR FIRST LOGIN
    if (result.user.is_first_login === 1) {
        alert("First login detected. Please reset your password.");
        window.location.href = "reset-password.html"; // Ensure this filename is correct
        return; // Stop here so they don't go to the dashboard
    }

    // Normal redirect if not first login
    const role = result.user.role.toLowerCase();
    if (role === 'admin') window.location.href = "admin.html";
    else if (role === 'staff' || role === 'reception') window.location.href = "reception.html";
    else if (role === 'doctor') window.location.href = "doctor.html";
    else if (role === 'lab') window.location.href = "lab.html";
    else if (role === 'patient') window.location.href = "patient.html";
} else {
                    alert(result.message || "Invalid Email or Password");
                }
            } catch (err) {
                alert("Server is offline. Check backend.");
            }
        });
    }

    /* ================= 3. RESET PASSWORD ================= */
    const resetForm = document.getElementById("resetForm");
    if (resetForm) {
        resetForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = localStorage.getItem("userEmail");
            const newPassword = document.getElementById("newPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (newPassword !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            try {
                const res = await fetch(`${API_URL}/reset-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, newPassword })
                });

                const result = await res.json();
                if (result.success) {
                    alert("Password updated! Please login again.");
                    localStorage.clear(); // Important: clear old data
                    window.location.href = "login.html"; 
                } else {
                    alert("Failed to update password.");
                }
            } catch (err) {
                console.error("Reset Error:", err);
            }
        });
    }

    /* ================= 4. REGISTRATION ================= */
    const registrationForm = document.getElementById("registrationForm");
    if (registrationForm) {
        registrationForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                role: "patient",
                fullName: document.getElementById("regName").value,
                gender: document.getElementById("regGender").value,
                mobile: document.getElementById("regMobile").value,
                email: document.getElementById("regEmail").value,
                address: document.getElementById("regAddress").value,
                password: document.getElementById("regPassword").value
            };

            try {
                const res = await fetch(`${API_URL}/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();
                if (result.success) {
                    alert("Account created! You can now login.");
                    window.location.href = "login.html";
                }
            } catch (err) { console.error(err); }
        });
    }
});

/* ================= 5. GLOBAL LOGOUT ================= */
window.logout = function() {
    localStorage.clear();
    window.location.href = "login.html";
};
