document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";

  const form = document.getElementById("loginForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (!form) {
    console.error("Formulário loginForm não encontrado.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById("email");
    const passwordInputLogin = document.getElementById("password");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInputLogin ? passwordInputLogin.value.trim() : "";

    if (!email || !password) {
      abrirPopup("Preencha e-mail e senha.");
      return;
    }

    try {
      const response = await fetch("https://www.manage-control-dev.com.br/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await lerResposta(response);

      if (!response.ok) {
        abrirPopup("Email ou senha inválidos.");
        return;
      }

      const accessToken = extrairAccessToken(data);
      const refreshToken = extrairRefreshToken(data);
      const usuario = extrairUsuario(data, email);

      if (!tokenValido(accessToken)) {
        console.error("Access token inválido ou não encontrado:", data);
        abrirPopup("Erro ao realizar login. Token não encontrado.");
        return;
      }

      if (!refreshTokenValido(refreshToken)) {
        console.error("Refresh token inválido ou não encontrado:", data);
        abrirPopup("Erro ao realizar login. Refresh token não encontrado.");
        return;
      }

      sessionStorage.clear();

      limparTokensLocalStorage();

      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("refreshToken", refreshToken);

      sessionStorage.setItem("emailUsuario", usuario.email);
      sessionStorage.setItem("nomeUsuario", usuario.nome);
      sessionStorage.setItem("nicknameUsuario", usuario.nome);

      salvarDadoUsuario("nomeUsuario", usuario.nome, usuario.email);
      salvarDadoUsuario("nicknameUsuario", usuario.nome, usuario.email);

      window.location.href = "home.html";

    } catch (error) {
      console.error("ERRO REAL LOGIN:", error);
      abrirPopup("Erro ao conectar com o servidor.");
    }
  });

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";

      passwordInput.type = isPassword ? "text" : "password";

      togglePassword.classList.toggle("fa-eye");
      togglePassword.classList.toggle("fa-eye-slash");
    });
  }
});

function abrirPopup(mensagem) {
  const popupText = document.getElementById("popup-text");
  const popup = document.getElementById("popup");

  const texto = mensagem || "Ocorreu um erro. Tente novamente.";

  if (popupText) popupText.innerText = texto;
  if (popup) popup.style.display = "flex";
}

function fecharPopup() {
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";
}

async function lerResposta(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function tokenValido(token) {
  return (
    token &&
    typeof token === "string" &&
    token !== "undefined" &&
    token !== "null" &&
    token !== "[object Object]" &&
    token.startsWith("eyJ")
  );
}

function refreshTokenValido(token) {
  return (
    token &&
    typeof token === "string" &&
    token !== "undefined" &&
    token !== "null" &&
    token !== "[object Object]" &&
    token.trim() !== ""
  );
}

function extrairAccessToken(data) {
  return (
    data?.accessToken ||
    data?.access_token ||
    data?.authToken ||

    data?.token?.accessToken ||
    data?.token?.access_token ||
    data?.token?.token ||
    data?.token?.authToken ||

    data?.data?.accessToken ||
    data?.data?.access_token ||
    data?.data?.authToken ||

    data?.data?.token?.accessToken ||
    data?.data?.token?.access_token ||
    data?.data?.token?.token ||
    data?.data?.token?.authToken ||

    procurarJwt(data) ||
    ""
  );
}

function extrairRefreshToken(data) {
  return (
    data?.refreshToken ||
    data?.refresh_token ||
    data?.tokenRefresh ||
    data?.refresh ||

    data?.token?.refreshToken ||
    data?.token?.refresh_token ||
    data?.token?.tokenRefresh ||
    data?.token?.refresh ||

    data?.data?.refreshToken ||
    data?.data?.refresh_token ||
    data?.data?.tokenRefresh ||
    data?.data?.refresh ||

    data?.data?.token?.refreshToken ||
    data?.data?.token?.refresh_token ||
    data?.data?.token?.tokenRefresh ||
    data?.data?.token?.refresh ||

    ""
  );
}

function procurarJwt(data) {
  if (typeof data === "string" && data.startsWith("eyJ")) {
    return data;
  }

  function procurar(obj) {
    if (!obj) return null;

    if (typeof obj === "string") {
      return obj.startsWith("eyJ") ? obj : null;
    }

    if (typeof obj !== "object") return null;

    for (const chave in obj) {
      const valor = obj[chave];

      if (typeof valor === "string" && valor.startsWith("eyJ")) {
        return valor;
      }

      if (typeof valor === "object") {
        const encontrado = procurar(valor);

        if (encontrado) {
          return encontrado;
        }
      }
    }

    return null;
  }

  return procurar(data);
}

function extrairUsuario(data, emailDigitado) {
  const usuario =
    data?.user ||
    data?.usuario ||
    data?.data?.user ||
    data?.data?.usuario ||
    data?.data ||
    data;

  const nome =
    usuario?.nickname ||
    usuario?.nickName ||
    usuario?.name ||
    usuario?.nome ||
    data?.nickname ||
    data?.name ||
    emailDigitado.split("@")[0] ||
    "Usuário";

  const email =
    usuario?.email ||
    data?.email ||
    data?.data?.email ||
    emailDigitado;

  return {
    nome,
    email
  };
}

function limparTokensLocalStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("refresh_token");
}

function gerarChaveUsuario(email) {
  return String(email || "usuario")
    .toLowerCase()
    .trim()
    .replace(/\s/g, "");
}

function salvarDadoUsuario(chave, valor, email) {
  const userKey = gerarChaveUsuario(email);
  localStorage.setItem(`fambudget_${userKey}_${chave}`, valor);
}

function buscarDadoUsuario(chave, email) {
  const userKey = gerarChaveUsuario(email);
  return localStorage.getItem(`fambudget_${userKey}_${chave}`);
}