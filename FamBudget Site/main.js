// NAVEGAÇÃO
document.querySelectorAll("[data-link]").forEach(item => {
  item.addEventListener("click", () => {
    let pagina = item.getAttribute("data-link");
    window.location.href = pagina;
  });
});

// LOGOUT
let logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    alert("Saindo...");
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
  });
}
