console.log("LOGIN.JS OK");

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

      console.log("LOGIN STATUS:", response.status);
      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        abrirPopup("Email ou senha inválidos.");
        return;
      }

      const accessToken = extrairAccessToken(data);
      const refreshToken = extrairRefreshToken(data);
      const usuario = extrairUsuario(data, email);

      console.log("ACCESS TOKEN EXTRAÍDO:", accessToken);
      console.log("REFRESH TOKEN EXTRAÍDO:", refreshToken);
      console.log("USUÁRIO EXTRAÍDO:", usuario);

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

      /*
        Limpa dados da conta anterior nesta aba.
        Isso evita misturar sessão de contas diferentes.
      */
      sessionStorage.clear();

      /*
        Remove tokens antigos do localStorage.
        Tokens no localStorage são compartilhados entre abas e podem misturar contas.
      */
      limparTokensLocalStorage();

      /*
        Tokens ficam no sessionStorage.
        Assim cada aba mantém sua própria conta.
      */
      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("refreshToken", refreshToken);

      sessionStorage.setItem("emailUsuario", usuario.email);
      sessionStorage.setItem("nomeUsuario", usuario.nome);
      sessionStorage.setItem("nicknameUsuario", usuario.nome);

      salvarDadoUsuario("nomeUsuario", usuario.nome, usuario.email);
      salvarDadoUsuario("nicknameUsuario", usuario.nome, usuario.email);

      console.log("ACCESS TOKEN SESSION:", sessionStorage.getItem("accessToken"));
      console.log("REFRESH TOKEN SESSION:", sessionStorage.getItem("refreshToken"));
      console.log("NOME SALVO:", usuario.nome);
      console.log("EMAIL SALVO:", usuario.email);

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

/* ================= POPUP ================= */
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

/* ================= RESPOSTA SEGURA ================= */
async function lerResposta(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ================= VALIDADORES ================= */
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

/* ================= TOKEN ================= */
function extrairAccessToken(data) {
  return (
    data?.accessToken ||
    data?.access_token ||
    data?.authToken ||

    /*
      Essa é a parte mais importante para sua API.
      Pelo console, a resposta vem como:
      data.token.accessToken
    */
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

    /*
      Essa é a parte mais importante para sua API.
      Pelo console, a resposta vem como:
      data.token.refreshToken
    */
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

      /*
        Evita pegar o objeto inteiro data.token como se fosse token.
        Só aceita string JWT.
      */
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

/* ================= USUÁRIO ================= */
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

/* ================= LIMPEZA DE TOKENS ANTIGOS ================= */
function limparTokensLocalStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("refresh_token");
}

/* ================= DADOS POR CONTA ================= */
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