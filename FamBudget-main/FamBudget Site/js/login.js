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

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

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

      const token = extrairToken(data);

      if (!token || token === "[object Object]") {
        console.error("Token inválido ou não encontrado:", data);
        abrirPopup("Erro ao realizar login. Token não encontrado.");
        return;
      }

      const refreshToken = extrairRefreshToken(data);
      const usuario = extrairUsuario(data, email);

      /*
        Limpa dados da conta anterior nesta aba.
        Isso evita Bianca puxar sessão/foto/nome da Beatriz.
      */
      sessionStorage.clear();

      /*
        Tokens NÃO ficam no localStorage.
        localStorage é compartilhado entre contas/abas.
      */
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");

      sessionStorage.setItem("accessToken", token);
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

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ================= TOKEN ================= */
function extrairToken(data) {
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
        if (encontrado) return encontrado;
      }
    }

    return null;
  }

  return procurar(data);
}

function extrairRefreshToken(data) {
  const possiveis = [
    data?.refreshToken,
    data?.refresh_token,
    data?.data?.refreshToken,
    data?.data?.refresh_token,
    data?.tokenRefresh,
    data?.data?.tokenRefresh
  ];

  const refresh = possiveis.find(t => typeof t === "string" && t.trim() !== "");

  return refresh || "";
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