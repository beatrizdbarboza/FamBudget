console.log("HOME.JS OK - API ATUALIZADO");

const HOME_API_URL = "https://www.manage-control-dev.com.br/api/v1";

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  await carregarDadosFinanceiros();

  if (typeof configurarModalFamilia === "function") {
    configurarModalFamilia();
  }
});

/*
  Atualiza a Home quando voltar para a aba.
  Isso ajuda quando você adiciona receita/despesa em outra tela
  e depois volta para home.html.
*/
document.addEventListener("visibilitychange", async () => {
  if (!document.hidden) {
    await carregarDadosFinanceiros();
  }
});

/*
  Atualiza se alguma preferência mudar.
  Aqui NÃO busca receitas/despesas do localStorage.
  Só atualiza a moeda/visual.
*/
window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  if (
    event.key.includes("moedaUsuario") ||
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia"
  ) {
    carregarUsuario();
    await carregarDadosFinanceiros();
  }
});

/* ================= TOKEN / API ================= */
function getTokenHome() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function headersHome() {
  const token = getTokenHome();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function lerRespostaHome(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiGetHome(path) {
  const token = getTokenHome();

  if (!token) {
    console.warn("HOME: token não encontrado.");
    return null;
  }

  try {
    const res = await fetch(`${HOME_API_URL}${path}`, {
      method: "GET",
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

/* ================= USUÁRIO ================= */
function getEmailUsuarioLogadoHome() {
  return (
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    ""
  ).toLowerCase().trim();
}

function getUserKeyHome() {
  const email = getEmailUsuarioLogadoHome();
  return `fambudget_${email || "usuario"}`;
}

function buscarDadoUsuarioHome(chave) {
  const userKey = getUserKeyHome();
  return localStorage.getItem(`${userKey}_${chave}`);
}

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

/* ================= MOEDA ================= */
function obterMoedaUsuario() {
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

/* ================= ARRAY / NORMALIZAÇÃO ================= */
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

function normalizarTextoHome(texto) {
  return String(texto || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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

function formatarDataHome(dataISO) {
  const data = converterData(dataISO);

  if (!data) return "";

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

function pegarData(item) {
  return (
    item.dateInitial ||
    item.data ||
    item.date ||
    item.createdAt ||
    item.dueDate ||
    item.paymentDate ||
    item.receivedAt ||
    null
  );
}

function pegarValor(item) {
  const valorBruto =
    item.value ??
    item.amount ??
    item.valor ??
    item.total ??
    item.price ??
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
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  return Math.abs(Number(valorTexto) || 0);
}

function pegarDescricao(item) {
  return (
    item.description ||
    item.descricao ||
    item.name ||
    item.nome ||
    item.title ||
    item.incomeName ||
    item.descriptionIncome ||
    item.expenseName ||
    item.descriptionExpense ||
    ""
  );
}

function pegarCategoria(item, tipo) {
  const categoria =
    item.category?.name ||
    item.category?.description ||
    item.categoria ||
    item.categoryName ||
    item.descriptionCategory ||
    item.nameCategory ||
    item.category ||
    "";

  if (categoria && Number.isNaN(Number(categoria))) {
    return categoria;
  }

  const categoryId =
    item.categoryId ||
    item.category_id ||
    item.idCategory ||
    item.category?.id ||
    item.category;

  const categoriasDespesas = {
    1: "Alimentação",
    2: "Transporte",
    3: "Lazer",
    4: "Moradia",
    5: "Saúde",
    6: "Cartão de Crédito",
    7: "Cartão de Débito",
    8: "Outros"
  };

  const categoriasReceitas = {
    1: "Salário",
    2: "Receita",
    3: "Outros",
    4: "Outros",
    5: "Outros",
    6: "Outros",
    7: "Outros",
    8: "Outros"
  };

  if (tipo === "receita" && categoryId && categoriasReceitas[Number(categoryId)]) {
    return categoriasReceitas[Number(categoryId)];
  }

  if (tipo === "despesa" && categoryId && categoriasDespesas[Number(categoryId)]) {
    return categoriasDespesas[Number(categoryId)];
  }

  return tipo === "receita" ? "Receita" : "Outros";
}

/* ================= REMOVER DUPLICADOS ================= */
function removerDuplicadosHome(lista, tipo) {
  const mapa = new Map();

  transformarEmArray(lista).forEach((item) => {
    const data = formatarDataISOHome(pegarData(item));
    const valor = pegarValor(item).toFixed(2);
    const categoria = normalizarTextoHome(pegarCategoria(item, tipo));

    /*
      Não uso descrição na chave porque a API às vezes retorna
      "Sem descrição" para receitas antigas.
    */
    const chave = `${data}|${categoria}|${valor}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, item);
      return;
    }

    /*
      Se encontrar duplicado, mantém o que tiver melhor descrição.
    */
    const atual = mapa.get(chave);

    const descricaoAtual = normalizarTextoHome(pegarDescricao(atual));
    const descricaoNova = normalizarTextoHome(pegarDescricao(item));

    const atualRuim =
      !descricaoAtual ||
      descricaoAtual === "sem descricao" ||
      descricaoAtual === "sem descrição";

    const novaBoa =
      descricaoNova &&
      descricaoNova !== "sem descricao" &&
      descricaoNova !== "sem descrição";

    if (atualRuim && novaBoa) {
      mapa.set(chave, item);
    }
  });

  return Array.from(mapa.values());
}

/* ================= CARREGAR FINANCEIRO ================= */
async function carregarDadosFinanceiros() {
  let receitas = [];
  let despesas = [];

  try {
    const hoje = new Date();
    const mes = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();

    const despesasUser = await apiGetHome(`/expense/user?month=${mes}&year=${ano}`);
    const receitasUser = await apiGetHome(`/income/user?month=${mes}&year=${ano}`);

    despesas = transformarEmArray(despesasUser);
    receitas = transformarEmArray(receitasUser);
  } catch (erro) {
    console.error("Erro ao carregar dados financeiros da Home:", erro);
  }

  /*
    IMPORTANTE:
    Não junta mais localStorage aqui.
    Receitas/despesas devem vir da API para funcionar em outro computador.
  */
  receitas = removerDuplicadosHome(receitas, "receita");
  despesas = removerDuplicadosHome(despesas, "despesa");

  calcularResumoMesAtual(receitas, despesas);
}

/* ================= RESUMO ================= */
function calcularResumoMesAtual(receitas, despesas) {
  receitas = transformarEmArray(receitas);
  despesas = transformarEmArray(despesas);

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let totalReceitas = 0;
  let totalDespesas = 0;

  const receitasSemDuplicar = removerDuplicadosHome(receitas, "receita");
  const despesasSemDuplicar = removerDuplicadosHome(despesas, "despesa");

  receitasSemDuplicar.forEach((r) => {
    const data = converterData(pegarData(r));
    if (!data) return;

    const mesmoMes =
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual;

    if (!mesmoMes) return;

    totalReceitas += pegarValor(r);
  });

  despesasSemDuplicar.forEach((d) => {
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

  if (totalReceitasEl) {
    totalReceitasEl.textContent = formatarMoeda(receitas);
  }

  if (totalDespesasEl) {
    totalDespesasEl.textContent = formatarMoeda(despesas);
  }

  if (valorEl) {
    valorEl.textContent = formatarMoeda(saldo);
  }

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