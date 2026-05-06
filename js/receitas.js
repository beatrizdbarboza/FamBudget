console.log("RECEITAS.JS OK - API ATUALIZADO COMPLETO");

const RECEITAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";
const QUANTIDADE_MESES_RECEITA_FIXA = 12;

let receitas = [];
let categoriasReceitaCache = [];
let mostrarUsuarioReceita = false;

let filtros = {
  tipo: null,
  data: null,
  busca: ""
};

let modal;
let btnNova;
let btnCancelar;
let btnSalvar;

let inputDesc;
let inputValor;
let inputData;
let checkMensal;

let selectCategoria;
let dropdownCategoriaModal;
let textoSelecionado;

let inputBusca;
let filtroTipo;
let dropdownTipo;

let tabela;
let totalReceitas;
let totalEntradas;
let semDados;

let btnMesAnterior;
let btnProximoMes;
let textoMesAtual;

let dataMesAtual = new Date();

let modoEdicaoReceita = false;
let idReceitaEditando = null;

const CATEGORY_ID_RECEITA_FALLBACK = {
  salario: 1,
  salário: 1,
  receita: 1,
  outros: 8
};

const CATEGORY_NAME_RECEITA_BY_ID = {
  1: "Salário",
  2: "Receita",
  3: "Outros",
  4: "Outros",
  5: "Outros",
  6: "Outros",
  7: "Outros",
  8: "Outros"
};

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  pegarElementos();
  inserirCssAcoesReceitas();
  criarPopupReceitas();
  carregarUsuario();
  configurarEventos();
  configurarControleMes();

  filtros.data = pegarAnoMesData(dataMesAtual);
  atualizarTextoMes();

  categoriasReceitaCache = await buscarCategoriasReceitaApi();

  mostrarUsuarioReceita = await usuarioEstaEmFamiliaReceitas();
  atualizarCabecalhoUsuarioReceitas();

  await carregarReceitasApi();
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
    mostrarUsuarioReceita = await usuarioEstaEmFamiliaReceitas();
    atualizarCabecalhoUsuarioReceitas();
    await carregarReceitasApi();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  mostrarUsuarioReceita = await usuarioEstaEmFamiliaReceitas();
  atualizarCabecalhoUsuarioReceitas();
  await carregarReceitasApi();
});

/* ================= ELEMENTOS ================= */
function pegarElementos() {
  modal = document.getElementById("modalNovaReceita");

  btnNova =
    document.getElementById("btnNovaReceita") ||
    document.getElementById("btnNovaDespesa");

  btnCancelar = document.getElementById("cancelarReceita");
  btnSalvar = document.getElementById("salvarReceita");

  inputDesc = document.getElementById("descReceita");
  inputValor = document.getElementById("valorReceita");
  inputData = document.getElementById("dataReceita");

  checkMensal =
    document.getElementById("checkMensal") ||
    document.getElementById("checkPago");

  selectCategoria = document.getElementById("selectCategoria");
  dropdownCategoriaModal = document.getElementById("dropdownCategoriaModal");
  textoSelecionado = document.getElementById("categoriaSelecionada");

  inputBusca =
    document.getElementById("inputBuscaReceita") ||
    document.querySelector(".input-busca input");

  filtroTipo = document.getElementById("filtroTipo");
  dropdownTipo = document.getElementById("dropdownTipo");

  tabela = document.getElementById("lista-extratos");

  totalReceitas =
    document.getElementById("total-receitas") ||
    document.querySelector(".card-total h2");

  totalEntradas = document.getElementById("total-entradas");
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

/* ================= CSS / POPUP ================= */
function inserirCssAcoesReceitas() {
  if (document.getElementById("css-acoes-receitas")) return;

  const style = document.createElement("style");
  style.id = "css-acoes-receitas";

  style.textContent = `
    .acoes-coluna {
      text-align: center !important;
      width: 120px;
    }

    .acoes-receita {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-acao-receita {
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

    .btn-acao-receita img {
      width: 17px;
      height: 17px;
      object-fit: contain;
      display: block;
      pointer-events: none;
    }

    .btn-editar-receita {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .btn-editar-receita:hover {
      background: #c8e6c9;
      transform: scale(1.05);
    }

    .btn-excluir-receita {
      background: #ffebee;
      color: #d32f2f;
    }

    .btn-excluir-receita:hover {
      background: #ffcdd2;
      transform: scale(1.05);
    }

    .usuario-receita {
      font-weight: 600;
      color: #2e7d32;
      white-space: nowrap;
    }

    body.tema-escuro .usuario-receita,
    body.dark .usuario-receita {
      color: #22c55e;
    }

    .popup-receitas-overlay {
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

    .popup-receitas-box {
      width: 420px;
      max-width: 95%;
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
      text-align: center;
      animation: popupReceitasEntrada 0.2s ease;
    }

    @keyframes popupReceitasEntrada {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .popup-receitas-icone {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #e8f5e9;
      color: #2e7d32;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 700;
    }

    .popup-receitas-box h3 {
      font-size: 21px;
      color: #111827;
      margin-bottom: 8px;
    }

    .popup-receitas-box p {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
      margin-bottom: 20px;
      white-space: pre-line;
    }

    .popup-receitas-acoes {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .popup-receitas-acoes button {
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

function criarPopupReceitas() {
  if (document.getElementById("popupReceitas")) return;

  const popup = document.createElement("div");
  popup.id = "popupReceitas";
  popup.className = "popup-receitas-overlay";

  popup.innerHTML = `
    <div class="popup-receitas-box">
      <div class="popup-receitas-icone" id="popupReceitasIcone">i</div>
      <h3 id="popupReceitasTitulo">Confirmação</h3>
      <p id="popupReceitasTexto">Tem certeza?</p>
      <div class="popup-receitas-acoes" id="popupReceitasAcoes"></div>
    </div>
  `;

  document.body.appendChild(popup);
}

function abrirPopupReceitas({ icone = "i", titulo, texto, botoes }) {
  const popup = document.getElementById("popupReceitas");
  const popupIcone = document.getElementById("popupReceitasIcone");
  const popupTitulo = document.getElementById("popupReceitasTitulo");
  const popupTexto = document.getElementById("popupReceitasTexto");
  const popupAcoes = document.getElementById("popupReceitasAcoes");

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
      fecharPopupReceitas();

      if (typeof botao.acao === "function") {
        botao.acao();
      }
    });

    popupAcoes.appendChild(btn);
  });

  popup.style.display = "flex";
}

function fecharPopupReceitas() {
  const popup = document.getElementById("popupReceitas");

  if (popup) {
    popup.style.display = "none";
  }
}

function mostrarMensagemReceita(mensagem) {
  abrirPopupReceitas({
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

/* ================= USUÁRIO ================= */
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

/* ================= API BASE ================= */
function getTokenReceitas() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function headersReceitas(json = true) {
  const token = getTokenReceitas();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function lerRespostaReceitas(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extrairMensagemErroApi(data) {
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

async function apiReceitas(path, options = {}) {
  const token = getTokenReceitas();

  if (!token) {
    mostrarMensagemReceita("Sessão expirada. Faça login novamente.");
    return null;
  }

  const metodo = String(options.method || "GET").toUpperCase();
  const deveMostrarErro = metodo !== "GET";

  try {
    const response = await fetch(`${RECEITAS_API_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        ...headersReceitas(Boolean(options.body)),
        ...(options.headers || {})
      }
    });

    const data = await lerRespostaReceitas(response);

    if (response.status === 401 || response.status === 403) {
      if (deveMostrarErro) {
        mostrarMensagemReceita("Sua sessão expirou. Faça login novamente.");
      }

      return null;
    }

    if (!response.ok) {
      console.warn("Erro API receitas:", path, response.status, data);

      if (deveMostrarErro) {
        mostrarMensagemReceita(extrairMensagemErroApi(data));
      }

      return null;
    }

    return data?.data || data;
  } catch (erro) {
    console.error("Erro API receitas:", erro);

    if (deveMostrarErro) {
      mostrarMensagemReceita("Não foi possível conectar com a API.");
    }

    return null;
  }
}

/* ================= CATEGORIAS ================= */
async function buscarCategoriasReceitaApi() {
  const token = getTokenReceitas();

  if (!token) return [];

  try {
    const response = await fetch(`${RECEITAS_API_URL}/category/user`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await lerRespostaReceitas(response);

    if (!response.ok) {
      console.warn("Erro ao buscar categorias:", data);
      return [];
    }

    return transformarEmArrayReceitas(data?.data || data);
  } catch (erro) {
    console.warn("Erro ao buscar categorias:", erro);
    return [];
  }
}

function normalizarTextoReceita(texto) {
  return String(texto || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function buscarCategoryIdReceita(nomeCategoria) {
  if (!Array.isArray(categoriasReceitaCache) || categoriasReceitaCache.length === 0) {
    categoriasReceitaCache = await buscarCategoriasReceitaApi();
  }

  const categoriaEncontrada = categoriasReceitaCache.find((cat) => {
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

    return normalizarTextoReceita(nome) === normalizarTextoReceita(nomeCategoria);
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

  const chave = normalizarTextoReceita(nomeCategoria);
  const idFallback = CATEGORY_ID_RECEITA_FALLBACK[chave];

  if (idFallback) return Number(idFallback);

  return 1;
}

function pegarNomeCategoriaReceita(item) {
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

  if (idCategoria && CATEGORY_NAME_RECEITA_BY_ID[Number(idCategoria)]) {
    return CATEGORY_NAME_RECEITA_BY_ID[Number(idCategoria)];
  }

  return "Receita";
}

/* ================= TIPOS ================= */
function normalizarTipoReceita(tipo) {
  const texto = normalizarTextoReceita(tipo);

  if (texto.includes("vari")) return "variavel";
  if (texto.includes("sazon")) return "sazonal";
  return "fixa";
}

/* ================= PAYLOAD / CRUD ================= */
function montarPayloadReceita(dados, categoryId) {
  return {
    description: dados.descricao,
    categoryId: String(categoryId),
    value: Number(dados.valor || 0),
    dateInitial: dados.data,
    monthly: dados.tipo === "fixa" || dados.salvarTodoMes || dados.recorrente ? 1 : 0
  };
}

async function tentarEnviarReceitaApi(path, method, dados) {
  const categoryId = await buscarCategoryIdReceita(dados.categoria);

  const tentativas = [
    montarPayloadReceita(dados, categoryId)
  ];

  let ultimoErro = null;

  for (const body of tentativas) {
    try {
      console.log("Tentando salvar receita com body:", body);

      const response = await fetch(`${RECEITAS_API_URL}${path}`, {
        method,
        cache: "no-store",
        headers: headersReceitas(true),
        body: JSON.stringify(body)
      });

      const data = await lerRespostaReceitas(response);

      if (response.ok) {
        console.log("Receita salva com sucesso:", data);
        return data?.data || data;
      }

      ultimoErro = data;

      console.warn("Tentativa falhou:", response.status, data);

      if (response.status !== 422 && response.status !== 400) {
        break;
      }
    } catch (erro) {
      ultimoErro = erro;
      break;
    }
  }

  console.warn("Erro ao salvar receita:", ultimoErro);
  mostrarMensagemReceita(extrairMensagemErroApi(ultimoErro));
  return null;
}

async function carregarReceitasApi() {
  const mes = dataMesAtual.getMonth() + 1;
  const ano = dataMesAtual.getFullYear();

  const resposta = await apiReceitas(`/income/user?month=${mes}&year=${ano}`, {
    method: "GET"
  });

  const lista = transformarEmArrayReceitas(resposta);

  receitas = removerReceitasDuplicadas(
    lista.map(normalizarReceitaApi)
  );

  aplicarFiltros();
}

async function buscarReceitasMesApi(mes, ano) {
  const resposta = await apiReceitas(`/income/user?month=${mes}&year=${ano}`, {
    method: "GET"
  });

  return transformarEmArrayReceitas(resposta).map(normalizarReceitaApi);
}

function transformarEmArrayReceitas(resposta) {
  if (!resposta) return [];

  if (Array.isArray(resposta)) return resposta;

  if (Array.isArray(resposta.data)) return resposta.data;
  if (Array.isArray(resposta.items)) return resposta.items;
  if (Array.isArray(resposta.results)) return resposta.results;
  if (Array.isArray(resposta.incomes)) return resposta.incomes;
  if (Array.isArray(resposta.revenues)) return resposta.revenues;
  if (Array.isArray(resposta.receitas)) return resposta.receitas;
  if (Array.isArray(resposta.categories)) return resposta.categories;
  if (Array.isArray(resposta.categorias)) return resposta.categorias;

  if (resposta.data && typeof resposta.data === "object") {
    if (Array.isArray(resposta.data.items)) return resposta.data.items;
    if (Array.isArray(resposta.data.results)) return resposta.data.results;
    if (Array.isArray(resposta.data.incomes)) return resposta.data.incomes;
    if (Array.isArray(resposta.data.revenues)) return resposta.data.revenues;
    if (Array.isArray(resposta.data.receitas)) return resposta.data.receitas;
    if (Array.isArray(resposta.data.categories)) return resposta.data.categories;
    if (Array.isArray(resposta.data.categorias)) return resposta.data.categorias;
  }

  return [];
}

function normalizarReceitaApi(item) {
  const data = normalizarDataISO(
    item.dateInitial ||
    item.data ||
    item.date ||
    item.createdAt ||
    item.receivedAt ||
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
    item.monthly === 1 ||
    item.monthly === true ||
    item.tipo === "fixa" ||
    item.type === "fixa"
      ? "fixa"
      : (
          item.typeIncome?.name ||
          item.typeIncome?.description ||
          item.typeIncome ||
          item.tipoReceita ||
          item.type ||
          item.tipo ||
          "fixa"
        );

  return {
    id: item.id || item.incomeId || item.uuid,

    descricao:
      item.description ||
      item.descricao ||
      item.name ||
      item.nome ||
      item.title ||
      item.incomeName ||
      item.nameIncome ||
      item.descriptionIncome ||
      "Sem descrição",

    valor: Math.abs(valor || 0),
    data,
    dataFormatada: formatarData(data),
    categoria: pegarNomeCategoriaReceita(item),
    tipo: normalizarTipoReceita(tipo),
    origem: "api",
    monthly: item.monthly ?? null,

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

function criarReceitaVisual(dados, respostaApi = null) {
  const itemBase = respostaApi && typeof respostaApi === "object" ? respostaApi : {};

  return normalizarReceitaApi({
    ...itemBase,
    id: itemBase.id || itemBase.incomeId || `temp-${Date.now()}-${Math.random()}`,

    description:
      itemBase.description ||
      itemBase.descricao ||
      itemBase.name ||
      dados.descricao,

    value: itemBase.value ?? itemBase.amount ?? dados.valor,
    dateInitial: itemBase.dateInitial || itemBase.data || dados.data,

    category:
      itemBase.category ||
      itemBase.categoria ||
      dados.categoria,

    categoryId:
      itemBase.categoryId ||
      itemBase.category_id ||
      itemBase.idCategory,

    monthly:
      itemBase.monthly ??
      (dados.tipo === "fixa" || dados.salvarTodoMes || dados.recorrente ? 1 : 0),

    typeIncome:
      itemBase.typeIncome ||
      itemBase.typeIncomeId ||
      dados.tipo
  });
}

/* ================= EVITAR DUPLICAR FIXAS ================= */
function receitaEhIgual(a, b) {
  const dataA = normalizarDataISO(a.data || a.dateInitial || a.date);
  const dataB = normalizarDataISO(b.data || b.dateInitial || b.date);

  const valorA = Number(a.valor ?? a.value ?? a.amount ?? 0);
  const valorB = Number(b.valor ?? b.value ?? b.amount ?? 0);

  const categoriaA = normalizarTextoReceita(
    a.categoria ||
    a.category?.name ||
    a.category ||
    a.descriptionCategory ||
    pegarNomeCategoriaReceita(a)
  );

  const categoriaB = normalizarTextoReceita(
    b.categoria ||
    b.category?.name ||
    b.category ||
    b.descriptionCategory ||
    pegarNomeCategoriaReceita(b)
  );

  return (
    dataA === dataB &&
    categoriaA === categoriaB &&
    Math.abs(valorA - valorB) < 0.01
  );
}

function removerReceitasDuplicadas(lista) {
  const mapa = new Map();

  lista.forEach((receita) => {
    const data = normalizarDataISO(receita.data || receita.dateInitial || receita.date);
    const valor = Number(receita.valor ?? receita.value ?? receita.amount ?? 0).toFixed(2);

    const categoria = normalizarTextoReceita(
      receita.categoria ||
      receita.category?.name ||
      receita.category ||
      receita.descriptionCategory ||
      pegarNomeCategoriaReceita(receita)
    );

    const chave = `${data}|${categoria}|${valor}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, receita);
      return;
    }

    const atual = mapa.get(chave);

    const descricaoAtual = normalizarTextoReceita(atual.descricao);
    const descricaoNova = normalizarTextoReceita(receita.descricao);

    const atualRuim =
      !descricaoAtual ||
      descricaoAtual === "sem descricao" ||
      descricaoAtual === "sem descrição";

    const novaBoa =
      descricaoNova &&
      descricaoNova !== "sem descricao" &&
      descricaoNova !== "sem descrição";

    if (atualRuim && novaBoa) {
      mapa.set(chave, receita);
    }
  });

  return Array.from(mapa.values());
}

async function buscarReceitaFixaExistente(dadosReceita) {
  const data = converterData(dadosReceita.data);

  if (!data) return null;

  const mes = data.getMonth() + 1;
  const ano = data.getFullYear();

  const receitasDoMes = await buscarReceitasMesApi(mes, ano);

  const existente = receitasDoMes.find((receita) => {
    return receitaEhIgual(receita, dadosReceita);
  });

  return existente || null;
}

function inserirReceitaNaTelaSeNaoExiste(receita) {
  if (!receita || !receita.data) return;

  if (pegarAnoMes(receita.data) !== filtros.data) return;

  const jaExistePorId = receitas.some((item) => {
    return String(item.id) === String(receita.id);
  });

  if (jaExistePorId) return;

  const jaExistePorDados = receitas.some((item) => {
    return receitaEhIgual(item, receita);
  });

  if (jaExistePorDados) return;

  receitas.push(receita);

  receitas = removerReceitasDuplicadas(receitas);
}

/* ================= FAMÍLIA / AUTOR ================= */
async function usuarioEstaEmFamiliaReceitas() {
  const token = getTokenReceitas();

  if (!token) return false;

  try {
    const resposta = await fetch(`${RECEITAS_API_URL}/family`, {
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
  } catch {
    return false;
  }
}

function getEmailUsuarioAtualReceita() {
  return (
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    ""
  ).toLowerCase().trim();
}

function getUserKeyReceita(email = null) {
  const emailFinal = email || getEmailUsuarioAtualReceita();
  return `fambudget_${String(emailFinal || "usuario").toLowerCase().trim()}`;
}

function buscarDadoUsuarioReceita(chave, email = null) {
  const userKey = getUserKeyReceita(email);
  return localStorage.getItem(`${userKey}_${chave}`) || "";
}

function getNicknameUsuarioAtualReceita() {
  const email = getEmailUsuarioAtualReceita();

  return (
    buscarDadoUsuarioReceita("nicknameUsuario", email) ||
    buscarDadoUsuarioReceita("nomeUsuario", email) ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário"
  );
}

function buscarNicknamePorEmailReceita(email) {
  if (!email) return "";

  return (
    buscarDadoUsuarioReceita("nicknameUsuario", email) ||
    buscarDadoUsuarioReceita("nomeUsuario", email) ||
    ""
  );
}

function pegarNomeAutorReceita(receita) {
  const emailAutor =
    receita.autorEmail ||
    receita.userEmail ||
    receita.emailUsuario ||
    receita.createdByEmail ||
    receita.created_by_email ||
    receita.createdBy?.email ||
    receita.user?.email ||
    receita.usuario?.email ||
    "";

  const nicknameSalvo = buscarNicknamePorEmailReceita(emailAutor);

  return (
    nicknameSalvo ||
    receita.autorNickname ||
    receita.nicknameUsuario ||
    receita.nomeUsuario ||
    receita.createdByNickname ||
    receita.createdByName ||
    receita.createdBy?.nickname ||
    receita.createdBy?.name ||
    receita.user?.nickname ||
    receita.user?.name ||
    receita.usuario?.nickname ||
    receita.usuario?.nome ||
    getNicknameUsuarioAtualReceita()
  );
}

function atualizarCabecalhoUsuarioReceitas() {
  if (!tabela) return;

  const tabelaCompleta = tabela.closest("table");
  if (!tabelaCompleta) return;

  const linhaCabecalho = tabelaCompleta.querySelector("thead tr");
  if (!linhaCabecalho) return;

  const thUsuarioExistente = linhaCabecalho.querySelector("[data-coluna-usuario='receitas']");

  if (mostrarUsuarioReceita) {
    if (!thUsuarioExistente) {
      const thValor =
        linhaCabecalho.querySelector(".valor-coluna") ||
        linhaCabecalho.lastElementChild;

      const thUsuario = document.createElement("th");
      thUsuario.textContent = "Usuário";
      thUsuario.setAttribute("data-coluna-usuario", "receitas");

      if (thValor) {
        linhaCabecalho.insertBefore(thUsuario, thValor);
      } else {
        linhaCabecalho.appendChild(thUsuario);
      }
    }
  } else if (thUsuarioExistente) {
    thUsuarioExistente.remove();
  }
}

/* ================= EVENTOS ================= */
function configurarEventos() {
  if (btnNova) {
    btnNova.addEventListener("click", abrirModalReceita);
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", fecharModalReceita);
  }

  if (btnSalvar) {
    btnSalvar.addEventListener("click", salvarReceita);
  }

  if (inputValor) {
    inputValor.addEventListener("input", () => {
      formatarMoedaInput(inputValor);
    });
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

  if (tabela) {
    tabela.addEventListener("click", (e) => {
      const btnEditar = e.target.closest(".btn-editar-receita");
      const btnExcluir = e.target.closest(".btn-excluir-receita");

      if (btnEditar) {
        confirmarEditarReceita(btnEditar.dataset.id);
        return;
      }

      if (btnExcluir) {
        confirmarExcluirReceita(btnExcluir.dataset.id);
      }
    });
  }

  configurarCategoria();
  configurarFiltros();
  configurarMenu();

  document.addEventListener("click", (e) => {
    if (
      dropdownCategoriaModal &&
      selectCategoria &&
      !selectCategoria.contains(e.target)
    ) {
      dropdownCategoriaModal.style.display = "none";
    }

    if (
      dropdownTipo &&
      filtroTipo &&
      !filtroTipo.contains(e.target)
    ) {
      dropdownTipo.style.display = "none";
    }
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      fecharModalReceita();
    }
  });
}

function configurarMenu() {
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

/* ================= MODAL ================= */
function abrirModalReceita() {
  modoEdicaoReceita = false;
  idReceitaEditando = null;

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar";
  }

  if (modal) {
    modal.style.display = "flex";
  }
}

function abrirModalReceitaEdicao() {
  if (btnSalvar) {
    btnSalvar.textContent = "Atualizar";
  }

  if (modal) {
    modal.style.display = "flex";
  }
}

function fecharModalReceita() {
  if (modal) {
    modal.style.display = "none";
  }

  limparCampos();

  modoEdicaoReceita = false;
  idReceitaEditando = null;

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

/* ================= CATEGORIA ================= */
function configurarCategoria() {
  if (!selectCategoria || !dropdownCategoriaModal || !textoSelecionado) return;

  selectCategoria.addEventListener("click", (e) => {
    e.stopPropagation();

    dropdownCategoriaModal.style.display =
      dropdownCategoriaModal.style.display === "block" ? "none" : "block";
  });

  document.querySelectorAll(".item-categoria").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();

      selecionarCategoriaReceita(item);
      dropdownCategoriaModal.style.display = "none";
    });
  });
}

function selecionarCategoriaReceita(item) {
  const nome = item.getAttribute("data-categoria");

  textoSelecionado.textContent = nome;
  textoSelecionado.className = "";

  item.classList.forEach((classe) => {
    if (classe.startsWith("cat-")) {
      textoSelecionado.classList.add(classe);
    }
  });

  document.querySelectorAll(".item-categoria").forEach((opcao) => {
    opcao.classList.remove("ativo");
  });

  item.classList.add("ativo");
}

function selecionarCategoriaPorNome(nomeCategoria) {
  if (!textoSelecionado) return;

  textoSelecionado.textContent = nomeCategoria || "Selecione uma categoria";
  textoSelecionado.className = "";

  document.querySelectorAll(".item-categoria").forEach((item) => {
    item.classList.remove("ativo");

    if (item.getAttribute("data-categoria") === nomeCategoria) {
      item.classList.add("ativo");

      item.classList.forEach((classe) => {
        if (classe.startsWith("cat-")) {
          textoSelecionado.classList.add(classe);
        }
      });
    }
  });
}

/* ================= FILTROS ================= */
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
}

/* ================= MÊS ================= */
function configurarControleMes() {
  if (btnMesAnterior) {
    btnMesAnterior.addEventListener("click", async () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() - 1);
      filtros.data = pegarAnoMesData(dataMesAtual);
      atualizarTextoMes();
      await carregarReceitasApi();
    });
  }

  if (btnProximoMes) {
    btnProximoMes.addEventListener("click", async () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() + 1);
      filtros.data = pegarAnoMesData(dataMesAtual);
      atualizarTextoMes();
      await carregarReceitasApi();
    });
  }
}

function atualizarTextoMes() {
  if (!textoMesAtual) return;

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  textoMesAtual.textContent = `${meses[dataMesAtual.getMonth()]} ${dataMesAtual.getFullYear()}`;
}

function pegarAnoMesData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

/* ================= SALVAR / EDITAR ================= */
async function salvarReceita() {
  if (modoEdicaoReceita) {
    await atualizarReceitaEditada();
    return;
  }

  const descricao = inputDesc.value.trim();
  const valor = converterMoedaParaNumero(inputValor.value);
  const data = inputData?.value || "";
  const categoria = textoSelecionado.textContent;

  let tipo =
    document.querySelector('input[name="tipoReceita"]:checked')?.value ||
    "fixa";

  const salvarTodoMes = checkMensal?.checked || false;

  if (
    !descricao ||
    valor <= 0 ||
    !data ||
    categoria === "Selecione uma categoria"
  ) {
    mostrarMensagemReceita("Preencha todos os campos corretamente!");
    return;
  }

  const deveRepetirTodoMes = tipo === "fixa" || salvarTodoMes;

  btnSalvar.disabled = true;
  const textoOriginalBotao = btnSalvar.textContent;
  btnSalvar.textContent = "Salvando...";

  try {
    const receitasCriadas = [];

    if (deveRepetirTodoMes) {
      tipo = "fixa";

      for (let i = 0; i < QUANTIDADE_MESES_RECEITA_FIXA; i++) {
        const dataMensal = adicionarMeses(data, i);

        const dadosReceita = {
          descricao,
          valor,
          data: dataMensal,
          categoria,
          tipo,
          recorrente: true,
          salvarTodoMes: true
        };

        const existente = await buscarReceitaFixaExistente(dadosReceita);

        if (existente) {
          receitasCriadas.push(existente);
          continue;
        }

        const criado = await tentarEnviarReceitaApi("/income", "POST", dadosReceita);

        if (!criado) return;

        receitasCriadas.push(criarReceitaVisual(dadosReceita, criado));
      }
    } else {
      const dadosReceita = {
        descricao,
        valor,
        data,
        categoria,
        tipo,
        recorrente: false,
        salvarTodoMes: false
      };

      const criado = await tentarEnviarReceitaApi("/income", "POST", dadosReceita);

      if (!criado) return;

      receitasCriadas.push(criarReceitaVisual(dadosReceita, criado));
    }

    receitasCriadas.forEach((receita) => {
      inserirReceitaNaTelaSeNaoExiste(receita);
    });

    aplicarFiltros();
    fecharModalReceita();

    if (typeof carregarDadosFinanceiros === "function") {
      carregarDadosFinanceiros();
    }

    setTimeout(() => {
      carregarReceitasApi();
    }, 600);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = textoOriginalBotao || "Salvar";
  }
}

async function atualizarReceitaEditada() {
  const receitaOriginal = receitas.find((receita) => {
    return String(receita.id) === String(idReceitaEditando);
  });

  if (!receitaOriginal) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  const descricao = inputDesc.value.trim();
  const valor = converterMoedaParaNumero(inputValor.value);
  const data = inputData?.value || "";
  const categoria = textoSelecionado.textContent;

  const tipo =
    document.querySelector('input[name="tipoReceita"]:checked')?.value ||
    "fixa";

  if (
    !descricao ||
    valor <= 0 ||
    !data ||
    categoria === "Selecione uma categoria"
  ) {
    mostrarMensagemReceita("Preencha todos os campos corretamente!");
    return;
  }

  btnSalvar.disabled = true;
  const textoOriginalBotao = btnSalvar.textContent;
  btnSalvar.textContent = "Atualizando...";

  try {
    const dadosReceita = {
      descricao,
      valor,
      data,
      categoria,
      tipo
    };

    const atualizado = await tentarEnviarReceitaApi(`/income/${idReceitaEditando}`, "PUT", dadosReceita);

    if (!atualizado) return;

    receitas = receitas.map((receita) => {
      if (String(receita.id) !== String(idReceitaEditando)) {
        return receita;
      }

      return criarReceitaVisual(
        {
          ...dadosReceita,
          data
        },
        {
          ...atualizado,
          id: idReceitaEditando
        }
      );
    });

    receitas = removerReceitasDuplicadas(receitas);

    aplicarFiltros();
    fecharModalReceita();

    if (typeof carregarDadosFinanceiros === "function") {
      carregarDadosFinanceiros();
    }

    mostrarMensagemReceita("Receita atualizada com sucesso!");
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = textoOriginalBotao || "Atualizar";
  }
}

/* ================= EXCLUIR RECEITA FIXA ================= */
function confirmarExcluirReceita(id) {
  const receita = receitas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  const ehFixa =
    receita.tipo === "fixa" ||
    receita.monthly === 1 ||
    receita.monthly === true ||
    normalizarTextoReceita(receita.tipo).includes("fixa");

  if (ehFixa) {
    abrirPopupReceitas({
      icone: "!",
      titulo: "Excluir receita fixa",
      texto: "Essa receita é fixa. Deseja excluir apenas este mês ou todos os meses dessa receita fixa?",
      botoes: [
        {
          texto: "Cancelar",
          classe: "popup-btn-cancelar"
        },
        {
          texto: "Apenas este mês",
          classe: "popup-btn-secundario",
          acao: () => excluirReceita(id, "unico")
        },
        {
          texto: "Todos os meses",
          classe: "popup-btn-perigo",
          acao: () => excluirReceita(id, "todos")
        }
      ]
    });

    return;
  }

  abrirPopupReceitas({
    icone: "!",
    titulo: "Excluir receita",
    texto: "Tem certeza que deseja excluir esta receita? Essa ação não poderá ser desfeita.",
    botoes: [
      {
        texto: "Cancelar",
        classe: "popup-btn-cancelar"
      },
      {
        texto: "Excluir",
        classe: "popup-btn-perigo",
        acao: () => excluirReceita(id, "unico")
      }
    ]
  });
}

async function excluirReceita(id, escopo = "unico") {
  const receita = receitas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  if (escopo === "todos") {
    await excluirTodasReceitasFixas(receita);
    return;
  }

  const excluido = await apiReceitas(`/income/${id}`, {
    method: "DELETE"
  });

  if (excluido === null) return;

  receitas = receitas.filter((item) => {
    return String(item.id) !== String(id);
  });

  receitas = removerReceitasDuplicadas(receitas);

  aplicarFiltros();

  if (typeof carregarDadosFinanceiros === "function") {
    carregarDadosFinanceiros();
  }

  mostrarMensagemReceita("Receita excluída com sucesso!");
}

function descricaoReceitaBoa(receita) {
  const descricao = normalizarTextoReceita(
    receita.descricao ||
    receita.name ||
    receita.description ||
    receita.incomeName ||
    receita.descriptionIncome ||
    ""
  );

  return (
    descricao &&
    descricao !== "sem descricao" &&
    descricao !== "sem descrição"
  );
}

function receitasSaoMesmoGrupoFixo(receitaBase, receitaComparada) {
  const valorBase = Number(
    receitaBase.valor ??
    receitaBase.value ??
    receitaBase.amount ??
    0
  );

  const valorComparada = Number(
    receitaComparada.valor ??
    receitaComparada.value ??
    receitaComparada.amount ??
    0
  );

  const categoriaBase = normalizarTextoReceita(
    receitaBase.categoria ||
    receitaBase.category?.name ||
    receitaBase.category ||
    receitaBase.descriptionCategory ||
    pegarNomeCategoriaReceita(receitaBase)
  );

  const categoriaComparada = normalizarTextoReceita(
    receitaComparada.categoria ||
    receitaComparada.category?.name ||
    receitaComparada.category ||
    receitaComparada.descriptionCategory ||
    pegarNomeCategoriaReceita(receitaComparada)
  );

  const mesmoValor = Math.abs(valorBase - valorComparada) < 0.01;
  const mesmaCategoria = categoriaBase === categoriaComparada;

  const baseTemDescricaoBoa = descricaoReceitaBoa(receitaBase);
  const comparadaTemDescricaoBoa = descricaoReceitaBoa(receitaComparada);

  if (baseTemDescricaoBoa && comparadaTemDescricaoBoa) {
    const descricaoBase = normalizarTextoReceita(receitaBase.descricao);
    const descricaoComparada = normalizarTextoReceita(receitaComparada.descricao);

    return (
      descricaoBase === descricaoComparada &&
      mesmaCategoria &&
      mesmoValor
    );
  }

  return mesmaCategoria && mesmoValor;
}

async function buscarReceitasFixasDoGrupo(receitaBase) {
  const dataBase = converterData(receitaBase.data);

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

    const receitasMes = await buscarReceitasMesApi(mes, ano);

    receitasMes.forEach((receita) => {
      const ehMesmoGrupo = receitasSaoMesmoGrupoFixo(receitaBase, receita);

      if (ehMesmoGrupo && receita.id) {
        todas.push(receita);
      }
    });
  }

  const mapa = new Map();

  todas.forEach((receita) => {
    if (!mapa.has(String(receita.id))) {
      mapa.set(String(receita.id), receita);
    }
  });

  return Array.from(mapa.values());
}

async function excluirTodasReceitasFixas(receitaBase) {
  const receitasParaExcluir = await buscarReceitasFixasDoGrupo(receitaBase);

  if (receitasParaExcluir.length === 0) {
    mostrarMensagemReceita("Não encontrei outras receitas fixas para excluir.");
    return;
  }

  let excluidas = 0;
  let falhas = 0;

  for (const receita of receitasParaExcluir) {
    const resultado = await apiReceitas(`/income/${receita.id}`, {
      method: "DELETE"
    });

    if (resultado === null) {
      falhas++;
    } else {
      excluidas++;
    }
  }

  receitas = receitas.filter((receitaAtual) => {
    return !receitasParaExcluir.some((receitaExcluida) => {
      return String(receitaExcluida.id) === String(receitaAtual.id);
    });
  });

  receitas = removerReceitasDuplicadas(receitas);

  aplicarFiltros();

  if (typeof carregarDadosFinanceiros === "function") {
    carregarDadosFinanceiros();
  }

  if (falhas > 0) {
    mostrarMensagemReceita(
      `Algumas receitas foram excluídas, mas ${falhas} não puderam ser removidas pela API.`
    );
    return;
  }

  mostrarMensagemReceita(
    `${excluidas} receita(s) fixa(s) excluída(s) com sucesso!`
  );
}

/* ================= AÇÕES EDITAR ================= */
function confirmarEditarReceita(id) {
  const receita = receitas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  abrirPopupReceitas({
    icone: "i",
    titulo: "Editar receita",
    texto: "Deseja mesmo editar esta receita?",
    botoes: [
      {
        texto: "Cancelar",
        classe: "popup-btn-cancelar"
      },
      {
        texto: "Editar",
        classe: "popup-btn-confirmar",
        acao: () => prepararEdicaoReceita(id)
      }
    ]
  });
}

function prepararEdicaoReceita(id) {
  const receita = receitas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  modoEdicaoReceita = true;
  idReceitaEditando = id;

  if (inputDesc) inputDesc.value = receita.descricao || "";
  if (inputValor) inputValor.value = formatarMoeda(receita.valor);
  if (inputData) inputData.value = normalizarDataISO(receita.data);
  if (checkMensal) checkMensal.checked = false;

  selecionarCategoriaPorNome(receita.categoria);

  const radioTipo = document.querySelector(
    `input[name="tipoReceita"][value="${receita.tipo || "fixa"}"]`
  );

  if (radioTipo) {
    radioTipo.checked = true;
  }

  abrirModalReceitaEdicao();
}

/* ================= FILTRO / RENDER ================= */
function aplicarFiltros() {
  const receitasSemDuplicar = removerReceitasDuplicadas(receitas);

  const lista = receitasSemDuplicar.filter((receita) => {
    if (filtros.busca) {
      const texto = filtros.busca;

      const descricao = String(receita.descricao || "").toLowerCase();
      const categoria = String(receita.categoria || "").toLowerCase();
      const autor = String(pegarNomeAutorReceita(receita) || "").toLowerCase();

      if (
        !descricao.includes(texto) &&
        !categoria.includes(texto) &&
        !autor.includes(texto)
      ) {
        return false;
      }
    }

    if (filtros.tipo && receita.tipo !== filtros.tipo) {
      return false;
    }

    if (filtros.data) {
      const mesAnoReceita = pegarAnoMes(receita.data);

      if (mesAnoReceita !== filtros.data) {
        return false;
      }
    }

    return true;
  });

  renderizarReceitas(lista);
}

function renderizarReceitas(lista = receitas) {
  if (!tabela) return;

  tabela.innerHTML = "";
  atualizarCabecalhoUsuarioReceitas();

  if (lista.length === 0) {
    if (semDados) semDados.style.display = "block";
  } else {
    if (semDados) semDados.style.display = "none";
  }

  lista.forEach((receita) => {
    const tr = document.createElement("tr");

    const colunaUsuario = mostrarUsuarioReceita
      ? `<td class="usuario-receita">${pegarNomeAutorReceita(receita)}</td>`
      : "";

    tr.innerHTML = `
      <td>${receita.dataFormatada || formatarData(receita.data)}</td>
      <td>${receita.descricao}</td>
      <td>${receita.categoria}</td>
      <td>${formatarTipoReceita(receita.tipo)}</td>
      ${colunaUsuario}
      <td class="valor positivo">${formatarMoeda(receita.valor)}</td>
      <td>
        <div class="acoes-receita">
          <button 
            type="button" 
            class="btn-acao-receita btn-editar-receita" 
            title="Editar"
            data-id="${receita.id}"
          >
            <img src="imagem/iconConfig/lapis.png" alt="Editar">
          </button>

          <button 
            type="button" 
            class="btn-acao-receita btn-excluir-receita" 
            title="Excluir"
            data-id="${receita.id}"
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

function atualizarTotais(lista = receitas) {
  const listaSemDuplicar = removerReceitasDuplicadas(lista);

  const total = listaSemDuplicar.reduce((soma, receita) => {
    return soma + Number(receita.valor || 0);
  }, 0);

  if (totalReceitas) totalReceitas.textContent = formatarMoeda(total);
  if (totalEntradas) totalEntradas.textContent = formatarMoeda(total);
}

/* ================= UTILS ================= */
function limparCampos() {
  if (inputDesc) inputDesc.value = "";
  if (inputValor) inputValor.value = "";
  if (inputData) inputData.value = "";
  if (checkMensal) checkMensal.checked = false;

  if (textoSelecionado) {
    textoSelecionado.textContent = "Selecione uma categoria";
    textoSelecionado.className = "select-categorias";
  }

  document.querySelectorAll(".item-categoria").forEach((opcao) => {
    opcao.classList.remove("ativo");
  });

  const tipoFixa = document.querySelector(
    'input[name="tipoReceita"][value="fixa"]'
  );

  if (tipoFixa) {
    tipoFixa.checked = true;
  }
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

function formatarTipoReceita(tipo) {
  const tipos = {
    fixa: "Fixa",
    variavel: "Variável",
    sazonal: "Sazonal"
  };

  return tipos[tipo] || tipo;
}

function obterMoedaReceitas() {
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
  let valor = String(input.value || "").replace(/\D/g, "");

  if (!valor) {
    input.value = "";
    return;
  }

  const numero = Number(valor) / 100;

  try {
    input.value = numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaReceitas()
    });
  } catch {
    input.value = numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  input.setSelectionRange(input.value.length, input.value.length);
}

function converterMoedaParaNumero(valor) {
  if (!valor) return 0;

  const somenteNumeros = String(valor).replace(/\D/g, "");

  if (!somenteNumeros) return 0;

  return Number(somenteNumeros) / 100;
}

function formatarMoeda(valor) {
  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaReceitas()
    });
  } catch {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}