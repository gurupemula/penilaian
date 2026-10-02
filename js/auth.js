/**
 * auth.js — helper authentication untuk semua halaman
 */

function requireAuth(redirectTo = "index.html") {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        resolve(user);
      } else {
        window.location.href = redirectTo;
      }
    });
  });
}

function redirectIfLoggedIn(redirectTo = "dashboard.html") {
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = redirectTo;
    }
  });
}

function logout() {
  auth.signOut()
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
      alert("Gagal logout. Coba lagi.");
    });
}

function showUserEmail(elementId = "user-email") {
  auth.onAuthStateChanged((user) => {
    if (user) {
      const el = document.getElementById(elementId);
      if (el) el.textContent = user.email;
    }
  });
}
