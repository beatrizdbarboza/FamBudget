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
    sessionStorage.removeItem("usuario");
    window.location.href = "login.html";
  });
}

//TOGGLE TEMA GLOBAL

function configurarTema() {
  const btnClaro = document.getElementById("temaClaro");
  const btnEscuro = document.getElementById("temaEscuro");

  // 🔥 evita erro em outras páginas
  if (!btnClaro || !btnEscuro) return;

  btnClaro.addEventListener("click", () => {
    document.body.classList.remove("dark");
    btnClaro.classList.add("ativo");
    btnEscuro.classList.remove("ativo");
    sessionStorage.setItem("tema", "claro");
  });

  btnEscuro.addEventListener("click", () => {
    document.body.classList.add("dark");
    btnEscuro.classList.add("ativo");
    btnClaro.classList.remove("ativo");
    sessionStorage.setItem("tema", "escuro");
  });
}

function carregarTema() {
  const tema = sessionStorage.getItem("tema");

  const btnClaro = document.getElementById("temaClaro");
  const btnEscuro = document.getElementById("temaEscuro");

  if (tema === "escuro") {
    document.body.classList.add("dark");

    if (btnEscuro) btnEscuro.classList.add("ativo");
    if (btnClaro) btnClaro.classList.remove("ativo");
  } else {
    document.body.classList.remove("dark");

    if (btnClaro) btnClaro.classList.add("ativo");
    if (btnEscuro) btnEscuro.classList.remove("ativo");
  }
}

//sidebar
function ativarMenuAtual() {
  let paginaAtual = window.location.pathname.split("/").pop();

  if (paginaAtual === "" || paginaAtual === "/") {
    paginaAtual = "index.html";
  }

  document.querySelectorAll(".menu li").forEach(item => {
    let link = item.getAttribute("data-link");

    // 🔥 se NÃO tiver data-link, pega do onclick
    if (!link) {
      let onclick = item.getAttribute("onclick");

      if (onclick) {
        let match = onclick.match(/'([^']+)'/);
        if (match) link = match[1];
      }
    }

    // compara com a página atual
    if (link === paginaAtual) {
      item.classList.add("ativo");
    } else {
      item.classList.remove("ativo");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  configurarTema();
  carregarTema();
  ativarMenuAtual();
});