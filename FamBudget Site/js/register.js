const API_URL_REGISTER = "https://www.manage-control-dev.com.br/api/v1";

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");
  if (popup) {
    popup.style.display = "none";
    popup.classList.add("hidden");
  }

  const form = document.getElementById("registerForm");
  const inputNome = document.getElementById("name");
  const inputEmail = document.getElementById("email");
  const inputTelefone = document.getElementById("mobileNumber");
  const inputSenha = document.getElementById("password");
  const inputConfirmarSenha = document.getElementById("confirmPassword");
  const requisitosSenha = document.getElementById("passwordRequirements");
  const btnCadastrar = document.getElementById("btnCadastrar");

  if (!form) {
    console.error("Formulário registerForm não encontrado.");
    return;
  }

  if (inputTelefone) {
    inputTelefone.addEventListener("input", () => {
      inputTelefone.value = mascararTelefone(inputTelefone.value);
    });
  }

  if (inputSenha && requisitosSenha) {
    inputSenha.addEventListener("input", () => {
      atualizarRequisitosSenha(inputSenha.value);
    });
  }

  configurarMostrarSenha();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = inputNome?.value.trim() || "";
    const email = inputEmail?.value.trim() || "";
    const mobileNumber = inputTelefone?.value.trim() || "";
    const password = inputSenha?.value.trim() || "";
    const confirmPassword = inputConfirmarSenha?.value.trim() || "";

    if (!name || !email || !password || !confirmPassword) {
      abrirPopup("Preencha nome, e-mail, senha e confirmação de senha.");
      return;
    }

    if (!senhaValida(password)) {
      abrirPopup(
        "A senha deve ter no mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial."
      );

      if (requisitosSenha) {
        requisitosSenha.classList.add("senha-fraca");
      }

      return;
    }

    if (password !== confirmPassword) {
      abrirPopup("As senhas não coincidem.");
      return;
    }

    const payload = {
      name: name,
      nickname: name,
      email: email,
      password: password
    };

    if (mobileNumber) {
      payload.mobileNumber = limparTelefone(mobileNumber);
    }

    try {
      if (btnCadastrar) {
        btnCadastrar.disabled = true;
        btnCadastrar.textContent = "Cadastrando...";
      }

      const response = await fetch(`${API_URL_REGISTER}/user/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await lerRespostaRegister(response);

      if (!response.ok) {
        abrirPopup(pegarMensagemErroRegister(data));
        return;
      }

      abrirPopupComAcao("Conta criada com sucesso!", () => {
        window.location.href = "index.html";
      });

    } catch (error) {
      console.error("ERRO AO CADASTRAR:", error);
      abrirPopup("Erro ao conectar com o servidor.");
    } finally {
      if (btnCadastrar) {
        btnCadastrar.disabled = false;
        btnCadastrar.textContent = "Cadastrar";
      }
    }
  });
});

function senhaValida(senha) {
  const temMinimo = senha.length >= 8;
  const temMaiuscula = /[A-Z]/.test(senha);
  const temMinuscula = /[a-z]/.test(senha);
  const temNumero = /[0-9]/.test(senha);
  const temEspecial = /[^A-Za-z0-9]/.test(senha);

  return temMinimo && temMaiuscula && temMinuscula && temNumero && temEspecial;
}

function atualizarRequisitosSenha(senha) {
  const requisitosSenha = document.getElementById("passwordRequirements");

  if (!requisitosSenha) return;

  const regras = {
    minimo: senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    minuscula: /[a-z]/.test(senha),
    numero: /[0-9]/.test(senha),
    especial: /[^A-Za-z0-9]/.test(senha)
  };

  requisitosSenha.innerHTML = `
    <p class="${regras.minimo ? "ok" : "erro"}">• Mínimo de 8 caracteres</p>
    <p class="${regras.maiuscula ? "ok" : "erro"}">• Pelo menos 1 letra maiúscula</p>
    <p class="${regras.minuscula ? "ok" : "erro"}">• Pelo menos 1 letra minúscula</p>
    <p class="${regras.numero ? "ok" : "erro"}">• Pelo menos 1 número</p>
    <p class="${regras.especial ? "ok" : "erro"}">• Pelo menos 1 caractere especial</p>
  `;

  if (senhaValida(senha)) {
    requisitosSenha.classList.remove("senha-fraca");
    requisitosSenha.classList.add("senha-forte");
  } else {
    requisitosSenha.classList.remove("senha-forte");
    requisitosSenha.classList.add("senha-fraca");
  }

  function atualizarRequisitosSenha(senha) {
    const requisitosSenha = document.getElementById("passwordRequirements");

    if (!requisitosSenha) return;

    const regras = {
      minimo: senha.length >= 8,
      maiuscula: /[A-Z]/.test(senha),
      minuscula: /[a-z]/.test(senha),
      numero: /[0-9]/.test(senha),
      especial: /[^A-Za-z0-9]/.test(senha)
    };

    requisitosSenha.classList.add("show");

    requisitosSenha.innerHTML = `
      <p class="${regras.minimo ? "ok" : "erro"}">• Mínimo de 8 caracteres</p>
      <p class="${regras.maiuscula ? "ok" : "erro"}">• Pelo menos 1 letra maiúscula</p>
      <p class="${regras.minuscula ? "ok" : "erro"}">• Pelo menos 1 letra minúscula</p>
      <p class="${regras.numero ? "ok" : "erro"}">• Pelo menos 1 número</p>
      <p class="${regras.especial ? "ok" : "erro"}">• Pelo menos 1 caractere especial</p>
    `;

    if (senhaValida(senha)) {
      requisitosSenha.classList.remove("senha-fraca");
      requisitosSenha.classList.add("senha-forte");
    } else {
      requisitosSenha.classList.remove("senha-forte");
      requisitosSenha.classList.add("senha-fraca");
    }
  }
}

function configurarMostrarSenha() {
  document.querySelectorAll(".togglePassword").forEach((icone) => {
    icone.addEventListener("click", () => {
      const targetId = icone.dataset.target;
      const input = document.getElementById(targetId);

      if (!input) return;

      const senhaOculta = input.type === "password";
      input.type = senhaOculta ? "text" : "password";

      icone.classList.toggle("fa-eye", !senhaOculta);
      icone.classList.toggle("fa-eye-slash", senhaOculta);
    });
  });
}

function limparTelefone(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function mascararTelefone(valor) {
  const numeros = limparTelefone(valor).slice(0, 11);

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

async function lerRespostaRegister(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function pegarMensagemErroRegister(data) {
  if (!data) {
    return "Não foi possível realizar o cadastro.";
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

  return "Não foi possível realizar o cadastro.";
}

function abrirPopup(mensagem) {
  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popup-text");

  if (popupText) {
    popupText.innerText = mensagem || "Ocorreu um erro. Tente novamente.";
  }

  if (popup) {
    popup.classList.remove("hidden");
    popup.style.display = "flex";
  } else {
    alert(mensagem);
  }
}

function fecharPopup() {
  const popup = document.getElementById("popup");

  if (popup) {
    popup.style.display = "none";
    popup.classList.add("hidden");
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

window.fecharPopup = fecharPopup;