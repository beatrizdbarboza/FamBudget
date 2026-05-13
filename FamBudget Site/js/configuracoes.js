const API_URL = "https://www.manage-control-dev.com.br/api/v1";
const UPDATE_NICKNAME_ENDPOINT = "/user/update-nickname";
const API_URL_CONFIG = "https://www.manage-control-dev.com.br/api/v1";

document.addEventListener("DOMContentLoaded", () => {
  inicializarMenu();
  carregarUsuario();
  configurarEventosPerfil();

  carregarPreferenciasPerfil();
  configurarPreferenciasPerfil();

  configurarAlterarSenha();
});

function getToken() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function headers() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function readResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      ...headers(),
      ...(options.headers || {})
    }
  });

  const data = await readResponse(response);

  return { response, data };
}

function tokenExpirado() {
  const dadosToken = decodificarToken();

  if (!dadosToken || !dadosToken.exp) {
    return false;
  }

  const agora = Math.floor(Date.now() / 1000);

  return dadosToken.exp < agora;
}

function sessaoExpirada() {
  sessionStorage.clear();

  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");

  mostrarToast("Sua sessão expirou. Faça login novamente.", "erro");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1800);
}

function mensagemIndicaTokenInvalido(mensagem) {
  if (!mensagem) return false;

  const texto = String(mensagem).toLowerCase();

  return (
    texto.includes("token") ||
    texto.includes("expirado") ||
    texto.includes("expired") ||
    texto.includes("invalid") ||
    texto.includes("inválido") ||
    texto.includes("unauthorized") ||
    texto.includes("não autorizado")
  );
}

function inicializarMenu() {
  document.querySelectorAll(".menu li[data-link]").forEach((item) => {
    item.addEventListener("click", () => {
      window.location.href = item.dataset.link;
    });
  });

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.clear();

      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      sessionStorage.removeItem("moedaUsuario");
      sessionStorage.removeItem("pagamentoCartao");
      sessionStorage.removeItem("avatarUsuario");
      sessionStorage.removeItem("nicknameUsuario");
      sessionStorage.removeItem("nomeUsuario");
      sessionStorage.removeItem("emailUsuario");

      window.location.href = "index.html";
    });
  }
}

function decodificarToken() {
  const token = getToken();

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
    console.warn("Não foi possível decodificar o token:", error);
    return null;
  }
}

function getUserKey() {
  const dadosToken = decodificarToken();

  const email =
    sessionStorage.getItem("emailUsuario") ||
    dadosToken?.email ||
    "usuario";

  return `fambudget_${String(email).toLowerCase().trim()}`;
}

function salvarDadoUsuario(chave, valor) {
  const userKey = getUserKey();
  localStorage.setItem(`${userKey}_${chave}`, valor);
}

function buscarDadoUsuario(chave) {
  const userKey = getUserKey();
  return localStorage.getItem(`${userKey}_${chave}`);
}

function carregarUsuario() {
  const dadosToken = decodificarToken();

  const nickname =
    buscarDadoUsuario("nicknameUsuario") ||
    buscarDadoUsuario("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    dadosToken?.nickname ||
    dadosToken?.name ||
    dadosToken?.nome ||
    dadosToken?.username ||
    "Usuário";

  const email =
    sessionStorage.getItem("emailUsuario") ||
    dadosToken?.email ||
    "email@email.com";

  const avatarSalvo =
    buscarDadoUsuario("avatarUsuario") ||
    sessionStorage.getItem("avatarUsuario") ||
    "";

  sessionStorage.setItem("nicknameUsuario", nickname);
  sessionStorage.setItem("nomeUsuario", nickname);
  sessionStorage.setItem("emailUsuario", email);

  if (avatarSalvo) {
    sessionStorage.setItem("avatarUsuario", avatarSalvo);
  } else {
    sessionStorage.removeItem("avatarUsuario");
  }

  atualizarDadosUsuario(nickname, email, avatarSalvo);
}

function atualizarDadosUsuario(nickname, email, avatarImagem = null) {
  const primeiraLetra = nickname ? nickname.charAt(0).toUpperCase() : "U";

  const nomeTopo = document.getElementById("nome-usuario");
  const avatarTopo = document.getElementById("avatar");

  const nomeCard = document.getElementById("nomeUsuario");
  const emailCard = document.getElementById("emailUsuario");
  const avatarCard = document.getElementById("avatarCard");

  const avatarPreview = document.getElementById("avatarPreview");

  if (nomeTopo) nomeTopo.textContent = nickname;
  if (nomeCard) nomeCard.textContent = nickname;
  if (emailCard) emailCard.textContent = email;

  preencherAvatar(avatarTopo, primeiraLetra, avatarImagem);
  preencherAvatar(avatarCard, primeiraLetra, avatarImagem);
  preencherAvatar(avatarPreview, primeiraLetra, avatarImagem);
}

function preencherAvatar(elemento, letra, imagem) {
  if (!elemento) return;

  if (imagem) {
    elemento.innerHTML = `<img src="${imagem}" alt="Avatar">`;
  } else {
    elemento.innerHTML = "";
    elemento.textContent = letra;
  }
}

function configurarEventosPerfil() {
  const modal = document.getElementById("modalPerfil");
  const abrir = document.getElementById("editarPerfil");
  const cancelar = document.getElementById("cancelarModal");
  const salvar = document.getElementById("salvarPerfil");

  const inputNome = document.getElementById("inputNome");
  const inputAvatar = document.getElementById("inputAvatar");
  const fileName = document.getElementById("fileName");
  const cameraAvatar = document.getElementById("cameraAvatar");

  if (abrir) {
    abrir.addEventListener("click", () => {
      const nomeAtual =
        buscarDadoUsuario("nicknameUsuario") ||
        sessionStorage.getItem("nicknameUsuario") ||
        document.getElementById("nomeUsuario")?.textContent ||
        "";

      if (inputNome) {
        inputNome.value = nomeAtual;
      }

      if (fileName) {
        fileName.textContent = "Nenhum arquivo escolhido";
      }

      abrirModal(modal);
    });
  }

  if (cancelar) {
    cancelar.addEventListener("click", () => {
      sessionStorage.removeItem("avatarUsuarioTemp");
      carregarUsuario();
      fecharModal(modal);
    });
  }

  if (cameraAvatar && inputAvatar) {
    cameraAvatar.addEventListener("click", () => {
      inputAvatar.click();
    });
  }

  if (inputAvatar) {
    inputAvatar.addEventListener("change", () => {
      const arquivo = inputAvatar.files[0];

      if (!arquivo) return;

      if (!arquivo.type.startsWith("image/")) {
        mostrarToast("Escolha uma imagem válida.", "erro");
        inputAvatar.value = "";
        return;
      }

      if (arquivo.size > 5 * 1024 * 1024) {
        mostrarToast("A imagem deve ter no máximo 5MB.", "erro");
        inputAvatar.value = "";
        return;
      }

      if (fileName) {
        fileName.textContent = arquivo.name;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const imagemBase64 = reader.result;

        sessionStorage.setItem("avatarUsuarioTemp", imagemBase64);

        const nicknameAtual =
          inputNome.value.trim() ||
          sessionStorage.getItem("nicknameUsuario") ||
          "Usuário";

        const emailAtual =
          sessionStorage.getItem("emailUsuario") ||
          document.getElementById("emailUsuario")?.textContent ||
          "email@email.com";

        atualizarDadosUsuario(nicknameAtual, emailAtual, imagemBase64);
      };

      reader.readAsDataURL(arquivo);
    });
  }

  if (salvar) {
    salvar.addEventListener("click", async () => {
      const nickname = inputNome.value.trim();
      const avatarTemp = sessionStorage.getItem("avatarUsuarioTemp");
      const avatarAtual =
        buscarDadoUsuario("avatarUsuario") ||
        sessionStorage.getItem("avatarUsuario") ||
        "";

      if (!nickname) {
        mostrarToast("Digite o nome de usuário.", "erro");
        return;
      }

      const token = getToken();

      if (!token) {
        mostrarToast("Você precisa estar logado.", "erro");

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);

        return;
      }

      if (tokenExpirado()) {
        sessaoExpirada();
        return;
      }

      try {
        const endpoint = `${UPDATE_NICKNAME_ENDPOINT}?nickname=${encodeURIComponent(nickname)}`;

        const { response, data } = await apiFetch(endpoint, {
          method: "PUT"
        });

        if (!response.ok) {
          const mensagem =
            typeof data === "string"
              ? data
              : data?.message ||
                data?.detail ||
                "Não foi possível atualizar o nome de usuário.";

          if (
            response.status === 401 ||
            response.status === 403 ||
            mensagemIndicaTokenInvalido(mensagem)
          ) {
            sessaoExpirada();
            return;
          }

          mostrarToast(mensagem, "erro");
          return;
        }

        sessionStorage.setItem("nicknameUsuario", nickname);
        sessionStorage.setItem("nomeUsuario", nickname);

        salvarDadoUsuario("nicknameUsuario", nickname);
        salvarDadoUsuario("nomeUsuario", nickname);

        localStorage.removeItem("nicknameUsuario");
        localStorage.removeItem("nomeUsuario");

        let avatarFinal = avatarAtual;

        if (avatarTemp) {
          avatarFinal = avatarTemp;

          salvarDadoUsuario("avatarUsuario", avatarTemp);
          sessionStorage.setItem("avatarUsuario", avatarTemp);

          localStorage.removeItem("avatarUsuario");
          localStorage.removeItem("fotoUsuario");
          localStorage.removeItem("imagemPerfil");
          localStorage.removeItem("fotoPerfil");
          localStorage.removeItem("imagemUsuario");

          sessionStorage.removeItem("avatarUsuarioTemp");
        }

        const emailAtual =
          sessionStorage.getItem("emailUsuario") ||
          document.getElementById("emailUsuario")?.textContent ||
          "email@email.com";

        atualizarDadosUsuario(nickname, emailAtual, avatarFinal);

        fecharModal(modal);
        mostrarToast("Perfil atualizado com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        mostrarToast("Erro ao conectar com a API.", "erro");
      }
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      sessionStorage.removeItem("avatarUsuarioTemp");
      carregarUsuario();
      fecharModal(modal);
    }
  });
}

function abrirModal(modal) {
  if (modal) {
    modal.style.display = "flex";
  }
}

function fecharModal(modal) {
  if (modal) {
    modal.style.display = "none";
  }
}

function mostrarToast(mensagem, tipo = "sucesso") {
  let toast = document.getElementById("toast");
  let texto = document.getElementById("toastText");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";

    texto = document.createElement("span");
    texto.id = "toastText";

    toast.appendChild(texto);
    document.body.appendChild(toast);
  }

  texto.textContent = mensagem;

  toast.className = "toast";

  if (tipo === "erro") {
    toast.classList.add("erro");
  }

  if (tipo === "aviso") {
    toast.classList.add("aviso");
  }

  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3200);
}

function carregarPreferenciasPerfil() {
  const moeda =
    buscarDadoUsuario("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL";

  const pagamentoCartao =
    buscarDadoUsuario("pagamentoCartao") ||
    sessionStorage.getItem("pagamentoCartao") ||
    "";

  const selectMoeda = document.getElementById("selectMoeda");
  const inputPagamentoCartao = document.getElementById("inputPagamentoCartao");

  if (selectMoeda) {
    selectMoeda.value = moeda;
  }

  if (inputPagamentoCartao) {
    inputPagamentoCartao.value = pagamentoCartao;
  }

  sessionStorage.setItem("moedaUsuario", moeda);

  if (pagamentoCartao) {
    sessionStorage.setItem("pagamentoCartao", pagamentoCartao);
  }
}

function configurarPreferenciasPerfil() {
  const selectMoeda = document.getElementById("selectMoeda");
  const inputPagamentoCartao = document.getElementById("inputPagamentoCartao");

  if (selectMoeda) {
    selectMoeda.addEventListener("change", () => {
      const moeda = selectMoeda.value;

      salvarDadoUsuario("moedaUsuario", moeda);
      sessionStorage.setItem("moedaUsuario", moeda);

      mostrarToast("Moeda salva com sucesso!");
    });
  }

  if (inputPagamentoCartao) {
    inputPagamentoCartao.addEventListener("input", () => {
      let valor = inputPagamentoCartao.value.replace(/\D/g, "");

      if (valor.length > 2) {
        valor = valor.slice(0, 2);
      }

      inputPagamentoCartao.value = valor;

      const dia = Number(valor);

      if (!valor) {
        const userKey = getUserKey();

        localStorage.removeItem(`${userKey}_pagamentoCartao`);
        sessionStorage.removeItem("pagamentoCartao");

        return;
      }

      if (dia >= 1 && dia <= 31) {
        salvarDadoUsuario("pagamentoCartao", String(dia));
        sessionStorage.setItem("pagamentoCartao", String(dia));
      }
    });

    inputPagamentoCartao.addEventListener("blur", () => {
      const dia = Number(inputPagamentoCartao.value);

      if (!inputPagamentoCartao.value) return;

      if (dia < 1 || dia > 31) {
        mostrarToast("Digite um dia entre 1 e 31.", "erro");

        inputPagamentoCartao.value = "";

        const userKey = getUserKey();

        localStorage.removeItem(`${userKey}_pagamentoCartao`);
        sessionStorage.removeItem("pagamentoCartao");

        return;
      }

      salvarDadoUsuario("pagamentoCartao", String(dia));
      sessionStorage.setItem("pagamentoCartao", String(dia));

      mostrarToast("Data de pagamento do cartão salva!");
    });
  }
}

function configurarAlterarSenha() {
  const btnAlterarSenha = document.getElementById("btnAlterarSenha");

  if (!btnAlterarSenha) return;

  btnAlterarSenha.setAttribute("type", "button");

  btnAlterarSenha.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    enviarCodigoAlterarSenha();
  });
}

async function enviarCodigoAlterarSenha() {
  const btnAlterarSenha = document.getElementById("btnAlterarSenha");

  const email =
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    sessionStorage.getItem("email") ||
    localStorage.getItem("email");

  if (!email) {
    mostrarToast("Não foi possível identificar seu e-mail. Faça login novamente.", "erro");
    return;
  }

  if (btnAlterarSenha) {
    btnAlterarSenha.disabled = true;
    btnAlterarSenha.innerText = "Enviando código...";
  }

  try {
    const response = await fetch(
      `${API_URL_CONFIG}/user/forgot-password/email/${encodeURIComponent(email)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      const mensagem =
        data.message ||
        data.detail ||
        text ||
        "Não foi possível enviar o código para seu e-mail.";

      mostrarToast(mensagem, "erro");
      return;
    }

    sessionStorage.setItem("email", email);
    sessionStorage.setItem("resetEmail", email);

    mostrarToast("Código enviado para seu e-mail.");

    window.location.assign("validate-code.html");

  } catch (error) {
    console.error("ERRO AO ENVIAR CÓDIGO:", error);
    mostrarToast("Erro ao conectar com o servidor.", "erro");

  } finally {
    if (btnAlterarSenha) {
      btnAlterarSenha.disabled = false;
      btnAlterarSenha.innerText = "Alterar Senha";
    }
  }
}