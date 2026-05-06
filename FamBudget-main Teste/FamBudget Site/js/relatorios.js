console.log("RELATORIOS.JS OK - MOEDA, STORAGE POR CONTA E GRÁFICO POR % DAS RECEITAS");

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
  "lazer": "#DA4175",
  "outros": "#4F595B",
  "contas pessoais": "#4B2B0A",
  "moradia": "#4B2B0A",
  "transporte": "#00CCFF",
  "alimentação": "#FF7700",
  "alimentacao": "#FF7700",
  "cartão de débito": "#E1CC0A",
  "cartao de debito": "#E1CC0A",
  "saúde": "#44B948",
  "saude": "#44B948",
  "cartão de crédito": "#7B55E3",
  "cartao de credito": "#7B55E3"
};

let usuarioPertenceFamiliaRelatorios = false;

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  configurarMenu();
  configurarEventos();

  usuarioPertenceFamiliaRelatorios = await usuarioEstaEmFamiliaRelatorios();

  await carregarRelatorios();
});

window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  if (
    event.key.includes("moedaUsuario") ||
    event.key === "receitas" ||
    event.key === "despesas" ||
    event.key === "transacoes" ||
    event.key === "receitasFixas" ||
    event.key.includes("_receitas") ||
    event.key.includes("_despesas") ||
    event.key.includes("_transacoes") ||
    event.key.includes("_receitasFixas")
  ) {
    await carregarRelatorios();
  }

  if (
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia"
  ) {
    usuarioPertenceFamiliaRelatorios = await usuarioEstaEmFamiliaRelatorios();
    await carregarRelatorios();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  usuarioPertenceFamiliaRelatorios = await usuarioEstaEmFamiliaRelatorios();
  await carregarRelatorios();
});

window.addEventListener("dadosFinanceirosAtualizados", async () => {
  await carregarRelatorios();
});

/* =========================
   TOKEN / USUÁRIO
========================= */

function getTokenRelatorios() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function getPayloadTokenRelatorios() {
  const token = getTokenRelatorios();

  if (!token) return {};

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function getEmailUsuarioRelatorios() {
  const payload = getPayloadTokenRelatorios();

  return String(
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    payload.email ||
    payload.user_email ||
    ""
  ).toLowerCase().trim();
}

function getIdUsuarioRelatorios() {
  const payload = getPayloadTokenRelatorios();

  return (
    payload.user_id ||
    payload.userId ||
    payload.id ||
    payload.sub ||
    null
  );
}

function getUserKeyRelatorios(email = null) {
  const emailFinal = email || getEmailUsuarioRelatorios();
  return `fambudget_${String(emailFinal || "usuario").toLowerCase().trim()}`;
}

function getChaveUsuarioRelatorios(chave) {
  return `${getUserKeyRelatorios()}_${chave}`;
}

function buscarDadoUsuarioRelatorios(chave, email = null) {
  const userKey = getUserKeyRelatorios(email);
  return localStorage.getItem(`${userKey}_${chave}`) || "";
}

function headersRelatorios() {
  const token = getTokenRelatorios();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function apiFetchRelatorios(path, options = {}) {
  const response = await fetch(`${RELATORIOS_API_URL}${path}`, {
    ...options,
    headers: {
      ...headersRelatorios(),
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    let erro = "Erro ao carregar dados dos relatórios.";

    try {
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        erro = data.message || data.detail || erro;
      } else {
        erro = await response.text();
      }
    } catch {
      erro = "Erro ao carregar dados dos relatórios.";
    }

    throw new Error(erro);
  }

  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return await response.blob();
}

/* =========================
   USUÁRIO
========================= */

function carregarUsuario() {
  const nome =
    buscarDadoUsuarioRelatorios("nomeUsuario") ||
    buscarDadoUsuarioRelatorios("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    "Usuário";

  const imagem =
    buscarDadoUsuarioRelatorios("avatarUsuario") ||
    buscarDadoUsuarioRelatorios("fotoUsuario") ||
    buscarDadoUsuarioRelatorios("imagemPerfil") ||
    buscarDadoUsuarioRelatorios("fotoPerfil") ||
    sessionStorage.getItem("avatarUsuario") ||
    localStorage.getItem("avatarUsuario") ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) nomeUsuario.textContent = nome;

  if (avatar) {
    if (imagem) {
      avatar.textContent = "";
      avatar.style.backgroundImage = `url("${imagem}")`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.style.backgroundRepeat = "no-repeat";
    } else if (!avatar.querySelector("img")) {
      avatar.style.backgroundImage = "";
      avatar.textContent = nome.charAt(0).toUpperCase();
    }
  }
}

/* =========================
   MENU / LOGOUT SEGURO
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
      /*
        IMPORTANTE:
        Não use localStorage.clear().
        Isso apagava receitas, despesas, moeda e preferências.
      */
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
   FAMÍLIA / ESCOPO
========================= */

function getMembersFromResponseRelatorios(data) {
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

async function usuarioEstaEmFamiliaRelatorios() {
  const token = getTokenRelatorios();

  if (!token) return false;

  try {
    const resposta = await fetch(`${RELATORIOS_API_URL}/family`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (resposta.status === 404) {
      return false;
    }

    if (!resposta.ok) {
      return false;
    }

    const text = await resposta.text();
    const data = text ? JSON.parse(text) : null;
    const membros = getMembersFromResponseRelatorios(data);

    if (!Array.isArray(membros)) return true;

    return membros.length > 0;
  } catch (erro) {
    console.warn("Erro ao verificar família em relatórios:", erro);
    return false;
  }
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function idsIguaisRelatorios(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}

function emailsIguaisRelatorios(a, b) {
  if (!a || !b) return false;
  return String(a).toLowerCase().trim() === String(b).toLowerCase().trim();
}

function pegarIdDonoRelatorios(item) {
  return (
    item?.autorId ||
    item?.userId ||
    item?.user_id ||
    item?.usuarioId ||
    item?.usuario_id ||
    item?.createdById ||
    item?.created_by_id ||
    item?.ownerId ||
    item?.owner_id ||
    item?.createdBy?.id ||
    item?.user?.id ||
    item?.usuario?.id ||
    null
  );
}

function pegarEmailDonoRelatorios(item) {
  return String(
    item?.autorEmail ||
    item?.userEmail ||
    item?.user_email ||
    item?.emailUsuario ||
    item?.email_usuario ||
    item?.createdByEmail ||
    item?.created_by_email ||
    item?.ownerEmail ||
    item?.owner_email ||
    item?.createdBy?.email ||
    item?.user?.email ||
    item?.usuario?.email ||
    ""
  ).toLowerCase().trim();
}

function itemPertenceAFamiliaRelatorios(item) {
  if (!item || typeof item !== "object") return false;

  const origem = normalizarTexto(item.origem || item.source || item.tipoOrigem || item.origin || "");
  const escopo = normalizarTexto(item.escopo || item.scope || item.tipoEscopo || "");
  const tipoDado = normalizarTexto(item.tipoDado || item.dataType || "");

  return (
    origem.includes("familia") ||
    origem.includes("family") ||
    escopo.includes("familia") ||
    escopo.includes("family") ||
    tipoDado.includes("familia") ||
    tipoDado.includes("family") ||
    Boolean(item.familyId) ||
    Boolean(item.family_id) ||
    Boolean(item.idFamilia) ||
    Boolean(item.familiaId) ||
    Boolean(item.family) ||
    Boolean(item.familia) ||
    item.compartilhado === true ||
    item.shared === true ||
    item.isFamily === true ||
    item.familiar === true
  );
}

function itemPertenceAoUsuarioLogadoRelatorios(item) {
  const idAtual = getIdUsuarioRelatorios();
  const emailAtual = getEmailUsuarioRelatorios();

  const idDono = pegarIdDonoRelatorios(item);
  const emailDono = pegarEmailDonoRelatorios(item);

  if (idsIguaisRelatorios(idAtual, idDono)) return true;
  if (emailsIguaisRelatorios(emailAtual, emailDono)) return true;

  /*
    Dados antigos sem autor salvo.
    Mantém visível apenas se não estiverem marcados como família.
  */
  if (!idDono && !emailDono && !itemPertenceAFamiliaRelatorios(item)) {
    return true;
  }

  return false;
}

function filtrarPorEscopoRelatorios(lista) {
  let resultado = normalizarLista(lista);

  if (!usuarioPertenceFamiliaRelatorios) {
    resultado = resultado.filter((item) => {
      if (itemPertenceAFamiliaRelatorios(item)) {
        return false;
      }

      return itemPertenceAoUsuarioLogadoRelatorios(item);
    });
  }

  return resultado;
}

/* =========================
   CARREGAR RELATÓRIOS
========================= */

async function carregarRelatorios() {
  try {
    const locais = carregarTransacoesLocaisRelatorios();

    let receitas = locais.filter((item) => item.tipo === "receita");
    let despesas = locais.filter((item) => item.tipo === "despesa");

    /*
      Para não duplicar:
      Se já existem dados locais, usa os locais.
      Só busca API quando não houver nenhum dado local.
    */
    if (locais.length === 0) {
      const [receitasApi, despesasApi] = await Promise.all([
        buscarReceitas(),
        buscarDespesas()
      ]);

      receitas = normalizarLista(receitasApi).map((item) => {
        return normalizarTransacao(item, "receita");
      });

      despesas = normalizarLista(despesasApi).map((item) => {
        return normalizarTransacao(item, "despesa");
      });

      receitas = filtrarPorEscopoRelatorios(receitas);
      despesas = filtrarPorEscopoRelatorios(despesas);
    }

    receitas = removerDuplicadosRelatorios(receitas);
    despesas = removerDuplicadosRelatorios(despesas);

    const periodoSelecionado = obterPeriodoSelecionado();

    const receitasFiltradas = filtrarPorPeriodo(receitas, periodoSelecionado);
    const despesasFiltradas = filtrarPorPeriodo(despesas, periodoSelecionado);

    const totalReceitas = somarValores(receitasFiltradas);
    const totalDespesas = somarValores(despesasFiltradas);
    const saldo = totalReceitas - totalDespesas;

    atualizarCards(totalReceitas, totalDespesas, saldo);
    renderizarGraficoBarras(receitas, despesas);

    /*
      Agora o gráfico de despesas por categoria usa o total de receitas
      como base para calcular a porcentagem.
    */
    renderizarGraficoRosca(despesasFiltradas, totalReceitas);

    renderizarResumoMes(
      receitasFiltradas,
      despesasFiltradas,
      totalReceitas,
      totalDespesas,
      saldo
    );
  } catch (error) {
    console.error("Erro nos relatórios:", error);
    carregarRelatoriosFallback();
  }
}

async function buscarReceitas() {
  return await apiFetchRelatorios("/income/user", {
    method: "GET"
  });
}

async function buscarDespesas() {
  return await apiFetchRelatorios("/expense/user", {
    method: "GET"
  });
}

/* =========================
   LOCALSTORAGE POR CONTA
========================= */

function carregarTransacoesLocaisRelatorios() {
  const receitasUsuario = lerStorage("receitas", localStorage, true);
  const despesasUsuario = lerStorage("despesas", localStorage, true);
  const transacoesUsuario = lerStorage("transacoes", localStorage, true);

  const receitasGlobais = lerStorage("receitas", localStorage, false);
  const despesasGlobais = lerStorage("despesas", localStorage, false);
  const transacoesGlobais = lerStorage("transacoes", localStorage, false);

  const receitas = [
    ...receitasUsuario,
    ...receitasGlobais
  ].map((item) => normalizarTransacao({ ...item, tipo: "receita" }, "receita"));

  const despesas = [
    ...despesasUsuario,
    ...despesasGlobais
  ].map((item) => normalizarTransacao({ ...item, tipo: "despesa" }, "despesa"));

  const transacoes = [
    ...transacoesUsuario,
    ...transacoesGlobais
  ].map((item) => {
    const tipo = detectarTipoTransacao(item);
    return normalizarTransacao({ ...item, tipo }, tipo);
  });

  const todas = [
    ...receitas,
    ...despesas,
    ...transacoes
  ];

  return removerDuplicadosRelatorios(filtrarPorEscopoRelatorios(todas));
}

function carregarRelatoriosFallback() {
  const transacoes = carregarTransacoesLocaisRelatorios();

  const periodoSelecionado = obterPeriodoSelecionado();

  const receitas = transacoes.filter((item) => item.tipo === "receita");
  const despesas = transacoes.filter((item) => item.tipo === "despesa");

  const receitasFiltradas = filtrarPorPeriodo(receitas, periodoSelecionado);
  const despesasFiltradas = filtrarPorPeriodo(despesas, periodoSelecionado);

  const totalReceitas = somarValores(receitasFiltradas);
  const totalDespesas = somarValores(despesasFiltradas);
  const saldo = totalReceitas - totalDespesas;

  atualizarCards(totalReceitas, totalDespesas, saldo);
  renderizarGraficoBarras(receitas, despesas);

  /*
    Fallback também usa porcentagem baseada nas receitas.
  */
  renderizarGraficoRosca(despesasFiltradas, totalReceitas);

  renderizarResumoMes(
    receitasFiltradas,
    despesasFiltradas,
    totalReceitas,
    totalDespesas,
    saldo
  );
}

function lerStorage(chave, storage, porUsuario = false) {
  try {
    const chaveFinal = porUsuario
      ? getChaveUsuarioRelatorios(chave)
      : chave;

    const dados = storage.getItem(chaveFinal);

    if (!dados) return [];

    const parseado = JSON.parse(dados);

    if (Array.isArray(parseado)) return parseado;
    if (parseado && Array.isArray(parseado.data)) return parseado.data;
    if (parseado && Array.isArray(parseado.items)) return parseado.items;
    if (parseado && Array.isArray(parseado.content)) return parseado.content;

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

  return [];
}

function detectarTipoTransacao(item) {
  const texto = normalizarTexto(
    item.type ||
    item.tipo ||
    item.transactionType ||
    item.categoryType ||
    item.natureza ||
    item.origem ||
    ""
  );

  if (
    texto.includes("receita") ||
    texto.includes("income") ||
    texto.includes("entrada") ||
    texto.includes("revenue")
  ) {
    return "receita";
  }

  return "despesa";
}

function normalizarTransacao(item, tipoForcado = null) {
  let tipo = tipoForcado || detectarTipoTransacao(item);

  const valor = Math.abs(converterValor(
    item.value ??
    item.valor ??
    item.amount ??
    item.price ??
    item.total ??
    item.valorTotal ??
    item.totalValue ??
    item.totalAmount ??
    0
  ));

  const categoria =
    item.categoryName ||
    item.category ||
    item.categoria ||
    item.nomeCategoria ||
    item.typeExpense ||
    item.typeIncome ||
    "Outros";

  const descricao =
    item.description ||
    item.descricao ||
    item.name ||
    item.nome ||
    categoria ||
    "Transação";

  const data =
    item.dateInitial ||
    item.date ||
    item.data ||
    item.createdAt ||
    item.created_at ||
    item.paymentDate ||
    item.dueDate ||
    item.dataTransacao ||
    item.transactionDate ||
    new Date().toISOString();

  return {
    ...item,
    id:
      item.id ||
      item.incomeId ||
      item.income_id ||
      item.expenseId ||
      item.expense_id ||
      item.transactionId ||
      item.transaction_id ||
      item._id ||
      null,

    tipo,
    valor,
    categoria: String(categoria),
    descricao: String(descricao),
    data,

    origem: item.origem || item.source || "",

    escopo: item.escopo || item.scope || "",
    compartilhado: Boolean(item.compartilhado || item.shared),

    regraReceitaFixaId: item.regraReceitaFixaId || null,
    compraId: item.compraId || item.purchaseId || null,
    parcelaAtual: item.parcelaAtual || item.currentInstallment || null,
    totalParcelas: item.totalParcelas || item.installments || null,
    despesaFixaId: item.despesaFixaId || item.fixedExpenseId || null,

    autorId:
      item.autorId ||
      item.userId ||
      item.user_id ||
      item.usuarioId ||
      item.usuario_id ||
      item.createdById ||
      item.created_by_id ||
      item.createdBy?.id ||
      item.user?.id ||
      item.usuario?.id ||
      null,

    autorEmail:
      item.autorEmail ||
      item.userEmail ||
      item.user_email ||
      item.emailUsuario ||
      item.email_usuario ||
      item.createdByEmail ||
      item.created_by_email ||
      item.createdBy?.email ||
      item.user?.email ||
      item.usuario?.email ||
      "",

    autorNickname:
      item.autorNickname ||
      item.nicknameUsuario ||
      item.nomeUsuario ||
      item.createdByNickname ||
      item.createdByName ||
      item.createdBy?.nickname ||
      item.createdBy?.name ||
      item.user?.nickname ||
      item.user?.name ||
      item.usuario?.nickname ||
      item.usuario?.nome ||
      ""
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

  texto = texto.replace("-", "");

  const numero = Number(texto);

  return Number.isFinite(numero) ? numero : 0;
}

function converterData(data) {
  if (!data) return new Date();

  const texto = String(data).trim();

  if (texto.includes("-")) {
    const partes = texto.split("T")[0].split("-");

    if (partes.length === 3) {
      const ano = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const dia = Number(partes[2]);

      return new Date(ano, mes, dia, 12, 0, 0);
    }
  }

  if (texto.includes("/")) {
    const partes = texto.split("/");

    if (partes.length === 3) {
      const dia = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const ano = Number(partes[2]);

      return new Date(ano, mes, dia, 12, 0, 0);
    }
  }

  const convertida = new Date(texto);

  if (!isNaN(convertida.getTime())) {
    return convertida;
  }

  return new Date();
}

/* =========================
   DUPLICADOS
========================= */

function chaveFlexivelRelatorios(item) {
  const data = converterData(item.data);
  const dataISO = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;

  return [
    item.tipo || "",
    dataISO,
    normalizarTexto(item.descricao || ""),
    normalizarTexto(item.categoria || ""),
    Number(item.valor || 0).toFixed(2)
  ].join("|");
}

function chaveEstritaRelatorios(item) {
  const data = converterData(item.data);
  const dataISO = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;

  if (item.tipo === "receita" && item.regraReceitaFixaId) {
    return [
      "receita-fixa",
      item.regraReceitaFixaId,
      dataISO,
      Number(item.valor || 0).toFixed(2)
    ].join("|");
  }

  if (item.tipo === "despesa" && item.compraId && item.parcelaAtual) {
    return [
      "despesa-parcelada",
      item.compraId,
      item.parcelaAtual,
      dataISO,
      Number(item.valor || 0).toFixed(2)
    ].join("|");
  }

  if (item.id) {
    return `${item.tipo}|${item.id}`;
  }

  return null;
}

function pontuacaoPreferenciaRelatorios(item) {
  let pontos = 0;

  if (item.autorEmail) pontos += 5;
  if (item.autorNickname) pontos += 4;
  if (item.autorId) pontos += 3;

  if (item.origem === "receitas" || item.origem === "despesas") pontos += 2;
  if (item.origem === "transacoes") pontos += 1;

  if (item.id) pontos += 1;

  return pontos;
}

function removerDuplicadosRelatorios(lista) {
  const mapaEstrito = new Map();

  normalizarLista(lista).forEach((item) => {
    const chave = chaveEstritaRelatorios(item) || chaveFlexivelRelatorios(item);
    const existente = mapaEstrito.get(chave);

    if (!existente) {
      mapaEstrito.set(chave, item);
      return;
    }

    if (pontuacaoPreferenciaRelatorios(item) > pontuacaoPreferenciaRelatorios(existente)) {
      mapaEstrito.set(chave, item);
    }
  });

  const mapaFlexivel = new Map();

  Array.from(mapaEstrito.values()).forEach((item) => {
    const chave = chaveFlexivelRelatorios(item);
    const existente = mapaFlexivel.get(chave);

    if (!existente) {
      mapaFlexivel.set(chave, item);
      return;
    }

    if (pontuacaoPreferenciaRelatorios(item) > pontuacaoPreferenciaRelatorios(existente)) {
      mapaFlexivel.set(chave, item);
    }
  });

  return Array.from(mapaFlexivel.values());
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
  return normalizarLista(lista).filter((item) => {
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

  setText("variacao-receitas", "▲ Atualizado");
  setText("variacao-despesas", "▲ Atualizado");
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

  atualizarInfoGrafico(dados);
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
  const moeda = obterMoedaRelatorios();
  const simbolo = pegarSimboloMoedaRelatorios(moeda);

  if (valor >= 1000) {
    const mil = valor / 1000;

    if (Number.isInteger(mil)) {
      return `${simbolo} ${mil} mil`;
    }

    return `${simbolo} ${mil.toFixed(1).replace(".", ",")} mil`;
  }

  return `${simbolo} ${valor.toFixed(0)}`;
}

/* =========================
   GRÁFICO DE DESPESAS POR CATEGORIA
   PORCENTAGEM BASEADA NO TOTAL DE RECEITAS
========================= */

function renderizarGraficoRosca(despesas, totalReceitasReferencia = 0) {
  const grafico = document.getElementById("grafico-rosca");
  const lista = document.getElementById("lista-categorias");
  const totalRosca = document.getElementById("total-despesas-rosca");

  if (!grafico || !lista || !totalRosca) return;

  const totalDespesas = somarValores(despesas);
  const totalReceitas = Number(totalReceitasReferencia || 0);

  totalRosca.textContent = formatarMoeda(totalDespesas);
  lista.innerHTML = "";

  if (totalDespesas <= 0) {
    grafico.style.background = "#e5e7eb";

    lista.innerHTML = `
      <div class="item-categoria">
        <span class="bolinha-categoria" style="background:#9ca3af;"></span>
        <span>Nenhuma despesa</span>
        <strong class="valor-categoria">${formatarMoeda(0)}</strong>
        <span class="percentual-categoria">(0% das receitas)</span>
      </div>
    `;

    return;
  }

  if (totalReceitas <= 0) {
    grafico.style.background = "#e5e7eb";

    lista.innerHTML = `
      <div class="item-categoria">
        <span class="bolinha-categoria" style="background:#9ca3af;"></span>
        <span>Sem receitas no período</span>
        <strong class="valor-categoria">${formatarMoeda(totalDespesas)}</strong>
        <span class="percentual-categoria">(não é possível calcular %)</span>
      </div>
    `;

    return;
  }

  const agrupadas = {};

  despesas.forEach((item) => {
    const categoria = item.categoria || "Outros";

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
        cor: buscarCorCategoria(nome),
        percentualReceitas: (valor / totalReceitas) * 100
      };
    })
    .sort((a, b) => b.valor - a.valor);

  /*
    A rosca representa quanto das receitas foi consumido por despesas.
    Exemplo:
    Receitas = 3000
    Alimentação = 300 => 10% da rosca
    Transporte = 150 => 5% da rosca
    O restante fica cinza, representando receita não consumida por despesas.
  */
  let anguloAtual = 0;
  const fatias = [];

  categorias.forEach((item) => {
    const percentualSobreReceitas = item.valor / totalReceitas;
    const graus = percentualSobreReceitas * 360;

    if (graus <= 0) return;

    const inicio = anguloAtual;
    const fim = Math.min(inicio + graus, 360);

    if (inicio >= 360) return;

    fatias.push(`${item.cor} ${inicio}deg ${fim}deg`);
    anguloAtual = fim;
  });

  if (anguloAtual < 360) {
    fatias.push(`#e5e7eb ${anguloAtual}deg 360deg`);
  }

  grafico.style.background = `conic-gradient(${fatias.join(", ")})`;

  categorias.forEach((item) => {
    const percentual = item.percentualReceitas
      .toFixed(1)
      .replace(".", ",");

    const div = document.createElement("div");
    div.className = "item-categoria";

    div.innerHTML = `
      <span class="bolinha-categoria" style="background:${item.cor};"></span>
      <span>${item.nome}</span>
      <strong class="valor-categoria">${formatarMoeda(item.valor)}</strong>
      <span class="percentual-categoria">(${percentual}% das receitas)</span>
    `;

    lista.appendChild(div);
  });
}

function buscarCorCategoria(categoria) {
  const chave = removerAcentos(String(categoria).toLowerCase());

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
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();

  let percentualMes = Math.round((hoje.getDate() / diasNoMes) * 100);

  const periodo = obterPeriodoSelecionado();

  if (
    periodo.ano !== hoje.getFullYear() ||
    periodo.mes !== hoje.getMonth()
  ) {
    percentualMes = 100;
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
    const blob = await apiFetchRelatorios("/report/pdf", {
      method: "GET",
      headers: {
        Accept: "application/pdf"
      }
    });

    baixarArquivo(blob, "relatorio-fambudget.pdf");
  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    alert("Não foi possível exportar o PDF.");
  }
}

function exportarCsv() {
  const linhas = [];

  linhas.push(["Campo", "Valor"]);
  linhas.push(["Receitas", document.getElementById("valor-receitas")?.textContent || formatarMoeda(0)]);
  linhas.push(["Despesas", document.getElementById("valor-despesas")?.textContent || formatarMoeda(0)]);
  linhas.push(["Saldo", document.getElementById("valor-saldo")?.textContent || formatarMoeda(0)]);

  const csv = linhas
    .map((linha) => linha.map((campo) => `"${campo}"`).join(";"))
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8"
  });

  baixarArquivo(blob, "relatorio-fambudget.csv");
}

function baixarArquivo(blob, nomeArquivo) {
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
   MOEDA
========================= */

function obterMoedaRelatorios() {
  const email =
    getEmailUsuarioRelatorios() ||
    "usuario";

  const userKey = `fambudget_${String(email).toLowerCase().trim()}`;

  return (
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function pegarSimboloMoedaRelatorios(moeda) {
  const simbolos = {
    BRL: "R$",
    USD: "US$",
    EUR: "€",
    GBP: "£",
    ARS: "$",
    JPY: "¥"
  };

  return simbolos[moeda] || moeda;
}

function formatarMoeda(valor) {
  const moeda = obterMoedaRelatorios();

  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: moeda
    });
  } catch {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}

/* =========================
   HELPERS
========================= */

function somarValores(lista) {
  return normalizarLista(lista).reduce((total, item) => {
    return total + Number(item.valor || 0);
  }, 0);
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

/* =========================
   FUNÇÕES GLOBAIS
========================= */

window.carregarRelatorios = carregarRelatorios;
window.recarregarRelatorios = carregarRelatorios;