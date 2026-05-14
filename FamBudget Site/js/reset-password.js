const API_RESET_PASSWORD = "https://www.manage-control-dev.com.br/api/v1";

function abrirPopup(mensagem) {
  const popupText = document.getElementById("popup-text");
  const popup = document.getElementById("popup");

  if (popupText) {
    popupText.innerText = mensagem || "Ocorreu um erro. Tente novamente.";
  }

  if (popup) {
    popup.classList.add("show");
    popup.classList.remove("hidden");
    popup.style.display = "flex";
  } else {
    alert(mensagem);
  }
}

function fecharPopup() {
  const popup = document.getElementById("popup");

  if (popup) {
    popup.classList.remove("show");
    popup.classList.add("hidden");
    popup.style.display = "none";
  }
}

function abrirPopupComAcao(mensagem, acao) {
  abrirPopup(mensagem);

  const botaoOk = document.querySelector("#popup button");

  if (botaoOk) {
    botaoOk.onclick = () => {
      fecharPopup();

      if (typeof acao === "function") {
        acao();
      }
    };
  }
}

function verificarRegrasSenha(senha) {
  return {
    minimo: senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    minuscula: /[a-z]/.test(senha),
    numero: /[0-9]/.test(senha),
    especial: /[^A-Za-z0-9]/.test(senha)
  };
}

function validarSenhaForte(senha) {
  const regras = verificarRegrasSenha(senha);

  return (
    regras.minimo &&
    regras.maiuscula &&
    regras.minuscula &&
    regras.numero &&
    regras.especial
  );
}

function atualizarMensagemSenha() {
  const password = document.getElementById("password");
  const passwordRequirements = document.getElementById("passwordRequirements");

  if (!password || !passwordRequirements) return;

  const senha = password.value;
  const regras = verificarRegrasSenha(senha);

  if (!senha) {
    passwordRequirements.classList.remove(
      "show",
      "valid",
      "senha-forte",
      "senha-fraca"
    );

    passwordRequirements.innerHTML = `
      <p>A senha deve ter no mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial.</p>
    `;

    return;
  }

  passwordRequirements.classList.add("show");

  passwordRequirements.innerHTML = `
    <p class="${regras.minimo ? "ok" : "erro"}">• Mínimo de 8 caracteres</p>
    <p class="${regras.maiuscula ? "ok" : "erro"}">• Pelo menos 1 letra maiúscula</p>
    <p class="${regras.minuscula ? "ok" : "erro"}">• Pelo menos 1 letra minúscula</p>
    <p class="${regras.numero ? "ok" : "erro"}">• Pelo menos 1 número</p>
    <p class="${regras.especial ? "ok" : "erro"}">• Pelo menos 1 caractere especial</p>
  `;

  if (validarSenhaForte(senha)) {
    passwordRequirements.classList.add("valid", "senha-forte");
    passwordRequirements.classList.remove("senha-fraca");
  } else {
    passwordRequirements.classList.remove("valid", "senha-forte");
    passwordRequirements.classList.add("senha-fraca");
  }
}

function validarConfirmacaoSenha() {
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");

  if (!password || !confirmPassword) return;

  if (!confirmPassword.value) {
    confirmPassword.classList.remove("input-ok", "input-erro");
    return;
  }

  if (password.value === confirmPassword.value) {
    confirmPassword.classList.add("input-ok");
    confirmPassword.classList.remove("input-erro");
  } else {
    confirmPassword.classList.add("input-erro");
    confirmPassword.classList.remove("input-ok");
  }
}

function configurarMostrarSenha() {
  const toggles = document.querySelectorAll(".togglePassword");

  toggles.forEach((icon) => {
    icon.addEventListener("click", () => {
      const inputId = icon.getAttribute("data-target");
      const input = document.getElementById(inputId);

      if (!input) return;

      const isPassword = input.type === "password";

      input.type = isPassword ? "text" : "password";

      icon.classList.toggle("fa-eye", !isPassword);
      icon.classList.toggle("fa-eye-slash", isPassword);
    });
  });
}

async function lerRespostaReset(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function pegarMensagemErroReset(data) {
  if (!data) {
    return "Erro ao redefinir senha.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.message) {
    return data.message;
  }

  if (data.detail && typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((erro) => erro.msg || erro.message || "Campo inválido.")
      .join("\n");
  }

  return "Erro ao redefinir senha.";
}

function getResetEmail() {
  return (
    sessionStorage.getItem("resetEmail") ||
    sessionStorage.getItem("email") ||
    localStorage.getItem("resetEmail") ||
    localStorage.getItem("email") ||
    ""
  );
}

function getResetCode() {
  return (
    sessionStorage.getItem("resetToken") ||
    sessionStorage.getItem("code") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("resetToken") ||
    localStorage.getItem("code") ||
    localStorage.getItem("token") ||
    ""
  );
}

function limparDadosRecuperacao() {
  sessionStorage.removeItem("email");
  sessionStorage.removeItem("resetEmail");
  sessionStorage.removeItem("code");
  sessionStorage.removeItem("resetToken");
  sessionStorage.removeItem("token");

  localStorage.removeItem("email");
  localStorage.removeItem("resetEmail");
  localStorage.removeItem("code");
  localStorage.removeItem("resetToken");
  localStorage.removeItem("token");
}

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");

  if (popup) {
    popup.classList.add("hidden");
    popup.classList.remove("show");
    popup.style.display = "none";
  }

  configurarMostrarSenha();

  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const form = document.getElementById("resetForm");

  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      atualizarMensagemSenha();
      validarConfirmacaoSenha();
    });
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", validarConfirmacaoSenha);
  }

  if (!form) {
    console.error("Formulário resetForm não encontrado.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const btnResetar = form.querySelector("button[type='submit']");

    const password = document.getElementById("password")?.value.trim() || "";
    const confirmPassword = document.getElementById("confirmPassword")?.value.trim() || "";

    const email = getResetEmail();
    const code = getResetCode();

    if (!password || !confirmPassword) {
      abrirPopup("Preencha a nova senha e a confirmação.");
      return;
    }

    if (!validarSenhaForte(password)) {
      atualizarMensagemSenha();
      abrirPopup(
        "A senha deve ter no mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial."
      );
      return;
    }

    if (password !== confirmPassword) {
      validarConfirmacaoSenha();
      abrirPopup("As senhas não coincidem.");
      return;
    }

    if (!email) {
      abrirPopup("Dados de recuperação inválidos. Reinicie o processo.");
      return;
    }

    if (!code) {
      abrirPopup("Código inválido ou expirado. Valide o código novamente.");
      return;
    }

    const payload = {
      email: email,
      code: code,
      newPassword: password
    };

    try {
      if (btnResetar) {
        btnResetar.disabled = true;
        btnResetar.innerText = "Redefinindo...";
      }

      const response = await fetch(`${API_RESET_PASSWORD}/user/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await lerRespostaReset(response);

      if (!response.ok) {
        abrirPopup(pegarMensagemErroReset(data));
        return;
      }

      limparDadosRecuperacao();

      abrirPopupComAcao("Senha redefinida com sucesso!", () => {
        window.location.href = "index.html";
      });

    } catch (error) {
      console.error("ERRO RESET:", error);
      abrirPopup("Erro ao conectar com servidor.");
    } finally {
      if (btnResetar) {
        btnResetar.disabled = false;
        btnResetar.innerText = "Redefinir senha";
      }
    }
  });
});

window.fecharPopup = fecharPopup;