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

const CORES_CATEGORIA_API_RELATORIOS = {
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

const CORES_CATEGORIAS = {
  alimentacao: "#00CCFF",
  alimentação: "#00CCFF",

  assinaturas: "#FF7700",
  assinatura: "#FF7700",

  "contas pessoais": "#DA4175",
  contas: "#DA4175",
  conta: "#DA4175",

  educacao: "#E1CC0A",
  educação: "#E1CC0A",

  lazer: "#7B55E3",

  saude: "#44B948",
  saúde: "#44B948",

  outros: "#4F595B",
  outro: "#4F595B",

  moradia: "#4B2B0A",

  transporte: "#00CCFF",

  "cartao de credito": "#7B55E3",
  "cartão de crédito": "#7B55E3",

  "cartao de debito": "#E1CC0A",
  "cartão de débito": "#E1CC0A"
};

let categoriasAPIRelatorios = [];
let usuarioPertenceFamiliaRelatorios = false;
let membrosFamiliaRelatorios = [];

let ultimasReceitasRelatorios = [];
let ultimasDespesasRelatorios = [];

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  configurarMenu();
  configurarEventos();

  usuarioPertenceFamiliaRelatorios = await usuarioEstaEmFamiliaRelatorios();

  if (usuarioPertenceFamiliaRelatorios) {
    membrosFamiliaRelatorios = await carregarMembrosFamiliaRelatorios();
  } else {
    membrosFamiliaRelatorios = [];
  }

  await carregarCategoriasRelatoriosAPI();
  await carregarRelatorios();
});

window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  if (
    event.key.includes("moedaUsuario") ||
    event.key.includes("_despesasEditadasLocalmente") ||
    event.key === "categoriasAtualizadasEm" ||
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia" ||
    event.key === "receitasExcluidas" ||
    event.key === "despesasExcluidas" ||
    event.key.includes("_receitasExcluidas") ||
    event.key.includes("_despesasExcluidas") ||
    event.key === "receitasAtualizadasEm" ||
    event.key === "despesasAtualizadasEm" ||
    event.key === "dadosFinanceirosAtualizadosEm"
  ) {
    usuarioPertenceFamiliaRelatorios = await usuarioEstaEmFamiliaRelatorios();

    if (usuarioPertenceFamiliaRelatorios) {
      membrosFamiliaRelatorios = await carregarMembrosFamiliaRelatorios();
    } else {
      membrosFamiliaRelatorios = [];
    }

    await carregarCategoriasRelatoriosAPI();
    await carregarRelatorios();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  usuarioPertenceFamiliaRelatorios = await usuarioEstaEmFamiliaRelatorios();

  if (usuarioPertenceFamiliaRelatorios) {
    membrosFamiliaRelatorios = await carregarMembrosFamiliaRelatorios();
  } else {
    membrosFamiliaRelatorios = [];
  }

  await carregarCategoriasRelatoriosAPI();
  await carregarRelatorios();
});

window.addEventListener("dadosFinanceirosAtualizados", async () => {
  await carregarCategoriasRelatoriosAPI();
  await carregarRelatorios();
});

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
    payload.sub_email ||
    ""
  )
    .toLowerCase()
    .trim();
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

  return (
    localStorage.getItem(`${userKey}_${chave}`) ||
    sessionStorage.getItem(`${userKey}_${chave}`) ||
    localStorage.getItem(chave) ||
    sessionStorage.getItem(chave) ||
    ""
  );
}

function headersRelatorios(json = true) {
  const token = getTokenRelatorios();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function lerRespostaRelatorios(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiGetRelatorios(path) {
  const token = getTokenRelatorios();

  if (!token) {
    console.warn("Relatórios: token não encontrado.");
    return null;
  }

  try {
    const response = await fetch(`${RELATORIOS_API_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: headersRelatorios(false)
    });

    const data = await lerRespostaRelatorios(response);

    if (!response.ok) {
      console.warn("GET RELATÓRIOS falhou:", path, response.status, data);
      return null;
    }

    return data?.data || data;
  } catch (error) {
    console.warn("Erro na API de relatórios:", error);
    return null;
  }
}

async function apiFetchRelatorios(path, options = {}) {
  const response = await fetch(`${RELATORIOS_API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      ...headersRelatorios(true),
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    let erro = "Erro ao carregar dados dos relatórios.";

    try {
      if (contentType.includes("application/json")) {
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

  if (contentType.includes("application/pdf")) {
    return await response.blob();
  }

  return await lerRespostaRelatorios(response);
}

async function carregarCategoriasRelatoriosAPI() {
  try {
    const resposta = await apiGetRelatorios("/category/user");
    const lista = transformarEmArrayCategoriasRelatorios(resposta);

    categoriasAPIRelatorios = lista
      .map((item, index) => normalizarCategoriaRelatoriosAPI(item, index))
      .filter((categoria) => categoria.nome);

    categoriasAPIRelatorios = removerCategoriasDuplicadasRelatoriosAPI(categoriasAPIRelatorios);

  } catch (erro) {
    console.warn("Não foi possível carregar categorias da API nos relatórios:", erro);
    categoriasAPIRelatorios = [];
  }
}

function transformarEmArrayCategoriasRelatorios(resposta) {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;

  const possiveisListas = [
    resposta.data,
    resposta.items,
    resposta.categories,
    resposta.categorias,
    resposta.content,
    resposta.results,
    resposta.result,
    resposta.default,
    resposta.defaults,
    resposta.user,
    resposta.usuario,
    resposta.list,
    resposta.lista,

    resposta.data?.items,
    resposta.data?.categories,
    resposta.data?.categorias,
    resposta.data?.content,
    resposta.data?.results,
    resposta.data?.default,
    resposta.data?.defaults,
    resposta.data?.user,
    resposta.data?.usuario,
    resposta.data?.list,
    resposta.data?.lista
  ];

  for (const lista of possiveisListas) {
    if (Array.isArray(lista)) return lista;
  }

  return [];
}

function normalizarCategoriaRelatoriosAPI(item, index = 0) {
  const nome =
    item.name ||
    item.nome ||
    item.description ||
    item.descricao ||
    item.category ||
    item.categoria ||
    item.title ||
    "";

  const id =
    item.id ||
    item.categoryId ||
    item.category_id ||
    item.categoriaId ||
    item.categoria_id ||
    item.uuid ||
    `categoria-${index}`;

  const corClasse =
    item.color ||
    item.cor ||
    item.colorName ||
    item.color_name ||
    item.typeColor ||
    item.type_color ||
    item.style ||
    item.categoryColor ||
    item.category_color ||
    "";

  const corHex =
    item.hexColor ||
    item.hex_color ||
    item.colorHex ||
    item.color_hex ||
    item.backgroundColor ||
    item.background_color ||
    "";

  return {
    id: Number(id),
    nome: String(nome).trim(),
    corClasse: String(corClasse || "").trim(),
    cor: obterCorCategoriaRelatoriosAPI(nome, corClasse, corHex)
  };
}

function removerCategoriasDuplicadasRelatoriosAPI(lista) {
  const mapa = new Map();

  lista.forEach((categoria) => {
    const chave = normalizarTexto(categoria.nome);

    if (!mapa.has(chave)) {
      mapa.set(chave, categoria);
    }
  });

  return Array.from(mapa.values());
}

function obterCorCategoriaRelatoriosAPI(nome, corClasse = "", corHex = "") {
  const hex = String(corHex || "").trim();

  if (/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
    return hex;
  }

  const classe = String(corClasse || "").trim();

  if (CORES_CATEGORIA_API_RELATORIOS[classe]) {
    return CORES_CATEGORIA_API_RELATORIOS[classe];
  }

  const chave = normalizarTexto(nome);

  return CORES_CATEGORIAS[chave] || "#4F595B";
}

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
    avatar.innerHTML = "";
    avatar.textContent = "";

    avatar.style.width = "35px";
    avatar.style.height = "35px";
    avatar.style.minWidth = "35px";
    avatar.style.maxWidth = "35px";
    avatar.style.minHeight = "35px";
    avatar.style.maxHeight = "35px";
    avatar.style.borderRadius = "50%";
    avatar.style.overflow = "hidden";
    avatar.style.backgroundSize = "cover";
    avatar.style.backgroundPosition = "center";
    avatar.style.backgroundRepeat = "no-repeat";

    if (imagem) {
      avatar.style.backgroundImage = `url("${imagem}")`;
    } else {
      avatar.style.backgroundImage = "";
      avatar.textContent = String(nome || "U").charAt(0).toUpperCase();
    }
  }
}

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

    options += `<option value="${value}">${labelFormatado}</option>`;
  }

  filtro.innerHTML = options;
}

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
      headers: headersRelatorios(false)
    });

    if (resposta.status === 404) return false;
    if (!resposta.ok) return false;

    const data = await lerRespostaRelatorios(resposta);
    const membros = getMembersFromResponseRelatorios(data);

    localStorage.setItem("familiaAtual", JSON.stringify(data || {}));
    localStorage.setItem("membrosFamilia", JSON.stringify(membros || []));

    if (!Array.isArray(membros)) return true;

    return membros.length > 0 || Boolean(data);
  } catch (erro) {
    console.warn("Erro ao verificar família em relatórios:", erro);
    return false;
  }
}

async function carregarMembrosFamiliaRelatorios() {
  const resposta = await apiGetRelatorios("/family");

  if (!resposta) return [];

  return getMembersFromResponseRelatorios(resposta);
}

async function obterFamilyIdRelatorios() {
  const resposta = await apiGetRelatorios("/family");

  if (!resposta) return null;

  return (
    resposta?.id ||
    resposta?.familyId ||
    resposta?.family_id ||
    resposta?.familiaId ||
    resposta?.familia_id ||
    resposta?.family?.id ||
    resposta?.familia?.id ||
    resposta?.data?.id ||
    resposta?.data?.familyId ||
    null
  );
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
  )
    .toLowerCase()
    .trim();
}

function itemPertenceAoUsuarioLogadoRelatorios(item) {
  const idAtual = getIdUsuarioRelatorios();
  const emailAtual = getEmailUsuarioRelatorios();

  const idDono = pegarIdDonoRelatorios(item);
  const emailDono = pegarEmailDonoRelatorios(item);

  if (idsIguaisRelatorios(idAtual, idDono)) return true;
  if (emailsIguaisRelatorios(emailAtual, emailDono)) return true;

  if (!idDono && !emailDono) return true;

  return false;
}

function filtrarPorEscopoRelatorios(lista) {
  let resultado = normalizarLista(lista);

  if (!usuarioPertenceFamiliaRelatorios) {
    resultado = resultado.filter((item) => {
      return itemPertenceAoUsuarioLogadoRelatorios(item);
    });
  }

  return resultado;
}

async function carregarRelatorios() {
  try {
    const [receitasApi, despesasApi] = await Promise.all([
      buscarReceitas(),
      buscarDespesas()
    ]);

    let receitas = normalizarLista(receitasApi)
      .map((item) => normalizarTransacao(item, "receita"));

    let despesas = normalizarLista(despesasApi)
      .map((item) => normalizarTransacao(item, "despesa"));

    despesas = aplicarEdicoesLocaisRelatorios(despesas);

    receitas = receitas.filter((item) => !receitaFoiExcluidaRelatorios(item));
    despesas = despesas.filter((item) => !despesaFoiExcluidaRelatorios(item));

    receitas = filtrarPorEscopoRelatorios(receitas);
    despesas = filtrarPorEscopoRelatorios(despesas);

    receitas = removerDuplicadosRelatorios(receitas);
    despesas = removerDuplicadosRelatorios(despesas);

    ultimasReceitasRelatorios = receitas;
    ultimasDespesasRelatorios = despesas;

    const periodoSelecionado = obterPeriodoSelecionado();

    const receitasFiltradas = filtrarPorPeriodo(receitas, periodoSelecionado);
    const despesasFiltradas = filtrarPorPeriodo(despesas, periodoSelecionado);

    const totalReceitas = somarValores(receitasFiltradas);
    const totalDespesas = somarValores(despesasFiltradas);
    const saldo = totalReceitas - totalDespesas;

    atualizarCards(totalReceitas, totalDespesas, saldo);
    renderizarGraficoBarras(receitas, despesas);
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

    atualizarCards(0, 0, 0);
    renderizarGraficoBarras([], []);
    renderizarGraficoRosca([], 0);
    renderizarResumoMes([], [], 0, 0, 0);
  }
}

async function buscarReceitas() {
  const periodoSelecionado = obterPeriodoSelecionado();
  const [anoTexto, mesTexto] = String(periodoSelecionado || "").split("-");

  const mes = Number(mesTexto) || new Date().getMonth() + 1;
  const ano = Number(anoTexto) || new Date().getFullYear();

  if (usuarioPertenceFamiliaRelatorios) {
    const familyId = await obterFamilyIdRelatorios();

    if (familyId) {
      const respostaFamilia = await apiGetRelatorios(
        `/income/family/${familyId}?month=${mes}&year=${ano}`
      );

      const listaFamilia = transformarEmArrayRelatorios(respostaFamilia);

      return listaFamilia;
    }

    return [];
  }

  const respostaUsuario = await apiGetRelatorios(
    `/income/user?month=${mes}&year=${ano}`
  );

  return transformarEmArrayRelatorios(respostaUsuario);
}

async function buscarDespesas() {
  const periodoSelecionado = obterPeriodoSelecionado();
  const [anoTexto, mesTexto] = String(periodoSelecionado || "").split("-");

  const mes = Number(mesTexto) || new Date().getMonth() + 1;
  const ano = Number(anoTexto) || new Date().getFullYear();

  if (usuarioPertenceFamiliaRelatorios) {
    const familyId = await obterFamilyIdRelatorios();

    if (familyId) {
      const respostaFamilia = await apiGetRelatorios(
        `/expense/family/${familyId}?month=${mes}&year=${ano}`
      );

      const listaFamilia = transformarEmArrayRelatorios(respostaFamilia);

      return listaFamilia;
    }

    return [];
  }

  const respostaUsuario = await apiGetRelatorios(
    `/expense/user?month=${mes}&year=${ano}`
  );

  return transformarEmArrayRelatorios(respostaUsuario);
}

function getChaveDespesasEditadasRelatorios() {
  return `${getUserKeyRelatorios()}_despesasEditadasLocalmente`;
}

function lerDespesasEditadasLocalmenteRelatorios() {
  try {
    const dados = localStorage.getItem(getChaveDespesasEditadasRelatorios());

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function criarChaveEdicaoDespesaRelatorios(item) {
  return String(
    item?.expenseId ||
    item?.expense_id ||
    item?.id ||
    ""
  );
}

function aplicarEdicoesLocaisRelatorios(lista) {
  const editadas = lerDespesasEditadasLocalmenteRelatorios();

  if (!editadas.length) return lista;

  return lista.map((despesa) => {
    if (despesa.tipo !== "despesa") return despesa;

    const chaveDespesa = criarChaveEdicaoDespesaRelatorios(despesa);

    const editada = editadas.find((item) => {
      return criarChaveEdicaoDespesaRelatorios(item) === chaveDespesa;
    });

    if (!editada) return despesa;

    return normalizarTransacao(
      {
        ...despesa,
        ...editada
      },
      "despesa"
    );
  });
}

function lerListaStorageRelatorios(chave) {
  try {
    const lista = JSON.parse(localStorage.getItem(chave) || "[]");

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function lerReceitasExcluidasRelatorios() {
  return [
    ...lerListaStorageRelatorios("receitasExcluidas"),
    ...lerListaStorageRelatorios(getChaveUsuarioRelatorios("receitasExcluidas"))
  ];
}

function lerDespesasExcluidasRelatorios() {
  return [
    ...lerListaStorageRelatorios("despesasExcluidas"),
    ...lerListaStorageRelatorios(getChaveUsuarioRelatorios("despesasExcluidas"))
  ];
}

function receitaFoiExcluidaRelatorios(item) {
  if (!item || item.tipo !== "receita") return false;

  const excluidas = lerReceitasExcluidasRelatorios();

  const idsItem = [
    item.id,
    item.incomeId,
    item.income_id,
    item.transactionId,
    item.transaction_id,
    item.regraReceitaFixaId
  ]
    .filter(Boolean)
    .map(String);

  const descricaoItem = normalizarTexto(
    item.description ||
    item.descricao ||
    item.name ||
    item.nome ||
    ""
  );

  const valorItem = Number(
    item.value ??
    item.valor ??
    item.amount ??
    0
  );

  return excluidas.some((excluida) => {
    const idsExcluidos = [
      excluida.id,
      excluida.incomeId,
      excluida.income_id,
      ...(Array.isArray(excluida.ids) ? excluida.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    if (
      idsItem.length &&
      idsExcluidos.length &&
      idsItem.some((id) => idsExcluidos.includes(id))
    ) {
      return true;
    }

    const descricaoExcluida = normalizarTexto(
      excluida.description ||
      excluida.descricao ||
      excluida.name ||
      excluida.nome ||
      ""
    );

    const valorExcluido = Number(
      excluida.value ??
      excluida.valor ??
      excluida.amount ??
      0
    );

    return (
      descricaoItem &&
      descricaoItem === descricaoExcluida &&
      Number(valorItem || 0).toFixed(2) === Number(valorExcluido || 0).toFixed(2)
    );
  });
}

function despesaFoiExcluidaRelatorios(item) {
  if (!item || item.tipo !== "despesa") return false;

  const excluidas = lerDespesasExcluidasRelatorios();

  const idsItem = [
    item.id,
    item.expenseId,
    item.expense_id,
    item.transactionId,
    item.transaction_id,
    item.compraId,
    item.purchaseId
  ]
    .filter(Boolean)
    .map(String);

  const descricaoItem = normalizarTexto(
    item.description ||
    item.descricao ||
    item.name ||
    item.nome ||
    ""
  );

  const valorItem = Number(
    item.value ??
    item.valor ??
    item.amount ??
    item.total ??
    0
  );

  const dataItem = formatarDataISORelatorios(
    item.dateInitial ||
    item.data ||
    item.date ||
    ""
  );

  return excluidas.some((excluida) => {
    const idsExcluidos = [
      excluida.id,
      excluida.expenseId,
      excluida.expense_id,
      excluida.compraId,
      excluida.purchaseId,
      ...(Array.isArray(excluida.ids) ? excluida.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    if (
      idsItem.length &&
      idsExcluidos.length &&
      idsItem.some((id) => idsExcluidos.includes(id))
    ) {
      return true;
    }

    const descricaoExcluida = normalizarTexto(
      excluida.description ||
      excluida.descricao ||
      excluida.name ||
      excluida.nome ||
      ""
    );

    const valorExcluido = Number(
      excluida.value ??
      excluida.valor ??
      excluida.amount ??
      excluida.total ??
      0
    );

    const dataExcluida = formatarDataISORelatorios(
      excluida.dateInitial ||
      excluida.data ||
      excluida.date ||
      ""
    );

    return (
      descricaoItem &&
      descricaoItem === descricaoExcluida &&
      Number(valorItem || 0).toFixed(2) === Number(valorExcluido || 0).toFixed(2) &&
      dataItem &&
      dataExcluida &&
      dataItem === dataExcluida
    );
  });
}

function normalizarLista(dados) {
  return transformarEmArrayRelatorios(dados);
}

function transformarEmArrayRelatorios(dados) {
  if (!dados) return [];

  if (Array.isArray(dados)) return dados;

  const listas = [
    dados.data,
    dados.items,
    dados.content,
    dados.results,
    dados.incomes,
    dados.expenses,
    dados.revenues,
    dados.receitas,
    dados.despesas,
    dados.list,
    dados.lista,

    dados.data?.items,
    dados.data?.content,
    dados.data?.results,
    dados.data?.incomes,
    dados.data?.expenses,
    dados.data?.revenues,
    dados.data?.receitas,
    dados.data?.despesas,
    dados.data?.list,
    dados.data?.lista
  ];

  for (const lista of listas) {
    if (Array.isArray(lista)) return lista;
  }

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
  const tipo = tipoForcado || detectarTipoTransacao(item);

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

  const categoria = tipo === "receita"
    ? "Receita"
    : pegarCategoriaRelatorio(item);

  const descricao =
    item.description ||
    item.descricao ||
    item.name ||
    item.nome ||
    item.title ||
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

    incomeId:
      item.incomeId ||
      item.income_id ||
      (tipo === "receita" ? item.id : null) ||
      null,

    income_id:
      item.income_id ||
      item.incomeId ||
      (tipo === "receita" ? item.id : null) ||
      null,

    expenseId:
      item.expenseId ||
      item.expense_id ||
      (tipo === "despesa" ? item.id : null) ||
      null,

    expense_id:
      item.expense_id ||
      item.expenseId ||
      (tipo === "despesa" ? item.id : null) ||
      null,

    tipo,
    valor,
    value: valor,
    amount: valor,
    categoria: String(categoria),
    category: String(categoria),
    categoryName: String(categoria),
    descricao: String(descricao),
    description: String(descricao),
    data,
    dateInitial: data,

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
      "",

    compraId: item.compraId || item.purchaseId || null,
    parcelaAtual: item.parcelaAtual || item.currentInstallment || null,
    totalParcelas: item.totalParcelas || item.installments || null
  };
}

function pegarCategoriaRelatorio(item) {
  const categoriaId = pegarCategoriaIdRelatorio(item);
  const categoriaPorId = pegarNomeCategoriaPorIdRelatorio(categoriaId);

  const categoriaObj =
    typeof item.category === "object"
      ? item.category
      : typeof item.categoria === "object"
        ? item.categoria
        : null;

  if (categoriaObj) {
    return (
      categoriaObj.name ||
      categoriaObj.nome ||
      categoriaObj.description ||
      categoriaObj.descricao ||
      categoriaPorId ||
      "Outros"
    );
  }

  const categoriaTexto =
    item.categoria ||
    item.categoryName ||
    item.category_name ||
    item.nomeCategoria ||
    item.descriptionCategory ||
    item.typeCategory ||
    item.nameCategory ||
    categoriaPorId ||
    "";

  if (categoriaTexto && isNaN(Number(categoriaTexto))) {
    return String(categoriaTexto);
  }

  if (
    typeof item.category === "string" &&
    item.category &&
    isNaN(Number(item.category))
  ) {
    return item.category;
  }

  return "Outros";
}

function pegarCategoriaIdRelatorio(item) {
  const ids = [
    item?.categoryId,
    item?.category_id,
    item?.categoriaId,
    item?.categoria_id,
    item?.idCategory,
    item?.id_category,
    item?.category?.id,
    item?.categoria?.id,
    typeof item?.category === "number" ? item.category : null,
    typeof item?.categoria === "number" ? item.categoria : null
  ];

  for (const id of ids) {
    const numero = Number(id);

    if (Number.isInteger(numero) && numero > 0) {
      return numero;
    }
  }

  return null;
}

function pegarNomeCategoriaPorIdRelatorio(categoriaId) {
  const id = Number(categoriaId);

  if (!Number.isInteger(id) || id <= 0) return "";

  const categoria = categoriasAPIRelatorios.find((item) => Number(item.id) === id);

  return categoria?.nome || "";
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

function formatarDataISORelatorios(dataValor) {
  const data = converterData(dataValor);

  if (!data) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

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

  if (item.tipo === "despesa" && item.compraId && item.parcelaAtual) {
    return [
      "despesa-parcelada",
      item.compraId,
      item.parcelaAtual,
      dataISO,
      Number(item.valor || 0).toFixed(2)
    ].join("|");
  }

  const id =
    item.expenseId ||
    item.expense_id ||
    item.incomeId ||
    item.income_id ||
    item.id;

  if (id) {
    return `${item.tipo}|${id}`;
  }

  return null;
}

function removerDuplicadosRelatorios(lista) {
  const mapa = new Map();

  normalizarLista(lista).forEach((item) => {
    const chave = chaveEstritaRelatorios(item) || chaveFlexivelRelatorios(item);

    if (!mapa.has(chave)) {
      mapa.set(chave, item);
    }
  });

  return Array.from(mapa.values());
}

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

function atualizarInfoGrafico(dados) {
  const info = document.getElementById("info-grafico");

  if (!info) return;

  const ultimo = dados[dados.length - 1];

  if (!ultimo) {
    info.innerHTML = "";
    return;
  }

  const saldo = ultimo.receitas - ultimo.despesas;

  info.innerHTML = `
    <span>Mês selecionado</span>
    <strong>${formatarMoeda(saldo)}</strong>
    <small>
      Receitas: ${formatarMoeda(ultimo.receitas)}<br>
      Despesas: ${formatarMoeda(ultimo.despesas)}
    </small>
  `;
}

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
        <span class="percentual-categoria">(0%)</span>
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
    .map(([categoria, valor]) => {
      const percentual = totalReceitas > 0
        ? (valor / totalReceitas) * 100
        : (valor / totalDespesas) * 100;

      return {
        categoria,
        valor,
        percentual,
        cor: pegarCorCategoriaRelatorios(categoria)
      };
    })
    .sort((a, b) => b.valor - a.valor);

  let inicio = 0;
  const partes = [];

  categorias.forEach((item) => {
    const base = totalReceitas > 0 ? totalReceitas : totalDespesas;
    const grausCalculados = (item.valor / base) * 360;
    const graus = Math.min(grausCalculados, 360 - inicio);

    if (graus <= 0) return;

    const fim = inicio + graus;

    partes.push(`${item.cor} ${inicio}deg ${fim}deg`);

    inicio = fim;
  });

  if (inicio < 360) {
    partes.push(`#e5e7eb ${inicio}deg 360deg`);
  }

  grafico.style.background = `conic-gradient(${partes.join(", ")})`;

  categorias.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item-categoria";

    div.innerHTML = `
      <span class="bolinha-categoria" style="background:${item.cor};"></span>
      <span>${escapeHTML(item.categoria)}</span>
      <strong class="valor-categoria">${formatarMoeda(item.valor)}</strong>
      <span class="percentual-categoria">
        (${item.percentual.toFixed(1).replace(".", ",")}%)
      </span>
    `;

    lista.appendChild(div);
  });
}

function pegarCorCategoriaRelatorios(categoria) {
  const chave = normalizarTexto(categoria);

  const categoriaAPI = categoriasAPIRelatorios.find((item) => {
    return normalizarTexto(item.nome) === chave;
  });

  if (categoriaAPI?.cor) {
    return categoriaAPI.cor;
  }

  return CORES_CATEGORIAS[chave] || "#4F595B";
}

function renderizarResumoMes(receitas, despesas, totalReceitas, totalDespesas, saldo) {
  setText("resumo-receitas", formatarMoeda(totalReceitas));
  setText("resumo-despesas", formatarMoeda(totalDespesas));

  const maiorDespesa = [...despesas].sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0))[0];
  const menorDespesa = [...despesas].filter((item) => Number(item.valor || 0) > 0)
    .sort((a, b) => Number(a.valor || 0) - Number(b.valor || 0))[0];

  setText(
    "maior-despesa",
    maiorDespesa
      ? `${maiorDespesa.descricao} - ${formatarMoeda(maiorDespesa.valor)}`
      : "-"
  );

  setText(
    "menor-despesa",
    menorDespesa
      ? `${menorDespesa.descricao} - ${formatarMoeda(menorDespesa.valor)}`
      : "-"
  );

  const melhorDia = calcularMelhorDiaParaEconomizar(despesas);

  setText("melhor-dia", melhorDia || "-");

  atualizarProgressoMes();
  atualizarDicaMes(totalReceitas, totalDespesas, saldo);
}

function calcularMelhorDiaParaEconomizar(despesas) {
  if (!despesas.length) return "-";

  const gastosPorDia = {};

  DIAS_SEMANA.forEach((dia) => {
    gastosPorDia[dia] = 0;
  });

  despesas.forEach((item) => {
    const data = converterData(item.data);
    const diaSemana = DIAS_SEMANA[data.getDay()];

    gastosPorDia[diaSemana] += Number(item.valor || 0);
  });

  const ordenado = Object.entries(gastosPorDia)
    .sort((a, b) => a[1] - b[1]);

  return ordenado[0]?.[0] || "-";
}

function atualizarProgressoMes() {
  const progresso = document.getElementById("progresso-circular");
  const percentualEl = document.getElementById("percentual-mes");

  if (!progresso || !percentualEl) return;

  const periodo = obterPeriodoSelecionado();
  const hoje = new Date();

  const primeiroDia = new Date(periodo.ano, periodo.mes, 1);
  const ultimoDia = new Date(periodo.ano, periodo.mes + 1, 0);

  let percentual = 100;

  if (
    hoje.getFullYear() === periodo.ano &&
    hoje.getMonth() === periodo.mes
  ) {
    percentual = (hoje.getDate() / ultimoDia.getDate()) * 100;
  } else if (hoje < primeiroDia) {
    percentual = 0;
  }

  const graus = Math.min(Math.max(percentual, 0), 100) * 3.6;

  progresso.style.background = `conic-gradient(#2e7d32 0deg ${graus}deg, #e5e7eb ${graus}deg 360deg)`;
  percentualEl.textContent = `${Math.round(percentual)}%`;
}

function atualizarDicaMes(receitas, despesas, saldo) {
  const texto = document.getElementById("texto-dica");

  if (!texto) return;

  if (receitas <= 0 && despesas <= 0) {
    texto.textContent = "Ainda não há dados suficientes para gerar uma dica neste mês.";
    return;
  }

  if (saldo < 0) {
    texto.textContent = "Atenção: suas despesas ultrapassaram suas receitas neste período. Reveja os maiores gastos.";
    return;
  }

  const percentualGasto = receitas > 0 ? (despesas / receitas) * 100 : 0;

  if (percentualGasto >= 80) {
    texto.textContent = "Você já usou uma grande parte das receitas do mês. Tente reduzir gastos variáveis.";
    return;
  }

  if (percentualGasto >= 50) {
    texto.textContent = "Você está com um nível moderado de gastos. Continue acompanhando suas categorias principais.";
    return;
  }

  texto.textContent = "Você está no caminho certo! Continue assim para alcançar suas metas.";
}

async function exportarPdf() {
  try {
    const blob = await apiFetchRelatorios("/report/family", {
      method: "GET",
      headers: headersRelatorios(false)
    });

    if (!(blob instanceof Blob)) {
      throw new Error("PDF não retornado pela API.");
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `relatorio-fambudget-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  } catch (erro) {
    console.warn("Erro ao exportar PDF da API. Gerando impressão da tela:", erro);
    window.print();
  }
}

function exportarCsv() {
  const periodo = obterPeriodoSelecionado();

  const receitas = filtrarPorPeriodo(ultimasReceitasRelatorios, periodo);
  const despesas = filtrarPorPeriodo(ultimasDespesasRelatorios, periodo);

  const linhas = [
    ["Tipo", "Descrição", "Categoria", "Data", "Valor"],
    ...receitas.map((item) => [
      "Receita",
      item.descricao,
      item.categoria,
      formatarDataISORelatorios(item.data),
      String(Number(item.valor || 0)).replace(".", ",")
    ]),
    ...despesas.map((item) => [
      "Despesa",
      item.descricao,
      item.categoria,
      formatarDataISORelatorios(item.data),
      String(Number(item.valor || 0)).replace(".", ",")
    ])
  ];

  const conteudo = linhas
    .map((linha) => {
      return linha
        .map((campo) => `"${String(campo ?? "").replaceAll('"', '""')}"`)
        .join(";");
    })
    .join("\n");

  const blob = new Blob(["\uFEFF" + conteudo], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `relatorio-fambudget-${periodo.ano}-${String(periodo.mes + 1).padStart(2, "0")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function somarValores(lista) {
  return normalizarLista(lista).reduce((total, item) => {
    return total + Number(item.valor || 0);
  }, 0);
}

function setText(id, valor) {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = valor;
  }
}

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

function escapeHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.carregarRelatorios = carregarRelatorios;
window.recarregarRelatorios = carregarRelatorios;