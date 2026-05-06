console.log("DESPESAS.JS OK - API COMPLETO COM PUT E FALLBACK");

const QUANTIDADE_MESES_DESPESA_FIXA = 12;
const DESPESAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

let despesas = [];
let categoriasDespesaCache = [];
let mostrarUsuarioDespesa = false;

let filtros = {
  tipo: null,
  status: null,
  data: null,
  busca: ""
};

let modal;
let btnAbrir;
let btnCancelar;
let btnSalvar;

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

let totalDespesas;
let totalSaidas;
let semDados;

let btnMesAnterior;
let btnProximoMes;
let textoMesAtual;

let dataMesAtual = new Date();

let modoEdicaoDespesa = false;
let idDespesaEditando = null;

const coresCategoria = {
  "Alimentação": "cat-orange",
  "Transporte": "cat-blue",
  "Lazer": "cat-pink",
  "Moradia": "cat-brown",
  "Saúde": "cat-green",
  "Cartão de crédito": "cat-purple",
  "Cartão de Crédito": "cat-purple",
  "Cartão de débito": "cat-yellow",
  "Cartão de Débito": "cat-yellow",
  "Outros": "cat-gray"
};

const CATEGORY_ID_FALLBACK = {
  "alimentacao": 1,
  "alimentação": 1,
  "transporte": 2,
  "lazer": 3,
  "moradia": 4,
  "saude": 5,
  "saúde": 5,
  "cartao de credito": 6,
  "cartão de crédito": 6,
  "cartao de debito": 7,
  "cartão de débito": 7,
  "outros": 8
};

const CATEGORY_NAME_BY_ID = {
  1: "Alimentação",
  2: "Transporte",
  3: "Lazer",
  4: "Moradia",
  5: "Saúde",
  6: "Cartão de Crédito",
  7: "Cartão de Débito",
  8: "Outros"
};

const TYPE_EXPENSE_ID = {
  fixa: 1,
  variavel: 2,
  variável: 2,
  sazonal: 3
};

/* =======================
   INIT
======================= */
document.addEventListener("DOMContentLoaded", async () => {
  pegarElementos();
  inserirCssAcoesDespesas();
  criarPopupDespesas();
  carregarUsuario();
  configurarEventos();
  configurarControleMes();

  filtros.data = pegarAnoMesData(dataMesAtual);
  atualizarTextoMes();

  categoriasDespesaCache = await buscarCategoriasDespesaApi();

  mostrarUsuarioDespesa = await usuarioEstaEmFamilia();
  atualizarCabecalhoUsuarioDespesas();

  await carregarDespesasApi();

  if (typeof carregarDadosFinanceiros === "function") {
    await carregarDadosFinanceiros();
  }
});

window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  if (event.key.includes("moedaUsuario")) {
    aplicarFiltros();
  }

  if (
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia"
  ) {
    mostrarUsuarioDespesa = await usuarioEstaEmFamilia();
    atualizarCabecalhoUsuarioDespesas();
    await carregarDespesasApi();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  mostrarUsuarioDespesa = await usuarioEstaEmFamilia();
  atualizarCabecalhoUsuarioDespesas();
  await carregarDespesasApi();
});

/* =======================
   ELEMENTOS
======================= */
function pegarElementos() {
  modal = document.getElementById("modalNovaDespesa");
  btnAbrir = document.getElementById("btnNovaDespesa");
  btnCancelar = document.getElementById("cancelarDespesa");
  btnSalvar = document.getElementById("salvarDespesa");

  inputDesc = document.getElementById("descDespesa");
  inputValor = document.getElementById("valorDespesa");
  inputData = document.getElementById("dataDespesa");
  checkPago = document.getElementById("checkPago");

  inputParcelas = document.getElementById("parcelasDespesa");
  containerParcelas = document.getElementById("containerParcelasDespesa");
  previewParcelas = document.getElementById("previewParcelasDespesa");

  tabela = document.getElementById("lista-extratos");

  inputBusca =
    document.getElementById("inputBuscaDespesa") ||
    document.querySelector(".input-busca input");

  filtroTipo = document.getElementById("filtroTipo");
  dropdownTipo = document.getElementById("dropdownTipo");

  filtroStatus = document.getElementById("filtroStatus");
  dropdownStatus = document.getElementById("dropdownStatus");

  selectCategoria = document.getElementById("selectCategoria");
  dropdownCategoriaModal = document.getElementById("dropdownCategoriaModal");
  categoriaTexto = document.getElementById("categoriaSelecionada");

  totalDespesas = document.getElementById("total-despesas");
  totalSaidas = document.getElementById("total-saidas");
  semDados = document.getElementById("sem-dados");

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

/* =======================
   CSS / POPUP
======================= */
function inserirCssAcoesDespesas() {
  if (document.getElementById("css-acoes-despesas")) return;

  const style = document.createElement("style");
  style.id = "css-acoes-despesas";

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
      font-weight: 600;
      color: #2e7d32;
      white-space: nowrap;
    }

    body.tema-escuro .usuario-despesa,
    body.dark .usuario-despesa {
      color: #22c55e;
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
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
      text-align: center;
      animation: popupDespesasEntrada 0.2s ease;
    }

    @keyframes popupDespesasEntrada {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
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
      white-space: pre-line;
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

    .popup-btn-cancelar:hover {
      background: #e5e7eb;
    }

    .popup-btn-confirmar {
      background: #2e7d32;
      color: #fff;
    }

    .popup-btn-confirmar:hover {
      background: #256628;
    }

    .popup-btn-perigo {
      background: #d32f2f;
      color: #fff;
    }

    .popup-btn-perigo:hover {
      background: #b71c1c;
    }

    .popup-btn-secundario {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .popup-btn-secundario:hover {
      background: #c8e6c9;
    }
  `;

  document.head.appendChild(style);
}

function criarPopupDespesas() {
  if (document.getElementById("popupDespesas")) return;

  const popup = document.createElement("div");
  popup.id = "popupDespesas";
  popup.className = "popup-despesas-overlay";

  popup.innerHTML = `
    <div class="popup-despesas-box">
      <div class="popup-despesas-icone" id="popupDespesasIcone">i</div>
      <h3 id="popupDespesasTitulo">Confirmação</h3>
      <p id="popupDespesasTexto">Tem certeza?</p>
      <div class="popup-despesas-acoes" id="popupDespesasAcoes"></div>
    </div>
  `;

  document.body.appendChild(popup);
}

function abrirPopupDespesas({ icone = "i", titulo, texto, botoes }) {
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

/* =======================
   USUÁRIO
======================= */
function carregarUsuario() {
  const nome =
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário";

  const email =
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    "usuario";

  const userKey = `fambudget_${String(email).toLowerCase().trim()}`;

  const avatarImagem =
    sessionStorage.getItem("avatarUsuario") ||
    localStorage.getItem(`${userKey}_avatarUsuario`) ||
    localStorage.getItem("avatarUsuario") ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) {
    nomeUsuario.textContent = nome;
  }

  if (avatar) {
    if (avatarImagem) {
      avatar.innerHTML = `<img src="${avatarImagem}" alt="Avatar">`;
    } else {
      avatar.innerHTML = "";
      avatar.textContent = nome.charAt(0).toUpperCase();
    }
  }
}

/* =======================
   TOKEN / API
======================= */
function getTokenDespesas() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function headersDespesas(json = true) {
  const token = getTokenDespesas();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function lerRespostaDespesas(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extrairMensagemErroApiDespesa(data) {
  if (!data) return "Erro ao comunicar com a API.";

  if (typeof data === "string") return data;

  if (typeof data.message === "string") return data.message;
  if (typeof data.detail === "string") return data.detail;

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        const campo = Array.isArray(item.loc)
          ? item.loc.join(".")
          : "campo";

        return `${campo}: ${item.msg || item.message || "Campo inválido"}`;
      })
      .join("\n");
  }

  return "Erro ao comunicar com a API.";
}

async function apiDespesas(path, options = {}) {
  const token = getTokenDespesas();

  if (!token) {
    mostrarMensagemDespesa("Sessão expirada. Faça login novamente.");
    return null;
  }

  const metodo = String(options.method || "GET").toUpperCase();
  const deveMostrarErro = metodo !== "GET";

  try {
    const response = await fetch(`${DESPESAS_API_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        ...headersDespesas(Boolean(options.body)),
        ...(options.headers || {})
      }
    });

    const data = await lerRespostaDespesas(response);

    if (response.status === 401 || response.status === 403) {
      if (deveMostrarErro) {
        mostrarMensagemDespesa("Sua sessão expirou. Faça login novamente.");
      }

      return null;
    }

    if (!response.ok) {
      console.warn("Erro API despesas:", path, response.status, data);

      if (deveMostrarErro) {
        mostrarMensagemDespesa(extrairMensagemErroApiDespesa(data));
      }

      return null;
    }

    return data?.data || data;
  } catch (erro) {
    console.error("Erro API despesas:", erro);

    if (deveMostrarErro) {
      mostrarMensagemDespesa("Erro ao conectar com a API.");
    }

    return null;
  }
}

/* =======================
   CATEGORIA API
======================= */
async function buscarCategoriasDespesaApi() {
  const token = getTokenDespesas();

  if (!token) return [];

  try {
    const response = await fetch(`${DESPESAS_API_URL}/category/user`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await lerRespostaDespesas(response);

    if (!response.ok) {
      console.warn("Erro ao buscar categorias:", data);
      return [];
    }

    return transformarEmArrayDespesas(data?.data || data);
  } catch (erro) {
    console.warn("Erro ao buscar categorias:", erro);
    return [];
  }
}

function normalizarTextoDespesa(texto) {
  return String(texto || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function buscarCategoryIdDespesa(nomeCategoria) {
  if (!Array.isArray(categoriasDespesaCache) || categoriasDespesaCache.length === 0) {
    categoriasDespesaCache = await buscarCategoriasDespesaApi();
  }

  const categoriaEncontrada = categoriasDespesaCache.find((cat) => {
    const nome =
      cat.name ||
      cat.nome ||
      cat.description ||
      cat.descricao ||
      cat.category ||
      cat.categoria ||
      cat.descriptionCategory ||
      cat.typeCategory ||
      "";

    return normalizarTextoDespesa(nome) === normalizarTextoDespesa(nomeCategoria);
  });

  const idApi =
    categoriaEncontrada?.id ||
    categoriaEncontrada?.categoryId ||
    categoriaEncontrada?.categoriaId ||
    categoriaEncontrada?.uuid ||
    null;

  if (idApi !== null && idApi !== undefined && !Number.isNaN(Number(idApi))) {
    return Number(idApi);
  }

  const chave = normalizarTextoDespesa(nomeCategoria);
  const idFallback = CATEGORY_ID_FALLBACK[chave];

  if (idFallback) return Number(idFallback);

  return null;
}

function pegarNomeCategoriaDespesa(item) {
  const categoriaDireta =
    item.category?.name ||
    item.category?.description ||
    item.categoria ||
    item.categoryName ||
    item.descriptionCategory ||
    item.nameCategory ||
    "";

  if (categoriaDireta && Number.isNaN(Number(categoriaDireta))) {
    return categoriaDireta;
  }

  const idCategoria =
    item.categoryId ||
    item.category_id ||
    item.idCategory ||
    item.category?.id ||
    item.category;

  if (idCategoria && CATEGORY_NAME_BY_ID[Number(idCategoria)]) {
    return CATEGORY_NAME_BY_ID[Number(idCategoria)];
  }

  return "Outros";
}

function buscarTypeExpenseId(tipo) {
  const chave = normalizarTextoDespesa(tipo || "fixa");
  return TYPE_EXPENSE_ID[chave] || 1;
}

/* =======================
   API DESPESA
======================= */
function montarPayloadDespesa(dados, categoryId) {
  return {
    name: dados.descricao,
    categoryId: Number(categoryId),
    typeExpenseId: Number(buscarTypeExpenseId(dados.tipo)),
    value: Number(dados.valor || 0),
    dateInitial: dados.data
  };
}

async function tentarEnviarDespesaApi(path, method, dados) {
  const categoryId = await buscarCategoryIdDespesa(dados.categoria);

  if (!categoryId || Number.isNaN(Number(categoryId))) {
    mostrarMensagemDespesa(
      `Não encontrei o ID da categoria "${dados.categoria}".\n\nAbra a tela Categorias ou confira se essa categoria existe na API.`
    );
    return null;
  }

  const body = montarPayloadDespesa(dados, categoryId);

  try {
    console.log(`${method} despesa em:`, `${DESPESAS_API_URL}${path}`);
    console.log("Body enviado:", body);

    const response = await fetch(`${DESPESAS_API_URL}${path}`, {
      method,
      cache: "no-store",
      headers: headersDespesas(true),
      body: JSON.stringify(body)
    });

    const data = await lerRespostaDespesas(response);

    console.log("Status despesa:", response.status);
    console.log("Resposta despesa:", data);

    if (!response.ok) {
      mostrarMensagemDespesa(extrairMensagemErroApiDespesa(data));
      return null;
    }

    return data?.data || data;
  } catch (erro) {
    console.error("Erro ao salvar/editar despesa:", erro);

    mostrarMensagemDespesa(
      "Não foi possível conectar com a API.\n\n" +
      "Se o console mostrar erro de CORS, o servidor precisa liberar PUT, DELETE e OPTIONS para o endereço do site."
    );

    return null;
  }
}

async function carregarDespesasApi() {
  const mes = dataMesAtual.getMonth() + 1;
  const ano = dataMesAtual.getFullYear();

  const resposta = await apiDespesas(`/expense/user?month=${mes}&year=${ano}`, {
    method: "GET"
  });

  const lista = transformarEmArrayDespesas(resposta);

  despesas = removerDespesasDuplicadas(
    lista.map(normalizarDespesaApi)
  );

  aplicarFiltros();
}

async function buscarDespesasMesApi(mes, ano) {
  const resposta = await apiDespesas(`/expense/user?month=${mes}&year=${ano}`, {
    method: "GET"
  });

  return transformarEmArrayDespesas(resposta).map(normalizarDespesaApi);
}

function transformarEmArrayDespesas(resposta) {
  if (!resposta) return [];

  if (Array.isArray(resposta)) return resposta;

  if (Array.isArray(resposta.data)) return resposta.data;
  if (Array.isArray(resposta.items)) return resposta.items;
  if (Array.isArray(resposta.results)) return resposta.results;
  if (Array.isArray(resposta.expenses)) return resposta.expenses;
  if (Array.isArray(resposta.despesas)) return resposta.despesas;
  if (Array.isArray(resposta.categories)) return resposta.categories;
  if (Array.isArray(resposta.categorias)) return resposta.categorias;

  if (resposta.data && typeof resposta.data === "object") {
    if (Array.isArray(resposta.data.items)) return resposta.data.items;
    if (Array.isArray(resposta.data.results)) return resposta.data.results;
    if (Array.isArray(resposta.data.expenses)) return resposta.data.expenses;
    if (Array.isArray(resposta.data.despesas)) return resposta.data.despesas;
    if (Array.isArray(resposta.data.categories)) return resposta.data.categories;
    if (Array.isArray(resposta.data.categorias)) return resposta.data.categorias;
  }

  return [];
}

function normalizarDespesaApi(item) {
  const data = normalizarDataISO(
    item.dateInitial ||
    item.data ||
    item.date ||
    item.createdAt ||
    item.dueDate ||
    ""
  );

  const valor = Number(
    item.value ??
    item.amount ??
    item.valor ??
    item.total ??
    0
  );

  const tipo =
    item.typeExpense?.name ||
    item.typeExpense?.description ||
    item.typeExpense ||
    item.typeExpenseId ||
    item.tipoDespesa ||
    item.type ||
    item.tipo ||
    "fixa";

  const statusTexto = String(item.status || "").toLowerCase();

  const pago =
    item.paid === true ||
    item.pago === true ||
    statusTexto.includes("paid") ||
    statusTexto.includes("pago");

  return {
    id: item.id || item.expenseId || item.uuid,
    descricao:
      item.name ||
      item.description ||
      item.descricao ||
      item.nome ||
      "Sem descrição",
    valor: Math.abs(valor || 0),
    valorTotal: Math.abs(valor || 0),
    data,
    dataFormatada: formatarData(data),
    tipo: normalizarTipoDespesa(tipo),
    pago,
    categoria: pegarNomeCategoriaDespesa(item),
    origem: "api",
    parcelada: Boolean(item.parcelada),
    parcelaAtual: item.parcelaAtual || null,
    totalParcelas: item.totalParcelas || null,
    fixaMensal: Boolean(item.fixaMensal),
    autorId:
      item.userId ||
      item.user_id ||
      item.createdById ||
      item.created_by_id ||
      item.user?.id ||
      item.usuario?.id ||
      null,
    autorEmail:
      item.userEmail ||
      item.emailUsuario ||
      item.createdByEmail ||
      item.created_by_email ||
      item.user?.email ||
      item.usuario?.email ||
      "",
    autorNickname:
      item.nicknameUsuario ||
      item.nomeUsuario ||
      item.createdByNickname ||
      item.createdByName ||
      item.user?.nickname ||
      item.user?.name ||
      item.usuario?.nickname ||
      item.usuario?.nome ||
      ""
  };
}

function criarDespesaVisual(dados, respostaApi = null) {
  const itemBase = respostaApi && typeof respostaApi === "object" ? respostaApi : {};

  return normalizarDespesaApi({
    ...itemBase,
    id: itemBase.id || itemBase.expenseId || `temp-${Date.now()}-${Math.random()}`,
    name: itemBase.name || dados.descricao,
    value: itemBase.value ?? dados.valor,
    dateInitial: itemBase.dateInitial || dados.data,
    category: itemBase.category || dados.categoria,
    categoryId: itemBase.categoryId || itemBase.category_id || itemBase.idCategory,
    typeExpense: itemBase.typeExpense || dados.tipo,
    paid: itemBase.paid ?? dados.pago,
    fixaMensal: Boolean(dados.fixaMensal),
    parcelada: Boolean(dados.parcelada),
    parcelaAtual: dados.parcelaAtual || null,
    totalParcelas: dados.totalParcelas || null
  });
}

function normalizarTipoDespesa(tipo) {
  const texto = normalizarTextoDespesa(tipo);

  if (texto === "2" || texto.includes("vari")) return "variavel";
  if (texto === "3" || texto.includes("sazon")) return "sazonal";
  return "fixa";
}

/* =======================
   EVITAR DUPLICAR
======================= */
function despesaEhIgual(a, b) {
  const dataA = normalizarDataISO(a.data || a.dateInitial || a.date);
  const dataB = normalizarDataISO(b.data || b.dateInitial || b.date);

  const valorA = Number(a.valor ?? a.value ?? a.amount ?? 0);
  const valorB = Number(b.valor ?? b.value ?? b.amount ?? 0);

  const categoriaA = normalizarTextoDespesa(
    a.categoria ||
    a.category?.name ||
    a.category ||
    a.descriptionCategory ||
    pegarNomeCategoriaDespesa(a)
  );

  const categoriaB = normalizarTextoDespesa(
    b.categoria ||
    b.category?.name ||
    b.category ||
    b.descriptionCategory ||
    pegarNomeCategoriaDespesa(b)
  );

  return (
    dataA === dataB &&
    categoriaA === categoriaB &&
    Math.abs(valorA - valorB) < 0.01
  );
}

function removerDespesasDuplicadas(lista) {
  const mapa = new Map();

  lista.forEach((despesa) => {
    const data = normalizarDataISO(despesa.data || despesa.dateInitial || despesa.date);
    const valor = Number(despesa.valor ?? despesa.value ?? despesa.amount ?? 0).toFixed(2);

    const categoria = normalizarTextoDespesa(
      despesa.categoria ||
      despesa.category?.name ||
      despesa.category ||
      despesa.descriptionCategory ||
      pegarNomeCategoriaDespesa(despesa)
    );

    const chave = `${data}|${categoria}|${valor}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, despesa);
      return;
    }

    const atual = mapa.get(chave);

    const descricaoAtual = normalizarTextoDespesa(atual.descricao);
    const descricaoNova = normalizarTextoDespesa(despesa.descricao);

    const atualRuim =
      !descricaoAtual ||
      descricaoAtual === "sem descricao" ||
      descricaoAtual === "sem descrição";

    const novaBoa =
      descricaoNova &&
      descricaoNova !== "sem descricao" &&
      descricaoNova !== "sem descrição";

    if (atualRuim && novaBoa) {
      mapa.set(chave, despesa);
    }
  });

  return Array.from(mapa.values());
}

async function buscarDespesaFixaExistente(dadosDespesa) {
  const data = converterData(dadosDespesa.data);

  if (!data) return null;

  const mes = data.getMonth() + 1;
  const ano = data.getFullYear();

  const despesasDoMes = await buscarDespesasMesApi(mes, ano);

  const existente = despesasDoMes.find((despesa) => {
    return despesaEhIgual(despesa, dadosDespesa);
  });

  return existente || null;
}

function inserirDespesaNaTelaSeNaoExiste(despesa) {
  if (!despesa || !despesa.data) return;

  if (pegarAnoMes(despesa.data) !== filtros.data) return;

  const jaExistePorId = despesas.some((item) => {
    return String(item.id) === String(despesa.id);
  });

  if (jaExistePorId) return;

  const jaExistePorDados = despesas.some((item) => {
    return despesaEhIgual(item, despesa);
  });

  if (jaExistePorDados) return;

  despesas.push(despesa);

  despesas = removerDespesasDuplicadas(despesas);
}

/* =======================
   FAMÍLIA / AUTOR
======================= */
async function usuarioEstaEmFamilia() {
  const token = getTokenDespesas();

  if (!token) return false;

  try {
    const resposta = await fetch(`${DESPESAS_API_URL}/family`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (resposta.status === 404) return false;
    if (!resposta.ok) return false;

    const data = await resposta.json();

    const membros =
      data?.members ||
      data?.data?.members ||
      data?.family?.members ||
      [];

    return Array.isArray(membros) && membros.length > 0;
  } catch (erro) {
    console.warn("Erro ao verificar família em despesas:", erro);
    return false;
  }
}

function getEmailUsuarioAtualDespesa() {
  return (
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    ""
  ).toLowerCase().trim();
}

function getUserKeyDespesa(email = null) {
  const emailFinal = email || getEmailUsuarioAtualDespesa();
  return `fambudget_${String(emailFinal || "usuario").toLowerCase().trim()}`;
}

function buscarDadoUsuarioDespesa(chave, email = null) {
  const userKey = getUserKeyDespesa(email);
  return localStorage.getItem(`${userKey}_${chave}`) || "";
}

function getNicknameUsuarioAtualDespesa() {
  const email = getEmailUsuarioAtualDespesa();

  return (
    buscarDadoUsuarioDespesa("nicknameUsuario", email) ||
    buscarDadoUsuarioDespesa("nomeUsuario", email) ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário"
  );
}

function buscarNicknamePorEmailDespesa(email) {
  if (!email) return "";

  return (
    buscarDadoUsuarioDespesa("nicknameUsuario", email) ||
    buscarDadoUsuarioDespesa("nomeUsuario", email) ||
    ""
  );
}

function pegarNomeAutorDespesa(despesa) {
  const emailAutor =
    despesa.autorEmail ||
    despesa.userEmail ||
    despesa.emailUsuario ||
    despesa.createdByEmail ||
    despesa.created_by_email ||
    despesa.createdBy?.email ||
    despesa.user?.email ||
    despesa.usuario?.email ||
    "";

  const nicknameSalvo = buscarNicknamePorEmailDespesa(emailAutor);

  return (
    nicknameSalvo ||
    despesa.autorNickname ||
    despesa.nicknameUsuario ||
    despesa.nomeUsuario ||
    despesa.createdByNickname ||
    despesa.createdByName ||
    despesa.createdBy?.nickname ||
    despesa.createdBy?.name ||
    despesa.user?.nickname ||
    despesa.user?.name ||
    despesa.usuario?.nickname ||
    despesa.usuario?.nome ||
    getNicknameUsuarioAtualDespesa()
  );
}

function atualizarCabecalhoUsuarioDespesas() {
  if (!tabela) return;

  const tabelaCompleta = tabela.closest("table");
  if (!tabelaCompleta) return;

  const linhaCabecalho = tabelaCompleta.querySelector("thead tr");
  if (!linhaCabecalho) return;

  const thUsuarioExistente = linhaCabecalho.querySelector("[data-coluna-usuario='despesa']");

  if (mostrarUsuarioDespesa) {
    if (!thUsuarioExistente) {
      const thAcoes =
        linhaCabecalho.querySelector(".acoes-coluna") ||
        linhaCabecalho.lastElementChild;

      const thUsuario = document.createElement("th");
      thUsuario.textContent = "Usuário";
      thUsuario.setAttribute("data-coluna-usuario", "despesa");

      if (thAcoes) {
        linhaCabecalho.insertBefore(thUsuario, thAcoes);
      } else {
        linhaCabecalho.appendChild(thUsuario);
      }
    }
  } else if (thUsuarioExistente) {
    thUsuarioExistente.remove();
  }
}

/* =======================
   EVENTOS
======================= */
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

  if (inputValor) {
    inputValor.addEventListener("input", (event) => {
      const input = event.target;

      setTimeout(() => {
        formatarMoedaInput(input);
        atualizarPreviewParcelas();
      }, 0);
    });
  }

  if (inputParcelas) {
    inputParcelas.addEventListener("input", atualizarPreviewParcelas);
  }

  if (inputBusca) {
    inputBusca.addEventListener("input", (e) => {
      filtros.busca = e.target.value.toLowerCase().trim();
      aplicarFiltros();
    });
  }

  if (filtroTipo && dropdownTipo) {
    toggleDropdown(filtroTipo, dropdownTipo);
  }

  if (filtroStatus && dropdownStatus) {
    toggleDropdown(filtroStatus, dropdownStatus);
  }

  if (tabela) {
    tabela.addEventListener("click", (e) => {
      const btnEditar = e.target.closest(".btn-editar-despesa");
      const btnExcluir = e.target.closest(".btn-excluir-despesa");

      if (btnEditar) {
        confirmarEditarDespesa(btnEditar.dataset.id);
        return;
      }

      if (btnExcluir) {
        confirmarExcluirDespesa(btnExcluir.dataset.id);
      }
    });
  }

  configurarCategoria();
  configurarFiltros();

  document.addEventListener("click", (e) => {
    if (
      dropdownCategoriaModal &&
      selectCategoria &&
      !selectCategoria.contains(e.target)
    ) {
      dropdownCategoriaModal.style.display = "none";
    }

    if (dropdownTipo && filtroTipo && !filtroTipo.contains(e.target)) {
      dropdownTipo.style.display = "none";
    }

    if (dropdownStatus && filtroStatus && !filtroStatus.contains(e.target)) {
      dropdownStatus.style.display = "none";
    }
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      fecharModalDespesa();
    }
  });

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

/* =======================
   MODAL
======================= */
function abrirModalDespesa() {
  modoEdicaoDespesa = false;
  idDespesaEditando = null;

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar";
  }

  if (modal) {
    modal.style.display = "flex";
  }

  atualizarCampoParcelas();
  atualizarPreviewParcelas();
}

function abrirModalDespesaEdicao() {
  if (btnSalvar) {
    btnSalvar.textContent = "Atualizar";
  }

  if (modal) {
    modal.style.display = "flex";
  }

  atualizarCampoParcelas();
  atualizarPreviewParcelas();
}

function fecharModalDespesa() {
  if (modal) {
    modal.style.display = "none";
  }

  limparCampos();

  modoEdicaoDespesa = false;
  idDespesaEditando = null;

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar";
  }
}

function toggleDropdown(btn, drop) {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    drop.style.display = drop.style.display === "block" ? "none" : "block";
  });
}

/* =======================
   CATEGORIA
======================= */
function configurarCategoria() {
  if (!selectCategoria || !dropdownCategoriaModal || !categoriaTexto) return;

  selectCategoria.addEventListener("click", (e) => {
    e.stopPropagation();

    dropdownCategoriaModal.style.display =
      dropdownCategoriaModal.style.display === "block" ? "none" : "block";
  });

  document.querySelectorAll(".item-categoria").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();

      selecionarCategoriaDespesa(item);

      dropdownCategoriaModal.style.display = "none";

      atualizarCampoParcelas();
      atualizarPreviewParcelas();
    });
  });
}

function selecionarCategoriaDespesa(item) {
  const categoria = item.dataset.categoria;

  categoriaTexto.innerText = categoria;
  selectCategoria.dataset.categoria = categoria;

  categoriaTexto.className = "";

  const classeCor = coresCategoria[categoria];

  if (classeCor) {
    categoriaTexto.classList.add(classeCor);
  }

  document.querySelectorAll(".item-categoria").forEach((opcao) => {
    opcao.classList.remove("ativo");
  });

  item.classList.add("ativo");
}

function selecionarCategoriaPorNome(categoria) {
  if (!categoriaTexto || !selectCategoria) return;

  categoriaTexto.innerText = categoria || "Selecione uma categoria";
  categoriaTexto.className = "";

  if (categoria) {
    selectCategoria.dataset.categoria = categoria;
  } else {
    delete selectCategoria.dataset.categoria;
  }

  const classeCor = coresCategoria[categoria];

  if (classeCor) {
    categoriaTexto.classList.add(classeCor);
  }

  document.querySelectorAll(".item-categoria").forEach((item) => {
    item.classList.remove("ativo");

    if (item.dataset.categoria === categoria) {
      item.classList.add("ativo");
    }
  });

  atualizarCampoParcelas();
  atualizarPreviewParcelas();
}

/* =======================
   FILTROS
======================= */
function configurarFiltros() {
  document.querySelectorAll("[data-tipo]").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();

      const tipoClicado = item.dataset.tipo;

      filtros.tipo = filtros.tipo === tipoClicado ? null : tipoClicado;

      document.querySelectorAll("[data-tipo]").forEach((opcao) => {
        opcao.classList.remove("ativo");
      });

      if (filtros.tipo) {
        item.classList.add("ativo");
      }

      if (dropdownTipo) {
        dropdownTipo.style.display = "none";
      }

      aplicarFiltros();
    });
  });

  document.querySelectorAll("[data-status]").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();

      const statusClicado = item.dataset.status;

      filtros.status = filtros.status === statusClicado ? null : statusClicado;

      document.querySelectorAll("[data-status]").forEach((opcao) => {
        opcao.classList.remove("ativo");
      });

      if (filtros.status) {
        item.classList.add("ativo");
      }

      if (dropdownStatus) {
        dropdownStatus.style.display = "none";
      }

      aplicarFiltros();
    });
  });
}

/* =======================
   CONTROLE DE MÊS
======================= */
function configurarControleMes() {
  if (btnMesAnterior) {
    btnMesAnterior.addEventListener("click", async () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() - 1);
      filtros.data = pegarAnoMesData(dataMesAtual);
      atualizarTextoMes();
      await carregarDespesasApi();
    });
  }

  if (btnProximoMes) {
    btnProximoMes.addEventListener("click", async () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() + 1);
      filtros.data = pegarAnoMesData(dataMesAtual);
      atualizarTextoMes();
      await carregarDespesasApi();
    });
  }
}

function atualizarTextoMes() {
  if (!textoMesAtual) return;

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const mes = meses[dataMesAtual.getMonth()];
  const ano = dataMesAtual.getFullYear();

  textoMesAtual.textContent = `${mes} ${ano}`;
}

function pegarAnoMesData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");

  return `${ano}-${mes}`;
}

/* =======================
   SALVAR / EDITAR
======================= */
async function salvarDespesa() {
  if (modoEdicaoDespesa) {
    await atualizarDespesaEditada();
    return;
  }

  const descricao = inputDesc.value.trim();
  const valorTotal = converterMoedaParaNumero(inputValor.value);
  const data = inputData.value;
  const pago = checkPago.checked;
  const categoria = selectCategoria.dataset.categoria;

  const tipo =
    document.querySelector('input[name="tipoDespesa"]:checked')?.value ||
    "fixa";

  if (!descricao || valorTotal <= 0 || !data || !categoria) {
    mostrarMensagemDespesa("Preencha todos os campos corretamente!");
    return;
  }

  btnSalvar.disabled = true;
  const textoOriginalBotao = btnSalvar.textContent;
  btnSalvar.textContent = "Salvando...";

  try {
    const despesasCriadas = [];

    if (ehCartaoCredito(categoria)) {
      const criadas = await salvarDespesaParceladaApi({
        descricao,
        valorTotal,
        data,
        pago,
        categoria,
        tipo: "variavel"
      });

      if (!criadas) return;

      despesasCriadas.push(...criadas);
    } else if (tipo === "fixa") {
      const criadas = await salvarDespesaFixaMensalApi({
        descricao,
        valorTotal,
        data,
        pago,
        categoria,
        tipo
      });

      if (!criadas) return;

      despesasCriadas.push(...criadas);
    } else {
      const dadosDespesa = {
        descricao,
        valor: valorTotal,
        data,
        pago,
        categoria,
        tipo,
        parcelada: false,
        fixaMensal: false
      };

      const criado = await tentarEnviarDespesaApi("/expense", "POST", dadosDespesa);

      if (!criado) return;

      despesasCriadas.push(criarDespesaVisual(dadosDespesa, criado));
    }

    despesasCriadas.forEach((despesa) => {
      inserirDespesaNaTelaSeNaoExiste(despesa);
    });

    aplicarFiltros();
    fecharModalDespesa();

    if (typeof carregarDadosFinanceiros === "function") {
      carregarDadosFinanceiros();
    }

    setTimeout(() => {
      carregarDespesasApi();
    }, 600);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = textoOriginalBotao || "Salvar";
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

  const descricao = inputDesc.value.trim();
  const valorTotal = converterMoedaParaNumero(inputValor.value);
  const data = inputData.value;
  const pago = checkPago.checked;
  const categoria = selectCategoria.dataset.categoria;

  const tipo =
    document.querySelector('input[name="tipoDespesa"]:checked')?.value ||
    "fixa";

  if (!descricao || valorTotal <= 0 || !data || !categoria) {
    mostrarMensagemDespesa("Preencha todos os campos corretamente!");
    return;
  }

  btnSalvar.disabled = true;
  const textoOriginalBotao = btnSalvar.textContent;
  btnSalvar.textContent = "Atualizando...";

  try {
    const dadosDespesa = {
      descricao,
      valor: valorTotal,
      data,
      pago,
      categoria,
      tipo,
      parcelada: false,
      fixaMensal: false
    };

    /*
      Endpoint correto do Swagger:
      PUT /api/v1/expense/{expenseId}
    */
    const atualizado = await tentarEnviarDespesaApi(
      `/expense/${idDespesaEditando}`,
      "PUT",
      dadosDespesa
    );

    if (!atualizado) return;

    const despesaAtualizada = criarDespesaVisual(dadosDespesa, {
      ...atualizado,
      id: idDespesaEditando
    });

    despesas = despesas.map((despesa) => {
      if (String(despesa.id) !== String(idDespesaEditando)) {
        return despesa;
      }

      return despesaAtualizada;
    });

    despesas = removerDespesasDuplicadas(despesas);

    aplicarFiltros();
    fecharModalDespesa();

    if (typeof carregarDadosFinanceiros === "function") {
      carregarDadosFinanceiros();
    }

    mostrarMensagemDespesa("Despesa atualizada com sucesso!");

    setTimeout(() => {
      carregarDespesasApi();
    }, 600);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = textoOriginalBotao || "Atualizar";
  }
}

async function salvarDespesaParceladaApi({ descricao, valorTotal, data, pago, categoria, tipo }) {
  const quantidadeParcelas = Math.max(1, Number(inputParcelas?.value || 1));
  const valorParcela = arredondarValor(valorTotal / quantidadeParcelas);
  const criadas = [];

  for (let i = 0; i < quantidadeParcelas; i++) {
    const dataParcela = adicionarMeses(data, i);

    const dadosDespesa = {
      descricao: `${descricao} (${i + 1}/${quantidadeParcelas})`,
      valor: valorParcela,
      data: dataParcela,
      pago,
      categoria,
      tipo,
      parcelada: true,
      parcelaAtual: i + 1,
      totalParcelas: quantidadeParcelas,
      fixaMensal: false
    };

    const criado = await tentarEnviarDespesaApi("/expense", "POST", dadosDespesa);

    if (!criado) return false;

    criadas.push(criarDespesaVisual(dadosDespesa, criado));
  }

  return criadas;
}

async function salvarDespesaFixaMensalApi({ descricao, valorTotal, data, pago, categoria, tipo }) {
  const criadas = [];

  for (let i = 0; i < QUANTIDADE_MESES_DESPESA_FIXA; i++) {
    const dataMensal = adicionarMeses(data, i);

    const dadosDespesa = {
      descricao,
      valor: valorTotal,
      data: dataMensal,
      pago,
      categoria,
      tipo,
      parcelada: false,
      fixaMensal: true
    };

    const existente = await buscarDespesaFixaExistente(dadosDespesa);

    if (existente) {
      criadas.push(existente);
      continue;
    }

    const criado = await tentarEnviarDespesaApi("/expense", "POST", dadosDespesa);

    if (!criado) return false;

    criadas.push(criarDespesaVisual(dadosDespesa, criado));
  }

  return criadas;
}

/* =======================
   EXCLUIR DESPESA FIXA
======================= */
function confirmarExcluirDespesa(id) {
  const despesa = despesas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!despesa) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  const ehFixa =
    despesa.tipo === "fixa" ||
    despesa.typeExpenseId === 1 ||
    despesa.typeExpense === 1 ||
    normalizarTextoDespesa(despesa.tipo).includes("fixa");

  if (ehFixa) {
    abrirPopupDespesas({
      icone: "!",
      titulo: "Excluir despesa fixa",
      texto: "Essa despesa é fixa. Deseja excluir apenas este mês ou todos os meses dessa despesa fixa?",
      botoes: [
        {
          texto: "Cancelar",
          classe: "popup-btn-cancelar"
        },
        {
          texto: "Apenas este mês",
          classe: "popup-btn-secundario",
          acao: () => excluirDespesa(id, "unico")
        },
        {
          texto: "Todos os meses",
          classe: "popup-btn-perigo",
          acao: () => excluirDespesa(id, "todos")
        }
      ]
    });

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
        acao: () => excluirDespesa(id, "unico")
      }
    ]
  });
}

async function excluirDespesa(id, escopo = "unico") {
  const despesa = despesas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!despesa) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  if (escopo === "todos") {
    await excluirTodasDespesasFixas(despesa);
    return;
  }

  const excluido = await apiDespesas(`/expense/${id}`, {
    method: "DELETE"
  });

  if (excluido === null) return;

  despesas = despesas.filter((item) => {
    return String(item.id) !== String(id);
  });

  despesas = removerDespesasDuplicadas(despesas);

  aplicarFiltros();

  if (typeof carregarDadosFinanceiros === "function") {
    carregarDadosFinanceiros();
  }

  mostrarMensagemDespesa("Despesa excluída com sucesso!");
}

function descricaoDespesaBoa(despesa) {
  const descricao = normalizarTextoDespesa(
    despesa.descricao ||
    despesa.name ||
    despesa.description ||
    ""
  );

  return (
    descricao &&
    descricao !== "sem descricao" &&
    descricao !== "sem descrição"
  );
}

function despesasSaoMesmoGrupoFixo(despesaBase, despesaComparada) {
  const valorBase = Number(
    despesaBase.valor ??
    despesaBase.value ??
    despesaBase.amount ??
    0
  );

  const valorComparada = Number(
    despesaComparada.valor ??
    despesaComparada.value ??
    despesaComparada.amount ??
    0
  );

  const categoriaBase = normalizarTextoDespesa(
    despesaBase.categoria ||
    despesaBase.category?.name ||
    despesaBase.category ||
    despesaBase.descriptionCategory ||
    pegarNomeCategoriaDespesa(despesaBase)
  );

  const categoriaComparada = normalizarTextoDespesa(
    despesaComparada.categoria ||
    despesaComparada.category?.name ||
    despesaComparada.category ||
    despesaComparada.descriptionCategory ||
    pegarNomeCategoriaDespesa(despesaComparada)
  );

  const mesmoValor = Math.abs(valorBase - valorComparada) < 0.01;
  const mesmaCategoria = categoriaBase === categoriaComparada;

  const baseTemDescricaoBoa = descricaoDespesaBoa(despesaBase);
  const comparadaTemDescricaoBoa = descricaoDespesaBoa(despesaComparada);

  if (baseTemDescricaoBoa && comparadaTemDescricaoBoa) {
    const descricaoBase = normalizarTextoDespesa(despesaBase.descricao);
    const descricaoComparada = normalizarTextoDespesa(despesaComparada.descricao);

    return (
      descricaoBase === descricaoComparada &&
      mesmaCategoria &&
      mesmoValor
    );
  }

  return mesmaCategoria && mesmoValor;
}

async function buscarDespesasFixasDoGrupo(despesaBase) {
  const dataBase = converterData(despesaBase.data);

  if (!dataBase) return [];

  const todas = [];
  const mesesVerificados = new Set();

  for (let i = -12; i <= 12; i++) {
    const dataBusca = new Date(
      dataBase.getFullYear(),
      dataBase.getMonth() + i,
      1
    );

    const mes = dataBusca.getMonth() + 1;
    const ano = dataBusca.getFullYear();
    const chaveMes = `${ano}-${String(mes).padStart(2, "0")}`;

    if (mesesVerificados.has(chaveMes)) continue;
    mesesVerificados.add(chaveMes);

    const despesasMes = await buscarDespesasMesApi(mes, ano);

    despesasMes.forEach((despesa) => {
      const ehMesmoGrupo = despesasSaoMesmoGrupoFixo(despesaBase, despesa);

      if (ehMesmoGrupo && despesa.id) {
        todas.push(despesa);
      }
    });
  }

  const mapa = new Map();

  todas.forEach((despesa) => {
    if (!mapa.has(String(despesa.id))) {
      mapa.set(String(despesa.id), despesa);
    }
  });

  return Array.from(mapa.values());
}

async function excluirTodasDespesasFixas(despesaBase) {
  const despesasParaExcluir = await buscarDespesasFixasDoGrupo(despesaBase);

  if (despesasParaExcluir.length === 0) {
    mostrarMensagemDespesa("Não encontrei outras despesas fixas para excluir.");
    return;
  }

  let excluidas = 0;
  let falhas = 0;

  for (const despesa of despesasParaExcluir) {
    const resultado = await apiDespesas(`/expense/${despesa.id}`, {
      method: "DELETE"
    });

    if (resultado === null) {
      falhas++;
    } else {
      excluidas++;
    }
  }

  despesas = despesas.filter((despesaAtual) => {
    return !despesasParaExcluir.some((despesaExcluida) => {
      return String(despesaExcluida.id) === String(despesaAtual.id);
    });
  });

  despesas = removerDespesasDuplicadas(despesas);

  aplicarFiltros();

  if (typeof carregarDadosFinanceiros === "function") {
    carregarDadosFinanceiros();
  }

  if (falhas > 0) {
    mostrarMensagemDespesa(
      `Algumas despesas foram excluídas, mas ${falhas} não puderam ser removidas pela API.`
    );
    return;
  }

  mostrarMensagemDespesa(
    `${excluidas} despesa(s) fixa(s) excluída(s) com sucesso!`
  );
}

/* =======================
   EDITAR
======================= */
function confirmarEditarDespesa(id) {
  const despesa = despesas.find((item) => {
    return String(item.id) === String(id);
  });

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
        acao: () => prepararEdicaoDespesa(id)
      }
    ]
  });
}

function prepararEdicaoDespesa(id) {
  const despesa = despesas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!despesa) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  modoEdicaoDespesa = true;
  idDespesaEditando = id;

  if (inputDesc) inputDesc.value = limparDescricaoParcela(despesa.descricao || "");
  if (inputValor) inputValor.value = formatarMoedaPositiva(despesa.valorTotal || despesa.valor);
  if (inputData) inputData.value = normalizarDataISO(despesa.data);
  if (checkPago) checkPago.checked = Boolean(despesa.pago);

  if (inputParcelas) {
    inputParcelas.value = despesa.totalParcelas || 1;
  }

  selecionarCategoriaPorNome(despesa.categoria);

  const radioTipo = document.querySelector(
    `input[name="tipoDespesa"][value="${despesa.tipo || "fixa"}"]`
  );

  if (radioTipo) {
    radioTipo.checked = true;
  }

  abrirModalDespesaEdicao();
}

/* =======================
   FILTRO / RENDER
======================= */
function aplicarFiltros() {
  const despesasSemDuplicar = removerDespesasDuplicadas(despesas);

  const lista = despesasSemDuplicar.filter((despesa) => {
    if (filtros.busca) {
      const texto = filtros.busca;

      const descricao = String(despesa.descricao || "").toLowerCase();
      const descricaoOriginal = String(despesa.descricaoOriginal || "").toLowerCase();
      const categoria = String(despesa.categoria || "").toLowerCase();
      const autor = String(pegarNomeAutorDespesa(despesa) || "").toLowerCase();

      if (
        !descricao.includes(texto) &&
        !descricaoOriginal.includes(texto) &&
        !categoria.includes(texto) &&
        !autor.includes(texto)
      ) {
        return false;
      }
    }

    if (filtros.tipo && despesa.tipo !== filtros.tipo) {
      return false;
    }

    if (filtros.status) {
      const status = despesa.pago ? "pago" : "pendente";

      if (status !== filtros.status) {
        return false;
      }
    }

    if (filtros.data) {
      const mesAnoDespesa = pegarAnoMes(despesa.data);

      if (mesAnoDespesa !== filtros.data) {
        return false;
      }
    }

    return true;
  });

  renderizarDespesas(lista);
}

function renderizarDespesas(lista = despesas) {
  if (!tabela) return;

  tabela.innerHTML = "";
  atualizarCabecalhoUsuarioDespesas();

  if (lista.length === 0) {
    if (semDados) semDados.style.display = "block";
  } else {
    if (semDados) semDados.style.display = "none";
  }

  lista.forEach((despesa) => {
    const tr = document.createElement("tr");

    const status = despesa.pago ? "Pago" : "Pendente";
    const colunaUsuario = mostrarUsuarioDespesa
      ? `<td class="usuario-despesa">${pegarNomeAutorDespesa(despesa)}</td>`
      : "";

    tr.innerHTML = `
      <td>${despesa.dataFormatada || formatarData(despesa.data)}</td>
      <td>${despesa.descricao}</td>
      <td>${despesa.categoria}</td>
      <td>${formatarTipoDespesa(despesa.tipo)}</td>
      <td>${status}</td>
      <td class="valor negativo">${formatarMoeda(despesa.valor)}</td>
      ${colunaUsuario}
      <td>
        <div class="acoes-despesa">
          <button 
            type="button" 
            class="btn-acao-despesa btn-editar-despesa" 
            title="Editar"
            data-id="${despesa.id}"
          >
            <img src="imagem/iconConfig/lapis.png" alt="Editar">
          </button>

          <button 
            type="button" 
            class="btn-acao-despesa btn-excluir-despesa" 
            title="Excluir"
            data-id="${despesa.id}"
          >
            <img src="imagem/iconConfig/lixeira.png" alt="Excluir">
          </button>
        </div>
      </td>
    `;

    tabela.appendChild(tr);
  });

  atualizarTotais(lista);
}

function atualizarTotais(lista = despesas) {
  const listaSemDuplicar = removerDespesasDuplicadas(lista);

  const total = listaSemDuplicar.reduce((soma, despesa) => {
    return soma + Number(despesa.valor || 0);
  }, 0);

  if (totalDespesas) totalDespesas.textContent = formatarMoeda(total);
  if (totalSaidas) totalSaidas.textContent = formatarMoeda(total);
}

/* =======================
   PARCELAMENTO
======================= */
function ehCartaoCredito(categoria) {
  if (!categoria) return false;

  const texto = String(categoria)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return texto.includes("cartao") && texto.includes("credito");
}

function atualizarCampoParcelas() {
  if (!containerParcelas || !selectCategoria) return;

  const categoria = selectCategoria.dataset.categoria;

  if (ehCartaoCredito(categoria)) {
    containerParcelas.style.display = "flex";
    containerParcelas.style.flexDirection = "column";

    if (inputParcelas && (!inputParcelas.value || Number(inputParcelas.value) < 1)) {
      inputParcelas.value = "1";
    }
  } else {
    containerParcelas.style.display = "none";

    if (inputParcelas) {
      inputParcelas.value = "1";
    }

    if (previewParcelas) {
      previewParcelas.textContent = "Informe em quantas vezes a compra foi dividida.";
    }
  }
}

function atualizarPreviewParcelas() {
  if (!previewParcelas || !inputValor || !inputParcelas || !selectCategoria) return;

  const categoria = selectCategoria.dataset.categoria;

  if (!ehCartaoCredito(categoria)) {
    previewParcelas.textContent = "Parcelamento disponível apenas para cartão de crédito.";
    return;
  }

  const valorTotal = converterMoedaParaNumero(inputValor.value);
  const parcelas = Math.max(1, Number(inputParcelas.value || 1));
  const valorParcela = valorTotal / parcelas;

  if (valorTotal <= 0) {
    previewParcelas.textContent = "Informe o valor total da compra.";
    return;
  }

  previewParcelas.textContent = `${parcelas}x de ${formatarMoedaPositiva(valorParcela)}`;
}

/* =======================
   UTIL
======================= */
function limparCampos() {
  if (inputDesc) inputDesc.value = "";
  if (inputValor) inputValor.value = "";
  if (inputData) inputData.value = "";
  if (checkPago) checkPago.checked = false;

  if (inputParcelas) {
    inputParcelas.value = "1";
  }

  if (containerParcelas) {
    containerParcelas.style.display = "none";
  }

  if (previewParcelas) {
    previewParcelas.textContent = "Informe em quantas vezes a compra foi dividida.";
  }

  if (categoriaTexto) {
    categoriaTexto.innerText = "Selecione uma categoria";
    categoriaTexto.className = "";
  }

  if (selectCategoria) {
    delete selectCategoria.dataset.categoria;
  }

  document.querySelectorAll(".item-categoria").forEach((opcao) => {
    opcao.classList.remove("ativo");
  });

  const tipoFixa = document.querySelector(
    'input[name="tipoDespesa"][value="fixa"]'
  );

  if (tipoFixa) {
    tipoFixa.checked = true;
  }
}

function limparDescricaoParcela(descricao) {
  return String(descricao || "").replace(/\s*\(\d+\/\d+\)\s*$/g, "").trim();
}

function formatarData(dataISO) {
  if (!dataISO) return "";

  const texto = String(dataISO);

  if (texto.includes("/")) return texto;

  const [ano, mes, dia] = texto.split("T")[0].split("-");

  if (!ano || !mes || !dia) return texto;

  return `${dia}/${mes}/${ano}`;
}

function normalizarDataISO(data) {
  if (!data) return "";

  const texto = String(data);

  if (texto.includes("-")) return texto.split("T")[0];

  if (texto.includes("/")) {
    const [dia, mes, ano] = texto.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  return texto;
}

function converterData(dataValor) {
  if (!dataValor) return null;

  const texto = String(dataValor).trim();

  if (texto.includes("-")) {
    const [ano, mes, dia] = texto.split("T")[0].split("-");
    return new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0);
  }

  if (texto.includes("/")) {
    const [dia, mes, ano] = texto.split("/");
    return new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0);
  }

  const data = new Date(texto);
  return isNaN(data.getTime()) ? null : data;
}

function pegarAnoMes(dataISO) {
  const data = normalizarDataISO(dataISO);

  if (!data || !data.includes("-")) return "";

  const [ano, mes] = data.split("-");

  return `${ano}-${mes}`;
}

function adicionarMeses(dataISO, quantidadeMeses) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);

  const data = new Date(ano, mes - 1, dia);
  const diaOriginal = data.getDate();

  data.setMonth(data.getMonth() + quantidadeMeses);

  if (data.getDate() !== diaOriginal) {
    data.setDate(0);
  }

  const novoAno = data.getFullYear();
  const novoMes = String(data.getMonth() + 1).padStart(2, "0");
  const novoDia = String(data.getDate()).padStart(2, "0");

  return `${novoAno}-${novoMes}-${novoDia}`;
}

function arredondarValor(valor) {
  return Math.round(Number(valor || 0) * 100) / 100;
}

function formatarTipoDespesa(tipo) {
  const tipos = {
    fixa: "Fixa",
    variavel: "Variável",
    sazonal: "Sazonal"
  };

  return tipos[tipo] || tipo;
}

/* =======================
   MOEDA
======================= */
function obterMoedaDespesas() {
  const email =
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    "usuario";

  const userKey = `fambudget_${String(email).toLowerCase().trim()}`;

  return (
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoedaInput(input) {
  let valor = input.value;

  valor = valor.replace(/\D/g, "");

  if (valor === "") {
    input.value = "";
    return;
  }

  const numero = Number(valor) / 100;

  try {
    input.value = numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaDespesas()
    });
  } catch {
    input.value = numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}

function converterMoedaParaNumero(valor) {
  if (!valor) return 0;

  const somenteNumeros = String(valor).replace(/\D/g, "");

  if (!somenteNumeros) return 0;

  return Number(somenteNumeros) / 100;
}

function formatarMoeda(valor) {
  const numero = Math.abs(Number(valor || 0));

  try {
    return `- ${numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaDespesas()
    })}`;
  } catch {
    return `- ${numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })}`;
  }
}

function formatarMoedaPositiva(valor) {
  const numero = Math.abs(Number(valor || 0));

  try {
    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaDespesas()
    });
  } catch {
    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}