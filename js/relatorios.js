console.log("RELATORIOS.JS OK - CATEGORIAS ATUALIZADAS");

const RELATORIOS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

const MESES_RELATORIOS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
];

const CORES_CATEGORIAS = {
  "alimentacao": "#2e7d32",
  "transporte": "#3b82f6",
  "moradia": "#4B2B0A",
  "lazer": "#f59e0b",
  "saude": "#06b6d4",
  "cartao de credito": "#7c3aed",
  "cartao de debito": "#eab308",
  "contas pessoais": "#92400e",
  "outros": "#6b7280"
};

const CATEGORIAS_FIXAS_RELATORIOS = [
  "Alimentação",
  "Transporte",
  "Lazer",
  "Moradia",
  "Saúde",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Outros"
];

const CATEGORY_NAME_BY_ID_RELATORIOS = {
  1: "Alimentação",
  2: "Transporte",
  3: "Lazer",
  4: "Moradia",
  5: "Saúde",
  6: "Cartão de Crédito",
  7: "Cartão de Débito",
  8: "Outros"
};

let receitasGlobaisRelatorios = [];
let despesasGlobaisRelatorios = [];

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  configurarMenu();
  configurarEventos();

  await carregarRelatorios();
});

/* =========================
   TOKEN / AUTH
========================= */

function getTokenRelatorios() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (
    !token ||
    token === "undefined" ||
    token === "null" ||
    token === "[object Object]"
  ) {
    return null;
  }

  return token;
}

function headersRelatorios(extraHeaders = {}) {
  const token = getTokenRelatorios();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders
  };
}

async function lerRespostaRelatorios(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  if (
    contentType.includes("application/pdf") ||
    contentType.includes("application/octet-stream")
  ) {
    return await response.blob();
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extrairMensagemErroRelatorios(
  data,
  mensagemPadrao = "Erro ao carregar dados dos relatórios."
) {
  if (!data) return mensagemPadrao;

  if (typeof data === "string") {
    return data || mensagemPadrao;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item.msg || item.message || JSON.stringify(item))
      .join("\n");
  }

  return (
    data.message ||
    data.detail ||
    data.error ||
    data.msg ||
    mensagemPadrao
  );
}

async function tentarRenovarTokenRelatorios() {
  if (typeof window.renovarToken !== "function") {
    return false;
  }

  try {
    return await window.renovarToken();
  } catch (erro) {
    console.error("Erro ao renovar token em relatórios:", erro);
    return false;
  }
}

function redirecionarLoginRelatorios() {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("refreshToken");

  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");

  window.location.href = "index.html";
}

/* =========================
   FETCH API
========================= */

async function apiFetchRelatorios(path, options = {}, tentarRenovar = true) {
  const metodo = options.method || "GET";

  try {
    const response = await fetch(`${RELATORIOS_API_URL}${path}`, {
      ...options,
      method: metodo,
      headers: headersRelatorios(options.headers || {})
    });

    const data = await lerRespostaRelatorios(response);

    if (response.status === 401 && tentarRenovar) {
      console.warn("Token expirado em relatórios. Tentando renovar...");

      const renovou = await tentarRenovarTokenRelatorios();

      if (renovou) {
        return await apiFetchRelatorios(path, options, false);
      }

      redirecionarLoginRelatorios();
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    if (!response.ok) {
      const mensagem = extrairMensagemErroRelatorios(data);
      throw new Error(mensagem);
    }

    return data;

  } catch (erro) {
    console.error(`Erro na requisição ${metodo} ${path}:`, erro);

    if (
      erro instanceof TypeError ||
      String(erro.message || "").includes("Failed to fetch") ||
      String(erro.message || "").includes("NetworkError")
    ) {
      throw new Error(
        "Não foi possível conectar com a API. Se o console mostrar erro de CORS, o servidor precisa liberar o endereço do site."
      );
    }

    throw erro;
  }
}

/* =========================
   POPUP
========================= */

function mostrarPopupRelatorios(titulo, mensagem) {
  let popup = document.getElementById("popup-relatorios");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popup-relatorios";

    popup.innerHTML = `
      <div class="popup-relatorios-card">
        <div class="popup-relatorios-icon">i</div>
        <h2 id="popup-relatorios-titulo">Aviso</h2>
        <p id="popup-relatorios-texto">Mensagem</p>
        <button type="button" id="popup-relatorios-ok">OK</button>
      </div>
    `;

    document.body.appendChild(popup);

    const style = document.createElement("style");
    style.textContent = `
      #popup-relatorios {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(3px);
        z-index: 99999;
        padding: 20px;
      }

      .popup-relatorios-card {
        width: min(440px, 100%);
        background: #ffffff;
        border-radius: 18px;
        padding: 30px 26px;
        text-align: center;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
      }

      .popup-relatorios-icon {
        width: 58px;
        height: 58px;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: #fee2e2;
        color: #dc2626;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        font-weight: 800;
      }

      #popup-relatorios-titulo {
        margin: 0 0 10px;
        font-size: 22px;
        color: #111827;
      }

      #popup-relatorios-texto {
        margin: 0 0 22px;
        color: #6b7280;
        font-size: 15px;
        line-height: 1.6;
        white-space: pre-line;
      }

      #popup-relatorios-ok {
        border: 0;
        background: #2e7d32;
        color: #ffffff;
        padding: 12px 28px;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
      }

      #popup-relatorios-ok:hover {
        filter: brightness(0.95);
      }
    `;

    document.head.appendChild(style);

    document.getElementById("popup-relatorios-ok").addEventListener("click", () => {
      popup.style.display = "none";
    });
  }

  const tituloEl = document.getElementById("popup-relatorios-titulo");
  const textoEl = document.getElementById("popup-relatorios-texto");

  if (tituloEl) tituloEl.textContent = titulo || "Aviso";
  if (textoEl) textoEl.textContent = mensagem || "Ocorreu um erro.";

  popup.style.display = "flex";
}

/* =========================
   USUÁRIO
========================= */

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

/* =========================
   MENU
========================= */

function configurarMenu() {
  document.querySelectorAll(".menu li[data-link]").forEach((item) => {
    item.addEventListener("click", () => {
      const link = item.getAttribute("data-link");

      if (link) {
        window.location.href = link;
      }
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

/* =========================
   EVENTOS
========================= */

function configurarEventos() {
  const filtroPeriodo = document.getElementById("filtro-periodo");

  if (filtroPeriodo) {
    preencherFiltroComMeses();

    filtroPeriodo.addEventListener("change", async () => {
      await carregarRelatorios();
    });
  }

  const btnExportarPdf = document.getElementById("btn-exportar-pdf");
  const btnExportarCsv = document.getElementById("btn-exportar-csv");

  if (btnExportarPdf) {
    btnExportarPdf.addEventListener("click", exportarPdf);
  }

  if (btnExportarCsv) {
    btnExportarCsv.addEventListener("click", exportarCsv);
  }
}

function preencherFiltroComMeses() {
  const filtro = document.getElementById("filtro-periodo");
  if (!filtro) return;

  const hoje = new Date();
  let options = "";

  for (let i = 0; i < 12; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ano = data.getFullYear();
    const mes = data.getMonth() + 1;

    const value = `${ano}-${String(mes).padStart(2, "0")}`;

    const label = data.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    });

    const labelFormatado = label.charAt(0).toUpperCase() + label.slice(1);

    options += `
      <option value="${value}">
        ${labelFormatado}
      </option>
    `;
  }

  filtro.innerHTML = options;
}

/* =========================
   CARREGAR RELATÓRIOS
========================= */

async function carregarRelatorios() {
  try {
    const periodoSelecionado = obterPeriodoSelecionado();

    console.log("PERÍODO SELECIONADO:", periodoSelecionado);

    const [receitasApi, despesasApi] = await Promise.all([
      buscarReceitas(periodoSelecionado),
      buscarDespesas(periodoSelecionado)
    ]);

    console.log("RECEITAS API:", receitasApi);
    console.log("DESPESAS API:", despesasApi);

    const receitasMes = normalizarLista(receitasApi).map((item) => {
      return normalizarTransacao(item, "receita");
    });

    const despesasMes = normalizarLista(despesasApi).map((item) => {
      return normalizarTransacao(item, "despesa");
    });

    console.log("RECEITAS NORMALIZADAS:", receitasMes);
    console.log("DESPESAS NORMALIZADAS:", despesasMes);

    receitasGlobaisRelatorios = receitasMes;
    despesasGlobaisRelatorios = despesasMes;

    const dadosGrafico = await carregarDadosGraficoUltimosSeisMeses(periodoSelecionado);

    atualizarTelaRelatorios(
      receitasMes,
      despesasMes,
      dadosGrafico.receitas,
      dadosGrafico.despesas
    );

  } catch (error) {
    console.error("Erro nos relatórios:", error);

    mostrarPopupRelatorios(
      "Aviso",
      `${error.message}\n\nOs relatórios serão carregados com os dados locais, se existirem.`
    );

    carregarRelatoriosFallback();
  }
}

async function buscarReceitas(periodo = obterPeriodoSelecionado()) {
  const month = periodo.mes + 1;
  const year = periodo.ano;

  return await apiFetchRelatorios(`/income/user?month=${month}&year=${year}`, {
    method: "GET"
  });
}

async function buscarDespesas(periodo = obterPeriodoSelecionado()) {
  const month = periodo.mes + 1;
  const year = periodo.ano;

  return await apiFetchRelatorios(`/expense/user?month=${month}&year=${year}`, {
    method: "GET"
  });
}

async function carregarDadosGraficoUltimosSeisMeses(periodoSelecionado) {
  const meses = gerarUltimosSeisMeses(periodoSelecionado.ano, periodoSelecionado.mes);

  const receitas = [];
  const despesas = [];

  for (const periodo of meses) {
    try {
      const [receitasApi, despesasApi] = await Promise.all([
        buscarReceitas(periodo),
        buscarDespesas(periodo)
      ]);

      const receitasMes = normalizarLista(receitasApi).map((item) => {
        return normalizarTransacao(item, "receita");
      });

      const despesasMes = normalizarLista(despesasApi).map((item) => {
        return normalizarTransacao(item, "despesa");
      });

      receitas.push(...receitasMes);
      despesas.push(...despesasMes);

    } catch (erro) {
      console.warn("Não foi possível carregar dados do mês:", periodo, erro);
    }
  }

  return {
    receitas,
    despesas
  };
}

function atualizarTelaRelatorios(receitasMes, despesasMes, receitasGrafico, despesasGrafico) {
  const totalReceitas = somarValores(receitasMes);
  const totalDespesas = somarValores(despesasMes);
  const saldo = totalReceitas - totalDespesas;

  atualizarCards(totalReceitas, totalDespesas, saldo);
  renderizarGraficoBarras(receitasGrafico, despesasGrafico);

  /*
    Agora o bloco "Despesas por categoria" segue o mesmo padrão
    da tela Categorias:
    - mostra todas as categorias;
    - separa por categoria corretamente;
    - calcula porcentagem com base no total de receitas do mês.
  */
  renderizarGraficoRosca(despesasMes, totalReceitas);

  renderizarResumoMes(
    receitasMes,
    despesasMes,
    totalReceitas,
    totalDespesas,
    saldo
  );
}

/* =========================
   FALLBACK LOCALSTORAGE
========================= */

function carregarRelatoriosFallback() {
  const transacoes = [
    ...lerStorage("transacoes", localStorage),
    ...lerStorage("transacoes", sessionStorage)
  ].map((item) => normalizarTransacao(item));

  const periodoSelecionado = obterPeriodoSelecionado();

  const receitas = transacoes.filter((item) => item.tipo === "receita");
  const despesas = transacoes.filter((item) => item.tipo === "despesa");

  const receitasMes = filtrarPorPeriodo(receitas, periodoSelecionado);
  const despesasMes = filtrarPorPeriodo(despesas, periodoSelecionado);

  atualizarTelaRelatorios(receitasMes, despesasMes, receitas, despesas);
}

function lerStorage(chave, storage) {
  try {
    const dados = storage.getItem(chave);

    if (!dados) return [];

    const parseado = JSON.parse(dados);

    if (Array.isArray(parseado)) return parseado;
    if (parseado && Array.isArray(parseado.data)) return parseado.data;
    if (parseado && Array.isArray(parseado.items)) return parseado.items;
    if (parseado && Array.isArray(parseado.content)) return parseado.content;
    if (parseado && Array.isArray(parseado.transacoes)) return parseado.transacoes;

    return [];
  } catch {
    return [];
  }
}

/* =========================
   NORMALIZAÇÃO
========================= */

function normalizarLista(dados) {
  if (Array.isArray(dados)) return dados;

  if (dados && Array.isArray(dados.data)) return dados.data;
  if (dados && Array.isArray(dados.items)) return dados.items;
  if (dados && Array.isArray(dados.content)) return dados.content;
  if (dados && Array.isArray(dados.incomes)) return dados.incomes;
  if (dados && Array.isArray(dados.expenses)) return dados.expenses;
  if (dados && Array.isArray(dados.revenues)) return dados.revenues;
  if (dados && Array.isArray(dados.revenves)) return dados.revenves;
  if (dados && Array.isArray(dados.result)) return dados.result;
  if (dados && Array.isArray(dados.results)) return dados.results;

  return [];
}

function pegarTextoCampoRelatorios(campo) {
  if (!campo) return "";

  if (typeof campo === "string") return campo;
  if (typeof campo === "number") return String(campo);

  if (typeof campo === "object") {
    return (
      campo.name ||
      campo.nome ||
      campo.description ||
      campo.descricao ||
      campo.title ||
      campo.titulo ||
      campo.type ||
      campo.tipo ||
      campo.category ||
      campo.categoria ||
      campo.categoryName ||
      campo.nomeCategoria ||
      ""
    );
  }

  return "";
}

function normalizarNomeCategoriaRelatorios(categoria) {
  const textoOriginal = String(categoria || "Outros").trim();

  if (
    !Number.isNaN(Number(textoOriginal)) &&
    CATEGORY_NAME_BY_ID_RELATORIOS[Number(textoOriginal)]
  ) {
    return CATEGORY_NAME_BY_ID_RELATORIOS[Number(textoOriginal)];
  }

  const texto = removerAcentos(textoOriginal.toLowerCase());

  if (texto.includes("alimentacao")) return "Alimentação";
  if (texto.includes("transporte")) return "Transporte";
  if (texto.includes("lazer")) return "Lazer";

  if (
    texto.includes("moradia") ||
    texto.includes("aluguel") ||
    texto.includes("casa") ||
    texto.includes("agua") ||
    texto.includes("luz")
  ) {
    return "Moradia";
  }

  if (
    texto.includes("saude") ||
    texto.includes("farmacia") ||
    texto.includes("hospital") ||
    texto.includes("medico")
  ) {
    return "Saúde";
  }

  if (
    texto.includes("cartao de credito") ||
    texto.includes("credito")
  ) {
    return "Cartão de Crédito";
  }

  if (
    texto.includes("cartao de debito") ||
    texto.includes("debito")
  ) {
    return "Cartão de Débito";
  }

  if (
    texto.includes("contas pessoais") ||
    texto.includes("conta pessoal") ||
    texto.includes("pessoal") ||
    texto.includes("pessoais")
  ) {
    return "Contas pessoais";
  }

  if (
    texto.includes("outro") ||
    texto.includes("outros")
  ) {
    return "Outros";
  }

  return "Outros";
}

function extrairCategoriaRelatorios(item) {
  const idCategoria =
    item.categoryId ||
    item.category_id ||
    item.idCategory ||
    item.categoriaId ||
    item.category?.id ||
    item.category?.categoryId ||
    item.category ||
    null;

  if (
    idCategoria !== null &&
    idCategoria !== undefined &&
    !Number.isNaN(Number(idCategoria)) &&
    CATEGORY_NAME_BY_ID_RELATORIOS[Number(idCategoria)]
  ) {
    return CATEGORY_NAME_BY_ID_RELATORIOS[Number(idCategoria)];
  }

  const possiveis = [
    item.categoryName,
    item.nomeCategoria,
    item.descriptionCategory,
    item.typeCategory,
    item.nameCategory,
    item.categoria,

    item.category?.name,
    item.category?.nome,
    item.category?.description,
    item.category?.descricao,
    item.category?.title,

    item.typeExpense?.name,
    item.typeExpense?.nome,
    item.typeExpense?.description,
    item.typeExpense?.descricao,
    item.typeExpense?.title,

    item.expenseType?.name,
    item.expenseType?.nome,
    item.expenseType?.description,
    item.expenseType?.descricao,

    item.typeIncome?.name,
    item.typeIncome?.nome,
    item.typeIncome?.description,
    item.typeIncome?.descricao,

    item.incomeType?.name,
    item.incomeType?.nome,
    item.incomeType?.description,
    item.incomeType?.descricao
  ];

  for (const campo of possiveis) {
    const texto = pegarTextoCampoRelatorios(campo).trim();

    if (
      texto &&
      texto !== "[object Object]" &&
      !["expense", "income", "despesa", "receita"].includes(texto.toLowerCase())
    ) {
      return normalizarNomeCategoriaRelatorios(texto);
    }
  }

  return "Outros";
}

function normalizarTransacao(item, tipoForcado = null) {
  const tipoOriginal = String(
    item.type ||
    item.tipo ||
    item.transactionType ||
    item.categoryType ||
    item.movimentType ||
    ""
  ).toLowerCase();

  let tipo = tipoForcado;

  if (!tipo) {
    if (
      tipoOriginal.includes("receita") ||
      tipoOriginal.includes("income") ||
      tipoOriginal.includes("entrada") ||
      tipoOriginal.includes("revenue")
    ) {
      tipo = "receita";
    } else {
      tipo = "despesa";
    }
  }

  const valor = Math.abs(converterValor(
    item.value ??
    item.valor ??
    item.amount ??
    item.price ??
    item.total ??
    item.totalValue ??
    item.installmentValue ??
    0
  ));

  const categoria = extrairCategoriaRelatorios(item);

  const descricao =
    item.description ||
    item.descricao ||
    item.name ||
    item.nome ||
    item.title ||
    categoria ||
    "Transação";

  const data =
    item.dataISO ||
    item.dateInitial ||
    item.date ||
    item.data ||
    item.createdAt ||
    item.created_at ||
    item.paymentDate ||
    item.dueDate ||
    item.dataTransacao ||
    item.transactionDate ||
    item.expenseDate ||
    item.incomeDate ||
    new Date().toISOString();

  return {
    id: item.id || item.incomeId || item.expenseId || item._id || null,
    tipo,
    valor,
    categoria: String(categoria),
    descricao: String(descricao),
    data
  };
}

function converterValor(valor) {
  if (typeof valor === "number") return valor;

  if (!valor) return 0;

  let texto = String(valor)
    .replace("R$", "")
    .replace("US$", "")
    .replace("€", "")
    .replace("£", "")
    .replace("¥", "")
    .replace(/\s/g, "")
    .trim();

  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (texto.includes(",")) {
    texto = texto.replace(",", ".");
  }

  const numero = Number(texto);

  return Number.isFinite(numero) ? numero : 0;
}

function converterData(data) {
  if (!data) return new Date();

  if (data instanceof Date) {
    return data;
  }

  if (typeof data === "string" && data.includes("/")) {
    const partes = data.split("/");

    if (partes.length === 3) {
      const dia = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const ano = Number(partes[2]);

      const convertida = new Date(ano, mes, dia);

      if (!isNaN(convertida.getTime())) {
        return convertida;
      }
    }
  }

  const convertida = new Date(data);

  if (!isNaN(convertida.getTime())) {
    return convertida;
  }

  return new Date();
}

/* =========================
   FILTRO POR PERÍODO
========================= */

function obterPeriodoSelecionado() {
  const filtro = document.getElementById("filtro-periodo");

  if (!filtro || !filtro.value) {
    const hoje = new Date();

    return {
      ano: hoje.getFullYear(),
      mes: hoje.getMonth()
    };
  }

  const [ano, mes] = filtro.value.split("-").map(Number);

  return {
    ano,
    mes: mes - 1
  };
}

function filtrarPorPeriodo(lista, periodo) {
  return lista.filter((item) => {
    const data = converterData(item.data);

    return (
      data.getFullYear() === periodo.ano &&
      data.getMonth() === periodo.mes
    );
  });
}

/* =========================
   CARDS
========================= */

function atualizarCards(receitas, despesas, saldo) {
  setText("valor-receitas", formatarMoeda(receitas));
  setText("valor-despesas", formatarMoeda(despesas));
  setText("valor-saldo", formatarMoeda(saldo));

  setText("variacao-receitas", receitas > 0 ? "▲ Atualizado" : "Sem receitas");
  setText("variacao-despesas", despesas > 0 ? "▲ Atualizado" : "Sem despesas");
  setText("variacao-saldo", saldo >= 0 ? "▲ Saldo positivo" : "▼ Saldo negativo");

  const saldoEl = document.getElementById("valor-saldo");

  if (saldoEl) {
    saldoEl.classList.toggle("vermelho", saldo < 0);
    saldoEl.classList.toggle("azul", saldo >= 0);
  }
}

/* =========================
   GRÁFICO DE BARRAS
========================= */

function renderizarGraficoBarras(receitas, despesas) {
  const container = document.getElementById("grafico-barras");

  if (!container) return;

  const periodo = obterPeriodoSelecionado();
  const meses = gerarUltimosSeisMeses(periodo.ano, periodo.mes);

  const dados = meses.map((periodoItem) => {
    const receitasMes = receitas.filter((item) => {
      const data = converterData(item.data);

      return (
        data.getFullYear() === periodoItem.ano &&
        data.getMonth() === periodoItem.mes
      );
    });

    const despesasMes = despesas.filter((item) => {
      const data = converterData(item.data);

      return (
        data.getFullYear() === periodoItem.ano &&
        data.getMonth() === periodoItem.mes
      );
    });

    return {
      label: `${MESES_RELATORIOS[periodoItem.mes]}/${String(periodoItem.ano).slice(2)}`,
      receitas: somarValores(receitasMes),
      despesas: somarValores(despesasMes)
    };
  });

  const maiorValorReal = Math.max(
    ...dados.map((item) => item.receitas),
    ...dados.map((item) => item.despesas),
    0
  );

  const maiorValor = calcularEscalaGrafico(maiorValorReal);

  renderizarEixoY(maiorValor);
  atualizarInfoGrafico(dados);

  container.innerHTML = `
    <div class="grafico-barras-inner" id="grafico-barras-inner"></div>
  `;

  const graficoInner = document.getElementById("grafico-barras-inner");

  if (!graficoInner) return;

  dados.forEach((item) => {
    const alturaReceita = maiorValor > 0
      ? Math.max((item.receitas / maiorValor) * 100, item.receitas > 0 ? 5 : 0)
      : 0;

    const alturaDespesa = maiorValor > 0
      ? Math.max((item.despesas / maiorValor) * 100, item.despesas > 0 ? 5 : 0)
      : 0;

    const coluna = document.createElement("div");
    coluna.className = "coluna-mes";

    coluna.innerHTML = `
      <div class="barras-par">
        <div 
          class="barra-item receita" 
          style="height: ${alturaReceita}%"
          title="Receitas: ${formatarMoeda(item.receitas)}"
        ></div>

        <div 
          class="barra-item despesa" 
          style="height: ${alturaDespesa}%"
          title="Despesas: ${formatarMoeda(item.despesas)}"
        ></div>
      </div>

      <span class="rotulo-mes">${item.label}</span>
    `;

    graficoInner.appendChild(coluna);
  });
}

function gerarUltimosSeisMeses(ano, mes) {
  const meses = [];

  for (let i = 5; i >= 0; i--) {
    const data = new Date(ano, mes - i, 1);

    meses.push({
      ano: data.getFullYear(),
      mes: data.getMonth()
    });
  }

  return meses;
}

function calcularEscalaGrafico(maiorValor) {
  if (maiorValor <= 0) return 1000;

  if (maiorValor <= 1000) return 1000;
  if (maiorValor <= 2500) return 2500;
  if (maiorValor <= 5000) return 5000;
  if (maiorValor <= 10000) return 10000;
  if (maiorValor <= 15000) return 15000;
  if (maiorValor <= 20000) return 20000;
  if (maiorValor <= 25000) return 25000;
  if (maiorValor <= 50000) return 50000;

  return Math.ceil(maiorValor / 10000) * 10000;
}

function renderizarEixoY(maiorValor) {
  const eixoY = document.getElementById("eixo-y");
  if (!eixoY) return;

  const partes = 5;
  const valores = [];

  for (let i = partes; i >= 0; i--) {
    valores.push((maiorValor / partes) * i);
  }

  eixoY.innerHTML = valores
    .map((valor) => `<span>${formatarValorEixo(valor)}</span>`)
    .join("");
}

function formatarValorEixo(valor) {
  if (valor >= 1000) {
    const mil = valor / 1000;

    if (Number.isInteger(mil)) {
      return `R$ ${mil} mil`;
    }

    return `R$ ${mil.toFixed(1).replace(".", ",")} mil`;
  }

  return `R$ ${valor.toFixed(0)}`;
}

/* =========================
   DESPESAS POR CATEGORIA
========================= */

function renderizarGraficoRosca(despesas, totalReceitasMes = 0) {
  const grafico = document.getElementById("grafico-rosca");
  const lista = document.getElementById("lista-categorias");
  const totalRosca = document.getElementById("total-despesas-rosca");

  if (!grafico || !lista || !totalRosca) return;

  const agrupadas = {};

  /*
    Começa com todas as categorias fixas.
    Assim todas aparecem na tela, mesmo com R$ 0,00.
  */
  CATEGORIAS_FIXAS_RELATORIOS.forEach((categoria) => {
    agrupadas[categoria] = 0;
  });

  despesas.forEach((item) => {
    const categoria = normalizarNomeCategoriaRelatorios(
      item.categoria || extrairCategoriaRelatorios(item)
    );

    if (!agrupadas[categoria]) {
      agrupadas[categoria] = 0;
    }

    agrupadas[categoria] += Number(item.valor || 0);
  });

  const categorias = Object.entries(agrupadas)
    .map(([nome, valor]) => {
      return {
        nome,
        valor,
        cor: buscarCorCategoria(nome)
      };
    })
    .sort((a, b) => b.valor - a.valor);

  const totalDespesas = categorias.reduce((soma, item) => {
    return soma + item.valor;
  }, 0);

  totalRosca.textContent = formatarMoeda(totalDespesas);
  lista.innerHTML = "";

  if (totalDespesas <= 0 || totalReceitasMes <= 0) {
    grafico.style.background = "conic-gradient(#e5e7eb 0deg 360deg)";

    categorias.forEach((item) => {
      const div = document.createElement("div");
      div.className = "item-categoria";

      div.innerHTML = `
        <span class="bolinha-categoria" style="background:${item.cor};"></span>
        <span>${item.nome}</span>
        <strong class="valor-categoria">${formatarMoeda(item.valor)}</strong>
        <span class="percentual-categoria">(0,0%)</span>
      `;

      lista.appendChild(div);
    });

    return;
  }

  let anguloAtual = 0;
  const fatias = [];

  categorias.forEach((item) => {
    const percentual = totalReceitasMes > 0
      ? (item.valor / totalReceitasMes) * 100
      : 0;

    const grausCalculados = totalReceitasMes > 0
      ? (item.valor / totalReceitasMes) * 360
      : 0;

    const graus = Math.min(grausCalculados, 360 - anguloAtual);

    if (item.valor > 0 && graus > 0) {
      const inicio = anguloAtual;
      const fim = inicio + graus;

      fatias.push(`${item.cor} ${inicio}deg ${fim}deg`);

      anguloAtual = fim;
    }

    const div = document.createElement("div");
    div.className = "item-categoria";

    div.innerHTML = `
      <span class="bolinha-categoria" style="background:${item.cor};"></span>
      <span>${item.nome}</span>
      <strong class="valor-categoria">${formatarMoeda(item.valor)}</strong>
      <span class="percentual-categoria">(${percentual.toFixed(1).replace(".", ",")}%)</span>
    `;

    lista.appendChild(div);
  });

  /*
    O restante da receita fica cinza.
    Exemplo:
    Receita: R$ 1.500
    Despesas: R$ 260
    O gráfico colore 17,3% e deixa o restante cinza.
  */
  if (anguloAtual < 360) {
    fatias.push(`#e5e7eb ${anguloAtual}deg 360deg`);
  }

  grafico.style.background = `conic-gradient(${fatias.join(", ")})`;
}

function buscarCorCategoria(categoria) {
  const chave = removerAcentos(String(categoria || "").toLowerCase().trim());

  return CORES_CATEGORIAS[chave] || "#6b7280";
}

/* =========================
   RESUMO DO MÊS
========================= */

function renderizarResumoMes(receitas, despesas, totalReceitas, totalDespesas, saldo) {
  setText("resumo-receitas", formatarMoeda(totalReceitas));
  setText("resumo-despesas", formatarMoeda(totalDespesas));

  const maiorDespesa = [...despesas].sort((a, b) => b.valor - a.valor)[0];
  const menorDespesa = [...despesas].sort((a, b) => a.valor - b.valor)[0];

  setText(
    "maior-despesa",
    maiorDespesa
      ? `${maiorDespesa.categoria} - ${formatarMoeda(maiorDespesa.valor)}`
      : "-"
  );

  setText(
    "menor-despesa",
    menorDespesa
      ? `${menorDespesa.categoria} - ${formatarMoeda(menorDespesa.valor)}`
      : "-"
  );

  setText("melhor-dia", calcularMelhorDiaParaEconomizar(despesas));

  const hoje = new Date();
  const periodo = obterPeriodoSelecionado();

  let percentualMes = 100;

  if (
    periodo.ano === hoje.getFullYear() &&
    periodo.mes === hoje.getMonth()
  ) {
    const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    percentualMes = Math.round((hoje.getDate() / diasNoMes) * 100);
  }

  setText("percentual-mes", `${percentualMes}%`);

  const progresso = document.getElementById("progresso-circular");

  if (progresso) {
    const graus = (percentualMes / 100) * 360;

    progresso.style.background = `
      conic-gradient(
        #2e7d32 0deg ${graus}deg,
        #e5e7eb ${graus}deg 360deg
      )
    `;
  }

  const textoDica = document.getElementById("texto-dica");

  if (textoDica) {
    if (saldo < 0) {
      textoDica.textContent = "Suas despesas passaram das receitas. Tente reduzir gastos não essenciais.";
    } else if (totalReceitas > 0 && totalDespesas >= totalReceitas * 0.8) {
      textoDica.textContent = "Você ainda está positivo, mas suas despesas estão próximas das receitas.";
    } else if (totalReceitas === 0 && totalDespesas === 0) {
      textoDica.textContent = "Ainda não há dados suficientes para gerar uma dica deste mês.";
    } else {
      textoDica.textContent = "Você está no caminho certo! Continue assim para alcançar suas metas.";
    }
  }
}

function calcularMelhorDiaParaEconomizar(despesas) {
  if (!despesas.length) return "-";

  const gastosPorDia = {};

  despesas.forEach((item) => {
    const data = converterData(item.data);
    const diaSemana = data.getDay();

    if (!gastosPorDia[diaSemana]) {
      gastosPorDia[diaSemana] = 0;
    }

    gastosPorDia[diaSemana] += Number(item.valor || 0);
  });

  const menorDia = Object.entries(gastosPorDia)
    .sort((a, b) => a[1] - b[1])[0];

  if (!menorDia) return "-";

  return DIAS_SEMANA[Number(menorDia[0])];
}

/* =========================
   EXPORTAÇÃO
========================= */

async function exportarPdf() {
  try {
    const periodoSelecionado = obterPeriodoSelecionado();
    const month = periodoSelecionado.mes + 1;
    const year = periodoSelecionado.ano;

    const blob = await apiFetchRelatorios(`/report/pdf?month=${month}&year=${year}`, {
      method: "GET",
      headers: {
        Accept: "application/pdf"
      }
    });

    baixarArquivo(blob, "relatorio-fambudget.pdf");

  } catch (error) {
    console.error("Erro ao exportar PDF:", error);

    mostrarPopupRelatorios(
      "Erro ao exportar PDF",
      error.message || "Não foi possível exportar o PDF."
    );
  }
}

function exportarCsv() {
  const linhas = [];

  linhas.push(["Campo", "Valor"]);
  linhas.push(["Receitas", document.getElementById("valor-receitas")?.textContent || "R$ 0,00"]);
  linhas.push(["Despesas", document.getElementById("valor-despesas")?.textContent || "R$ 0,00"]);
  linhas.push(["Saldo", document.getElementById("valor-saldo")?.textContent || "R$ 0,00"]);

  const listaCategorias = document.querySelectorAll("#lista-categorias .item-categoria");

  if (listaCategorias.length) {
    linhas.push([]);
    linhas.push(["Categorias", "Valor", "Percentual"]);

    listaCategorias.forEach((item) => {
      const nome = item.querySelector("span:nth-child(2)")?.textContent || "-";
      const valor = item.querySelector(".valor-categoria")?.textContent || "R$ 0,00";
      const percentual = item.querySelector(".percentual-categoria")?.textContent || "(0%)";

      linhas.push([nome, valor, percentual]);
    });
  }

  const csv = linhas
    .map((linha) => {
      return linha
        .map((campo) => `"${String(campo ?? "").replace(/"/g, '""')}"`)
        .join(";");
    })
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8"
  });

  baixarArquivo(blob, "relatorio-fambudget.csv");
}

function baixarArquivo(blob, nomeArquivo) {
  if (!(blob instanceof Blob)) {
    mostrarPopupRelatorios(
      "Erro",
      "O arquivo recebido da API não é válido."
    );
    return;
  }

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/* =========================
   HELPERS
========================= */

function somarValores(lista) {
  return lista.reduce((total, item) => {
    return total + Number(item.valor || 0);
  }, 0);
}

function formatarMoeda(valor) {
  const moeda =
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL";

  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: moeda
  });
}

function removerAcentos(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function setText(id, texto) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = texto;
  }
}

function atualizarInfoGrafico(dados) {
  const info = document.getElementById("info-grafico");
  if (!info) return;

  const maiorReceita = [...dados].sort((a, b) => b.receitas - a.receitas)[0];

  const totalReceitas = dados.reduce((total, item) => total + item.receitas, 0);
  const totalDespesas = dados.reduce((total, item) => total + item.despesas, 0);
  const saldoPeriodo = totalReceitas - totalDespesas;

  if (!maiorReceita || maiorReceita.receitas <= 0) {
    info.innerHTML = `
      <span>Resumo do período</span>
      <strong>Sem receitas</strong>
      <small>Aguardando lançamentos</small>
    `;
    return;
  }

  info.innerHTML = `
    <span>Maior receita</span>
    <strong>${formatarMoeda(maiorReceita.receitas)}</strong>
    <small>${maiorReceita.label} · Saldo ${formatarMoeda(saldoPeriodo)}</small>
  `;
}