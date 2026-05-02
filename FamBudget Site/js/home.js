console.log("HOME.JS OK");

const HOME_API_URL = "https://www.manage-control-dev.com.br/api/v1";

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  await carregarDadosFinanceiros();

  if (typeof configurarModalFamilia === "function") {
    configurarModalFamilia();
  }
});

/* ================= TOKEN ================= */
function getTokenHome() {
  return sessionStorage.getItem("accessToken");
}

function headersHome() {
  return {
    Authorization: `Bearer ${getTokenHome()}`
  };
}

/* ================= DADOS POR CONTA ================= */
function getEmailUsuarioLogadoHome() {
  return (
    sessionStorage.getItem("emailUsuario") ||
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

/* ================= USUÁRIO ================= */
function carregarUsuario() {
  const nome =
    buscarDadoUsuarioHome("nicknameUsuario") ||
    buscarDadoUsuarioHome("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    "Usuário";

  const imagem =
    buscarDadoUsuarioHome("avatarUsuario") ||
    buscarDadoUsuarioHome("fotoUsuario") ||
    buscarDadoUsuarioHome("imagemPerfil") ||
    buscarDadoUsuarioHome("fotoPerfil") ||
    sessionStorage.getItem("avatarUsuario") ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const saudacao = document.getElementById("saudacao");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) nomeUsuario.textContent = nome;
  if (saudacao) saudacao.textContent = `Olá, ${nome}!`;

  if (avatar) {
    if (imagem) {
      avatar.textContent = "";
      avatar.style.backgroundImage = `url("${imagem}")`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.style.backgroundRepeat = "no-repeat";
    } else {
      avatar.style.backgroundImage = "";
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
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: obterMoedaUsuario()
  });
}

/* se existir uma função formatar no home.js, deixe assim */
function formatar(valor) {
  return formatarMoeda(valor);
}

/* ================= RESPOSTA SEGURA ================= */
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

  if (!token) return null;

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
}

/* ================= NORMALIZAR ARRAY ================= */
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
  }

  return [];
}

/* ================= DADOS FINANCEIROS DA FAMÍLIA ================= */
async function carregarDadosFinanceiros() {
  let receitas = [];
  let despesas = [];

  try {
    const familia = await apiGetHome("/family");

    if (familia?.id) {
      const familyId = familia.id;

      const despesasData = await apiGetHome(`/expense/family/${familyId}`);
      const receitasData = await apiGetHome(`/income/family/${familyId}`);

      despesas = transformarEmArray(despesasData);
      receitas = transformarEmArray(receitasData);

      console.log("HOME DESPESAS FAMÍLIA:", despesas);
      console.log("HOME RECEITAS FAMÍLIA:", receitas);

    } else {
      const hoje = new Date();
      const mes = hoje.getMonth() + 1;
      const ano = hoje.getFullYear();

      const despesasUser = await apiGetHome(`/expense/user?month=${mes}&year=${ano}`);
      const receitasUser = await apiGetHome(`/income/user?month=${mes}&year=${ano}`);

      despesas = transformarEmArray(despesasUser);
      receitas = transformarEmArray(receitasUser);

      console.log("HOME DESPESAS USUÁRIO:", despesas);
      console.log("HOME RECEITAS USUÁRIO:", receitas);
    }

  } catch (erro) {
    console.error("Erro ao carregar dados financeiros da Home:", erro);
  }

  calcularResumoMesAtual(receitas, despesas);
}

/* ================= DATA ================= */
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

      return isNaN(data) ? null : data;
    }
  }

  if (texto.includes("/")) {
    const partes = texto.split("/");

    if (partes.length === 3) {
      const dia = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const ano = Number(partes[2]);

      const data = new Date(ano, mes, dia, 12, 0, 0);

      return isNaN(data) ? null : data;
    }
  }

  const data = new Date(texto);

  return isNaN(data) ? null : data;
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

/* ================= VALOR ================= */
function pegarValor(item) {
  const valorBruto =
    item.amount ??
    item.value ??
    item.valor ??
    item.total ??
    0;

  if (typeof valorBruto === "number") {
    return valorBruto;
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

  return Number(valorTexto) || 0;
}

/* ================= RESUMO DO MÊS ================= */
function calcularResumoMesAtual(receitas, despesas) {
  receitas = transformarEmArray(receitas);
  despesas = transformarEmArray(despesas);

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let totalReceitas = 0;
  let totalDespesas = 0;

  receitas.forEach(r => {
    const data = converterData(pegarData(r));
    if (!data) return;

    const mesmoMes =
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual;

    if (mesmoMes) {
      totalReceitas += pegarValor(r);
    }
  });

  despesas.forEach(d => {
    const data = converterData(pegarData(d));
    if (!data) return;

    const mesmoMes =
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual;

    if (mesmoMes) {
      totalDespesas += pegarValor(d);
    }
  });

  atualizarResumo(totalReceitas, totalDespesas);
}

/* ================= ATUALIZAR TELA ================= */
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

/* ================= SALDO VISUAL ================= */
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

/* ================= ORÇAMENTO DA HOME ================= */
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