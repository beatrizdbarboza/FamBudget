console.log("HOME.JS OK - ATUALIZADO COM STORAGE POR CONTA E SEM DUPLICAR");

const HOME_API_URL = "https://www.manage-control-dev.com.br/api/v1";

let usuarioPertenceFamiliaHome = false;

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();

  usuarioPertenceFamiliaHome = await usuarioEstaEmFamiliaHome();

  gerarReceitasFixasHome();
  await carregarDadosFinanceiros();

  configurarLogoutHome();

  if (typeof configurarModalFamilia === "function") {
    configurarModalFamilia();
  }
});

window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  if (
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia"
  ) {
    usuarioPertenceFamiliaHome = await usuarioEstaEmFamiliaHome();
    await carregarDadosFinanceiros();
  }

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
    await carregarDadosFinanceiros();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  usuarioPertenceFamiliaHome = await usuarioEstaEmFamiliaHome();
  await carregarDadosFinanceiros();
});

window.addEventListener("dadosFinanceirosAtualizados", async () => {
  await carregarDadosFinanceiros();
});

/* ================= TOKEN / USUÁRIO ================= */

function getTokenHome() {
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

function getPayloadTokenHome() {
  const token = getTokenHome();

  if (!token) return {};

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function headersHome() {
  return {
    Authorization: `Bearer ${getTokenHome()}`
  };
}

function getEmailUsuarioLogadoHome() {
  const payload = getPayloadTokenHome();

  return String(
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    payload.email ||
    payload.user_email ||
    ""
  ).toLowerCase().trim();
}

function getIdUsuarioLogadoHome() {
  const payload = getPayloadTokenHome();

  return (
    payload.user_id ||
    payload.userId ||
    payload.id ||
    payload.sub ||
    null
  );
}

function getUserKeyHome(email = null) {
  const emailFinal = email || getEmailUsuarioLogadoHome();
  return `fambudget_${String(emailFinal || "usuario").toLowerCase().trim()}`;
}

function getChaveUsuarioHome(chave) {
  return `${getUserKeyHome()}_${chave}`;
}

function buscarDadoUsuarioHome(chave, email = null) {
  const userKey = getUserKeyHome(email);
  return localStorage.getItem(`${userKey}_${chave}`) || "";
}

function carregarUsuario() {
  const nome =
    buscarDadoUsuarioHome("nicknameUsuario") ||
    buscarDadoUsuarioHome("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário";

  const imagem =
    buscarDadoUsuarioHome("avatarUsuario") ||
    buscarDadoUsuarioHome("fotoUsuario") ||
    buscarDadoUsuarioHome("imagemPerfil") ||
    buscarDadoUsuarioHome("fotoPerfil") ||
    sessionStorage.getItem("avatarUsuario") ||
    localStorage.getItem("avatarUsuario") ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const saudacao = document.getElementById("saudacao");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) nomeUsuario.textContent = nome;
  if (saudacao) saudacao.textContent = `Olá, ${nome}!`;

  if (avatar) {
    /*
      IMPORTANTE:
      Remove qualquer <img> gigante que outro arquivo possa ter colocado dentro do avatar.
      Depois usa apenas background-image dentro do círculo.
    */
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
      avatar.textContent = nome.charAt(0).toUpperCase();
    }
  }
}

/* ================= LOGOUT SEGURO ================= */

function configurarLogoutHome() {
  const logoutBtn = document.getElementById("logout-btn");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    /*
      Não use localStorage.clear().
      Assim receitas, despesas e preferências continuam salvas por conta.
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

/* ================= MOEDA ================= */

function obterMoedaUsuario() {
  const email =
    getEmailUsuarioLogadoHome() ||
    "usuario";

  const userKey = `fambudget_${String(email).toLowerCase().trim()}`;

  return (
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoeda(valor) {
  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaUsuario()
    });
  } catch {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}

function formatar(valor) {
  return formatarMoeda(valor);
}

/* ================= API ================= */

async function lerRespostaHome(res) {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiGetHome(path) {
  const token = getTokenHome();

  if (!token) return null;

  try {
    const res = await fetch(`${HOME_API_URL}${path}`, {
      cache: "no-store",
      headers: headersHome()
    });

    const data = await lerRespostaHome(res);

    if (!res.ok) {
      console.warn("GET HOME falhou:", path, res.status, data);
      return null;
    }

    return data?.data || data;
  } catch (erro) {
    console.warn("Erro ao buscar API Home:", erro);
    return null;
  }
}

function transformarEmArray(resposta) {
  if (!resposta) return [];

  if (Array.isArray(resposta)) return resposta;

  if (Array.isArray(resposta.data)) return resposta.data;
  if (Array.isArray(resposta.items)) return resposta.items;
  if (Array.isArray(resposta.results)) return resposta.results;

  if (Array.isArray(resposta.expenses)) return resposta.expenses;
  if (Array.isArray(resposta.incomes)) return resposta.incomes;
  if (Array.isArray(resposta.revenues)) return resposta.revenues;

  if (Array.isArray(resposta.receitas)) return resposta.receitas;
  if (Array.isArray(resposta.despesas)) return resposta.despesas;

  if (resposta.data && typeof resposta.data === "object") {
    if (Array.isArray(resposta.data.items)) return resposta.data.items;
    if (Array.isArray(resposta.data.results)) return resposta.data.results;
    if (Array.isArray(resposta.data.expenses)) return resposta.data.expenses;
    if (Array.isArray(resposta.data.incomes)) return resposta.data.incomes;
    if (Array.isArray(resposta.data.revenues)) return resposta.data.revenues;
    if (Array.isArray(resposta.data.receitas)) return resposta.data.receitas;
    if (Array.isArray(resposta.data.despesas)) return resposta.data.despesas;
  }

  return [];
}

/* ================= FAMÍLIA ================= */

function getMembersFromResponseHome(data) {
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

async function usuarioEstaEmFamiliaHome() {
  const token = getTokenHome();

  if (!token) return false;

  try {
    const resposta = await fetch(`${HOME_API_URL}/family`, {
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
    const membros = getMembersFromResponseHome(data);

    if (!Array.isArray(membros)) return true;

    return membros.length > 0;
  } catch (erro) {
    console.warn("Erro ao verificar família na Home:", erro);
    return false;
  }
}

/* ================= DONO / ESCOPO ================= */

function normalizarTextoHome(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function idsIguaisHome(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}

function emailsIguaisHome(a, b) {
  if (!a || !b) return false;
  return String(a).toLowerCase().trim() === String(b).toLowerCase().trim();
}

function pegarIdDonoHome(item) {
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

function pegarEmailDonoHome(item) {
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

function itemPertenceAFamiliaHome(item) {
  if (!item || typeof item !== "object") return false;

  const origem = normalizarTextoHome(item.origem || item.source || item.tipoOrigem || item.origin || "");
  const escopo = normalizarTextoHome(item.escopo || item.scope || item.tipoEscopo || "");
  const tipoDado = normalizarTextoHome(item.tipoDado || item.dataType || "");

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

function itemPertenceAoUsuarioLogadoHome(item) {
  const idAtual = getIdUsuarioLogadoHome();
  const emailAtual = getEmailUsuarioLogadoHome();

  const idDono = pegarIdDonoHome(item);
  const emailDono = pegarEmailDonoHome(item);

  if (idsIguaisHome(idAtual, idDono)) return true;
  if (emailsIguaisHome(emailAtual, emailDono)) return true;

  /*
    Dados antigos sem autor salvo.
    Mantém visível se não estiverem marcados como família.
  */
  if (!idDono && !emailDono && !itemPertenceAFamiliaHome(item)) {
    return true;
  }

  return false;
}

/* ================= STORAGE ================= */

function lerStorageHome(chave) {
  try {
    const dados = localStorage.getItem(chave);

    if (!dados) return [];

    const parseado = JSON.parse(dados);

    return Array.isArray(parseado) ? parseado : [];
  } catch {
    return [];
  }
}

function salvarStorageHome(chave, lista) {
  if (!Array.isArray(lista)) return;

  localStorage.setItem(chave, JSON.stringify(lista));
}

function juntarListasPorIdHome(lista) {
  const mapa = new Map();

  transformarEmArray(lista).forEach((item, index) => {
    const chave =
      item?.id ||
      item?.incomeId ||
      item?.expenseId ||
      item?.transactionId ||
      `${index}-${JSON.stringify(item)}`;

    if (!mapa.has(String(chave))) {
      mapa.set(String(chave), item);
    }
  });

  return Array.from(mapa.values());
}

function ehTransacaoReceitaHome(item) {
  if (!item) return false;

  const tipo = normalizarTextoHome(
    item.tipo ||
    item.type ||
    item.transactionType ||
    item.tipoTransacao ||
    item.categoryType
  );

  const origem = normalizarTextoHome(item.origem || item.source || "");

  if (origem === "receitas") return true;

  return (
    tipo === "receita" ||
    tipo === "income" ||
    tipo === "entrada" ||
    tipo === "entradas" ||
    tipo.includes("receita") ||
    tipo.includes("income")
  );
}

function ehTransacaoDespesaHome(item) {
  if (!item) return false;

  const tipo = normalizarTextoHome(
    item.tipo ||
    item.type ||
    item.transactionType ||
    item.tipoTransacao ||
    item.categoryType
  );

  const origem = normalizarTextoHome(item.origem || item.source || "");

  if (origem === "despesas") return true;

  return (
    tipo === "despesa" ||
    tipo === "expense" ||
    tipo === "saida" ||
    tipo === "saidas" ||
    tipo.includes("despesa") ||
    tipo.includes("expense")
  );
}

function filtrarPorEscopoHome(lista) {
  let resultado = transformarEmArray(lista);

  if (!usuarioPertenceFamiliaHome) {
    resultado = resultado.filter((item) => {
      if (itemPertenceAFamiliaHome(item)) {
        return false;
      }

      return itemPertenceAoUsuarioLogadoHome(item);
    });
  }

  return resultado;
}

function buscarReceitasLocaisHome() {
  const receitasUsuario = lerStorageHome(getChaveUsuarioHome("receitas"));
  const receitasGlobais = lerStorageHome("receitas");

  const transacoesUsuario = lerStorageHome(getChaveUsuarioHome("transacoes"));
  const transacoesGlobais = lerStorageHome("transacoes");

  const receitasTransacoes = [
    ...transacoesUsuario,
    ...transacoesGlobais
  ].filter((item) => ehTransacaoReceitaHome(item));

  const todas = [
    ...receitasUsuario,
    ...receitasGlobais,
    ...receitasTransacoes
  ];

  return removerDuplicadosHome(
    filtrarPorEscopoHome(todas).map((item) => normalizarItemHome(item, "receita"))
  );
}

function buscarDespesasLocaisHome() {
  const despesasUsuario = lerStorageHome(getChaveUsuarioHome("despesas"));
  const despesasGlobais = lerStorageHome("despesas");

  const transacoesUsuario = lerStorageHome(getChaveUsuarioHome("transacoes"));
  const transacoesGlobais = lerStorageHome("transacoes");

  const despesasTransacoes = [
    ...transacoesUsuario,
    ...transacoesGlobais
  ].filter((item) => ehTransacaoDespesaHome(item));

  const todas = [
    ...despesasUsuario,
    ...despesasGlobais,
    ...despesasTransacoes
  ];

  return removerDuplicadosHome(
    filtrarPorEscopoHome(todas).map((item) => normalizarItemHome(item, "despesa"))
  );
}

/* ================= RECEITAS FIXAS ================= */

function gerarReceitasFixasHome() {
  const regrasUsuario = lerStorageHome(getChaveUsuarioHome("receitasFixas"));
  const regrasGlobais = lerStorageHome("receitasFixas");

  let regras = juntarListasPorIdHome([
    ...regrasUsuario,
    ...regrasGlobais
  ]);

  regras = filtrarPorEscopoHome(regras);

  const receitas = buscarReceitasLocaisHome();

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  let alterou = false;

  regras.forEach((regra) => {
    if (regra.ativa === false) return;

    const dataInicial = converterData(regra.dataInicial);

    if (!dataInicial) return;

    const diferencaMeses =
      (ano - dataInicial.getFullYear()) * 12 +
      (mes - dataInicial.getMonth());

    if (diferencaMeses < 0) return;

    const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate();
    const diaFinal = Math.min(Number(regra.diaRecebimento || 1), ultimoDiaDoMes);

    const dataGerada = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(diaFinal).padStart(2, "0")}`;
    const anoMesGerado = dataGerada.substring(0, 7);

    const jaExiste = receitas.some((receita) => {
      return (
        String(receita.regraReceitaFixaId) === String(regra.id) &&
        String(receita.data || "").substring(0, 7) === anoMesGerado
      );
    });

    if (jaExiste) return;

    receitas.push({
      id: `${regra.id}-${ano}-${String(mes + 1).padStart(2, "0")}`,
      regraReceitaFixaId: regra.id,
      descricao: regra.descricao,
      valor: Number(regra.valor || 0),
      data: dataGerada,
      dataFormatada: formatarDataHome(dataGerada),
      categoria: regra.categoria,
      tipo: "fixa",
      tipoReceita: "fixa",
      salvarTodoMes: true,
      origem: "receitas",
      recorrente: true,
      escopo: regra.escopo || (usuarioPertenceFamiliaHome ? "familia" : "individual"),
      compartilhado: Boolean(regra.compartilhado),
      autorId: regra.autorId || null,
      autorEmail: regra.autorEmail || "",
      autorNickname: regra.autorNickname || ""
    });

    alterou = true;
  });

  if (alterou) {
    const receitasFiltradas = filtrarPorEscopoHome(receitas);

    salvarStorageHome(getChaveUsuarioHome("receitas"), receitasFiltradas);
    salvarStorageHome("receitas", receitasFiltradas);

    sincronizarReceitasHomeEmTransacoes(receitasFiltradas);
  }
}

function sincronizarReceitasHomeEmTransacoes(receitas) {
  const chaveTransacoesUsuario = getChaveUsuarioHome("transacoes");

  const transacoesUsuario = lerStorageHome(chaveTransacoesUsuario);
  const transacoesGlobais = lerStorageHome("transacoes");

  const transacoesAntigas = juntarListasPorIdHome([
    ...transacoesUsuario,
    ...transacoesGlobais
  ]);

  const semReceitas = transacoesAntigas.filter((item) => {
    return !ehTransacaoReceitaHome(item);
  });

  const receitasComoTransacoes = receitas.map((receita) => ({
    id: receita.id,
    tipo: "receita",
    descricao: receita.descricao,
    categoria: receita.categoria,
    valor: receita.valor,
    data: receita.data,
    dataFormatada: receita.dataFormatada || formatarDataHome(receita.data),
    tipoReceita: receita.tipo,
    origem: "receitas",
    salvarTodoMes: Boolean(receita.salvarTodoMes),
    recorrente: Boolean(receita.recorrente),
    regraReceitaFixaId: receita.regraReceitaFixaId || null,
    escopo: receita.escopo || (usuarioPertenceFamiliaHome ? "familia" : "individual"),
    compartilhado: Boolean(receita.compartilhado),
    autorId: receita.autorId || null,
    autorEmail: receita.autorEmail || "",
    autorNickname: receita.autorNickname || ""
  }));

  const transacoesAtualizadas = removerDuplicadosHome([
    ...semReceitas,
    ...receitasComoTransacoes
  ]);

  salvarStorageHome(chaveTransacoesUsuario, transacoesAtualizadas);
  salvarStorageHome("transacoes", transacoesAtualizadas);
}

/* ================= CARREGAR DADOS FINANCEIROS ================= */

async function carregarDadosFinanceiros() {
  const receitasLocais = buscarReceitasLocaisHome();
  const despesasLocais = buscarDespesasLocaisHome();

  /*
    REGRA PARA NÃO DUPLICAR:
    Se já existem dados locais, usa os dados locais.
    Só usa API quando não houver dados locais.
  */
  let receitas = receitasLocais;
  let despesas = despesasLocais;

  if (receitasLocais.length === 0 || despesasLocais.length === 0) {
    try {
      const hoje = new Date();
      const mes = hoje.getMonth() + 1;
      const ano = hoje.getFullYear();

      if (despesasLocais.length === 0) {
        const despesasUser = await apiGetHome(`/expense/user?month=${mes}&year=${ano}`);

        despesas = transformarEmArray(despesasUser)
          .map((item) => normalizarItemHome(item, "despesa"));
      }

      if (receitasLocais.length === 0) {
        const receitasUser = await apiGetHome(`/income/user?month=${mes}&year=${ano}`);

        receitas = transformarEmArray(receitasUser)
          .map((item) => normalizarItemHome(item, "receita"));
      }
    } catch (erro) {
      console.error("Erro ao carregar dados financeiros da Home:", erro);
    }
  }

  receitas = removerDuplicadosHome(filtrarPorEscopoHome(receitas));
  despesas = removerDuplicadosHome(filtrarPorEscopoHome(despesas));

  calcularResumoMesAtual(receitas, despesas);
}

/* ================= NORMALIZAÇÃO / DUPLICADOS ================= */

function normalizarItemHome(item, tipoPadrao) {
  const tipo =
    normalizarTextoHome(
      item.tipo ||
      item.type ||
      item.transactionType ||
      item.tipoTransacao ||
      item.categoryType ||
      tipoPadrao
    ).includes("receita") ||
    normalizarTextoHome(tipoPadrao).includes("receita")
      ? "receita"
      : "despesa";

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

    tipo,
    data: pegarData(item),
    descricao:
      item.descricao ||
      item.description ||
      item.name ||
      item.nome ||
      item.title ||
      "Sem descrição",

    categoria:
      item.categoria ||
      item.category ||
      item.categoryName ||
      item.descriptionCategory ||
      item.typeCategory ||
      item.nameCategory ||
      item.nomeCategoria ||
      (tipo === "receita" ? "Receita" : "Outros"),

    valor: pegarValor(item),

    origem: item.origem || item.source || (tipo === "receita" ? "receitas" : "despesas"),

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

function chaveFlexivelHome(item) {
  const data = formatarDataISOHome(pegarData(item));

  return [
    item.tipo || "",
    data,
    normalizarTextoHome(item.descricao || item.description || ""),
    normalizarTextoHome(item.categoria || item.category || ""),
    Number(pegarValor(item) || 0).toFixed(2)
  ].join("|");
}

function chaveEstritaHome(item) {
  const data = formatarDataISOHome(pegarData(item));

  if (item.tipo === "receita" && item.regraReceitaFixaId) {
    return [
      "receita-fixa",
      item.regraReceitaFixaId,
      data,
      Number(pegarValor(item) || 0).toFixed(2)
    ].join("|");
  }

  if (item.tipo === "despesa" && item.compraId && item.parcelaAtual) {
    return [
      "despesa-parcelada",
      item.compraId,
      item.parcelaAtual,
      data,
      Number(pegarValor(item) || 0).toFixed(2)
    ].join("|");
  }

  if (item.id) {
    return `${item.tipo}|${item.id}`;
  }

  return null;
}

function pontuacaoPreferenciaHome(item) {
  let pontos = 0;

  if (item.autorEmail) pontos += 5;
  if (item.autorNickname) pontos += 4;
  if (item.autorId) pontos += 3;

  if (item.origem === "receitas" || item.origem === "despesas") pontos += 2;
  if (item.origem === "transacoes") pontos += 1;

  if (item.id) pontos += 1;

  return pontos;
}

function removerDuplicadosHome(lista) {
  const mapaEstrito = new Map();

  transformarEmArray(lista).forEach((item) => {
    const chave = chaveEstritaHome(item) || chaveFlexivelHome(item);
    const existente = mapaEstrito.get(chave);

    if (!existente) {
      mapaEstrito.set(chave, item);
      return;
    }

    if (pontuacaoPreferenciaHome(item) > pontuacaoPreferenciaHome(existente)) {
      mapaEstrito.set(chave, item);
    }
  });

  const mapaFlexivel = new Map();

  Array.from(mapaEstrito.values()).forEach((item) => {
    const chave = chaveFlexivelHome(item);
    const existente = mapaFlexivel.get(chave);

    if (!existente) {
      mapaFlexivel.set(chave, item);
      return;
    }

    if (pontuacaoPreferenciaHome(item) > pontuacaoPreferenciaHome(existente)) {
      mapaFlexivel.set(chave, item);
    }
  });

  return Array.from(mapaFlexivel.values());
}

/* ================= DATA / VALOR ================= */

function converterData(dataValor) {
  if (!dataValor) return null;

  const texto = String(dataValor).trim();

  if (texto.includes("-")) {
    const partes = texto.split("T")[0].split("-");

    if (partes.length === 3) {
      const ano = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const dia = Number(partes[2]);

      const data = new Date(ano, mes, dia, 12, 0, 0);

      return isNaN(data.getTime()) ? null : data;
    }
  }

  if (texto.includes("/")) {
    const partes = texto.split("/");

    if (partes.length === 3) {
      const dia = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const ano = Number(partes[2]);

      const data = new Date(ano, mes, dia, 12, 0, 0);

      return isNaN(data.getTime()) ? null : data;
    }
  }

  const data = new Date(texto);

  return isNaN(data.getTime()) ? null : data;
}

function formatarDataISOHome(dataValor) {
  const data = converterData(dataValor);

  if (!data) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function pegarData(item) {
  return (
    item.dateInitial ||
    item.data ||
    item.date ||
    item.createdAt ||
    item.created_at ||
    item.dueDate ||
    item.updatedAt ||
    item.dataTransacao ||
    item.transactionDate ||
    null
  );
}

function pegarValor(item) {
  const valorBruto =
    item.amount ??
    item.value ??
    item.valor ??
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

/* ================= RESUMO ================= */

function calcularResumoMesAtual(receitas, despesas) {
  receitas = removerDuplicadosHome(transformarEmArray(receitas));
  despesas = removerDuplicadosHome(transformarEmArray(despesas));

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let totalReceitas = 0;
  let totalDespesas = 0;

  receitas.forEach((r) => {
    const data = converterData(pegarData(r));

    if (!data) return;

    const mesmoMes =
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual;

    if (!mesmoMes) return;

    totalReceitas += pegarValor(r);
  });

  despesas.forEach((d) => {
    const data = converterData(pegarData(d));

    if (!data) return;

    const mesmoMes =
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual;

    if (!mesmoMes) return;

    totalDespesas += pegarValor(d);
  });

  atualizarResumo(totalReceitas, totalDespesas);
}

function atualizarResumo(receitas, despesas) {
  const saldo = receitas - despesas;

  const totalReceitasEl = document.getElementById("total-receitas");
  const totalDespesasEl = document.getElementById("total-despesas");

  const valorEl =
    document.getElementById("valor") ||
    document.getElementById("saldo") ||
    document.getElementById("saldo-atual");

  if (totalReceitasEl) totalReceitasEl.textContent = formatarMoeda(receitas);
  if (totalDespesasEl) totalDespesasEl.textContent = formatarMoeda(despesas);
  if (valorEl) valorEl.textContent = formatarMoeda(saldo);

  atualizarSaldoVisual(saldo);
  atualizarOrcamento(despesas, receitas);
}

function atualizarSaldoVisual(saldo) {
  const valorEl =
    document.getElementById("valor") ||
    document.getElementById("saldo") ||
    document.getElementById("saldo-atual");

  const mensagem = document.getElementById("mensagem-saldo");
  const seta = document.getElementById("seta");

  if (!valorEl || !mensagem || !seta) return;

  valorEl.classList.remove("positivo", "negativo");
  mensagem.classList.remove("positivo", "negativo");
  seta.classList.remove("seta-positiva", "seta-negativa");

  if (saldo >= 0) {
    valorEl.classList.add("positivo");

    mensagem.textContent = "Seu saldo está positivo!";
    mensagem.classList.add("positivo");

    seta.textContent = "↑";
    seta.classList.add("seta-positiva");
  } else {
    valorEl.classList.add("negativo");

    mensagem.textContent = "Saldo negativo";
    mensagem.classList.add("negativo");

    seta.textContent = "↓";
    seta.classList.add("seta-negativa");
  }
}

function atualizarOrcamento(despesas, receitas) {
  const barra = document.getElementById("orcamento");
  const texto = document.getElementById("texto-orcamento");

  if (!barra || !texto) return;

  const limite = receitas * 0.8;

  const porcentagem = limite > 0
    ? Math.min(Math.round((despesas / limite) * 100), 100)
    : 0;

  barra.value = porcentagem;
  texto.textContent = `${porcentagem}% do limite`;
}

function formatarDataHome(dataISO) {
  const data = converterData(dataISO);

  if (!data) return "";

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

/* ================= FUNÇÕES GLOBAIS ================= */

window.carregarDadosFinanceiros = carregarDadosFinanceiros;
window.recarregarHome = carregarDadosFinanceiros;