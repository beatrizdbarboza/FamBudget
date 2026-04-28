function abrirPopup(mensagem) {
  document.getElementById("popup-text").innerText = mensagem;
  document.getElementById("popup").style.display = "flex";
}

function fecharPopup() {
  document.getElementById("popup").style.display = "none";
}

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("https://www.manage-control-dev.com.br/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    console.log("LOGIN RESPONSE:", data);

    if (!response.ok) {
      abrirPopup("Email ou senha inválidos");
      return;
    }

    const token = data.token.accessToken;

    console.log("TOKEN EXTRAÍDO:", token);

    if (!token) {
      abrirPopup("Erro: login não retornou token");
      return;
    }

    sessionStorage.setItem("accessToken", token);
    sessionStorage.setItem("refreshToken", data.token?.refreshToken || "");

    let nomeUsuario = "Usuário";

    if (data.user?.name || data.user?.nome) {
      nomeUsuario = data.user.name || data.user.nome;
    } else if (data.name || data.nome) {
      nomeUsuario = data.name || data.nome;
    } else if (email) {
      nomeUsuario = email.split("@")[0];
    }

    sessionStorage.setItem("nomeUsuario", nomeUsuario);

    window.location.href = "home.html";

  } catch (error) {
    console.error("ERRO REAL:", error);
    abrirPopup("Erro ao conectar com o servidor");
  }
});

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";

  passwordInput.type = isPassword ? "text" : "password";

  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});