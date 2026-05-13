const CATEGORIAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

const CORES_CATEGORIA_API = {
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

const CATEGORIAS_FIXAS = [
  "Alimentação",
  "Assinaturas",
  "Contas pessoais",
  "Educação",
  "Lazer",
  "Saúde",
  "Outros"
];

const MESES_CATEGORIAS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

let dataReferenciaCategorias = new Date();
let ultimoResumoCategorias = null;
let categoriasAPIUsuario = [];

let usuarioPertenceFamiliaCategorias = false;
let membrosFamiliaCategorias = [];

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuarioCategorias();
  configurarEventosCategorias();

  await atualizarEstadoFamiliaCategorias();

  await carregarCategoriasAPIUsuario();
  await carregarCategorias();
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
    await atualizarEstadoFamiliaCategorias();
    await carregarCategoriasAPIUsuario();
    await carregarCategorias();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  await atualizarEstadoFamiliaCategorias();
  await carregarCategoriasAPIUsuario();
  await carregarCategorias();
});

window.addEventListener("dadosFinanceirosAtualizados", async () => {
  await carregarCategoriasAPIUsuario();
  await carregarCategorias();
});

function carregarUsuarioCategorias() {
  const nome =
    buscarDadoUsuarioCategorias("nicknameUsuario") ||
    buscarDadoUsuarioCategorias("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário";

  const imagem =
    buscarDadoUsuarioCategorias("avatarUsuario") ||
    buscarDadoUsuarioCategorias("fotoUsuario") ||
    buscarDadoUsuarioCategorias("imagemPerfil") ||
    buscarDadoUsuarioCategorias("fotoPerfil") ||
    sessionStorage.getItem("avatarUsuario") ||
    localStorage.getItem("avatarUsuario") ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) {
    nomeUsuario.textContent = nome;
  }

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

function getPayloadTokenCategorias() {
  const token = getTokenCategorias();

  if (!token) return {};

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function getEmailUsuarioCategorias() {
  const payload = getPayloadTokenCategorias();

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

function getIdUsuarioCategorias() {
  const payload = getPayloadTokenCategorias();

  return (
    payload.user_id ||
    payload.userId ||
    payload.id ||
    payload.sub ||
    null
  );
}

function getUserKeyCategorias(email = null) {
  const emailFinal = email || getEmailUsuarioCategorias();

  return `fambudget_${String(emailFinal || "usuario").toLowerCase().trim()}`;
}

function getChaveUsuarioCategorias(chave) {
  return `${getUserKeyCategorias()}_${chave}`;
}

function buscarDadoUsuarioCategorias(chave, email = null) {
  const userKey = getUserKeyCategorias(email);

  return (
    localStorage.getItem(`${userKey}_${chave}`) ||
    sessionStorage.getItem(`${userKey}_${chave}`) ||
    ""
  );
}

function getTokenCategorias() {
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

function headersCategorias(json = false) {
  const token = getTokenCategorias();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function lerRespostaCategorias(res) {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiGetCategorias(path) {
  const token = getTokenCategorias();

  if (!token) {
    console.warn("Categorias: token não encontrado.");
    return null;
  }

  try {
    const res = await fetch(`${CATEGORIAS_API_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: headersCategorias(false)
    });

    const data = await lerRespostaCategorias(res);

    if (!res.ok) {
      console.warn("GET CATEGORIAS falhou:", path, res.status, data);
      return null;
    }

    return data?.data || data;
  } catch (erro) {
    console.warn("Erro na API de categorias:", erro);
    return null;
  }
}

async function atualizarEstadoFamiliaCategorias() {
  usuarioPertenceFamiliaCategorias = await usuarioEstaEmFamiliaCategorias();

  if (usuarioPertenceFamiliaCategorias) {
    membrosFamiliaCategorias = await carregarMembrosFamiliaCategorias();
  } else {
    membrosFamiliaCategorias = [];
  }
}

function getMembersFromResponseCategorias(data) {
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

    data?.familia?.members,
    data?.familia?.membros,
    data?.familia?.users,
    data?.familia?.usuarios,

    data?.familyMembers,
    data?.familiaMembers,
    data?.membersFamily,
    data?.membrosFamilia,

    data?.data?.familyMembers,
    data?.data?.familiaMembers,
    data?.data?.membersFamily,
    data?.data?.membrosFamilia
  ];

  return possiveisListas.find((lista) => Array.isArray(lista)) || [];
}

async function usuarioEstaEmFamiliaCategorias() {
  const token = getTokenCategorias();

  if (!token) return false;

  try {
    const resposta = await fetch(`${CATEGORIAS_API_URL}/family`, {
      method: "GET",
      cache: "no-store",
      headers: headersCategorias(false)
    });

    if (resposta.status === 404) return false;
    if (!resposta.ok) return false;

    const data = await lerRespostaCategorias(resposta);
    const membros = getMembersFromResponseCategorias(data);

    localStorage.setItem("familiaAtual", JSON.stringify(data || {}));
    localStorage.setItem("membrosFamilia", JSON.stringify(membros || []));

    return membros.length > 0 || Boolean(data);
  } catch (erro) {
    console.warn("Erro ao verificar família em categorias:", erro);
    return false;
  }
}

async function carregarMembrosFamiliaCategorias() {
  const token = getTokenCategorias();

  if (!token) return [];

  try {
    const resposta = await fetch(`${CATEGORIAS_API_URL}/family`, {
      method: "GET",
      cache: "no-store",
      headers: headersCategorias(false)
    });

    if (!resposta.ok) return [];

    const data = await lerRespostaCategorias(resposta);
    const membros = getMembersFromResponseCategorias(data);

    localStorage.setItem("familiaAtual", JSON.stringify(data || {}));
    localStorage.setItem("membrosFamilia", JSON.stringify(membros || []));

    return membros;
  } catch (erro) {
    console.warn("Erro ao carregar membros da família em categorias:", erro);
    return [];
  }
}

async function obterFamilyIdCategorias() {
  const resposta = await apiGetCategorias("/family");

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

function idsIguaisCategorias(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return false;

  return String(a) === String(b);
}

function emailsIguaisCategorias(a, b) {
  if (!a || !b) return false;

  return String(a).toLowerCase().trim() === String(b).toLowerCase().trim();
}

function pegarIdDonoCategorias(item) {
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

function pegarEmailDonoCategorias(item) {
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

function itemPertenceAoUsuarioLogadoCategorias(item) {
  const idAtual = getIdUsuarioCategorias();
  const emailAtual = getEmailUsuarioCategorias();

  const idDono = pegarIdDonoCategorias(item);
  const emailDono = pegarEmailDonoCategorias(item);

  if (idsIguaisCategorias(idAtual, idDono)) return true;
  if (emailsIguaisCategorias(emailAtual, emailDono)) return true;

  if (!idDono && !emailDono) return true;

  return false;
}

function filtrarPorEscopoCategorias(lista) {
  const dados = Array.isArray(lista) ? lista : [];

  if (usuarioPertenceFamiliaCategorias) {
    return dados;
  }

  return dados.filter((item) => itemPertenceAoUsuarioLogadoCategorias(item));
}

async function carregarCategoriasAPIUsuario() {
  const resposta = await apiGetCategorias("/category/user");
  const lista = transformarEmArrayCategoriasAPI(resposta);

  categoriasAPIUsuario = lista
    .map((item, index) => normalizarCategoriaAPIUsuario(item, index))
    .filter((categoria) => categoria.nome);

  categoriasAPIUsuario = removerCategoriasDuplicadasAPI(categoriasAPIUsuario);

}

function transformarEmArrayCategoriasAPI(resposta) {
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

function normalizarCategoriaAPIUsuario(item, index = 0) {
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
    id,
    nome: String(nome).trim(),
    corClasse: String(corClasse || "").trim(),
    cor: obterCorCategoriaAPI(nome, corClasse, corHex)
  };
}

function removerCategoriasDuplicadasAPI(lista) {
  const mapa = new Map();

  lista.forEach((categoria) => {
    const chave = normalizarTextoCategorias(categoria.nome);

    if (!mapa.has(chave)) {
      mapa.set(chave, categoria);
    }
  });

  return Array.from(mapa.values());
}

function obterCorCategoriaAPI(nome, corClasse = "", corHex = "") {
  const hex = String(corHex || "").trim();

  if (/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
    return hex;
  }

  const classe = String(corClasse || "").trim();

  if (CORES_CATEGORIA_API[classe]) {
    return CORES_CATEGORIA_API[classe];
  }

  const chave = normalizarTextoCategorias(nome);

  return CORES_CATEGORIAS[chave] || "#4F595B";
}

function getCategoriasParaResumo() {
  const nomesAPI = categoriasAPIUsuario.map((categoria) => categoria.nome);
  const nomesFinais = [...CATEGORIAS_FIXAS, ...nomesAPI];

  const mapa = new Map();

  nomesFinais.forEach((nome) => {
    const chave = normalizarTextoCategorias(nome);

    if (!mapa.has(chave)) {
      mapa.set(chave, nome);
    }
  });

  return Array.from(mapa.values());
}

function configurarEventosCategorias() {
  const btnAnterior = document.getElementById("mes-anterior");
  const btnProximo = document.getElementById("proximo-mes");
  const btnAtualizar = document.getElementById("btn-atualizar");

  if (btnAnterior) {
    btnAnterior.addEventListener("click", async () => {
      dataReferenciaCategorias.setMonth(dataReferenciaCategorias.getMonth() - 1);
      await carregarCategoriasAPIUsuario();
      await carregarCategorias();
    });
  }

  if (btnProximo) {
    btnProximo.addEventListener("click", async () => {
      dataReferenciaCategorias.setMonth(dataReferenciaCategorias.getMonth() + 1);
      await carregarCategoriasAPIUsuario();
      await carregarCategorias();
    });
  }

  if (btnAtualizar) {
    btnAtualizar.addEventListener("click", async () => {
      await carregarCategoriasAPIUsuario();
      await carregarCategorias();
    });
  }

  document.querySelectorAll(".menu li[data-link]").forEach((item) => {
    item.addEventListener("click", () => {
      window.location.href = item.dataset.link;
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

async function carregarCategorias() {
  atualizarTituloMesCategorias();

  const mes = dataReferenciaCategorias.getMonth() + 1;
  const ano = dataReferenciaCategorias.getFullYear();

  let despesasApiResposta = null;
  let receitasApiResposta = null;

  if (usuarioPertenceFamiliaCategorias) {
    const familyId = await obterFamilyIdCategorias();

    if (familyId) {
      const [despesasFamilia, receitasFamilia] = await Promise.all([
        apiGetCategorias(`/expense/family/${familyId}?month=${mes}&year=${ano}`),
        apiGetCategorias(`/income/family/${familyId}?month=${mes}&year=${ano}`)
      ]);

      const despesasFamiliaLista = transformarEmArrayCategorias(despesasFamilia);
      const receitasFamiliaLista = transformarEmArrayCategorias(receitasFamilia);

      despesasApiResposta = despesasFamiliaLista;
      receitasApiResposta = receitasFamiliaLista;
    }
  } else {
    despesasApiResposta = await apiGetCategorias(`/expense/user?month=${mes}&year=${ano}`);
    receitasApiResposta = await apiGetCategorias(`/income/user?month=${mes}&year=${ano}`);
  }

  let despesasApi = transformarEmArrayCategorias(despesasApiResposta)
    .map((item) => normalizarItemFinanceiroCategorias(item, "despesa"));

  let receitasApi = transformarEmArrayCategorias(receitasApiResposta)
    .map((item) => normalizarItemFinanceiroCategorias(item, "receita"));

  despesasApi = aplicarEdicoesLocaisCategorias(despesasApi);

  despesasApi = despesasApi.filter((item) => !despesaFoiExcluidaCategorias(item));
  receitasApi = receitasApi.filter((item) => !receitaFoiExcluidaCategorias(item));

  if (!usuarioPertenceFamiliaCategorias) {
    despesasApi = filtrarPorEscopoCategorias(despesasApi);
    receitasApi = filtrarPorEscopoCategorias(receitasApi);
  }

  despesasApi = removerDuplicadasCategorias(despesasApi, "despesa");
  receitasApi = removerDuplicadasCategorias(receitasApi, "receita");

  const despesasDoMes = removerDuplicadasCategorias(
    filtrarItensPorMesEAnoCategorias(despesasApi, mes, ano),
    "despesa"
  );

  const receitasDoMes = removerDuplicadasCategorias(
    filtrarItensPorMesEAnoCategorias(receitasApi, mes, ano),
    "receita"
  );

  const totalReceitasMes = calcularTotalReceitasCategorias(receitasDoMes);

  const resumo = montarResumoCategorias(despesasDoMes);

  ultimoResumoCategorias = resumo;

  renderizarCategorias(resumo, totalReceitasMes);
}

function getChaveDespesasEditadasCategorias() {
  return `${getUserKeyCategorias()}_despesasEditadasLocalmente`;
}

function lerDespesasEditadasLocalmenteCategorias() {
  try {
    const dados = localStorage.getItem(getChaveDespesasEditadasCategorias());

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function criarChaveEdicaoDespesaCategorias(item) {
  return String(
    item?.expenseId ||
    item?.expense_id ||
    item?.id ||
    ""
  );
}

function aplicarEdicoesLocaisCategorias(lista) {
  const editadas = lerDespesasEditadasLocalmenteCategorias();

  if (!editadas.length) return lista;

  return lista.map((despesa) => {
    if (despesa.tipo !== "despesa") return despesa;

    const chaveDespesa = criarChaveEdicaoDespesaCategorias(despesa);

    const editada = editadas.find((item) => {
      return criarChaveEdicaoDespesaCategorias(item) === chaveDespesa;
    });

    if (!editada) return despesa;

    return normalizarItemFinanceiroCategorias(
      {
        ...despesa,
        ...editada
      },
      "despesa"
    );
  });
}

function lerListaStorageCategorias(chave) {
  try {
    const lista = JSON.parse(localStorage.getItem(chave) || "[]");

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function lerReceitasExcluidasCategorias() {
  return [
    ...lerListaStorageCategorias("receitasExcluidas"),
    ...lerListaStorageCategorias(getChaveUsuarioCategorias("receitasExcluidas"))
  ];
}

function lerDespesasExcluidasCategorias() {
  return [
    ...lerListaStorageCategorias("despesasExcluidas"),
    ...lerListaStorageCategorias(getChaveUsuarioCategorias("despesasExcluidas"))
  ];
}

function receitaFoiExcluidaCategorias(item) {
  if (!item) return false;

  const excluidas = lerReceitasExcluidasCategorias();

  const idsItem = [
    item.id,
    item.incomeId,
    item.income_id,
    item.transactionId,
    item.transaction_id
  ]
    .filter(Boolean)
    .map(String);

  const descricaoItem = normalizarTextoCategorias(
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

    const descricaoExcluida = normalizarTextoCategorias(
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

function despesaFoiExcluidaCategorias(item) {
  if (!item) return false;

  const excluidas = lerDespesasExcluidasCategorias();

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

  const descricaoItem = normalizarTextoCategorias(
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

  const dataItem = normalizarDataChaveCategorias(
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

    const descricaoExcluida = normalizarTextoCategorias(
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

    const dataExcluida = normalizarDataChaveCategorias(
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

function normalizarItemFinanceiroCategorias(item, tipoPadrao) {
  const tipo = tipoPadrao === "receita" ? "receita" : "despesa";
  const data = pegarDataCategoria(item);
  const valor = pegarValorCategoria(item);

  const categoria = tipo === "receita"
    ? "Receita"
    : pegarCategoria(item);

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
    data,
    dateInitial: data,
    valor,
    value: valor,
    amount: valor,

    descricao:
      item.descricao ||
      item.description ||
      item.name ||
      item.nome ||
      item.title ||
      "Sem descrição",

    description:
      item.description ||
      item.descricao ||
      item.name ||
      item.nome ||
      item.title ||
      "Sem descrição",

    categoria,
    category: categoria,
    categoryName: categoria,
    nomeCategoria: categoria,

    categoriaId: pegarCategoriaIdCategoria(item),
    categoryId: pegarCategoriaIdCategoria(item),

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
      ""
  };
}

function pegarCategoriaIdCategoria(item) {
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

function calcularTotalReceitasCategorias(receitas) {
  return receitas.reduce((total, item) => {
    return total + pegarValorCategoria(item);
  }, 0);
}

function filtrarItensPorMesEAnoCategorias(itens, mes, ano) {
  return itens.filter((item) => {
    const data = pegarDataCategoria(item);

    if (!data) return false;

    const dataConvertida = converterDataCategoria(data);

    if (!dataConvertida) return false;

    return (
      dataConvertida.getMonth() + 1 === mes &&
      dataConvertida.getFullYear() === ano
    );
  });
}

function pegarDataCategoria(item) {
  return (
    item.dataISO ||
    item.dateInitial ||
    item.date ||
    item.data ||
    item.createdAt ||
    item.paymentDate ||
    item.dueDate ||
    item.created_at ||
    item.updatedAt ||
    item.dataTransacao ||
    item.transactionDate ||
    ""
  );
}

function converterDataCategoria(data) {
  if (!data) return null;

  if (data instanceof Date) {
    return data;
  }

  const texto = String(data).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    const [ano, mes, dia] = texto.substring(0, 10).split("-");
    return new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split("/");
    return new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0);
  }

  const dataConvertida = new Date(texto);

  if (isNaN(dataConvertida.getTime())) {
    return null;
  }

  return dataConvertida;
}

function transformarEmArrayCategorias(resposta) {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;

  const possiveis = [
    resposta.data,
    resposta.items,
    resposta.results,
    resposta.expenses,
    resposta.despesas,
    resposta.incomes,
    resposta.receitas,
    resposta.revenues,
    resposta.list,
    resposta.lista,

    resposta.data?.items,
    resposta.data?.results,
    resposta.data?.expenses,
    resposta.data?.despesas,
    resposta.data?.incomes,
    resposta.data?.receitas,
    resposta.data?.revenues,
    resposta.data?.list,
    resposta.data?.lista
  ];

  for (const lista of possiveis) {
    if (Array.isArray(lista)) return lista;
  }

  return [];
}

function pegarIdItemCategorias(item) {
  if (!item || typeof item !== "object") return null;

  return (
    item.id ||
    item.expenseId ||
    item.expense_id ||
    item.incomeId ||
    item.income_id ||
    item.transactionId ||
    item.transaction_id ||
    item._id ||
    null
  );
}

function criarChaveDuplicadaCategorias(item, tipo = "") {
  if (!item || typeof item !== "object") return "";

  const id = pegarIdItemCategorias(item);

  if (id) {
    return `${tipo}|id|${String(id)}`;
  }

  const data = normalizarDataChaveCategorias(pegarDataCategoria(item));
  const categoria = normalizarTextoCategorias(pegarCategoria(item));
  const valor = pegarValorCategoria(item).toFixed(2);

  const descricao = normalizarTextoCategorias(
    item.descricao ||
    item.description ||
    item.nome ||
    item.name ||
    item.title ||
    ""
  );

  return [
    tipo,
    data,
    categoria,
    valor,
    descricao
  ].join("|");
}

function normalizarDataChaveCategorias(data) {
  const dataConvertida = converterDataCategoria(data);

  if (!dataConvertida) return "";

  const ano = dataConvertida.getFullYear();
  const mes = String(dataConvertida.getMonth() + 1).padStart(2, "0");
  const dia = String(dataConvertida.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function removerDuplicadasCategorias(lista, tipo = "") {
  if (!Array.isArray(lista)) return [];

  const mapa = new Map();

  lista.forEach((item) => {
    const chave = criarChaveDuplicadaCategorias(item, tipo);

    if (!chave) return;

    if (!mapa.has(chave)) {
      mapa.set(chave, item);
    }
  });

  return Array.from(mapa.values());
}

function montarResumoCategorias(despesas) {
  const resumo = {};

  getCategoriasParaResumo().forEach((categoria) => {
    resumo[categoria] = 0;
  });

  despesas.forEach((item) => {
    const categoriaOriginal = pegarCategoria(item);
    const categoriaFinal = normalizarNomeCategoria(categoriaOriginal);
    const valor = pegarValorCategoria(item);

    if (!resumo[categoriaFinal]) {
      resumo[categoriaFinal] = 0;
    }

    resumo[categoriaFinal] += valor;
  });

  return resumo;
}

function pegarCategoria(item) {
  const categoriaId = pegarCategoriaIdCategoria(item);

  const categoriaPorId = categoriasAPIUsuario.find((categoria) => {
    return Number(categoria.id) === Number(categoriaId);
  });

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
      categoriaPorId?.nome ||
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
    categoriaPorId?.nome ||
    "";

  if (categoriaTexto && isNaN(Number(categoriaTexto))) {
    return categoriaTexto;
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

function normalizarNomeCategoria(categoria) {
  const texto = normalizarTextoCategorias(categoria);

  const categoriaAPI = categoriasAPIUsuario.find((item) => {
    return normalizarTextoCategorias(item.nome) === texto;
  });

  if (categoriaAPI) {
    return categoriaAPI.nome;
  }

  if (texto.includes("alimentacao")) return "Alimentação";
  if (texto.includes("assinatura")) return "Assinaturas";

  if (
    texto.includes("conta") ||
    texto.includes("pessoal") ||
    texto.includes("pessoais")
  ) {
    return "Contas pessoais";
  }

  if (
    texto.includes("educacao") ||
    texto.includes("faculdade") ||
    texto.includes("escola") ||
    texto.includes("curso")
  ) {
    return "Educação";
  }

  if (texto.includes("lazer")) return "Lazer";

  if (
    texto.includes("saude") ||
    texto.includes("farmacia") ||
    texto.includes("hospital") ||
    texto.includes("medico")
  ) {
    return "Saúde";
  }

  if (
    texto.includes("outros") ||
    texto.includes("outro")
  ) {
    return "Outros";
  }

  if (texto.includes("transporte")) return "Transporte";

  if (
    texto.includes("moradia") ||
    texto.includes("aluguel") ||
    texto.includes("casa")
  ) {
    return "Moradia";
  }

  if (
    texto.includes("credito") ||
    texto.includes("cartao de credito")
  ) {
    return "Cartão de Crédito";
  }

  if (
    texto.includes("debito") ||
    texto.includes("cartao de debito")
  ) {
    return "Cartão de Débito";
  }

  const nomeOriginal = String(categoria || "").trim();

  if (nomeOriginal) {
    return nomeOriginal.charAt(0).toUpperCase() + nomeOriginal.slice(1);
  }

  return "Outros";
}

function pegarValorCategoria(item) {
  const valorBruto =
    item.valor ??
    item.amount ??
    item.value ??
    item.total ??
    item.price ??
    item.valorTotal ??
    item.totalValue ??
    item.totalAmount ??
    0;

  if (typeof valorBruto === "number") {
    return Math.abs(valorBruto);
  }

  const valorTexto = String(valorBruto)
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

  return Math.abs(Number(valorTexto) || 0);
}

function calcularPercentualDespesaSobreReceitas(valorDespesa, totalReceitasMes) {
  const despesa = Number(valorDespesa) || 0;
  const receitas = Number(totalReceitasMes) || 0;

  if (receitas <= 0) return 0;

  return (despesa / receitas) * 100;
}

function renderizarCategorias(resumo, totalReceitasMes = 0) {
  const lista = document.getElementById("lista-categorias");
  const semDados = document.getElementById("sem-dados");
  const totalDonut = document.getElementById("total-donut");

  if (!lista) return;

  lista.innerHTML = "";

  const categoriasTabela = Object.entries(resumo)
    .map(([nome, valor]) => ({
      nome,
      valor,
      cor: pegarCorCategoria(nome)
    }));

  const categoriasResumo = categoriasTabela
    .filter((item) => item.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const totalDespesas = categoriasResumo.reduce((soma, item) => soma + item.valor, 0);

  atualizarTotalGastoTopo(totalDespesas);

  if (totalDonut) {
    totalDonut.textContent = formatarMoedaCategorias(totalDespesas);
  }

  if (semDados) {
    semDados.style.display = categoriasResumo.length ? "none" : "block";
  }

  categoriasTabela.forEach((item) => {
    const percentual = calcularPercentualDespesaSobreReceitas(item.valor, totalReceitasMes);
    const larguraBarra = Math.min(percentual, 100);

    const div = document.createElement("div");
    div.className = "categoria-item";

    div.innerHTML = `
      <div class="categoria-nome">
        <span class="categoria-bolinha" style="background:${item.cor}"></span>
        <span>${escapeHTMLCategorias(item.nome)}</span>
      </div>

      <div class="barra-container">
        <div 
          class="barra-preenchida" 
          style="width:${larguraBarra}%; background:${item.cor};"
        ></div>
      </div>

      <div class="categoria-percentual">
        ${percentual.toFixed(1).replace(".", ",")}%
      </div>

      <div class="categoria-valor">
        ${formatarMoedaCategorias(item.valor)}
      </div>
    `;

    lista.appendChild(div);
  });

  renderizarDonutCategorias(categoriasResumo, totalReceitasMes);
}

function atualizarTotalGastoTopo(total) {
  const valorFormatado = formatarMoedaCategorias(total);

  const totalPorId =
    document.getElementById("total-gasto-mes") ||
    document.getElementById("t");

  if (totalPorId) {
    totalPorId.textContent = valorFormatado;
  }

  const totalNoCard = document.querySelector(".resumo-categorias h2");

  if (totalNoCard) {
    totalNoCard.textContent = valorFormatado;
  }

}

function renderizarDonutCategorias(categorias, totalReceitasMes = 0) {
  const donut = document.getElementById("donut-categorias");
  const legenda = document.getElementById("legenda-donut");

  if (!donut || !legenda) return;

  legenda.innerHTML = "";

  const totalDespesas = categorias.reduce((soma, item) => soma + item.valor, 0);

  if (totalDespesas <= 0 || totalReceitasMes <= 0) {
    donut.style.background = "conic-gradient(#e5e7eb 0deg 360deg)";
    return;
  }

  let inicio = 0;
  const partes = [];

  categorias.forEach((item) => {
    if (item.valor <= 0) return;

    const percentual = calcularPercentualDespesaSobreReceitas(item.valor, totalReceitasMes);
    const grausCalculados = (percentual / 100) * 360;
    const graus = Math.min(grausCalculados, 360 - inicio);

    if (graus <= 0) return;

    const fim = inicio + graus;

    partes.push(`${item.cor} ${inicio}deg ${fim}deg`);
    inicio = fim;

    const div = document.createElement("div");
    div.className = "legenda-item";

    div.innerHTML = `
      <span class="legenda-cor" style="background:${item.cor}"></span>
      <span>${escapeHTMLCategorias(item.nome)}</span>
      <span class="legenda-valor">${percentual.toFixed(1).replace(".", ",")}%</span>
    `;

    legenda.appendChild(div);
  });

  if (inicio < 360) {
    partes.push(`#e5e7eb ${inicio}deg 360deg`);
  }

  donut.style.background = `conic-gradient(${partes.join(", ")})`;
}

function atualizarTituloMesCategorias() {
  const mesAtual = document.getElementById("mes-atual");

  if (!mesAtual) return;

  const mes = MESES_CATEGORIAS[dataReferenciaCategorias.getMonth()];
  const ano = dataReferenciaCategorias.getFullYear();

  mesAtual.textContent = `${mes} ${ano}`;
}

function pegarCorCategoria(categoria) {
  const chave = normalizarTextoCategorias(categoria);

  const categoriaAPI = categoriasAPIUsuario.find((item) => {
    return normalizarTextoCategorias(item.nome) === chave;
  });

  if (categoriaAPI && categoriaAPI.cor) {
    return categoriaAPI.cor;
  }

  return CORES_CATEGORIAS[chave] || "#4F595B";
}

function removerAcentos(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarTextoCategorias(texto) {
  return removerAcentos(String(texto || "").toLowerCase().trim());
}

function obterMoedaCategorias() {
  const email =
    getEmailUsuarioCategorias() ||
    "usuario";

  const userKey = `fambudget_${String(email).toLowerCase().trim()}`;

  return (
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoedaCategorias(valor) {
  const moeda = obterMoedaCategorias();

  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: moeda
    });
  } catch (erro) {
    console.warn("Moeda inválida em categorias:", moeda, erro);

    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}

function escapeHTMLCategorias(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.carregarCategorias = carregarCategorias;
window.recarregarCategorias = carregarCategorias;