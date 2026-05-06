function abrirPopup(mensagem) {
  const popupText = document.getElementById("popup-text");
  const popup = document.getElementById("popup");

  if (popupText) {
    popupText.innerText = mensagem;
  }

  if (popup) {
    popup.classList.add("show");
    popup.classList.remove("hidden");
  }
}

function fecharPopup() {
  const popup = document.getElementById("popup");

  if (popup) {
    popup.classList.remove("show");
    popup.classList.add("hidden");
  }
}

/* ================= VALIDAR SENHA FORTE ================= */
function validarSenhaForte(senha) {
  const temMinimo8 = senha.length >= 8;
  const temMaiuscula = /[A-Z]/.test(senha);
  const temMinuscula = /[a-z]/.test(senha);
  const temNumero = /[0-9]/.test(senha);
  const temEspecial = /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];']/g.test(senha);

  return (
    temMinimo8 &&
    temMaiuscula &&
    temMinuscula &&
    temNumero &&
    temEspecial
  );
}

/* ================= MENSAGEM ABAIXO DA SENHA ================= */
function atualizarMensagemSenha() {
  const password = document.getElementById("password");
  const passwordRequirements = document.getElementById("passwordRequirements");

  if (!password || !passwordRequirements) return;

  const senha = password.value;

  if (!senha) {
    passwordRequirements.classList.remove("show");
    passwordRequirements.classList.remove("valid");

    passwordRequirements.innerText =
      "A senha deve ter no mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial.";

    return;
  }

  if (validarSenhaForte(senha)) {
    passwordRequirements.classList.add("show");
    passwordRequirements.classList.add("valid");
    passwordRequirements.innerText = "Senha forte.";
  } else {
    passwordRequirements.classList.add("show");
    passwordRequirements.classList.remove("valid");

    passwordRequirements.innerText =
      "A senha deve ter no mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial.";
  }
}

document.addEventListener("DOMContentLoaded", () => {

  /* ================= OLHO DA SENHA ================= */
  const toggles = document.querySelectorAll(".togglePassword");

  toggles.forEach(icon => {
    icon.addEventListener("click", () => {
      const inputId = icon.getAttribute("data-target");
      const input = document.getElementById(inputId);

      if (!input) return;

      const isPassword = input.type === "password";

      input.type = isPassword ? "text" : "password";

      icon.classList.toggle("fa-eye");
      icon.classList.toggle("fa-eye-slash");
    });
  });

  /* ================= SENHA FORTE EM TEMPO REAL ================= */
  const passwordInput = document.getElementById("password");

  if (passwordInput) {
    passwordInput.addEventListener("input", atualizarMensagemSenha);
  }

  /* ================= FORMULÁRIO ================= */
  const form = document.getElementById("resetForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btnResetar = form.querySelector("button[type='submit']");

    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    const email =
      sessionStorage.getItem("email") ||
      sessionStorage.getItem("resetEmail");

    const code =
      sessionStorage.getItem("code") ||
      sessionStorage.getItem("resetToken");

    if (!validarSenhaForte(password)) {
      atualizarMensagemSenha();
      return;
    }

    if (password !== confirmPassword) {
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

    if (btnResetar) {
      btnResetar.disabled = true;
      btnResetar.innerText = "Redefinindo...";
    }

    const payload = {
      email: email,
      code: code,
      newPassword: password
    };

    try {
      const response = await fetch(
        "https://www.manage-control-dev.com.br/api/v1/user/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const text = await response.text();

      console.log("RESET STATUS:", response.status);
      console.log("RESET RESPONSE:", text);

      if (!response.ok) {
        abrirPopup("Erro ao redefinir senha.");
        return;
      }

      sessionStorage.removeItem("email");
      sessionStorage.removeItem("resetEmail");
      sessionStorage.removeItem("code");
      sessionStorage.removeItem("resetToken");

      abrirPopup("Senha redefinida com sucesso!");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);

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