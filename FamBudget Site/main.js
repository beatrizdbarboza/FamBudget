// NAVEGAÇÃO
document.querySelectorAll("[data-link]").forEach(item => {
  item.addEventListener("click", () => {
    const pagina = item.getAttribute("data-link");

    if (pagina) {
      window.location.href = pagina;
    }
  });
});

// LOGOUT
const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();

    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

    window.location.href = "index.html";
  });
}

/* =========================
   TOKEN / USUÁRIO GLOBAL
========================= */

function getTokenGlobal() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function decodificarTokenGlobal() {
  const token = getTokenGlobal();

  if (!token || !token.includes(".")) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    const payloadCorrigido = payload.replace(/-/g, "+").replace(/_/g, "/");

    const json = decodeURIComponent(
      atob(payloadCorrigido)
        .split("")
        .map((char) => {
          return `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`;
        })
        .join("")
    );

    return JSON.parse(json);
  } catch (error) {
    console.warn("Não foi possível decodificar o token no main.js:", error);
    return null;
  }
}

function getUserKeyGlobal() {
  const dadosToken = decodificarTokenGlobal();

  const email = (
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    dadosToken?.email ||
    "usuario"
  ).toLowerCase().trim();

  return `fambudget_${email}`;
}

function buscarDadoUsuarioGlobal(chave) {
  const userKey = getUserKeyGlobal();
  return localStorage.getItem(`${userKey}_${chave}`);
}

// USUÁRIO GLOBAL: NOME + AVATAR
function carregarUsuarioGlobal() {
  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  if (!nomeUsuario && !avatar) return;

  const dadosToken = decodificarTokenGlobal();

  const nome =
    sessionStorage.getItem("nicknameUsuario") ||
    buscarDadoUsuarioGlobal("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    buscarDadoUsuarioGlobal("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    dadosToken?.nickname ||
    dadosToken?.name ||
    dadosToken?.nome ||
    dadosToken?.username ||
    "Usuário";

  const imagem =
    buscarDadoUsuarioGlobal("avatarUsuario") ||
    sessionStorage.getItem("avatarUsuario") ||
    localStorage.getItem("avatarUsuario");

  if (nomeUsuario) {
    nomeUsuario.textContent = nome;
  }

  if (avatar) {
    if (imagem) {
      avatar.innerHTML = `<img src="${imagem}" alt="Avatar">`;
    } else {
      avatar.innerHTML = "";
      avatar.textContent = nome.charAt(0).toUpperCase();
    }
  }
}

/* =========================
   TEMA GLOBAL
========================= */

function aplicarTema(tema) {
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

function carregarTema() {
  const tema =
    sessionStorage.getItem("tema") ||
    localStorage.getItem("temaUsuario") ||
    "claro";

  aplicarTema(tema);
}

function configurarTema() {
  const btnClaro = document.getElementById("temaClaro");
  const btnEscuro = document.getElementById("temaEscuro");

  // Evita erro em páginas que não têm botões de tema
  if (!btnClaro || !btnEscuro) return;

  btnClaro.addEventListener("click", () => {
    sessionStorage.setItem("tema", "claro");
    localStorage.setItem("temaUsuario", "claro");
    aplicarTema("claro");
  });

  btnEscuro.addEventListener("click", () => {
    sessionStorage.setItem("tema", "escuro");
    localStorage.setItem("temaUsuario", "escuro");
    aplicarTema("escuro");
  });
}

/* =========================
   SIDEBAR
========================= */

function ativarMenuAtual() {
  let paginaAtual = window.location.pathname.split("/").pop();

  if (paginaAtual === "" || paginaAtual === "/") {
    paginaAtual = "index.html";
  }

  document.querySelectorAll(".menu li").forEach(item => {
    let link = item.getAttribute("data-link");

    if (!link) {
      const onclick = item.getAttribute("onclick");

      if (onclick) {
        const match = onclick.match(/'([^']+)'/);
        if (match) link = match[1];
      }
    }

    if (link === paginaAtual) {
      item.classList.add("ativo");
    } else {
      item.classList.remove("ativo");
    }
  });
}

/* =========================
   INIT GLOBAL
========================= */

document.addEventListener("DOMContentLoaded", () => {
  carregarTema();
  carregarUsuarioGlobal();
  configurarTema();
  ativarMenuAtual();
});