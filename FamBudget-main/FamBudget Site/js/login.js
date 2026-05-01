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

      console.log("TOKEN EXTRAÍDO:", token);

      if (!token || token === "[object Object]") {
        console.error("Token inválido ou não encontrado:", data);
        abrirPopup("Erro ao realizar login. Token não encontrado.");
        return;
      }

      const refreshToken = extrairRefreshToken(data);
      const usuario = extrairUsuario(data, email);

      sessionStorage.setItem("accessToken", token);
      localStorage.setItem("accessToken", token);

      sessionStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("refreshToken", refreshToken);

      sessionStorage.setItem("nomeUsuario", usuario.nome);
      localStorage.setItem("nomeUsuario", usuario.nome);

      sessionStorage.setItem("nicknameUsuario", usuario.nome);
      localStorage.setItem("nicknameUsuario", usuario.nome);

      sessionStorage.setItem("emailUsuario", usuario.email);
      localStorage.setItem("emailUsuario", usuario.email);

      console.log("TOKEN SALVO SESSION:", sessionStorage.getItem("accessToken"));
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
  console.log("DADOS PARA EXTRAIR TOKEN:", data);

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
    data?.data?.refresh_token
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