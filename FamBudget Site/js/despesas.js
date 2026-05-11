console.log("DESPESAS.JS OK - API + CATEGORIAS + PAYLOAD CORRIGIDO");

const DESPESAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";
const STORAGE_DESPESAS_EXCLUIDAS = "despesasExcluidas";

/* ================= CORES DAS CATEGORIAS ================= */

const CORES_CATEGORIA_API_DESPESAS = {
  categoryBrown: "#4B2B0A",
  categoryOrange: "#FF7700",
  categoryPink: "#DA4175",
  categoryPurple: "#7B55E3",
  categoryGray: "#4F595B",
  categoryBlue: "#00CCFF",
  categoryGreen: "#44B948",
  categoryYellow: "#E1CC0A",
  brown: "#4B2B0A",
  orange: "#FF7700",
  pink: "#DA4175",
  purple: "#7B55E3",
  gray: "#4F595B",
  blue: "#00CCFF",
  green: "#44B948",
  yellow: "#E1CC0A"
};

const CORES_CATEGORIA_POR_NOME_DESPESAS = {
  alimentacao: "#00CCFF",
  alimentação: "#00CCFF",
  assinaturas: "#FF7700",
  "contas pessoais": "#DA4175",
  educacao: "#E1CC0A",
  educação: "#E1CC0A",
  lazer: "#7B55E3",
  saude: "#44B948",
  saúde: "#44B948",
  outros: "#4F595B",
  moradia: "#4B2B0A",
  transporte: "#00CCFF",
  "cartao de credito": "#7B55E3",
  "cartão de crédito": "#7B55E3",
  "cartao de debito": "#E1CC0A",
  "cartão de débito": "#E1CC0A"
};

/* ================= VARIÁVEIS ================= */

let despesas = [];
let despesasFiltradas = [];
let categoriasDespesaAPI = [];
let membrosFamiliaDespesa = [];

let usuarioPertenceFamiliaDespesa = false;
let mostrarUsuarioDespesa = false;

let dataMesAtual = new Date();

let filtros = {
  tipo: null,
  status: null,
  busca: ""
};

let paginaAtual = 1;
let itensPorPagina = 8;

let modoEdicaoDespesa = false;
let idDespesaEditando = null;
let salvandoDespesa = false;

let modal;
let btnAbrir;
let btnCancelar;
let btnSalvar;
let tituloModalDespesa;

let inputDesc;
let inputValor;
let inputData;
let checkPago;

let inputParcelas;
let containerParcelas;
let previewParcelas;

let tabela;
let inputBusca;

let filtroTipo;
let dropdownTipo;

let filtroStatus;
let dropdownStatus;

let selectCategoria;
let dropdownCategoriaModal;
let categoriaTexto;
let bolinhaCategoriaSelecionada;

let totalDespesas;
let totalSaidas;
let semDados;
let paginacao;

let btnMesAnterior;
let btnProximoMes;
let textoMesAtual;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  pegarElementos();
  inserirCssExtraDespesas();
  criarPopupDespesas();
  configurarMenuELocal();
  configurarEventos();

  carregarUsuarioDespesa();

  filtros.data = pegarAnoMesData(dataMesAtual);
  atualizarTextoMes();

  usuarioPertenceFamiliaDespesa = await usuarioEstaEmFamiliaDespesa();
  mostrarUsuarioDespesa = usuarioPertenceFamiliaDespesa;

  await carregarCategoriasDespesaAPI();
  atualizarCabecalhoUsuarioDespesas();

  await carregarDespesasAPI();
  aplicarFiltros();
});

window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  const precisaRecarregar =
    event.key.includes("moedaUsuario") ||
    event.key === STORAGE_DESPESAS_EXCLUIDAS ||
    event.key === getChaveDespesasExcluidas() ||
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia" ||
    event.key === "despesasAtualizadasEm" ||
    event.key === "dadosFinanceirosAtualizadosEm";

  if (!precisaRecarregar) return;

  usuarioPertenceFamiliaDespesa = await usuarioEstaEmFamiliaDespesa();
  mostrarUsuarioDespesa = usuarioPertenceFamiliaDespesa;

  await carregarCategoriasDespesaAPI();
  atualizarCabecalhoUsuarioDespesas();

  await carregarDespesasAPI();
  aplicarFiltros();
});

window.addEventListener("familiaAtualizada", async () => {
  usuarioPertenceFamiliaDespesa = await usuarioEstaEmFamiliaDespesa();
  mostrarUsuarioDespesa = usuarioPertenceFamiliaDespesa;

  await carregarCategoriasDespesaAPI();
  atualizarCabecalhoUsuarioDespesas();

  await carregarDespesasAPI();
  aplicarFiltros();
});

window.addEventListener("dadosFinanceirosAtualizados", async () => {
  usuarioPertenceFamiliaDespesa = await usuarioEstaEmFamiliaDespesa();
  mostrarUsuarioDespesa = usuarioPertenceFamiliaDespesa;

  await carregarCategoriasDespesaAPI();
  atualizarCabecalhoUsuarioDespesas();

  await carregarDespesasAPI();
  aplicarFiltros();
});

/* ================= ELEMENTOS ================= */

function pegarElementos() {
  modal = document.getElementById("modalNovaDespesa");
  btnAbrir = document.getElementById("btnNovaDespesa");
  btnCancelar = document.getElementById("cancelarDespesa");
  btnSalvar = document.getElementById("salvarDespesa");
  tituloModalDespesa = document.getElementById("tituloModalDespesa");

  inputDesc = document.getElementById("descDespesa");
  inputValor = document.getElementById("valorDespesa");
  inputData = document.getElementById("dataDespesa");
  checkPago = document.getElementById("checkPago");

  inputParcelas = document.getElementById("parcelasDespesa");
  containerParcelas = document.getElementById("containerParcelasDespesa");
  previewParcelas = document.getElementById("previewParcelasDespesa");

  tabela = document.getElementById("lista-extratos");
  inputBusca = document.getElementById("inputBuscaDespesa");

  filtroTipo = document.getElementById("filtroTipo");
  dropdownTipo = document.getElementById("dropdownTipo");

  filtroStatus = document.getElementById("filtroStatus");
  dropdownStatus = document.getElementById("dropdownStatus");

  selectCategoria = document.getElementById("selectCategoria");
  dropdownCategoriaModal = document.getElementById("dropdownCategoriaModal");
  categoriaTexto = document.getElementById("categoriaSelecionada");
  bolinhaCategoriaSelecionada = document.getElementById("bolinhaCategoriaSelecionada");

  totalDespesas = document.getElementById("total-despesas");
  totalSaidas = document.getElementById("total-saidas");
  semDados = document.getElementById("sem-dados");
  paginacao = document.getElementById("paginacao");

  btnMesAnterior = document.getElementById("mes-anterior");
  btnProximoMes = document.getElementById("proximo-mes");
  textoMesAtual = document.getElementById("mes-atual");

  if (inputValor) {
    inputValor.setAttribute("type", "text");
    inputValor.setAttribute("inputmode", "numeric");
    inputValor.setAttribute("autocomplete", "off");
    inputValor.setAttribute("placeholder", "R$ 0,00");
  }
}

/* ================= MENU / LOGOUT ================= */

function configurarMenuELocal() {
  document.querySelectorAll("[data-link]").forEach((item) => {
    item.addEventListener("click", () => {
      const link = item.dataset.link;
      if (link) window.location.href = link;
    });
  });

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("nomeUsuario");
      sessionStorage.removeItem("nicknameUsuario");
      sessionStorage.removeItem("emailUsuario");

      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");

      window.location.href = "index.html";
    });
  }
}

/* ================= EVENTOS ================= */

function configurarEventos() {
  if (btnAbrir) {
    btnAbrir.addEventListener("click", abrirModalDespesa);
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", fecharModalDespesa);
  }

  if (btnSalvar) {
    btnSalvar.addEventListener("click", salvarDespesa);
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) fecharModalDespesa();
    });
  }

  if (inputValor) {
    inputValor.addEventListener("input", () => {
      inputValor.value = aplicarMascaraMoeda(inputValor.value);
      atualizarPreviewParcelas();
    });
  }

  if (inputParcelas) {
    inputParcelas.addEventListener("input", atualizarPreviewParcelas);
  }

  document.querySelectorAll('input[name="tipoDespesa"]').forEach((radio) => {
    radio.addEventListener("change", atualizarCampoParcelas);
  });

  if (inputBusca) {
    inputBusca.addEventListener("input", () => {
      filtros.busca = inputBusca.value.trim();
      paginaAtual = 1;
      aplicarFiltros();
    });
  }

  configurarDropdownFiltros();
  configurarSelectCategoria();
  configurarControleMes();

  document.addEventListener("click", (event) => {
    if (selectCategoria && !selectCategoria.contains(event.target)) {
      selectCategoria.classList.remove("ativo");
      if (dropdownCategoriaModal) dropdownCategoriaModal.style.display = "none";
    }

    if (filtroTipo && !filtroTipo.contains(event.target)) {
      filtroTipo.classList.remove("ativo");
      if (dropdownTipo) dropdownTipo.style.display = "none";
    }

    if (filtroStatus && !filtroStatus.contains(event.target)) {
      filtroStatus.classList.remove("ativo");
      if (dropdownStatus) dropdownStatus.style.display = "none";
    }
  });
}

function configurarDropdownFiltros() {
  if (filtroTipo && dropdownTipo) {
    filtroTipo.addEventListener("click", (event) => {
      event.stopPropagation();

      filtroTipo.classList.toggle("ativo");
      dropdownTipo.style.display = filtroTipo.classList.contains("ativo") ? "block" : "none";
    });

    dropdownTipo.querySelectorAll("[data-tipo]").forEach((item) => {
      item.addEventListener("click", (event) => {
        event.stopPropagation();

        const tipo = item.dataset.tipo;
        filtros.tipo = filtros.tipo === tipo ? null : tipo;

        dropdownTipo.querySelectorAll(".item-filtro").forEach((el) => {
          el.classList.toggle("ativo", el.dataset.tipo === filtros.tipo);
        });

        paginaAtual = 1;
        aplicarFiltros();

        filtroTipo.classList.remove("ativo");
        dropdownTipo.style.display = "none";
      });
    });
  }

  if (filtroStatus && dropdownStatus) {
    filtroStatus.addEventListener("click", (event) => {
      event.stopPropagation();

      filtroStatus.classList.toggle("ativo");
      dropdownStatus.style.display = filtroStatus.classList.contains("ativo") ? "block" : "none";
    });

    dropdownStatus.querySelectorAll("[data-status]").forEach((item) => {
      item.addEventListener("click", (event) => {
        event.stopPropagation();

        const status = item.dataset.status;
        filtros.status = filtros.status === status ? null : status;

        dropdownStatus.querySelectorAll(".item-filtro").forEach((el) => {
          el.classList.toggle("ativo", el.dataset.status === filtros.status);
        });

        paginaAtual = 1;
        aplicarFiltros();

        filtroStatus.classList.remove("ativo");
        dropdownStatus.style.display = "none";
      });
    });
  }
}

function configurarControleMes() {
  if (btnMesAnterior) {
    btnMesAnterior.addEventListener("click", async () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() - 1);
      filtros.data = pegarAnoMesData(dataMesAtual);
      paginaAtual = 1;

      atualizarTextoMes();
      await carregarDespesasAPI();
      aplicarFiltros();
    });
  }

  if (btnProximoMes) {
    btnProximoMes.addEventListener("click", async () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() + 1);
      filtros.data = pegarAnoMesData(dataMesAtual);
      paginaAtual = 1;

      atualizarTextoMes();
      await carregarDespesasAPI();
      aplicarFiltros();
    });
  }
}

function configurarSelectCategoria() {
  if (!selectCategoria || !dropdownCategoriaModal) return;

  selectCategoria.addEventListener("click", (event) => {
    event.stopPropagation();

    const aberto = selectCategoria.classList.contains("ativo");

    if (aberto) {
      selectCategoria.classList.remove("ativo");
      dropdownCategoriaModal.style.display = "none";
    } else {
      selectCategoria.classList.add("ativo");
      dropdownCategoriaModal.style.display = "block";
    }
  });

  dropdownCategoriaModal.addEventListener("click", (event) => {
    event.stopPropagation();

    const item = event.target.closest(".item-categoria");
    if (!item) return;

    selecionarCategoria({
      id: item.dataset.id,
      nome: item.dataset.categoria,
      cor: item.dataset.cor
    });

    selectCategoria.classList.remove("ativo");
    dropdownCategoriaModal.style.display = "none";
  });
}

/* ================= USUÁRIO ================= */

function getTokenDespesas() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") return null;

  return token;
}

function getPayloadTokenDespesa() {
  const token = getTokenDespesas();

  if (!token) return {};

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function getEmailUsuarioAtualDespesa() {
  const payload = getPayloadTokenDespesa();

  return String(
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    payload.email ||
    payload.user_email ||
    payload.sub_email ||
    ""
  )
    .toLowerCase()
    .trim();
}

function getIdUsuarioAtualDespesa() {
  const payload = getPayloadTokenDespesa();

  return (
    payload.user_id ||
    payload.userId ||
    payload.id ||
    payload.sub ||
    null
  );
}

function getUserKeyDespesa(email = null) {
  const emailFinal = email || getEmailUsuarioAtualDespesa() || "usuario";
  return `fambudget_${String(emailFinal).toLowerCase().trim()}`;
}

function buscarDadoUsuarioDespesa(chave, email = null) {
  const userKey = getUserKeyDespesa(email);

  return (
    localStorage.getItem(`${userKey}_${chave}`) ||
    sessionStorage.getItem(`${userKey}_${chave}`) ||
    sessionStorage.getItem(chave) ||
    localStorage.getItem(chave) ||
    ""
  );
}

function carregarUsuarioDespesa() {
  const email = getEmailUsuarioAtualDespesa();

  const nome =
    buscarDadoUsuarioDespesa("nicknameUsuario", email) ||
    buscarDadoUsuarioDespesa("nomeUsuario", email) ||
    "Usuário";

  const imagem =
    buscarDadoUsuarioDespesa("avatarUsuario", email) ||
    buscarDadoUsuarioDespesa("fotoUsuario", email) ||
    buscarDadoUsuarioDespesa("imagemPerfil", email) ||
    buscarDadoUsuarioDespesa("fotoPerfil", email) ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  const nomeFormatado = formatarNicknameDespesa(nome);

  if (nomeUsuario) nomeUsuario.textContent = nomeFormatado;

  corrigirFotoGiganteSolta();

  if (avatar) {
    avatar.innerHTML = "";
    avatar.textContent = "";

    avatar.style.setProperty("width", "35px", "important");
    avatar.style.setProperty("height", "35px", "important");
    avatar.style.setProperty("min-width", "35px", "important");
    avatar.style.setProperty("max-width", "35px", "important");
    avatar.style.setProperty("min-height", "35px", "important");
    avatar.style.setProperty("max-height", "35px", "important");
    avatar.style.setProperty("border-radius", "50%", "important");
    avatar.style.setProperty("overflow", "hidden", "important");
    avatar.style.setProperty("display", "flex", "important");
    avatar.style.setProperty("align-items", "center", "important");
    avatar.style.setProperty("justify-content", "center", "important");
    avatar.style.setProperty("flex", "0 0 35px", "important");
    avatar.style.setProperty("background-size", "cover", "important");
    avatar.style.setProperty("background-position", "center", "important");
    avatar.style.setProperty("background-repeat", "no-repeat", "important");

    if (imagem) {
      avatar.style.setProperty("background", "transparent", "important");
      avatar.style.setProperty("background-image", `url("${imagem}")`, "important");
      avatar.style.setProperty("color", "transparent", "important");
      avatar.textContent = "";
    } else {
      avatar.style.setProperty("background-image", "none", "important");
      avatar.style.setProperty(
        "background",
        "linear-gradient(135deg, #2e7d32, rgb(78, 187, 10))",
        "important"
      );
      avatar.style.setProperty("color", "#ffffff", "important");
      avatar.textContent = String(nomeFormatado || "U").charAt(0).toUpperCase();
    }
  }
}

function formatarNicknameDespesa(nome) {
  const texto = String(nome || "").trim();

  if (!texto) return "Usuário";

  const primeiroNome = texto.split(" ")[0];

  return primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
}

function corrigirFotoGiganteSolta() {
  document
    .querySelectorAll("body > img, .layout > img, .content > img, .main-content > img, .conteudo > img")
    .forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (src.startsWith("data:image")) img.remove();
    });
}

/* ================= API ================= */

function headersDespesas(json = false) {
  const token = getTokenDespesas();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function lerRespostaDespesas(resposta) {
  const texto = await resposta.text();

  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

async function apiDespesas(path, options = {}) {
  const token = getTokenDespesas();

  if (!token) {
    mostrarMensagemDespesa("Sessão expirada. Faça login novamente.");
    return { ok: false, status: 401, data: null };
  }

  try {
    const resposta = await fetch(`${DESPESAS_API_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        ...(options.headers || {})
      }
    });

    const data = await lerRespostaDespesas(resposta);

    if (!resposta.ok) {
      console.warn("API DESPESAS falhou:", path, resposta.status, data);
    }

    return {
      ok: resposta.ok,
      status: resposta.status,
      data
    };
  } catch (erro) {
    console.error("Erro na API de despesas:", erro);

    const mensagemErro = String(erro?.message || erro || "");

    if (mensagemErro.includes("Failed to fetch")) {
      return {
        ok: false,
        status: 0,
        data: {
          message:
            "A API bloqueou esta requisição por CORS. O backend precisa liberar o método PUT para o endereço do front-end."
        }
      };
    }

    return {
      ok: false,
      status: 0,
      data: erro
    };
  }
}

function transformarEmArray(resposta) {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;

  const possibilidades = [
    resposta.data,
    resposta.items,
    resposta.results,
    resposta.content,
    resposta.list,
    resposta.lista,

    resposta.expenses,
    resposta.despesas,

    resposta.categories,
    resposta.categorias,
    resposta.default,
    resposta.defaults,
    resposta.user,
    resposta.usuario,

    resposta.family?.categories,
    resposta.family?.categorias,
    resposta.familia?.categories,
    resposta.familia?.categorias,

    resposta.data?.items,
    resposta.data?.results,
    resposta.data?.content,
    resposta.data?.list,
    resposta.data?.lista,

    resposta.data?.expenses,
    resposta.data?.despesas,

    resposta.data?.categories,
    resposta.data?.categorias,
    resposta.data?.default,
    resposta.data?.defaults,
    resposta.data?.user,
    resposta.data?.usuario,

    resposta.data?.family?.categories,
    resposta.data?.family?.categorias,
    resposta.data?.familia?.categories,
    resposta.data?.familia?.categorias
  ];

  const listaDireta = possibilidades.find((item) => Array.isArray(item));

  return listaDireta || [];
}

/* ================= FAMÍLIA ================= */

async function usuarioEstaEmFamiliaDespesa() {
  const token = getTokenDespesas();

  if (!token) return false;

  try {
    const resposta = await fetch(`${DESPESAS_API_URL}/family`, {
      method: "GET",
      cache: "no-store",
      headers: headersDespesas(false)
    });

    if (resposta.status === 404) return false;
    if (!resposta.ok) return false;

    const data = await lerRespostaDespesas(resposta);
    const membros = getMembersFromResponseDespesa(data);

    if (!Array.isArray(membros)) return true;

    return membros.length > 0;
  } catch (erro) {
    console.warn("Erro ao verificar família em despesas:", erro);
    return false;
  }
}

function getMembersFromResponseDespesa(data) {
  const possiveisListas = [
    data?.members,
    data?.membros,
    data?.users,
    data?.usuarios,
    data?.data?.members,
    data?.data?.membros,
    data?.data?.users,
    data?.data?.usuarios,
    data?.family?.members,
    data?.family?.membros,
    data?.family?.users,
    data?.family?.usuarios,
    data?.data?.family?.members,
    data?.data?.family?.membros,
    data?.data?.family?.users,
    data?.data?.family?.usuarios,
    data?.familia?.members,
    data?.familia?.membros,
    data?.familia?.users,
    data?.familia?.usuarios,
    data?.familyMembers,
    data?.familiaMembers,
    data?.membersFamily,
    data?.membrosFamilia
  ];

  return possiveisListas.find((lista) => Array.isArray(lista)) || [];
}

async function carregarMembrosFamiliaDespesa() {
  membrosFamiliaDespesa = [];

  if (!usuarioPertenceFamiliaDespesa) return [];

  try {
    const resposta = await apiDespesas("/family", {
      method: "GET",
      headers: headersDespesas(false)
    });

    if (!resposta.ok) {
      console.warn("Não foi possível carregar membros da família em despesas:", resposta);
      return [];
    }

    const data = resposta.data?.data || resposta.data;
    const membros = getMembersFromResponseDespesa(data);

    membrosFamiliaDespesa = Array.isArray(membros) ? membros : [];

    console.log("MEMBROS FAMÍLIA DESPESAS:", membrosFamiliaDespesa);

    return membrosFamiliaDespesa;
  } catch (erro) {
    console.warn("Erro ao carregar membros da família em despesas:", erro);
    membrosFamiliaDespesa = [];
    return [];
  }
}

function pegarIdMembroDespesa(membro) {
  return (
    membro?.userId ||
    membro?.user_id ||
    membro?.memberUserId ||
    membro?.member_user_id ||
    membro?.familyUserId ||
    membro?.family_user_id ||
    membro?.userCreatedFamilyId ||
    membro?.user_created_family_id ||
    membro?.user?.id ||
    membro?.user?.userId ||
    membro?.user?.user_id ||
    membro?.usuario?.id ||
    membro?.usuario?.userId ||
    membro?.usuario?.user_id ||
    membro?.member?.id ||
    membro?.member?.userId ||
    membro?.member?.user_id ||
    membro?.familyUser?.id ||
    membro?.familyUser?.userId ||
    membro?.familyUser?.user_id ||
    membro?.id ||
    null
  );
}

function pegarEmailMembroDespesa(membro) {
  return String(
    membro?.email ||
    membro?.userEmail ||
    membro?.emailUser ||
    membro?.user_email ||
    membro?.email_user ||
    membro?.user?.email ||
    membro?.user?.userEmail ||
    membro?.usuario?.email ||
    membro?.usuario?.userEmail ||
    membro?.member?.email ||
    membro?.member?.userEmail ||
    membro?.familyUser?.email ||
    membro?.familyUser?.userEmail ||
    ""
  )
    .toLowerCase()
    .trim();
}

function pegarNomeMembroDespesa(membro) {
  return (
    membro?.nickname ||
    membro?.nickName ||
    membro?.name ||
    membro?.nome ||
    membro?.username ||
    membro?.email ||
    membro?.user?.nickname ||
    membro?.user?.nickName ||
    membro?.user?.name ||
    membro?.user?.nome ||
    membro?.user?.username ||
    membro?.user?.email ||
    membro?.usuario?.nickname ||
    membro?.usuario?.nickName ||
    membro?.usuario?.name ||
    membro?.usuario?.nome ||
    membro?.usuario?.username ||
    membro?.usuario?.email ||
    membro?.member?.nickname ||
    membro?.member?.nickName ||
    membro?.member?.name ||
    membro?.member?.nome ||
    membro?.member?.username ||
    membro?.member?.email ||
    membro?.familyUser?.nickname ||
    membro?.familyUser?.nickName ||
    membro?.familyUser?.name ||
    membro?.familyUser?.nome ||
    membro?.familyUser?.username ||
    membro?.familyUser?.email ||
    ""
  );
}

function buscarNomeMembroPorIdOuEmailDespesa(idUsuario, emailUsuario = "") {
  const id = idUsuario ? String(idUsuario) : "";
  const email = String(emailUsuario || "").toLowerCase().trim();

  const membro = membrosFamiliaDespesa.find((item) => {
    const idMembro = pegarIdMembroDespesa(item);
    const emailMembro = pegarEmailMembroDespesa(item);

    const mesmoId =
      id &&
      idMembro !== null &&
      idMembro !== undefined &&
      String(idMembro) === id;

    const mesmoEmail =
      email &&
      emailMembro &&
      emailMembro === email;

    return mesmoId || mesmoEmail;
  });

  if (!membro) return "";

  const nome = pegarNomeMembroDespesa(membro);

  return nome ? formatarNicknameDespesa(nome) : "";
}

/* ================= CATEGORIAS ================= */

async function carregarCategoriasDespesaAPI() {
  if (!dropdownCategoriaModal) return;

  dropdownCategoriaModal.innerHTML = `
    <div class="carregando-categorias">
      Carregando categorias...
    </div>
  `;

  const resposta = await apiDespesas("/category/user", {
    method: "GET",
    headers: headersDespesas(false)
  });

  console.log("RESPOSTA /category/user:", resposta);

  if (!resposta.ok) {
    categoriasDespesaAPI = [];

    dropdownCategoriaModal.innerHTML = `
      <div class="erro-categorias">
        Não foi possível carregar as categorias da API.
      </div>
    `;

    return;
  }

  const lista = transformarEmArray(resposta.data);

  console.log("LISTA EXTRAÍDA DE CATEGORIAS:", lista);

  categoriasDespesaAPI = removerCategoriasDuplicadasDespesa(
    lista
      .map(normalizarCategoriaDespesaAPI)
      .filter((categoria) => {
        const id = Number(categoria.id);
        return Number.isInteger(id) && id > 0 && categoria.nome;
      })
  );

  console.log("CATEGORIAS NORMALIZADAS:", categoriasDespesaAPI);

  if (!categoriasDespesaAPI.length) {
    dropdownCategoriaModal.innerHTML = `
      <div class="sem-categorias-api">
        Nenhuma categoria válida encontrada na API.
      </div>
    `;

    return;
  }

  renderizarCategoriasDespesa(categoriasDespesaAPI);
}

function normalizarCategoriaDespesaAPI(item) {
  const nome =
    item?.name ||
    item?.nome ||
    item?.description ||
    item?.descricao ||
    item?.categoryName ||
    item?.category_name ||
    item?.category?.name ||
    item?.category?.nome ||
    item?.categoria?.name ||
    item?.categoria?.nome ||
    "";

  const id = extrairIdNumericoCategoriaDespesa(item);

  const corClasse =
    item?.color ||
    item?.cor ||
    item?.colorName ||
    item?.color_name ||
    item?.typeColor ||
    item?.type_color ||
    "";

  const corHex =
    item?.hexColor ||
    item?.hex_color ||
    item?.colorHex ||
    item?.color_hex ||
    "";

  return {
    id,
    nome: String(nome).trim(),
    cor: obterCorCategoriaDespesa(nome, corClasse, corHex),
    corClasse
  };
}

function extrairIdNumericoCategoriaDespesa(item) {
  const possiveisIds = [
    item?.id,
    item?.categoryId,
    item?.category_id,
    item?.categoriaId,
    item?.categoria_id,
    item?.idCategory,
    item?.id_category,
    item?.category?.id,
    item?.categoria?.id
  ];

  for (const id of possiveisIds) {
    const numero = Number(id);

    if (Number.isInteger(numero) && numero > 0) return numero;
  }

  return null;
}

function removerCategoriasDuplicadasDespesa(lista) {
  const mapa = new Map();

  lista.forEach((categoria) => {
    const chave = normalizarTexto(categoria.nome);
    if (!mapa.has(chave)) mapa.set(chave, categoria);
  });

  return Array.from(mapa.values());
}

function renderizarCategoriasDespesa(categorias) {
  if (!dropdownCategoriaModal) return;

  dropdownCategoriaModal.innerHTML = "";

  categorias.forEach((categoria) => {
    const item = document.createElement("button");

    item.type = "button";
    item.className = "item-categoria";

    item.dataset.id = String(categoria.id);
    item.dataset.categoria = categoria.nome;
    item.dataset.cor = categoria.cor;

    item.innerHTML = `
      <span class="bolinha-categoria" style="background-color: ${categoria.cor};"></span>
      <span>${escapeHTML(categoria.nome)}</span>
    `;

    dropdownCategoriaModal.appendChild(item);
  });

  dropdownCategoriaModal.style.display = "none";
}

function selecionarCategoria(categoria) {
  if (!categoria || !selectCategoria || !categoriaTexto) return;

  selectCategoria.dataset.categoriaId = String(categoria.id || "");
  selectCategoria.dataset.categoria = categoria.nome || "";
  selectCategoria.dataset.cor = categoria.cor || "#4F595B";

  categoriaTexto.textContent = categoria.nome || "Selecione uma categoria";

  if (bolinhaCategoriaSelecionada) {
    bolinhaCategoriaSelecionada.style.backgroundColor = categoria.cor || "#4F595B";
  }

  dropdownCategoriaModal?.querySelectorAll(".item-categoria").forEach((item) => {
    item.classList.toggle(
      "ativo",
      String(item.dataset.id) === String(categoria.id)
    );
  });

  atualizarCampoParcelas();
  atualizarPreviewParcelas();
}

function selecionarCategoriaPorNome(nome) {
  const categoria = categoriasDespesaAPI.find((item) => {
    return normalizarTexto(item.nome) === normalizarTexto(nome);
  });

  if (categoria) {
    selecionarCategoria(categoria);
    return;
  }

  if (selectCategoria) {
    selectCategoria.dataset.categoriaId = "";
    selectCategoria.dataset.categoria = "";
    selectCategoria.dataset.cor = "";
  }

  if (categoriaTexto) categoriaTexto.textContent = "Selecione uma categoria";
}

function obterCategoriaIdNumericoDespesa() {
  const id = Number(selectCategoria?.dataset?.categoriaId || 0);

  if (Number.isInteger(id) && id > 0) return id;

  const nomeSelecionado = normalizarTexto(categoriaTexto?.textContent || "");

  const categoriaEncontrada = categoriasDespesaAPI.find((categoria) => {
    return normalizarTexto(categoria.nome) === nomeSelecionado;
  });

  const idEncontrado = Number(categoriaEncontrada?.id || 0);

  if (Number.isInteger(idEncontrado) && idEncontrado > 0) {
    return idEncontrado;
  }

  return null;
}

function obterCorCategoriaDespesa(nome, corClasse = "", corHex = "") {
  if (corHex && /^#([0-9A-F]{3}){1,2}$/i.test(corHex)) return corHex;

  if (CORES_CATEGORIA_API_DESPESAS[corClasse]) {
    return CORES_CATEGORIA_API_DESPESAS[corClasse];
  }

  const texto = normalizarTexto(nome);

  return CORES_CATEGORIA_POR_NOME_DESPESAS[texto] || "#4F595B";
}

/* ================= EDIÇÕES LOCAIS DE DESPESAS ================= */

async function obterFamilyIdDespesa() {
  const resposta = await apiDespesas("/family", {
    method: "GET",
    headers: headersDespesas(false)
  });

  if (!resposta.ok) {
    return null;
  }

  const data = resposta.data?.data || resposta.data;

  const familyId =
    data?.id ||
    data?.familyId ||
    data?.family_id ||
    data?.familiaId ||
    data?.familia_id ||
    data?.family?.id ||
    data?.familia?.id ||
    null;

  return familyId;
}

function getChaveDespesasEditadas() {
  return `${getUserKeyDespesa()}_despesasEditadasLocalmente`;
}

function lerDespesasEditadasLocalmente() {
  try {
    const dados = localStorage.getItem(getChaveDespesasEditadas());

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarDespesasEditadasLocalmente(lista) {
  localStorage.setItem(
    getChaveDespesasEditadas(),
    JSON.stringify(Array.isArray(lista) ? lista : [])
  );
}

function criarChaveEdicaoDespesa(despesa) {
  return String(
    despesa?.expenseId ||
    despesa?.expense_id ||
    despesa?.id ||
    ""
  );
}

function salvarDespesaEditadaLocalmente(despesaOriginal, dadosEditados) {
  const listaAtual = lerDespesasEditadasLocalmente();
  const chave = criarChaveEdicaoDespesa(despesaOriginal);

  if (!chave) return;

  const categoriaEncontrada = categoriasDespesaAPI.find((categoria) => {
    return Number(categoria.id) === Number(dadosEditados.categoriaId);
  });

  const nomeCategoria =
    categoriaEncontrada?.nome ||
    dadosEditados.categoria ||
    despesaOriginal.categoria ||
    "Outros";

  const corCategoria =
    categoriaEncontrada?.cor ||
    obterCorCategoriaDespesa(nomeCategoria);

  const despesaEditada = {
    ...despesaOriginal,

    id: despesaOriginal.id,
    expenseId: despesaOriginal.expenseId || despesaOriginal.expense_id || despesaOriginal.id,
    expense_id: despesaOriginal.expense_id || despesaOriginal.expenseId || despesaOriginal.id,

    valorOriginal:
      despesaOriginal.value ??
      despesaOriginal.valor ??
      despesaOriginal.amount ??
      0,

    valueOriginal:
      despesaOriginal.value ??
      despesaOriginal.valor ??
      despesaOriginal.amount ??
      0,

    amountOriginal:
      despesaOriginal.amount ??
      despesaOriginal.valor ??
      despesaOriginal.value ??
      0,

    dataOriginal:
      despesaOriginal.dateInitial ||
      despesaOriginal.data ||
      despesaOriginal.date ||
      "",

    dateInitialOriginal:
      despesaOriginal.dateInitial ||
      despesaOriginal.data ||
      despesaOriginal.date ||
      "",

    dateOriginal:
      despesaOriginal.date ||
      despesaOriginal.data ||
      despesaOriginal.dateInitial ||
      "",

    descricao: dadosEditados.descricao,
    description: dadosEditados.descricao,
    name: dadosEditados.descricao,

    valor: Number(dadosEditados.valor),
    value: Number(dadosEditados.valor),
    amount: Number(dadosEditados.valor),

    data: dadosEditados.data,
    dateInitial: dadosEditados.data,
    date: dadosEditados.data,

    categoria: nomeCategoria,
    category: nomeCategoria,
    categoryName: nomeCategoria,
    nomeCategoria: nomeCategoria,

    categoriaId: Number(dadosEditados.categoriaId),
    categoryId: Number(dadosEditados.categoriaId),
    category_id: Number(dadosEditados.categoriaId),
    categoria_id: Number(dadosEditados.categoriaId),

    corCategoria: corCategoria,

    tipo: dadosEditados.tipo,
    typeExpense: dadosEditados.typeExpense,
    typeExpenseId: dadosEditados.typeExpense,

    pago: Boolean(dadosEditados.pago),
    paid: Boolean(dadosEditados.pago),
    status: dadosEditados.pago ? "pago" : "pendente",

    editadoLocalmente: true
  };

  const novaLista = listaAtual.filter((item) => {
    return criarChaveEdicaoDespesa(item) !== chave;
  });

  novaLista.push(despesaEditada);

  salvarDespesasEditadasLocalmente(novaLista);

  console.log("DESPESA EDITADA LOCALMENTE:", despesaEditada);
}

function removerDespesaEditadaLocalmente(despesa) {
  const listaAtual = lerDespesasEditadasLocalmente();
  const chave = criarChaveEdicaoDespesa(despesa);

  if (!chave) return;

  const novaLista = listaAtual.filter((item) => {
    return criarChaveEdicaoDespesa(item) !== chave;
  });

  salvarDespesasEditadasLocalmente(novaLista);

  console.log("DESPESA EDITADA LOCALMENTE REMOVIDA:", despesa);
}

function aplicarEdicoesLocaisNasDespesas(lista) {
  const editadas = lerDespesasEditadasLocalmente();

  if (!editadas.length) return lista;

  return lista.map((despesa) => {
    const chaveDespesa = criarChaveEdicaoDespesa(despesa);

    const editada = editadas.find((item) => {
      return criarChaveEdicaoDespesa(item) === chaveDespesa;
    });

    return editada ? { ...despesa, ...editada } : despesa;
  });
}

async function carregarDespesasAPI() {
  let listaAPI = [];

  const mes = dataMesAtual.getMonth() + 1;
  const ano = dataMesAtual.getFullYear();

  if (usuarioPertenceFamiliaDespesa) {
    await carregarMembrosFamiliaDespesa();

    const familyId = await obterFamilyIdDespesa();

    if (familyId) {
      const respostaFamilia = await apiDespesas(`/expense/family/${familyId}?month=${mes}&year=${ano}`, {
        method: "GET",
        headers: headersDespesas(false)
      });

      if (respostaFamilia.ok) {
        listaAPI = transformarEmArray(respostaFamilia.data);
      }
    }

    if (!listaAPI.length) {
      const respostaUser = await apiDespesas(`/expense/user?month=${mes}&year=${ano}`, {
        method: "GET",
        headers: headersDespesas(false)
      });

      if (respostaUser.ok) {
        listaAPI = transformarEmArray(respostaUser.data);
      }
    }
  } else {
    membrosFamiliaDespesa = [];

    const respostaUser = await apiDespesas(`/expense/user?month=${mes}&year=${ano}`, {
      method: "GET",
      headers: headersDespesas(false)
    });

    if (respostaUser.ok) {
      listaAPI = transformarEmArray(respostaUser.data);
    }
  }

  let listaNormalizada = listaAPI
    .map(normalizarDespesaAPI)
    .filter((despesa) => !despesaFoiExcluida(despesa));

  listaNormalizada = aplicarEdicoesLocaisNasDespesas(listaNormalizada);

  despesas = removerDuplicadasDespesas(listaNormalizada);

  console.log("DESPESAS API USADAS:", despesas);
}

function pegarCategoriaIdDaDespesa(despesa) {
  const possiveisIds = [
    despesa?.categoryId,
    despesa?.category_id,
    despesa?.categoriaId,
    despesa?.categoria_id,
    despesa?.idCategory,
    despesa?.id_category,
    despesa?.category?.id,
    despesa?.categoria?.id,
    typeof despesa?.category === "number" ? despesa.category : null,
    typeof despesa?.categoria === "number" ? despesa.categoria : null
  ];

  for (const id of possiveisIds) {
    const numero = Number(id);

    if (Number.isInteger(numero) && numero > 0) {
      return numero;
    }
  }

  return null;
}

function pegarNomeCategoriaPorIdDespesa(categoriaId) {
  const id = Number(categoriaId);

  if (!Number.isInteger(id) || id <= 0) {
    return "";
  }

  const categoria = categoriasDespesaAPI.find((item) => {
    return Number(item.id) === id;
  });

  return categoria?.nome || "";
}

function pegarCorCategoriaPorIdDespesa(categoriaId) {
  const id = Number(categoriaId);

  if (!Number.isInteger(id) || id <= 0) {
    return "";
  }

  const categoria = categoriasDespesaAPI.find((item) => {
    return Number(item.id) === id;
  });

  return categoria?.cor || "";
}

function normalizarDespesaAPI(despesa, index = 0) {
  const categoriaId = pegarCategoriaIdDaDespesa(despesa);

  const categoriaObj =
    typeof despesa?.category === "object"
      ? despesa.category
      : typeof despesa?.categoria === "object"
        ? despesa.categoria
        : null;

  const nomeCategoriaPorId = pegarNomeCategoriaPorIdDespesa(categoriaId);

  const categoria =
    categoriaObj && typeof categoriaObj === "object"
      ? (
          categoriaObj.name ||
          categoriaObj.nome ||
          categoriaObj.description ||
          categoriaObj.descricao ||
          nomeCategoriaPorId ||
          "Outros"
        )
      : (
          despesa?.categoriaNome ||
          despesa?.nomeCategoria ||
          despesa?.categoryName ||
          despesa?.category_name ||
          despesa?.descriptionCategory ||
          despesa?.typeCategory ||
          despesa?.nameCategory ||
          nomeCategoriaPorId ||
          (
            typeof despesa?.categoria === "string" &&
            isNaN(Number(despesa.categoria))
              ? despesa.categoria
              : ""
          ) ||
          (
            typeof despesa?.category === "string" &&
            isNaN(Number(despesa.category))
              ? despesa.category
              : ""
          ) ||
          "Outros"
        );

  const tipo = normalizarTipoDespesa(
    despesa?.tipo ||
    despesa?.type ||
    despesa?.typeExpense ||
    despesa?.expenseType ||
    despesa?.tipoDespesa ||
    "variavel"
  );

  const pago = Boolean(
    despesa?.pago === true ||
    despesa?.paid === true ||
    despesa?.isPaid === true ||
    despesa?.status === "pago" ||
    despesa?.status === "PAID"
  );

  const corPorId = pegarCorCategoriaPorIdDespesa(categoriaId);

  return {
    ...despesa,

    id:
      despesa?.id ||
      despesa?.expenseId ||
      despesa?.expense_id ||
      despesa?.transactionId ||
      despesa?.transaction_id ||
      `despesa-api-${index}`,

    expenseId:
      despesa?.expenseId ||
      despesa?.expense_id ||
      despesa?.id ||
      null,

    expense_id:
      despesa?.expense_id ||
      despesa?.expenseId ||
      despesa?.id ||
      null,

    descricao:
      despesa?.descricao ||
      despesa?.description ||
      despesa?.name ||
      despesa?.nome ||
      despesa?.title ||
      "Sem descrição",

    categoria: String(categoria),
    category: String(categoria),
    categoryName: String(categoria),
    nomeCategoria: String(categoria),

    categoriaId: categoriaId || despesa?.categoriaId || despesa?.categoryId || null,
    categoryId: categoriaId || despesa?.categoryId || despesa?.categoriaId || null,
    category_id: categoriaId || despesa?.category_id || despesa?.categoria_id || null,
    categoria_id: categoriaId || despesa?.categoria_id || despesa?.category_id || null,

    corCategoria:
      despesa?.corCategoria ||
      despesa?.categoryColor ||
      despesa?.colorCategory ||
      corPorId ||
      obterCorCategoriaDespesa(categoria),

    tipo,
    typeExpense: despesa?.typeExpense || despesa?.typeExpenseId || tipo,
    typeExpenseId: despesa?.typeExpenseId || despesa?.typeExpense || obterTipoExpenseNumericoDespesa(tipo),

    pago,
    paid: pago,
    status: pago ? "pago" : "pendente",

    data: normalizarDataISO(
      despesa?.date ||
      despesa?.data ||
      despesa?.dateInitial ||
      despesa?.createdAt ||
      despesa?.created_at ||
      despesa?.dataTransacao ||
      despesa?.transactionDate ||
      despesa?.dueDate ||
      ""
    ),

    dateInitial: normalizarDataISO(
      despesa?.dateInitial ||
      despesa?.data ||
      despesa?.date ||
      despesa?.createdAt ||
      despesa?.created_at ||
      despesa?.dataTransacao ||
      despesa?.transactionDate ||
      despesa?.dueDate ||
      ""
    ),

    valor: extrairValorDespesa(despesa),
    value: extrairValorDespesa(despesa),
    amount: extrairValorDespesa(despesa),

    autorId:
      despesa?.autorId ||
      despesa?.userId ||
      despesa?.user_id ||
      despesa?.usuarioId ||
      despesa?.usuario_id ||
      despesa?.createdById ||
      despesa?.created_by_id ||
      despesa?.createdBy?.id ||
      despesa?.user?.id ||
      despesa?.usuario?.id ||
      null,

    autorEmail:
      despesa?.autorEmail ||
      despesa?.userEmail ||
      despesa?.user_email ||
      despesa?.emailUsuario ||
      despesa?.email_usuario ||
      despesa?.createdByEmail ||
      despesa?.created_by_email ||
      despesa?.createdBy?.email ||
      despesa?.user?.email ||
      despesa?.usuario?.email ||
      "",

    autorNickname:
      despesa?.autorNickname ||
      despesa?.nicknameUsuario ||
      despesa?.nomeUsuario ||
      despesa?.createdByNickname ||
      despesa?.createdByName ||
      despesa?.createdBy?.nickname ||
      despesa?.createdBy?.nickName ||
      despesa?.createdBy?.name ||
      despesa?.createdBy?.nome ||
      despesa?.createdBy?.username ||
      despesa?.user?.nickname ||
      despesa?.user?.nickName ||
      despesa?.user?.name ||
      despesa?.user?.nome ||
      despesa?.user?.username ||
      despesa?.usuario?.nickname ||
      despesa?.usuario?.nickName ||
      despesa?.usuario?.name ||
      despesa?.usuario?.nome ||
      despesa?.usuario?.username ||
      ""
  };
}

function normalizarTipoDespesa(tipo) {
  const texto = normalizarTexto(tipo);

  if (texto === "1" || texto.includes("fix")) return "fixa";
  if (texto === "3" || texto.includes("sazon")) return "sazonal";

  return "variavel";
}

function extrairValorDespesa(despesa) {
  const valorBruto =
    despesa?.amount ??
    despesa?.value ??
    despesa?.valor ??
    despesa?.total ??
    despesa?.price ??
    despesa?.valorTotal ??
    despesa?.totalValue ??
    despesa?.totalAmount ??
    0;

  if (typeof valorBruto === "number") return Math.abs(valorBruto);

  const texto = String(valorBruto)
    .replace("R$", "")
    .replace("US$", "")
    .replace("€", "")
    .replace("£", "")
    .replace("¥", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace("-", "")
    .trim();

  return Math.abs(Number(texto) || 0);
}

/* ================= FILTROS / RENDER ================= */

function aplicarFiltros() {
  const anoMesAtual = pegarAnoMesData(dataMesAtual);
  const busca = normalizarTexto(filtros.busca);

  despesasFiltradas = despesas.filter((despesa) => {
    const mesmoMes = pegarAnoMes(despesa.data) === anoMesAtual;

    if (!mesmoMes) return false;

    if (filtros.tipo && despesa.tipo !== filtros.tipo) return false;

    if (filtros.status && despesa.status !== filtros.status) return false;

    if (busca) {
      const texto = normalizarTexto(
        `${despesa.descricao} ${despesa.categoria} ${despesa.tipo} ${despesa.status} ${pegarNomeAutorDespesa(despesa)}`
      );

      if (!texto.includes(busca)) return false;
    }

    return true;
  });

  renderizarTabelaDespesas();
  atualizarTotaisDespesas();
  renderizarPaginacao();
}

function renderizarTabelaDespesas() {
  if (!tabela) return;

  tabela.innerHTML = "";

  if (!despesasFiltradas.length) {
    if (semDados) semDados.style.display = "block";
    return;
  }

  if (semDados) semDados.style.display = "none";

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const pagina = despesasFiltradas.slice(inicio, fim);

  pagina.forEach((despesa) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${formatarDataBR(despesa.data)}</td>

      <td>
        <div class="descricao-cell">
          <span class="icone-item icone-despesa">↓</span>
          <span>${escapeHTML(limparDescricaoParcela(despesa.descricao))}</span>
        </div>
      </td>

      <td>
        <div class="categoria-cell">
          <span class="bolinha-categoria" style="background-color: ${despesa.corCategoria};"></span>
          <span>${escapeHTML(despesa.categoria)}</span>
        </div>
      </td>

      <td>
        <div class="tipo-cell">
          <span class="ponto-tipo ponto-despesa"></span>
          <span>${formatarTipoDespesa(despesa.tipo)}</span>
        </div>
      </td>

      <td>${despesa.status === "pago" ? "Pago" : "Pendente"}</td>

      <td class="valor negativo">${formatarMoedaPositiva(despesa.valor)}</td>

      ${
        mostrarUsuarioDespesa
          ? `<td class="usuario-despesa">${escapeHTML(pegarNomeAutorDespesa(despesa))}</td>`
          : ""
      }

      <td class="acoes-coluna">
        <div class="acoes-despesa">
          <button 
            type="button"
            class="btn-acao-despesa btn-editar-despesa" 
            title="Editar" 
            onclick="confirmarEditarDespesa('${despesa.id}')"
          >
            <img 
              src="imagem/iconConfig/lapis.png" 
              alt="Editar"
              onerror="this.style.display='none'; this.parentElement.textContent='✎';"
            >
          </button>

          <button 
            type="button"
            class="btn-acao-despesa btn-excluir-despesa" 
            title="Excluir" 
            onclick="confirmarExcluirDespesa('${despesa.id}')"
          >
            <img 
              src="imagem/iconConfig/lixeira.png" 
              alt="Excluir"
              onerror="this.style.display='none'; this.parentElement.textContent='×';"
            >
          </button>
        </div>
      </td>
    `;

    tabela.appendChild(tr);
  });
}

function atualizarTotaisDespesas() {
  const total = despesasFiltradas.reduce((soma, despesa) => {
    return soma + Number(despesa.valor || 0);
  }, 0);

  if (totalDespesas) totalDespesas.textContent = formatarMoedaPositiva(total);
  if (totalSaidas) totalSaidas.textContent = formatarMoedaPositiva(total);
}

function atualizarCabecalhoUsuarioDespesas() {
  const cabecalho = document.getElementById("cabecalho-despesas");

  if (!cabecalho) return;

  cabecalho.innerHTML = `
    <th>Data</th>
    <th>Descrição</th>
    <th>Categoria</th>
    <th>Tipo</th>
    <th>Status</th>
    <th class="valor-coluna">Valor</th>
    ${mostrarUsuarioDespesa ? "<th>Usuário</th>" : ""}
    <th></th>
  `;
}

/* ================= PAGINAÇÃO ================= */

function renderizarPaginacao() {
  if (!paginacao) return;

  paginacao.innerHTML = "";

  const totalPaginas = Math.ceil(despesasFiltradas.length / itensPorPagina);

  if (totalPaginas <= 1) return;

  const btnAnterior = document.createElement("button");
  btnAnterior.className = "pagina-btn";
  btnAnterior.textContent = "‹";
  btnAnterior.disabled = paginaAtual === 1;
  btnAnterior.onclick = () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      renderizarTabelaDespesas();
      renderizarPaginacao();
    }
  };

  paginacao.appendChild(btnAnterior);

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.className = `pagina-numero ${i === paginaAtual ? "ativa" : ""}`;
    btn.textContent = i;

    btn.onclick = () => {
      paginaAtual = i;
      renderizarTabelaDespesas();
      renderizarPaginacao();
    };

    paginacao.appendChild(btn);
  }

  const btnProximo = document.createElement("button");
  btnProximo.className = "pagina-btn";
  btnProximo.textContent = "›";
  btnProximo.disabled = paginaAtual === totalPaginas;
  btnProximo.onclick = () => {
    if (paginaAtual < totalPaginas) {
      paginaAtual++;
      renderizarTabelaDespesas();
      renderizarPaginacao();
    }
  };

  paginacao.appendChild(btnProximo);
}

/* ================= MODAL ================= */

function abrirModalDespesa() {
  modoEdicaoDespesa = false;
  idDespesaEditando = null;

  limparCampos();

  if (tituloModalDespesa) tituloModalDespesa.textContent = "Nova Despesa";
  if (btnSalvar) btnSalvar.textContent = "Salvar";
  if (modal) modal.style.display = "flex";

  atualizarCampoParcelas();
  atualizarPreviewParcelas();
}

function abrirModalDespesaEdicao() {
  if (tituloModalDespesa) tituloModalDespesa.textContent = "Editar Despesa";
  if (btnSalvar) btnSalvar.textContent = "Atualizar";
  if (modal) modal.style.display = "flex";

  atualizarCampoParcelas();
  atualizarPreviewParcelas();
}

function fecharModalDespesa() {
  if (modal) modal.style.display = "none";

  limparCampos();

  modoEdicaoDespesa = false;
  idDespesaEditando = null;

  if (tituloModalDespesa) tituloModalDespesa.textContent = "Nova Despesa";
  if (btnSalvar) btnSalvar.textContent = "Salvar";
}

function limparCampos() {
  if (inputDesc) inputDesc.value = "";
  if (inputValor) inputValor.value = "";
  if (inputData) inputData.value = "";
  if (checkPago) checkPago.checked = false;
  if (inputParcelas) inputParcelas.value = 1;

  selecionarCategoriaPorNome("");

  const radioVariavel = document.querySelector('input[name="tipoDespesa"][value="variavel"]');
  if (radioVariavel) radioVariavel.checked = true;

  atualizarCampoParcelas();
  atualizarPreviewParcelas();
}

/* ================= SALVAR / EDITAR ================= */

async function salvarDespesa() {
  if (salvandoDespesa) return;

  salvandoDespesa = true;

  try {
    if (modoEdicaoDespesa) {
      await atualizarDespesaEditada();
      return;
    }

    const descricao = inputDesc?.value.trim() || "";
    const valorTotal = converterMoedaParaNumero(inputValor?.value || "");
    const data = inputData?.value || "";
    const pago = Boolean(checkPago?.checked);
    const categoria = selectCategoria?.dataset.categoria || "";
    const categoriaId = obterCategoriaIdNumericoDespesa();
    const tipoSelecionado = document.querySelector('input[name="tipoDespesa"]:checked')?.value || "variavel";
    const typeExpense = obterTipoExpenseNumericoDespesa(tipoSelecionado);

    if (!descricao || valorTotal <= 0 || !data || !categoria) {
      mostrarMensagemDespesa("Preencha descrição, valor, data e categoria corretamente!");
      return;
    }

    if (!categoriaId) {
      mostrarMensagemDespesa("Selecione uma categoria válida da API.");
      return;
    }

    const quantidadeParcelas = ehCartaoCredito(categoria)
      ? Math.max(1, Number(inputParcelas?.value || 1))
      : 1;

    const payloads = [];

    if (ehCartaoCredito(categoria) && quantidadeParcelas > 1) {
      const valorParcela = arredondarValor(valorTotal / quantidadeParcelas);

      for (let i = 0; i < quantidadeParcelas; i++) {
        payloads.push(
          montarPayloadDespesa({
            descricao: `${descricao} (${i + 1}/${quantidadeParcelas})`,
            valor: valorParcela,
            data: adicionarMeses(data, i),
            pago,
            categoriaId,
            tipo: "variavel",
            typeExpense: 2
          })
        );
      }
    } else {
      payloads.push(
        montarPayloadDespesa({
          descricao,
          valor: valorTotal,
          data,
          pago,
          categoriaId,
          tipo: tipoSelecionado,
          typeExpense
        })
      );
    }

    for (const payload of payloads) {
      const resposta = await criarDespesaAPI(payload);

      if (!resposta.ok) {
        mostrarMensagemDespesa(
          pegarMensagemErroDespesa(
            resposta.data,
            "Não foi possível salvar a despesa."
          )
        );
        return;
      }
    }

    fecharModalDespesa();

    await carregarDespesasAPI();
    aplicarFiltros();

    mostrarMensagemDespesa("Despesa salva com sucesso!");
    avisarAtualizacaoFinanceira();
  } finally {
    salvandoDespesa = false;
  }
}

async function atualizarDespesaEditada() {
  const despesaOriginal = despesas.find((despesa) => {
    return String(despesa.id) === String(idDespesaEditando);
  });

  if (!despesaOriginal) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  const descricao = inputDesc?.value.trim() || "";
  const valorTotal = converterMoedaParaNumero(inputValor?.value || "");
  const data = inputData?.value || "";
  const pago = Boolean(checkPago?.checked);
  const categoria = selectCategoria?.dataset.categoria || "";
  const categoriaId = obterCategoriaIdNumericoDespesa();

  const tipo =
    document.querySelector('input[name="tipoDespesa"]:checked')?.value ||
    "variavel";

  const typeExpense = obterTipoExpenseNumericoDespesa(tipo);

  if (!descricao || valorTotal <= 0 || !data || !categoria) {
    mostrarMensagemDespesa("Preencha descrição, valor, data e categoria corretamente!");
    return;
  }

  if (!categoriaId) {
    mostrarMensagemDespesa("Selecione uma categoria válida da API.");
    return;
  }

  const payload = montarPayloadDespesa({
    descricao,
    valor: valorTotal,
    data,
    pago,
    categoriaId,
    tipo,
    typeExpense
  });

  const idApi =
    despesaOriginal.expenseId ||
    despesaOriginal.expense_id ||
    despesaOriginal.id;

  const respostaPut = await atualizarDespesaAPI(idApi, payload);

  if (!respostaPut.ok) {
    console.warn("PUT falhou. A despesa será atualizada apenas na tela/localStorage:", respostaPut);
  }

  salvarDespesaEditadaLocalmente(despesaOriginal, {
    descricao,
    valor: valorTotal,
    data,
    pago,
    categoria,
    categoriaId,
    tipo,
    typeExpense
  });

  fecharModalDespesa();

  await carregarDespesasAPI();
  aplicarFiltros();

  mostrarMensagemDespesa("Despesa atualizada com sucesso!");
  avisarAtualizacaoFinanceira();
}

function montarPayloadDespesa({ descricao, valor, data, pago = false, categoriaId, tipo, typeExpense = null }) {
  const valorNumerico = Number(valor);
  const categoriaNumerica = Number(categoriaId);
  const tipoNumerico = Number(typeExpense || obterTipoExpenseNumericoDespesa(tipo));

  const payload = {
    name: descricao,
    description: descricao,

    value: valorNumerico,
    amount: valorNumerico,

    dateInitial: data,

    categoryId: categoriaNumerica,
    typeExpenseId: tipoNumerico,

    paid: Boolean(pago)
  };

  console.log("PAYLOAD DESPESA ENVIADO:", payload);

  return payload;
}

async function criarDespesaAPI(payload) {
  console.log("PAYLOAD ENVIADO PARA /expense:", payload);

  return apiDespesas("/expense", {
    method: "POST",
    headers: headersDespesas(true),
    body: JSON.stringify(payload)
  });
}

async function atualizarDespesaAPI(id, payload) {
  console.log("PAYLOAD ENVIADO PARA PUT /expense:", {
    id,
    payload
  });

  return apiDespesas(`/expense/${id}`, {
    method: "PUT",
    headers: headersDespesas(true),
    body: JSON.stringify(payload)
  });
}

async function excluirDespesaAPI(id) {
  return apiDespesas(`/expense/${id}`, {
    method: "DELETE",
    headers: headersDespesas(false)
  });
}

/* ================= EDITAR / EXCLUIR ================= */

function confirmarEditarDespesa(id) {
  const despesa = despesas.find((item) => String(item.id) === String(id));

  if (!despesa) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  abrirPopupDespesas({
    icone: "i",
    titulo: "Editar despesa",
    texto: "Deseja mesmo editar esta despesa?",
    botoes: [
      {
        texto: "Cancelar",
        classe: "popup-btn-cancelar"
      },
      {
        texto: "Editar",
        classe: "popup-btn-confirmar",
        acao: () => preencherModalEdicaoDespesa(id)
      }
    ]
  });
}

function preencherModalEdicaoDespesa(id) {
  const despesa = despesas.find((item) => String(item.id) === String(id));

  if (!despesa) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  modoEdicaoDespesa = true;
  idDespesaEditando = id;

  if (inputDesc) inputDesc.value = limparDescricaoParcela(despesa.descricao || "");
  if (inputValor) inputValor.value = formatarMoedaPositiva(despesa.valor);
  if (inputData) inputData.value = normalizarDataISO(despesa.data);
  if (checkPago) checkPago.checked = Boolean(despesa.pago || despesa.paid);

  selecionarCategoriaPorNome(despesa.categoria);

  const radioTipo = document.querySelector(
    `input[name="tipoDespesa"][value="${despesa.tipo || "variavel"}"]`
  );

  if (radioTipo) {
    radioTipo.checked = true;
  }

  abrirModalDespesaEdicao();
}

function confirmarExcluirDespesa(id) {
  const despesa = despesas.find((item) => String(item.id) === String(id));

  if (!despesa) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  abrirPopupDespesas({
    icone: "!",
    titulo: "Excluir despesa",
    texto: "Tem certeza que deseja excluir esta despesa? Essa ação não poderá ser desfeita.",
    botoes: [
      {
        texto: "Cancelar",
        classe: "popup-btn-cancelar"
      },
      {
        texto: "Excluir",
        classe: "popup-btn-perigo",
        acao: () => excluirDespesa(id)
      }
    ]
  });
}

async function excluirDespesa(id) {
  const despesa = despesas.find((item) => String(item.id) === String(id));

  if (!despesa) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  const idApi =
    despesa.expenseId ||
    despesa.expense_id ||
    despesa.id;

  const resposta = await excluirDespesaAPI(idApi);

  /*
    IMPORTANTE:
    Mesmo se a API falhar, vamos marcar como excluída localmente.
    Assim ela some de Despesas, Transações, Home e Relatórios.
    Só não fazemos isso se for erro de sessão.
  */
  if (resposta.status === 401) {
    mostrarMensagemDespesa("Sessão expirada. Faça login novamente.");
    return;
  }

  if (!resposta.ok) {
    console.warn("A API não excluiu, mas a despesa será ocultada localmente:", resposta);
  }

  marcarDespesaComoExcluida(despesa);
  removerDespesaEditadaLocalmente(despesa);

  despesas = despesas.filter((item) => String(item.id) !== String(id));

  aplicarFiltros();

  mostrarMensagemDespesa("Despesa excluída com sucesso!");
  avisarAtualizacaoFinanceira();
}

/* ================= EXCLUÍDAS ================= */

function getChaveDespesasExcluidas() {
  return `${getUserKeyDespesa()}_${STORAGE_DESPESAS_EXCLUIDAS}`;
}

function lerListaStorage(chave) {
  try {
    const dados = localStorage.getItem(chave);

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarListaStorage(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(Array.isArray(lista) ? lista : []));
}

function lerDespesasExcluidas() {
  return [
    ...lerListaStorage(STORAGE_DESPESAS_EXCLUIDAS),
    ...lerListaStorage(getChaveDespesasExcluidas())
  ];
}

function marcarDespesaComoExcluida(despesa) {
  const listaAtual = lerDespesasExcluidas();

  const ids = [
    despesa.id,
    despesa.expenseId,
    despesa.expense_id,
    despesa.transactionId,
    despesa.transaction_id
  ]
    .filter(Boolean)
    .map(String);

  const descricao =
    despesa.description ||
    despesa.descricao ||
    despesa.name ||
    despesa.nome ||
    "";

  const categoria =
    despesa.category ||
    despesa.categoria ||
    despesa.categoryName ||
    despesa.nomeCategoria ||
    "";

  const valor = Number(
    despesa.value ??
    despesa.valor ??
    despesa.amount ??
    despesa.total ??
    0
  );

  const data =
    despesa.dateInitial ||
    despesa.data ||
    despesa.date ||
    "";

  const nova = {
    id: despesa.id || null,
    expenseId: despesa.expenseId || despesa.expense_id || despesa.id || null,
    expense_id: despesa.expense_id || despesa.expenseId || despesa.id || null,

    ids,

    description: descricao,
    descricao,
    name: descricao,

    category: categoria,
    categoria,
    categoryName: categoria,

    value: valor,
    valor,
    amount: valor,

    dateInitial: data,
    data,
    date: data,

    chave: criarChaveExclusaoDespesa({
      ...despesa,
      description: descricao,
      descricao,
      category: categoria,
      categoria,
      value: valor,
      valor,
      amount: valor,
      dateInitial: data,
      data,
      date: data
    }),

    dataExclusao: new Date().toISOString()
  };

  const jaExiste = listaAtual.some((item) => {
    const idsItem = [
      item.id,
      item.expenseId,
      item.expense_id,
      ...(Array.isArray(item.ids) ? item.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    const mesmoId =
      ids.length > 0 &&
      idsItem.length > 0 &&
      ids.some((id) => idsItem.includes(id));

    const mesmaChave =
      item.chave &&
      item.chave === nova.chave;

    return mesmoId || mesmaChave;
  });

  const novaLista = jaExiste ? listaAtual : [...listaAtual, nova];

  salvarListaStorage(STORAGE_DESPESAS_EXCLUIDAS, novaLista);
  salvarListaStorage(getChaveDespesasExcluidas(), novaLista);

  console.log("DESPESA MARCADA COMO EXCLUÍDA:", nova);
}

function despesaFoiExcluida(despesa) {
  const excluidas = lerDespesasExcluidas();
  const chave = criarChaveExclusaoDespesa(despesa);

  const idsDespesa = [
    despesa.id,
    despesa.expenseId,
    despesa.expense_id,
    despesa.transactionId,
    despesa.transaction_id
  ]
    .filter(Boolean)
    .map(String);

  const descricaoDespesa = normalizarTexto(
    despesa.description ||
    despesa.descricao ||
    despesa.name ||
    despesa.nome ||
    ""
  );

  const categoriaDespesa = normalizarTexto(
    despesa.category ||
    despesa.categoria ||
    despesa.categoryName ||
    ""
  );

  const valorDespesa = Number(
    despesa.value ??
    despesa.valor ??
    despesa.amount ??
    0
  );

  const dataDespesa = normalizarDataISO(
    despesa.dateInitial ||
    despesa.data ||
    despesa.date ||
    ""
  );

  return excluidas.some((item) => {
    if (item.chave && item.chave === chave) return true;

    const idsItem = [
      item.id,
      item.expenseId,
      item.expense_id,
      ...(Array.isArray(item.ids) ? item.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    if (idsDespesa.some((id) => idsItem.includes(id))) {
      return true;
    }

    const descricaoItem = normalizarTexto(
      item.description ||
      item.descricao ||
      item.name ||
      item.nome ||
      ""
    );

    const categoriaItem = normalizarTexto(
      item.category ||
      item.categoria ||
      item.categoryName ||
      ""
    );

    const valorItem = Number(
      item.value ??
      item.valor ??
      item.amount ??
      0
    );

    const dataItem = normalizarDataISO(
      item.dateInitial ||
      item.data ||
      item.date ||
      ""
    );

    return (
      descricaoDespesa &&
      descricaoDespesa === descricaoItem &&
      categoriaDespesa === categoriaItem &&
      Number(valorDespesa || 0).toFixed(2) === Number(valorItem || 0).toFixed(2) &&
      dataDespesa &&
      dataDespesa === dataItem
    );
  });
}

function criarChaveExclusaoDespesa(despesa) {
  const descricao = normalizarTexto(
    despesa.description ||
    despesa.descricao ||
    despesa.name ||
    despesa.nome ||
    ""
  );

  const categoria = normalizarTexto(
    despesa.category ||
    despesa.categoria ||
    despesa.categoryName ||
    despesa.nomeCategoria ||
    ""
  );

  const valor = Number(
    despesa.value ??
    despesa.valor ??
    despesa.amount ??
    despesa.total ??
    0
  );

  const data = normalizarDataISO(
    despesa.dateInitial ||
    despesa.data ||
    despesa.date ||
    ""
  );

  return [
    "despesa",
    descricao,
    categoria,
    Number(valor || 0).toFixed(2),
    data
  ].join("|");
}

/* ================= HELPERS USUÁRIO / DUPLICADOS ================= */

function despesaPertenceAoUsuarioLogado(despesa) {
  const idAtual = getIdUsuarioAtualDespesa();
  const emailAtual = getEmailUsuarioAtualDespesa();

  const idDono =
    despesa?.autorId ||
    despesa?.userId ||
    despesa?.user_id ||
    despesa?.usuarioId ||
    despesa?.usuario_id ||
    despesa?.createdById ||
    despesa?.created_by_id ||
    despesa?.user?.id ||
    despesa?.usuario?.id ||
    null;

  const emailDono = String(
    despesa?.autorEmail ||
    despesa?.userEmail ||
    despesa?.user_email ||
    despesa?.emailUsuario ||
    despesa?.email_usuario ||
    despesa?.createdByEmail ||
    despesa?.created_by_email ||
    despesa?.user?.email ||
    despesa?.usuario?.email ||
    ""
  )
    .toLowerCase()
    .trim();

  if (idAtual && idDono && String(idAtual) === String(idDono)) return true;
  if (emailAtual && emailDono && emailAtual === emailDono) return true;

  if (!idDono && !emailDono) return true;

  return false;
}

function getNomeUsuarioLogadoDespesa() {
  const email = getEmailUsuarioAtualDespesa();
  const userKey = getUserKeyDespesa(email);

  return (
    localStorage.getItem(`${userKey}_nicknameUsuario`) ||
    sessionStorage.getItem(`${userKey}_nicknameUsuario`) ||
    localStorage.getItem(`${userKey}_nomeUsuario`) ||
    sessionStorage.getItem(`${userKey}_nomeUsuario`) ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário"
  );
}

function pegarNomeAutorDespesa(despesa) {
  const nomeDireto =
    despesa?.autorNickname ||
    despesa?.nicknameUsuario ||
    despesa?.nomeUsuario ||
    despesa?.createdByNickname ||
    despesa?.createdByName ||
    despesa?.createdBy?.nickname ||
    despesa?.createdBy?.nickName ||
    despesa?.createdBy?.name ||
    despesa?.createdBy?.nome ||
    despesa?.user?.nickname ||
    despesa?.user?.nickName ||
    despesa?.user?.name ||
    despesa?.user?.nome ||
    despesa?.usuario?.nickname ||
    despesa?.usuario?.nickName ||
    despesa?.usuario?.name ||
    despesa?.usuario?.nome ||
    "";

  if (nomeDireto) {
    return formatarNicknameDespesa(nomeDireto);
  }

  const idAtual = getIdUsuarioAtualDespesa();
  const emailAtual = getEmailUsuarioAtualDespesa();

  const idDono =
    despesa?.autorId ||
    despesa?.userId ||
    despesa?.user_id ||
    despesa?.usuarioId ||
    despesa?.usuario_id ||
    despesa?.createdById ||
    despesa?.created_by_id ||
    despesa?.user?.id ||
    despesa?.usuario?.id ||
    null;

  const emailDono = String(
    despesa?.autorEmail ||
    despesa?.userEmail ||
    despesa?.user_email ||
    despesa?.emailUsuario ||
    despesa?.email_usuario ||
    despesa?.createdByEmail ||
    despesa?.created_by_email ||
    despesa?.user?.email ||
    despesa?.usuario?.email ||
    ""
  )
    .toLowerCase()
    .trim();

  const nomePeloMembro = buscarNomeMembroPorIdOuEmailDespesa(idDono, emailDono);

  if (nomePeloMembro) {
    return nomePeloMembro;
  }

  const pertenceAoUsuarioLogado =
    (idAtual && idDono && String(idAtual) === String(idDono)) ||
    (emailAtual && emailDono && emailAtual === emailDono) ||
    (!idDono && !emailDono);

  if (pertenceAoUsuarioLogado) {
    return formatarNicknameDespesa(getNomeUsuarioLogadoDespesa());
  }

  if (emailDono) {
    const nomeSalvo =
      buscarDadoUsuarioDespesa("nicknameUsuario", emailDono) ||
      buscarDadoUsuarioDespesa("nomeUsuario", emailDono);

    if (nomeSalvo) {
      return formatarNicknameDespesa(nomeSalvo);
    }
  }

  return idDono ? `Usuário ${idDono}` : "Usuário";
}

function removerDuplicadasDespesas(lista) {
  const mapa = new Map();

  lista.forEach((despesa) => {
    const chaveId = despesa.id ? `id-${despesa.id}` : "";

    const chaveFlexivel = [
      normalizarTexto(despesa.descricao),
      normalizarTexto(despesa.categoria),
      normalizarDataISO(despesa.data),
      Number(despesa.valor || 0).toFixed(2)
    ].join("|");

    const chave = chaveId || chaveFlexivel;

    if (!mapa.has(chave)) {
      mapa.set(chave, despesa);
    }
  });

  return Array.from(mapa.values());
}

/* ================= FORMATAÇÕES ================= */

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obterMoedaUsuarioDespesa() {
  const userKey = getUserKeyDespesa();

  return (
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    sessionStorage.getItem(`${userKey}_moedaUsuario`) ||
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoedaPositiva(valor) {
  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaUsuarioDespesa()
    });
  } catch {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}

function converterMoedaParaNumero(valor) {
  if (typeof valor === "number") return valor;

  const texto = String(valor || "")
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  return Number(texto) || 0;
}

function aplicarMascaraMoeda(valor) {
  const apenasNumeros = String(valor || "").replace(/\D/g, "");
  const numero = Number(apenasNumeros || 0) / 100;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function normalizarDataISO(dataValor) {
  if (!dataValor) return "";

  const texto = String(dataValor).trim();

  if (texto.includes("-")) {
    const partes = texto.split("T")[0].split("-");

    if (partes.length === 3) {
      const ano = partes[0];
      const mes = partes[1].padStart(2, "0");
      const dia = partes[2].padStart(2, "0");

      return `${ano}-${mes}-${dia}`;
    }
  }

  if (texto.includes("/")) {
    const partes = texto.split("/");

    if (partes.length === 3) {
      const dia = partes[0].padStart(2, "0");
      const mes = partes[1].padStart(2, "0");
      const ano = partes[2];

      return `${ano}-${mes}-${dia}`;
    }
  }

  const data = new Date(texto);

  if (isNaN(data.getTime())) return "";

  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0")
  ].join("-");
}

function converterData(dataValor) {
  const iso = normalizarDataISO(dataValor);

  if (!iso) return null;

  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia, 12, 0, 0);

  return isNaN(data.getTime()) ? null : data;
}

function formatarDataBR(dataValor) {
  const iso = normalizarDataISO(dataValor);

  if (!iso) return "";

  const [ano, mes, dia] = iso.split("-");

  return `${dia}/${mes}/${ano}`;
}

function pegarAnoMes(dataValor) {
  const data = converterData(dataValor);

  if (!data) return "";

  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function pegarAnoMesData(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function atualizarTextoMes() {
  if (!textoMesAtual) return;

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  textoMesAtual.textContent = `${meses[dataMesAtual.getMonth()]} ${dataMesAtual.getFullYear()}`;
}

function formatarTipoDespesa(tipo) {
  const texto = normalizarTexto(tipo);

  if (texto.includes("fix")) return "Fixa";
  if (texto.includes("sazon")) return "Sazonal";

  return "Variável";
}

function obterTipoExpenseNumericoDespesa(tipo) {
  const texto = normalizarTexto(tipo);

  if (texto.includes("fix")) return 1;
  if (texto.includes("vari")) return 2;
  if (texto.includes("sazon")) return 3;

  return 2;
}

function escapeHTML(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function limparDescricaoParcela(descricao) {
  return String(descricao || "").replace(/\s*\(\d+\/\d+\)\s*$/, "");
}

function arredondarValor(valor) {
  return Math.round(Number(valor || 0) * 100) / 100;
}

function adicionarMeses(dataISO, quantidade) {
  const data = converterData(dataISO);

  if (!data) return dataISO;

  data.setMonth(data.getMonth() + quantidade);

  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0")
  ].join("-");
}

function ehCartaoCredito(categoria) {
  const texto = normalizarTexto(categoria);

  return texto.includes("cartao de credito") || texto.includes("cartão de crédito");
}

/* ================= PARCELAS ================= */

function atualizarCampoParcelas() {
  const categoria = selectCategoria?.dataset.categoria || "";
  const deveMostrar = ehCartaoCredito(categoria);

  if (containerParcelas) {
    containerParcelas.style.display = deveMostrar ? "block" : "none";
  }

  if (!deveMostrar && inputParcelas) {
    inputParcelas.value = 1;
  }
}

function atualizarPreviewParcelas() {
  if (!previewParcelas) return;

  const categoria = selectCategoria?.dataset.categoria || "";
  const valor = converterMoedaParaNumero(inputValor?.value || "");
  const parcelas = Math.max(1, Number(inputParcelas?.value || 1));

  if (!ehCartaoCredito(categoria)) {
    previewParcelas.textContent = "Informe em quantas vezes a compra foi dividida.";
    return;
  }

  if (valor <= 0 || parcelas <= 1) {
    previewParcelas.textContent = "Informe em quantas vezes a compra foi dividida.";
    return;
  }

  previewParcelas.textContent = `${parcelas} parcelas de ${formatarMoedaPositiva(valor / parcelas)}.`;
}

/* ================= POPUP ================= */

function criarPopupDespesas() {
  if (document.getElementById("popupDespesas")) return;

  const popup = document.createElement("div");
  popup.id = "popupDespesas";
  popup.className = "popup-despesas-overlay";

  popup.innerHTML = `
    <div class="popup-despesas-box">
      <div class="popup-despesas-icone" id="popupDespesasIcone">i</div>
      <h3 id="popupDespesasTitulo">Aviso</h3>
      <p id="popupDespesasTexto">Mensagem</p>
      <div class="popup-despesas-acoes" id="popupDespesasAcoes"></div>
    </div>
  `;

  document.body.appendChild(popup);
}

function abrirPopupDespesas({ icone = "i", titulo = "Aviso", texto = "", botoes = [] }) {
  const popup = document.getElementById("popupDespesas");
  const popupIcone = document.getElementById("popupDespesasIcone");
  const popupTitulo = document.getElementById("popupDespesasTitulo");
  const popupTexto = document.getElementById("popupDespesasTexto");
  const popupAcoes = document.getElementById("popupDespesasAcoes");

  if (!popup || !popupIcone || !popupTitulo || !popupTexto || !popupAcoes) return;

  popupIcone.textContent = icone;
  popupTitulo.textContent = titulo;
  popupTexto.textContent = texto;
  popupAcoes.innerHTML = "";

  botoes.forEach((botao) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = botao.texto;
    btn.className = botao.classe || "popup-btn-confirmar";

    btn.addEventListener("click", () => {
      fecharPopupDespesas();

      if (typeof botao.acao === "function") {
        botao.acao();
      }
    });

    popupAcoes.appendChild(btn);
  });

  popup.style.display = "flex";
}

function fecharPopupDespesas() {
  const popup = document.getElementById("popupDespesas");

  if (popup) {
    popup.style.display = "none";
  }
}

function mostrarMensagemDespesa(mensagem) {
  abrirPopupDespesas({
    icone: "i",
    titulo: "Aviso",
    texto: mensagem,
    botoes: [
      {
        texto: "OK",
        classe: "popup-btn-confirmar"
      }
    ]
  });
}

function pegarMensagemErroDespesa(data, fallback) {
  console.log("ERRO COMPLETO DESPESA:", data);

  if (!data) return fallback;

  if (typeof data === "string") return data;

  if (data.message) return data.message;
  if (typeof data.detail === "string") return data.detail;

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        const campo = Array.isArray(item.loc)
          ? item.loc.join(" > ")
          : "";

        const msg = item.msg || item.message || "Campo inválido";

        return campo ? `${campo}: ${msg}` : msg;
      })
      .join("\n");
  }

  return fallback;
}

/* ================= CSS EXTRA VIA JS ================= */

function inserirCssExtraDespesas() {
  if (document.getElementById("css-despesas-js-extra")) return;

  const style = document.createElement("style");
  style.id = "css-despesas-js-extra";

  style.textContent = `
    .acoes-coluna {
      text-align: center !important;
      width: 120px;
    }

    .acoes-despesa {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-acao-despesa {
      width: 34px;
      height: 34px;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: 0.2s ease;
      font-size: 18px;
      font-weight: 700;
    }

    .btn-acao-despesa img {
      width: 17px;
      height: 17px;
      object-fit: contain;
      display: block;
      pointer-events: none;
    }

    .btn-editar-despesa {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .btn-editar-despesa:hover {
      background: #c8e6c9;
      transform: scale(1.05);
    }

    .btn-excluir-despesa {
      background: #ffebee;
      color: #d32f2f;
    }

    .btn-excluir-despesa:hover {
      background: #ffcdd2;
      transform: scale(1.05);
    }

    .usuario-despesa {
      font-weight: 700;
      color: #111827;
      white-space: nowrap;
      text-align: left !important;
    }

    .select-categoria {
      position: relative !important;
      width: 100%;
      min-height: 42px;
      display: flex;
      align-items: center;
      padding: 10px;
      background: transparent;
      border: 1px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
      transition: 0.2s ease;
      overflow: visible !important;
      z-index: 999999 !important;
    }

    .select-categoria:hover,
    .select-categoria:focus,
    .select-categoria:focus-within,
    .select-categoria.ativo {
      outline: none;
      border-color: #2e7d32;
      box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.15);
    }

    .categoria-selecionada-linha {
      display: flex;
      align-items: center;
      width: 100%;
    }

    .bolinha-categoria-selecionada {
      display: none !important;
    }

    #categoriaSelecionada {
      flex: 1;
      font-size: 14px;
      font-weight: 400;
      color: #777;
      text-align: left !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .modal,
    .modal-content,
    .modal-despesa {
      overflow: visible !important;
    }

    .dropdown-categorias-api {
      display: none;
      position: absolute !important;
      top: calc(100% + 6px) !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      max-height: 240px !important;
      overflow-y: auto !important;
      padding: 8px 0;
      background: #ffffff !important;
      border: 1px solid #333 !important;
      border-radius: 8px !important;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35) !important;
      z-index: 999999 !important;
    }

    .select-categoria.ativo .dropdown-categorias-api {
      display: block !important;
    }

    .item-categoria {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 14px;
      background: transparent;
      border: none;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: 0.2s ease;
      text-align: left;
    }

    .item-categoria:hover {
      background: #f5f5f5;
    }

    .item-categoria.ativo {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .bolinha-categoria {
      width: 13px;
      height: 13px;
      min-width: 13px;
      border-radius: 50%;
      display: inline-block;
    }

    .popup-despesas-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(4px);
      z-index: 20000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .popup-despesas-box {
      width: 430px;
      max-width: 95%;
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
      text-align: center;
    }

    .popup-despesas-icone {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #ffebee;
      color: #d32f2f;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 700;
    }

    .popup-despesas-box h3 {
      font-size: 21px;
      color: #111827;
      margin-bottom: 8px;
    }

    .popup-despesas-box p {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .popup-despesas-acoes {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .popup-despesas-acoes button {
      border: none;
      border-radius: 10px;
      padding: 10px 16px;
      cursor: pointer;
      font-weight: 600;
      transition: 0.2s ease;
    }

    .popup-btn-cancelar {
      background: #f3f4f6;
      color: #374151;
    }

    .popup-btn-confirmar {
      background: #2e7d32;
      color: #ffffff;
    }

    .popup-btn-perigo {
      background: #d32f2f;
      color: #ffffff;
    }

    body.tema-escuro .dropdown-categorias-api,
    body.dark .dropdown-categorias-api {
      background: #1e1e1e !important;
      border-color: #444 !important;
    }

    body.tema-escuro .item-categoria,
    body.dark .item-categoria {
      color: #f9fafb !important;
    }

    body.tema-escuro .item-categoria:hover,
    body.dark .item-categoria:hover {
      background: #2a2a2a !important;
    }

    body.tema-escuro .popup-despesas-box,
    body.dark .popup-despesas-box {
      background: #1e1e1e;
      color: #f9fafb;
      border: 1px solid #5e6063;
    }

    body.tema-escuro .popup-despesas-box h3,
    body.dark .popup-despesas-box h3 {
      color: #f9fafb;
    }

    body.tema-escuro .popup-despesas-box p,
    body.dark .popup-despesas-box p {
      color: #d1d5db;
    }

    body.tema-escuro .btn-editar-despesa,
    body.dark .btn-editar-despesa {
      background: rgba(223, 220, 128, 0.49);
    }

    body.tema-escuro .btn-editar-despesa:hover,
    body.dark .btn-editar-despesa:hover {
      background: rgba(194, 189, 52, 0.63);
      color: #4ade80;
      transform: scale(1.05);
    }

    body.tema-escuro .btn-excluir-despesa,
    body.dark .btn-excluir-despesa {
      background: rgba(239, 68, 68, 0.16);
    }

    body.tema-escuro .btn-excluir-despesa:hover,
    body.dark .btn-excluir-despesa:hover {
      background: rgba(239, 68, 68, 0.25);
      color: #fca5a5;
      transform: scale(1.05);
    }
  `;

  document.head.appendChild(style);
}

/* ================= ATUALIZAÇÕES GLOBAIS ================= */

function avisarAtualizacaoFinanceira() {
  localStorage.setItem("despesasAtualizadasEm", String(Date.now()));
  localStorage.setItem("dadosFinanceirosAtualizadosEm", String(Date.now()));

  window.dispatchEvent(new CustomEvent("dadosFinanceirosAtualizados"));
}

/* ================= FUNÇÕES GLOBAIS ================= */

window.carregarDespesas = async function () {
  await carregarDespesasAPI();
  aplicarFiltros();
};

window.carregarDespesasAPI = carregarDespesasAPI;
window.aplicarFiltrosDespesas = aplicarFiltros;
window.confirmarEditarDespesa = confirmarEditarDespesa;
window.confirmarExcluirDespesa = confirmarExcluirDespesa;