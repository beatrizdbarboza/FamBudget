console.log("TRANSACOES.JS OK");

const TRANSACOES_API_URL = "https://www.manage-control-dev.com.br/api/v1";

let transacoes = [];
let familiaAtual = null;
let idParaExcluir = null;
const usuariosCache = {};

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  garantirColunaUsuario();

  await carregarTransacoesFamilia();

  renderizarTabela();
  calcularSaldoAtual();
});

/* ================= TOKEN ================= */
function getTokenTransacoes() {
  return sessionStorage.getItem("accessToken");
}

function headersTransacoes(json = true) {
  const h = {
    Authorization: `Bearer ${getTokenTransacoes()}`
  };

  if (json) {
    h["Content-Type"] = "application/json";
  }

  return h;
}

/* ================= DADOS POR CONTA ================= */
function getEmailUsuarioLogado() {
  return (
    sessionStorage.getItem("emailUsuario") ||
    ""
  ).toLowerCase().trim();
}

function getUserKeyTransacoes() {
  const email = getEmailUsuarioLogado();
  return `fambudget_${email || "usuario"}`;
}

function buscarDadoUsuarioTransacoes(chave) {
  const userKey = getUserKeyTransacoes();
  return localStorage.getItem(`${userKey}_${chave}`);
}

/* ================= BUSCAR DADOS DE OUTRA CONTA PELO E-MAIL ================= */
function gerarChaveUsuarioPorEmail(email) {
  return `fambudget_${String(email || "usuario").toLowerCase().trim()}`;
}

function buscarDadoUsuarioPorEmail(email, chave) {
  if (!email) return "";

  const userKey = gerarChaveUsuarioPorEmail(email);
  return localStorage.getItem(`${userKey}_${chave}`) || "";
}

function pegarEmailUsuarioItem(item) {
  return (
    item.user?.email ||
    item.usuario?.email ||
    item.createdBy?.email ||
    item.owner?.email ||
    item.createdUser?.email ||
    item.userEmail ||
    item.createdByEmail ||
    item.ownerEmail ||
    item.email ||
    ""
  ).toLowerCase().trim();
}

function buscarNicknameSalvoPorEmail(email) {
  return (
    buscarDadoUsuarioPorEmail(email, "nicknameUsuario") ||
    buscarDadoUsuarioPorEmail(email, "nomeUsuario") ||
    ""
  );
}

/* ================= USUÁRIO LOGADO / FOTO / NICKNAME ================= */
function getNicknameLogado() {
  return (
    buscarDadoUsuarioTransacoes("nicknameUsuario") ||
    buscarDadoUsuarioTransacoes("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    "Usuário"
  );
}

function getFotoUsuarioLogado() {
  return (
    buscarDadoUsuarioTransacoes("avatarUsuario") ||
    buscarDadoUsuarioTransacoes("fotoUsuario") ||
    buscarDadoUsuarioTransacoes("imagemPerfil") ||
    buscarDadoUsuarioTransacoes("fotoPerfil") ||
    sessionStorage.getItem("avatarUsuario") ||
    sessionStorage.getItem("fotoUsuario") ||
    ""
  );
}

function aplicarImagemNoAvatar(elemento, nome, foto) {
  if (!elemento) return;

  elemento.textContent = foto ? "" : nome.charAt(0).toUpperCase();

  elemento.style.backgroundImage = "";
  elemento.style.backgroundSize = "";
  elemento.style.backgroundPosition = "";
  elemento.style.backgroundRepeat = "";

  if (foto) {
    elemento.style.backgroundImage = `url("${foto}")`;
    elemento.style.backgroundSize = "cover";
    elemento.style.backgroundPosition = "center";
    elemento.style.backgroundRepeat = "no-repeat";
  }
}

function aplicarUsuarioHeader() {
  const nome = getNicknameLogado();
  const foto = getFotoUsuarioLogado();

  const nomeEl = document.getElementById("nome-usuario");
  const avatarEl = document.getElementById("avatar");

  if (nomeEl) nomeEl.textContent = nome;
  aplicarImagemNoAvatar(avatarEl, nome, foto);
}

function decodeTokenTransacoes() {
  const token = getTokenTransacoes();

  if (!token) return {};

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function getCurrentUserIdTransacoes() {
  const user = decodeTokenTransacoes();

  return (
    user.user_id ||
    user.userId ||
    user.id ||
    user.sub ||
    null
  );
}

function isUsuarioLogado(userId) {
  const currentUserId = getCurrentUserIdTransacoes();
  return Number(userId) === Number(currentUserId);
}

function carregarUsuario() {
  aplicarUsuarioHeader();
}

/* ================= MOEDA ================= */
function obterMoedaUsuarioTransacoes() {
  const email =
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    "usuario";

  const userKey = `fambudget_${String(email).toLowerCase().trim()}`;

  const moeda =
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL";

  console.log("MOEDA USADA EM TRANSAÇÕES:", moeda);

  return moeda;
}

function formatarMoedaTransacoes(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: obterMoedaUsuarioTransacoes()
  });
}

/* ================= RESPOSTA ================= */
async function lerResposta(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiGet(path) {
  const token = getTokenTransacoes();

  if (!token) return null;

  const res = await fetch(`${TRANSACOES_API_URL}${path}`, {
    cache: "no-store",
    headers: headersTransacoes(false)
  });

  const data = await lerResposta(res);

  if (!res.ok) {
    console.warn("GET falhou:", path, res.status, data);
    return null;
  }

  return data?.data || data;
}

async function apiSend(path, method, body = null) {
  const config = {
    method,
    headers: headersTransacoes(true)
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${TRANSACOES_API_URL}${path}`, config);
  const data = await lerResposta(res);

  console.log(`${method} ${path}`, body, res.status, data);

  if (!res.ok) {
    throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  }

  return data?.data || data;
}

/* ================= BUSCAR USUÁRIO POR ID ================= */
async function buscarUsuarioPorId(userId) {
  if (!userId) return null;

  if (usuariosCache[userId]) {
    return usuariosCache[userId];
  }

  try {
    const usuario = await apiGet(`/user/${userId}`);

    if (!usuario) return null;

    usuariosCache[userId] = usuario;

    return usuario;

  } catch (erro) {
    console.warn("Erro ao buscar usuário por ID:", userId, erro);
    return null;
  }
}

/* ================= FAMÍLIA ================= */
async function carregarFamilia() {
  const familia = await apiGet("/family");

  if (!familia?.id) {
    familiaAtual = null;
    sessionStorage.removeItem("familyId");
    return null;
  }

  familiaAtual = familia;

  sessionStorage.setItem("familyId", familia.id);
  sessionStorage.setItem("familiaAtual", JSON.stringify(familia));

  return familia;
}

function getMembrosFamilia() {
  const membros =
    familiaAtual?.members ||
    familiaAtual?.users ||
    familiaAtual?.familyMembers ||
    familiaAtual?.memberUsers ||
    [];

  return Array.isArray(membros) ? membros : [];
}

function pegarIdMembro(membro) {
  return (
    membro?.userId ||
    membro?.user_id ||
    membro?.memberUserId ||
    membro?.member_user_id ||
    membro?.familyUserId ||
    membro?.userCreatedFamilyId ||
    membro?.user?.id ||
    membro?.usuario?.id ||
    membro?.member?.id ||
    membro?.familyUser?.id ||
    membro?.id ||
    null
  );
}

function pegarNomeMembro(membro) {
  const id = pegarIdMembro(membro);

  if (isUsuarioLogado(id)) {
    return getNicknameLogado();
  }

  const emailMembro =
    membro?.email ||
    membro?.userEmail ||
    membro?.user?.email ||
    membro?.usuario?.email ||
    membro?.member?.email ||
    membro?.familyUser?.email ||
    "";

  const nicknameSalvo = buscarNicknameSalvoPorEmail(emailMembro);

  if (nicknameSalvo) {
    return nicknameSalvo;
  }

  return (
    membro?.nickname ||
    membro?.nickName ||
    membro?.name ||
    membro?.nome ||
    membro?.email ||

    membro?.user?.nickname ||
    membro?.user?.nickName ||
    membro?.user?.name ||
    membro?.user?.nome ||
    membro?.user?.email ||

    membro?.usuario?.nickname ||
    membro?.usuario?.nickName ||
    membro?.usuario?.name ||
    membro?.usuario?.nome ||
    membro?.usuario?.email ||

    membro?.member?.nickname ||
    membro?.member?.nickName ||
    membro?.member?.name ||
    membro?.member?.nome ||
    membro?.member?.email ||

    membro?.familyUser?.nickname ||
    membro?.familyUser?.nickName ||
    membro?.familyUser?.name ||
    membro?.familyUser?.nome ||
    membro?.familyUser?.email ||

    ""
  );
}

function buscarNomeUsuarioNaFamilia(userId) {
  if (!userId) return "";

  if (isUsuarioLogado(userId)) {
    return getNicknameLogado();
  }

  const membros = getMembrosFamilia();

  const membro = membros.find(m => {
    const id = pegarIdMembro(m);
    return Number(id) === Number(userId);
  });

  if (!membro) return "";

  return pegarNomeMembro(membro);
}

/* ================= ARRAY ================= */
function transformarEmArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;

  if (Array.isArray(data.expenses)) return data.expenses;
  if (Array.isArray(data.incomes)) return data.incomes;
  if (Array.isArray(data.revenues)) return data.revenues;

  if (Array.isArray(data.receitas)) return data.receitas;
  if (Array.isArray(data.despesas)) return data.despesas;

  return [];
}

/* ================= PEGAR ID DO CRIADOR ================= */
function pegarUserId(item) {
  return (
    item.userId ||
    item.user_id ||

    item.userCreatedId ||
    item.userCreated_id ||

    item.userCreatedExpenseId ||
    item.userCreatedExpense_id ||
    item.user_created_expense_id ||

    item.userCreatedIncomeId ||
    item.userCreatedIncome_id ||
    item.user_created_income_id ||

    item.userCreatedRevenueId ||
    item.userCreatedRevenue_id ||
    item.user_created_revenue_id ||

    item.createdById ||
    item.created_by_id ||

    item.ownerId ||
    item.owner_id ||

    item.createdUserId ||
    item.created_user_id ||

    item.user?.id ||
    item.usuario?.id ||
    item.createdBy?.id ||
    item.owner?.id ||
    item.createdUser?.id ||

    null
  );
}

/* ================= PEGAR NOME/NICKNAME DO USUÁRIO ================= */
async function pegarUsuario(item) {
  const userId = pegarUserId(item);
  const emailItem = pegarEmailUsuarioItem(item);

  if (isUsuarioLogado(userId)) {
    return getNicknameLogado();
  }

  const nicknameSalvo = buscarNicknameSalvoPorEmail(emailItem);

  if (nicknameSalvo) {
    return nicknameSalvo;
  }

  const nomeFamilia = buscarNomeUsuarioNaFamilia(userId);

  if (nomeFamilia) {
    return nomeFamilia;
  }

  const usuario = await buscarUsuarioPorId(userId);

  const emailUsuarioApi =
    usuario?.email ||
    usuario?.user?.email ||
    usuario?.usuario?.email ||
    "";

  const nicknameSalvoApi = buscarNicknameSalvoPorEmail(emailUsuarioApi);

  if (nicknameSalvoApi) {
    return nicknameSalvoApi;
  }

  const nomeApi =
    usuario?.nickname ||
    usuario?.nickName ||
    usuario?.name ||
    usuario?.nome ||
    usuario?.email;

  if (nomeApi) {
    return nomeApi;
  }

  const direto =
    item.user?.nickname ||
    item.user?.nickName ||
    item.user?.name ||
    item.user?.nome ||
    item.user?.email ||

    item.usuario?.nickname ||
    item.usuario?.nickName ||
    item.usuario?.name ||
    item.usuario?.nome ||
    item.usuario?.email ||

    item.createdBy?.nickname ||
    item.createdBy?.nickName ||
    item.createdBy?.name ||
    item.createdBy?.nome ||
    item.createdBy?.email ||

    item.owner?.nickname ||
    item.owner?.nickName ||
    item.owner?.name ||
    item.owner?.nome ||
    item.owner?.email ||

    item.createdUser?.nickname ||
    item.createdUser?.nickName ||
    item.createdUser?.name ||
    item.createdUser?.nome ||
    item.createdUser?.email ||

    item.nickname ||
    item.nickName ||
    item.userName ||
    item.userEmail ||
    item.createdByName ||
    item.createdByEmail;

  if (direto) {
    return direto;
  }

  return "Usuário";
}

/* ================= CAMPOS DA TRANSAÇÃO ================= */
function pegarCategoria(item) {
  const categoria =
    item.category?.name ||
    item.category?.description ||
    item.categoryName ||
    item.category ||
    item.categoria ||
    item.typeExpense?.name ||
    item.typeIncome?.name ||
    item.type?.name ||
    item.typeExpense ||
    item.typeIncome ||
    item.expenseType ||
    item.incomeType;

  if (categoria && typeof categoria === "string") return categoria;

  return (
    item.name ||
    item.description ||
    item.descricao ||
    "Sem categoria"
  );
}

function pegarDescricao(item) {
  return (
    item.description ||
    item.descricao ||
    item.name ||
    item.observation ||
    item.note ||
    pegarCategoria(item)
  );
}

function pegarData(item) {
  return (
    item.dateInitial ||
    item.data ||
    item.date ||
    item.createdAt ||
    item.dueDate ||
    null
  );
}

function pegarValor(item) {
  return Number(
    item.amount ||
    item.value ||
    item.valor ||
    item.total ||
    0
  );
}

async function normalizarTransacao(item, tipo) {
  const usuario = await pegarUsuario(item);

  return {
    id: item.id,
    tipo,
    categoria: pegarCategoria(item),
    descricao: pegarDescricao(item),
    valor: pegarValor(item),
    data: pegarData(item),
    usuario,
    origem: "api"
  };
}

/* ================= CARREGAR TRANSAÇÕES DA FAMÍLIA ================= */
async function carregarTransacoesFamilia() {
  try {
    const familia = await carregarFamilia();

    if (!familia?.id) {
      transacoes = carregarTransacoesLocais();
      return;
    }

    const familyId = familia.id;

    const despesasData = await apiGet(`/expense/family/${familyId}`);
    const receitasData = await apiGet(`/income/family/${familyId}`);

    const despesas = transformarEmArray(despesasData);
    const receitas = transformarEmArray(receitasData);

    const despesasNormalizadas = await Promise.all(
      despesas.map(d => normalizarTransacao(d, "Despesa"))
    );

    const receitasNormalizadas = await Promise.all(
      receitas.map(r => normalizarTransacao(r, "Receita"))
    );

    transacoes = [
      ...despesasNormalizadas,
      ...receitasNormalizadas
    ];

    transacoes.sort((a, b) => {
      const dataA = new Date(a.data || 0);
      const dataB = new Date(b.data || 0);
      return dataB - dataA;
    });

    sessionStorage.setItem("transacoesFamilia", JSON.stringify(transacoes));

  } catch (erro) {
    console.error("Erro ao carregar transações da família:", erro);
    transacoes = carregarTransacoesLocais();
  }
}

/* ================= STORAGE LOCAL FALLBACK ================= */
function carregarTransacoesLocais() {
  const locais =
    JSON.parse(sessionStorage.getItem("transacoes")) ||
    JSON.parse(localStorage.getItem("transacoes")) ||
    [];

  return Array.isArray(locais) ? locais : [];
}

function salvarLocal(lista) {
  localStorage.setItem("transacoes", JSON.stringify(lista));
  sessionStorage.setItem("transacoes", JSON.stringify(lista));
}

/* ================= MODAIS ================= */
function abrirModal() {
  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

function abrirModalExcluir(id) {
  idParaExcluir = id;
  document.getElementById("modal-excluir").style.display = "flex";
}

function fecharModalExcluir() {
  document.getElementById("modal-excluir").style.display = "none";
  idParaExcluir = null;
}

window.onclick = function (event) {
  const modal = document.getElementById("modal");
  const modalExcluir = document.getElementById("modal-excluir");

  if (event.target === modal) fecharModal();
  if (event.target === modalExcluir) fecharModalExcluir();
};

/* ================= EXCLUIR ================= */
async function confirmarExclusao() {
  if (idParaExcluir === null) return;

  const item = transacoes.find(t => Number(t.id) === Number(idParaExcluir));

  try {
    if (item?.origem === "api") {
      const endpoint = item.tipo === "Despesa" ? "expense" : "income";
      await apiSend(`/${endpoint}/${item.id}`, "DELETE");
    } else {
      let locais = carregarTransacoesLocais();
      locais = locais.filter(t => Number(t.id) !== Number(idParaExcluir));
      salvarLocal(locais);
    }

    await carregarTransacoesFamilia();

    fecharModalExcluir();
    renderizarTabela();
    calcularSaldoAtual();

  } catch (erro) {
    console.error("Erro ao excluir transação:", erro);
  }
}

/* ================= FORM ================= */
function verificarCartao() {
  const categoria = document.getElementById("categoria").value;
  const parcelasDiv = document.getElementById("parcelas-container");

  parcelasDiv.style.display =
    categoria === "Cartão de Crédito" ? "block" : "none";
}

async function salvarTransacao() {
  const tipo = document.getElementById("tipo").value;
  const categoria = document.getElementById("categoria").value;
  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const data = document.getElementById("data").value;
  const parcelas = parseInt(document.getElementById("parcelas").value) || 1;

  if (!descricao || !valor || !data || tipo === "Tipo" || categoria === "Categoria") {
    return;
  }

  const lista = [];

  if (categoria === "Cartão de Crédito" && parcelas > 1) {
    const valorParcela = valor / parcelas;

    for (let i = 0; i < parcelas; i++) {
      const novaData = new Date(data + "T12:00:00");
      novaData.setMonth(novaData.getMonth() + i);

      lista.push({
        tipo,
        categoria,
        descricao: `${descricao} (${i + 1}/${parcelas})`,
        valor: Number(valorParcela.toFixed(2)),
        data: novaData.toISOString().split("T")[0]
      });
    }
  } else {
    lista.push({
      tipo,
      categoria,
      descricao,
      valor,
      data
    });
  }

  try {
    for (const item of lista) {
      await criarTransacaoAPI(item);
    }

    await carregarTransacoesFamilia();

  } catch (erro) {
    console.warn("API falhou ao salvar. Salvando localmente:", erro);

    const locais = carregarTransacoesLocais();

    lista.forEach(item => {
      locais.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        ...item,
        usuario: getNicknameLogado(),
        origem: "local"
      });
    });

    salvarLocal(locais);
    transacoes = locais;
  }

  fecharModal();
  limparFormulario();
  renderizarTabela();
  calcularSaldoAtual();
}

async function criarTransacaoAPI(item) {
  if (item.tipo === "Receita") {
    return apiSend("/income", "POST", {
      description: item.descricao,
      category: item.categoria,
      value: item.valor,
      dateInitial: item.data
    });
  }

  return apiSend("/expense", "POST", {
    name: item.descricao,
    description: item.descricao,
    category: item.categoria,
    value: item.valor,
    dateInitial: item.data,
    categoryId: 1,
    typeExpenseId: 1
  });
}

/* ================= GARANTIR COLUNA USUÁRIO ================= */
function garantirColunaUsuario() {
  const tabela = document.querySelector(".tabela");
  if (!tabela) return;

  const cabecalho = tabela.querySelector("thead tr");
  if (!cabecalho) return;

  const ths = Array.from(cabecalho.children);
  const jaTemUsuario = ths.some(th => th.textContent.trim().toLowerCase() === "usuário");

  if (!jaTemUsuario) {
    const thUsuario = document.createElement("th");
    thUsuario.textContent = "Usuário";

    const ultimoTh = cabecalho.lastElementChild;
    cabecalho.insertBefore(thUsuario, ultimoTh);
  }

  const semDados = document.querySelector("#sem-dados td");
  if (semDados) semDados.colSpan = 7;
}

/* ================= TABELA ================= */
function renderizarTabela() {
  const tabela = document.getElementById("tabela-body");
  tabela.innerHTML = "";

  if (!transacoes.length) {
    tabela.innerHTML = `
      <tr id="sem-dados">
        <td colspan="7" style="text-align:center; padding: 20px;">
          Nenhuma transação cadastrada
        </td>
      </tr>`;
    return;
  }

  transacoes.forEach(t => {
    let dataFormatada = "Sem data";

    if (t.data) {
      const dataObj = new Date(t.data + "T12:00:00");

      if (!isNaN(dataObj)) {
        dataFormatada = dataObj.toLocaleDateString("pt-BR");
      }
    }

    const valorFormatado = formatarMoedaTransacoes(t.valor);

    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${t.tipo}</td>
      <td>${t.categoria}</td>
      <td>${t.descricao}</td>
      <td>${dataFormatada}</td>
      <td class="${t.tipo === "Receita" ? "positivo" : "negativo"}">
        ${t.tipo === "Despesa" ? "- " : ""}${valorFormatado}
      </td>
      <td>${t.usuario || "Usuário"}</td>
      <td>
        <button onclick="abrirModalExcluir(${t.id})" class="btn-delete">
          <img src="imagem/iconConfig/lixeira.png" class="icon-delete">
        </button>
      </td>
    `;

    tabela.appendChild(linha);
  });
}

/* ================= SALDO ================= */
function calcularSaldoAtual() {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let saldo = 0;

  transacoes.forEach(t => {
    if (!t.data) return;

    const data = new Date(t.data + "T12:00:00");

    if (data.getMonth() === mesAtual && data.getFullYear() === anoAtual) {
      saldo += t.tipo === "Receita" ? Number(t.valor) : -Number(t.valor);
    }
  });

  atualizarSaldoNaTela(saldo);
}

function atualizarSaldoNaTela(saldo) {
  const saldoEl = document.getElementById("saldo");

  if (!saldoEl) return;

  saldoEl.textContent = formatarMoedaTransacoes(saldo);

  saldoEl.classList.remove("positivo", "negativo");
  saldoEl.classList.add(saldo >= 0 ? "positivo" : "negativo");
}

/* ================= FILTROS ================= */
function filtrarTabela() {
  const busca = document.getElementById("filtro-busca").value.toLowerCase();
  const categoria = document.getElementById("filtro-categoria").value;
  const tipo = document.getElementById("filtro-tipo").value;

  const linhas = document.querySelectorAll("#tabela-body tr");

  linhas.forEach(linha => {
    if (linha.id === "sem-dados") return;

    const colTipo = linha.children[0].textContent;
    const colCategoria = linha.children[1].textContent;
    const colDescricao = linha.children[2].textContent.toLowerCase();
    const colUsuario = linha.children[5]?.textContent.toLowerCase() || "";

    const matchBusca =
      colDescricao.includes(busca) ||
      colUsuario.includes(busca);

    const matchCategoria =
      categoria === "" || colCategoria === categoria;

    const matchTipo =
      tipo === "" || colTipo === tipo;

    linha.style.display =
      matchBusca && matchCategoria && matchTipo ? "" : "none";
  });
}

function limparFiltros() {
  document.getElementById("filtro-busca").value = "";
  document.getElementById("filtro-categoria").value = "";
  document.getElementById("filtro-tipo").value = "";

  renderizarTabela();
}

/* ================= LIMPAR FORM ================= */
function limparFormulario() {
  document.getElementById("tipo").value = "Tipo";
  document.getElementById("categoria").value = "Categoria";
  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("data").value = "";
  document.getElementById("parcelas").value = "";

  document.getElementById("parcelas-container").style.display = "none";
}