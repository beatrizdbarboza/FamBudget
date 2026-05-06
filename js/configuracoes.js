console.log("CONFIGURACOES.JS OK - AVATAR CORRIGIDO");

const API_URL = "https://www.manage-control-dev.com.br/api/v1";
const API_URL_CONFIG = "https://www.manage-control-dev.com.br/api/v1";

const UPDATE_NICKNAME_ENDPOINT = "/user/update-nickname";

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", async () => {
  inicializarMenu();

  await carregarUsuario();

  configurarEventosPerfil();

  carregarPreferenciasPerfil();
  configurarPreferenciasPerfil();

  configurarAlterarSenha();

  /*
    IMPORTANTE:
    O botão "Exportar Dados" agora é controlado apenas pelo arquivo js/dados.js.
    Não chame configurarExportarPDF() aqui, senão ele baixa o PDF de configurações.
  */
});

/* =========================
   TOKEN / API
========================= */

function getToken() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function headers(json = true) {
  const token = getToken();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
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
      ...headers(Boolean(options.body)),
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

/* =========================
   MENU / LOGOUT
========================= */

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

      window.location.href = "index.html";
    });
  }
}

/* =========================
   TOKEN DECODER
========================= */

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

/* =========================
   DADOS POR USUÁRIO
========================= */

function getEmailUsuarioAtual() {
  const dadosToken = decodificarToken();

  return (
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    dadosToken?.email ||
    dadosToken?.sub ||
    ""
  ).toLowerCase().trim();
}

function getUserKey() {
  const email = getEmailUsuarioAtual() || "usuario";
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

function removerDadoUsuario(chave) {
  const userKey = getUserKey();
  localStorage.removeItem(`${userKey}_${chave}`);
}

/* =========================
   API USUÁRIO
========================= */

async function buscarUsuarioNaApi(email) {
  const token = getToken();

  if (!token || !email) return null;

  try {
    const { response, data } = await apiFetch(`/user/search/${encodeURIComponent(email)}`, {
      method: "GET"
    });

    if (!response.ok) {
      console.warn("Não foi possível buscar usuário na API:", response.status, data);
      return null;
    }

    return data?.data || data;
  } catch (error) {
    console.warn("Erro ao buscar usuário na API:", error);
    return null;
  }
}

function extrairNicknameUsuarioApi(usuarioApi) {
  if (!usuarioApi) return "";

  return (
    usuarioApi.nickname ||
    usuarioApi.name ||
    usuarioApi.nome ||
    usuarioApi.username ||
    usuarioApi.userName ||
    usuarioApi.fullName ||
    usuarioApi.data?.nickname ||
    usuarioApi.data?.name ||
    usuarioApi.data?.nome ||
    ""
  );
}

function extrairEmailUsuarioApi(usuarioApi) {
  if (!usuarioApi) return "";

  return (
    usuarioApi.email ||
    usuarioApi.userEmail ||
    usuarioApi.data?.email ||
    usuarioApi.data?.userEmail ||
    ""
  );
}

/* =========================
   CARREGAR USUÁRIO
========================= */

async function carregarUsuario() {
  const dadosToken = decodificarToken();

  const emailToken =
    sessionStorage.getItem("emailUsuario") ||
    dadosToken?.email ||
    dadosToken?.sub ||
    localStorage.getItem("emailUsuario") ||
    "";

  let usuarioApi = null;

  if (emailToken) {
    usuarioApi = await buscarUsuarioNaApi(emailToken);
  }

  const nicknameApi = extrairNicknameUsuarioApi(usuarioApi);
  const emailApi = extrairEmailUsuarioApi(usuarioApi);

  const nickname =
    nicknameApi ||
    buscarDadoUsuario("nicknameUsuario") ||
    buscarDadoUsuario("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    dadosToken?.nickname ||
    dadosToken?.name ||
    dadosToken?.nome ||
    dadosToken?.username ||
    "Usuário";

  const email =
    emailApi ||
    emailToken ||
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    "email@email.com";

  sessionStorage.setItem("emailUsuario", email);
  localStorage.setItem("emailUsuario", email);

  const avatarSalvo =
    sessionStorage.getItem("avatarUsuario") ||
    buscarDadoUsuario("avatarUsuario") ||
    localStorage.getItem("avatarUsuario") ||
    "";

  sessionStorage.setItem("nicknameUsuario", nickname);
  sessionStorage.setItem("nomeUsuario", nickname);

  localStorage.setItem("nicknameUsuario", nickname);
  localStorage.setItem("nomeUsuario", nickname);

  salvarDadoUsuario("nicknameUsuario", nickname);
  salvarDadoUsuario("nomeUsuario", nickname);

  if (avatarSalvo) {
    sessionStorage.setItem("avatarUsuario", avatarSalvo);
    localStorage.setItem("avatarUsuario", avatarSalvo);
    salvarDadoUsuario("avatarUsuario", avatarSalvo);
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

  console.log("PREENCHER AVATAR NOVO RODANDO:", {
    elemento: elemento.id,
    temImagem: Boolean(imagem)
  });

  elemento.innerHTML = "";
  elemento.textContent = "";

  elemento.style.display = "flex";
  elemento.style.alignItems = "center";
  elemento.style.justifyContent = "center";
  elemento.style.overflow = "hidden";
  elemento.style.borderRadius = "50%";

  if (imagem) {
    elemento.style.backgroundImage = `url("${imagem}")`;
    elemento.style.backgroundSize = "cover";
    elemento.style.backgroundPosition = "center";
    elemento.style.backgroundRepeat = "no-repeat";
    elemento.style.backgroundColor = "transparent";
    elemento.style.color = "transparent";
    return;
  }

  elemento.style.backgroundImage =
    "linear-gradient(135deg, #2e7d32, rgb(78, 187, 10))";
  elemento.style.backgroundSize = "auto";
  elemento.style.backgroundPosition = "center";
  elemento.style.backgroundRepeat = "no-repeat";
  elemento.style.color = "#ffffff";
  elemento.textContent = letra || "U";
}

/* =========================
   EDITAR PERFIL
========================= */

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
        sessionStorage.getItem("nicknameUsuario") ||
        buscarDadoUsuario("nicknameUsuario") ||
        localStorage.getItem("nicknameUsuario") ||
        document.getElementById("nomeUsuario")?.textContent ||
        "";

      const avatarAtual =
        sessionStorage.getItem("avatarUsuario") ||
        buscarDadoUsuario("avatarUsuario") ||
        localStorage.getItem("avatarUsuario") ||
        "";

      const emailAtual =
        sessionStorage.getItem("emailUsuario") ||
        localStorage.getItem("emailUsuario") ||
        document.getElementById("emailUsuario")?.textContent ||
        "email@email.com";

      if (inputNome) {
        inputNome.value = nomeAtual;
      }

      if (fileName) {
        fileName.textContent = "Nenhum arquivo escolhido";
      }

      atualizarDadosUsuario(nomeAtual || "Usuário", emailAtual, avatarAtual);

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
          localStorage.getItem("nicknameUsuario") ||
          "Usuário";

        const emailAtual =
          sessionStorage.getItem("emailUsuario") ||
          localStorage.getItem("emailUsuario") ||
          document.getElementById("emailUsuario")?.textContent ||
          "email@email.com";

        const primeiraLetra = nicknameAtual.charAt(0).toUpperCase();

        preencherAvatar(document.getElementById("avatar"), primeiraLetra, imagemBase64);
        preencherAvatar(document.getElementById("avatarCard"), primeiraLetra, imagemBase64);
        preencherAvatar(document.getElementById("avatarPreview"), primeiraLetra, imagemBase64);
      };

      reader.readAsDataURL(arquivo);
    });
  }

  if (salvar) {
    salvar.addEventListener("click", async () => {
      const nickname = inputNome.value.trim();
      const avatarTemp = sessionStorage.getItem("avatarUsuarioTemp");

      const avatarAtual =
        sessionStorage.getItem("avatarUsuario") ||
        buscarDadoUsuario("avatarUsuario") ||
        localStorage.getItem("avatarUsuario") ||
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

      salvar.disabled = true;
      const textoOriginal = salvar.textContent;
      salvar.textContent = "Salvando...";

      try {
        const endpoint = `${UPDATE_NICKNAME_ENDPOINT}?nickname=${encodeURIComponent(nickname)}`;

        const { response, data } = await apiFetch(endpoint, {
          method: "PUT"
        });

        console.log("UPDATE NICKNAME STATUS:", response.status);
        console.log("UPDATE NICKNAME RESPOSTA:", data);

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

        localStorage.setItem("nicknameUsuario", nickname);
        localStorage.setItem("nomeUsuario", nickname);

        salvarDadoUsuario("nicknameUsuario", nickname);
        salvarDadoUsuario("nomeUsuario", nickname);

        let avatarFinal = avatarAtual;

        if (avatarTemp) {
          avatarFinal = avatarTemp;

          sessionStorage.setItem("avatarUsuario", avatarTemp);
          localStorage.setItem("avatarUsuario", avatarTemp);
          salvarDadoUsuario("avatarUsuario", avatarTemp);

          localStorage.removeItem("fotoUsuario");
          localStorage.removeItem("imagemPerfil");
          localStorage.removeItem("fotoPerfil");
          localStorage.removeItem("imagemUsuario");

          sessionStorage.removeItem("avatarUsuarioTemp");
        }

        const emailAtual =
          sessionStorage.getItem("emailUsuario") ||
          localStorage.getItem("emailUsuario") ||
          document.getElementById("emailUsuario")?.textContent ||
          "email@email.com";

        atualizarDadosUsuario(nickname, emailAtual, avatarFinal);

        localStorage.setItem("perfilAtualizadoEm", String(Date.now()));

        fecharModal(modal);

        if (avatarTemp) {
          mostrarToast("Perfil e imagem salvos com sucesso!");
        } else {
          mostrarToast("Perfil atualizado com sucesso!");
        }
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        mostrarToast("Erro ao conectar com a API.", "erro");
      } finally {
        salvar.disabled = false;
        salvar.textContent = textoOriginal || "Salvar";
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

/* =========================
   MODAL / TOAST
========================= */

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

/* =========================
   PREFERÊNCIAS
========================= */

function carregarPreferenciasPerfil() {
  const moeda =
    buscarDadoUsuario("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    localStorage.getItem("moedaUsuario") ||
    "BRL";

  const pagamentoCartao =
    buscarDadoUsuario("pagamentoCartao") ||
    sessionStorage.getItem("pagamentoCartao") ||
    localStorage.getItem("pagamentoCartao") ||
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
  localStorage.setItem("moedaUsuario", moeda);

  if (pagamentoCartao) {
    sessionStorage.setItem("pagamentoCartao", pagamentoCartao);
    localStorage.setItem("pagamentoCartao", pagamentoCartao);
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
      localStorage.setItem("moedaUsuario", moeda);

      localStorage.setItem("preferenciasAtualizadasEm", String(Date.now()));

      mostrarToast("Moeda salva neste aparelho.");
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
        removerDadoUsuario("pagamentoCartao");
        sessionStorage.removeItem("pagamentoCartao");
        localStorage.removeItem("pagamentoCartao");
        localStorage.setItem("preferenciasAtualizadasEm", String(Date.now()));
        return;
      }

      if (dia >= 1 && dia <= 31) {
        salvarDadoUsuario("pagamentoCartao", String(dia));
        sessionStorage.setItem("pagamentoCartao", String(dia));
        localStorage.setItem("pagamentoCartao", String(dia));
        localStorage.setItem("preferenciasAtualizadasEm", String(Date.now()));
      }
    });

    inputPagamentoCartao.addEventListener("blur", () => {
      const dia = Number(inputPagamentoCartao.value);

      if (!inputPagamentoCartao.value) return;

      if (dia < 1 || dia > 31) {
        mostrarToast("Digite um dia entre 1 e 31.", "erro");

        inputPagamentoCartao.value = "";

        removerDadoUsuario("pagamentoCartao");
        sessionStorage.removeItem("pagamentoCartao");
        localStorage.removeItem("pagamentoCartao");

        localStorage.setItem("preferenciasAtualizadasEm", String(Date.now()));

        return;
      }

      salvarDadoUsuario("pagamentoCartao", String(dia));
      sessionStorage.setItem("pagamentoCartao", String(dia));
      localStorage.setItem("pagamentoCartao", String(dia));

      localStorage.setItem("preferenciasAtualizadasEm", String(Date.now()));

      mostrarToast("Data de pagamento do cartão salva neste aparelho.");
    });
  }
}

/* ================= ALTERAR SENHA POR CÓDIGO ================= */

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

    console.log("STATUS ENVIO CÓDIGO:", response.status);
    console.log("RESPOSTA ENVIO CÓDIGO:", data || text);

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