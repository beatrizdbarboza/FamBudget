console.log("HOME.JS OK");

const HOME_API_URL = "https://www.manage-control-dev.com.br/api/v1";

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  gerarReceitasFixasHome();
  await carregarDadosFinanceiros();

  if (typeof configurarModalFamilia === "function") {
    configurarModalFamilia();
  }
});

function getTokenHome() {
  return sessionStorage.getItem("accessToken");
}

function headersHome() {
  return {
    Authorization: `Bearer ${getTokenHome()}`
  };
}

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

function formatar(valor) {
  return formatarMoeda(valor);
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
  }

  return [];
}

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

function gerarReceitasFixasHome() {
  const regras = lerStorageHome("receitasFixas");
  const receitas = lerStorageHome("receitas");

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  let alterou = false;

  regras.forEach((regra) => {
    if (!regra.ativa) return;

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
        receita.regraReceitaFixaId === regra.id &&
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
      recorrente: true
    });

    alterou = true;
  });

  if (alterou) {
    localStorage.setItem("receitas", JSON.stringify(receitas));
    sincronizarReceitasHomeEmTransacoes(receitas);
  }
}

function sincronizarReceitasHomeEmTransacoes(receitas) {
  const transacoesAntigas = lerStorageHome("transacoes");

  const semReceitas = transacoesAntigas.filter((item) => {
    return item.origem !== "receitas";
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
    regraReceitaFixaId: receita.regraReceitaFixaId || null
  }));

  localStorage.setItem("transacoes", JSON.stringify([
    ...semReceitas,
    ...receitasComoTransacoes
  ]));
}

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

  const receitasLocais = lerStorageHome("receitas");
  const despesasLocais = lerStorageHome("despesas");

  receitas = [
    ...transformarEmArray(receitas),
    ...receitasLocais
  ];

  despesas = [
    ...transformarEmArray(despesas),
    ...despesasLocais
  ];

  calcularResumoMesAtual(receitas, despesas);
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
  const valorBruto =
    item.amount ??
    item.value ??
    item.valor ??
    item.total ??
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

function calcularResumoMesAtual(receitas, despesas) {
  receitas = transformarEmArray(receitas);
  despesas = transformarEmArray(despesas);

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let totalReceitas = 0;
  let totalDespesas = 0;

  const chavesReceitas = new Set();
  const chavesDespesas = new Set();

  receitas.forEach((r) => {
    const data = converterData(pegarData(r));
    if (!data) return;

    const mesmoMes =
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual;

    if (!mesmoMes) return;

    const chave = r.id || `${r.descricao}-${r.valor}-${r.data}`;

    if (chavesReceitas.has(chave)) return;

    chavesReceitas.add(chave);
    totalReceitas += pegarValor(r);
  });

  despesas.forEach((d) => {
    const data = converterData(pegarData(d));
    if (!data) return;

    const mesmoMes =
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual;

    if (!mesmoMes) return;

    const chave = d.id || `${d.descricao}-${d.valor}-${d.data}`;

    if (chavesDespesas.has(chave)) return;

    chavesDespesas.add(chave);
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