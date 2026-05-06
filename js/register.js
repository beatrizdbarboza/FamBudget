function abrirPopup(mensagem) {
  const popupText = document.getElementById("popup-text");
  const popup = document.getElementById("popup");

  if (popupText) {
    popupText.innerText = mensagem;
  }

  if (popup) {
    popup.classList.remove("hidden");
  }
}

function fecharPopup() {
  const popup = document.getElementById("popup");

  if (popup) {
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

/* ================= MOSTRAR MENSAGEM DA SENHA ================= */
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

/* ================= MÁSCARA DE TELEFONE ================= */
function aplicarMascaraTelefone(valor) {
  let numeros = valor.replace(/\D/g, "");

  // Limita em 11 números: DDD + 9 dígitos
  numeros = numeros.slice(0, 11);

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
}

/* ================= NORMALIZAR TELEFONE PARA API ================= */
function limparTelefoneParaApi(telefone) {
  return telefone.replace(/\D/g, "");
}

/* ================= DOM ================= */
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

  /* ================= TELEFONE ================= */
  const mobileNumberInput = document.getElementById("mobileNumber");

  if (mobileNumberInput) {
    mobileNumberInput.addEventListener("input", () => {
      mobileNumberInput.value = aplicarMascaraTelefone(mobileNumberInput.value);
    });
  }

  /* ================= SENHA FORTE EM TEMPO REAL ================= */
  const passwordInput = document.getElementById("password");

  if (passwordInput) {
    passwordInput.addEventListener("input", atualizarMensagemSenha);
  }

  /* ================= FORMULÁRIO ================= */
  const form = document.getElementById("registerForm");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const btnCadastrar = document.getElementById("btnCadastrar");

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobileNumberInput = document.getElementById("mobileNumber").value.trim();
    const mobileNumber = limparTelefoneParaApi(mobileNumberInput);
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!name) {
      abrirPopup("Digite seu nome completo.");
      return;
    }

    if (!email) {
      abrirPopup("Digite seu e-mail.");
      return;
    }

    if (mobileNumber && mobileNumber.length !== 11) {
      abrirPopup("Digite um telefone válido no formato (XX) XXXXX-XXXX.");
      return;
    }

    if (!validarSenhaForte(password)) {
      abrirPopup(
        "A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial."
      );

      atualizarMensagemSenha();
      return;
    }

    if (password !== confirmPassword) {
      abrirPopup("As senhas não coincidem.");
      return;
    }

    if (btnCadastrar) {
      btnCadastrar.disabled = true;
      btnCadastrar.innerText = "Cadastrando...";
    }

    try {
      const response = await fetch("https://www.manage-control-dev.com.br/api/v1/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          mobileNumber,
          password
        })
      });

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      console.log("STATUS CADASTRO:", response.status);
      console.log("RESPOSTA CADASTRO:", data || text);

      if (!response.ok) {
        const mensagemErro =
          data.message ||
          data.detail ||
          text ||
          "Não foi possível realizar o cadastro.";

        abrirPopup(mensagemErro);
        return;
      }

      abrirPopup("Cadastro realizado com sucesso!");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);

    } catch (error) {
      console.error("ERRO AO CADASTRAR:", error);

      abrirPopup(
        "Erro ao conectar com o servidor. Verifique sua conexão ou tente novamente mais tarde."
      );

    } finally {
      if (btnCadastrar) {
        btnCadastrar.disabled = false;
        btnCadastrar.innerText = "Cadastrar";
      }
    }
  });

});