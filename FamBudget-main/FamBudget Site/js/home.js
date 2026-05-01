console.log("HOME.JS OK");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  carregarUsuario();
  carregarDadosFinanceiros();

  if (typeof configurarModalFamilia === "function") {
    configurarModalFamilia();
  }
});

/* ================= USUÁRIO ================= */
function carregarUsuario() {
  const nome =
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nomeUsuario");

  if (!nome) return;

  const nomeUsuario = document.getElementById("nome-usuario");
  const saudacao = document.getElementById("saudacao");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) nomeUsuario.textContent = nome;
  if (saudacao) saudacao.textContent = `Olá, ${nome}!`;
  if (avatar) avatar.textContent = nome.charAt(0).toUpperCase();
}

/* ================= PEGAR TRANSAÇÕES ================= */
function getTransacoesHome() {
  const transacoes =
    JSON.parse(sessionStorage.getItem("transacoes")) ||
    JSON.parse(localStorage.getItem("transacoes")) ||
    [];

  return Array.isArray(transacoes) ? transacoes : [];
}

/* ================= DADOS FINANCEIROS ================= */
function carregarDadosFinanceiros() {
  const transacoes = getTransacoesHome();

  console.log("TRANSAÇÕES USADAS NA HOME:", transacoes);

  const receitas = transacoes.filter(t => t.tipo === "Receita");
  const despesas = transacoes.filter(t => t.tipo === "Despesa");

  calcularResumoMesAtual(receitas, despesas);
}

/* ================= DATA ================= */
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
  return Number(
    item.amount ||
    item.value ||
    item.valor ||
    item.total ||
    0
  );
}

/* ================= RESUMO DO MÊS ================= */
function calcularResumoMesAtual(receitas, despesas) {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let totalReceitas = 0;
  let totalDespesas = 0;

  receitas.forEach(r => {
    const dataValor = pegarData(r);

    if (!dataValor) return;

    const data = new Date(dataValor + "T12:00:00");

    if (isNaN(data)) return;

    if (data.getMonth() === mesAtual && data.getFullYear() === anoAtual) {
      totalReceitas += pegarValor(r);
    }
  });

  despesas.forEach(d => {
    const dataValor = pegarData(d);

    if (!dataValor) return;

    const data = new Date(dataValor + "T12:00:00");

    if (isNaN(data)) return;

    if (data.getMonth() === mesAtual && data.getFullYear() === anoAtual) {
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
  const valorEl = document.getElementById("valor");

  if (totalReceitasEl) totalReceitasEl.textContent = formatar(receitas);
  if (totalDespesasEl) totalDespesasEl.textContent = formatar(despesas);
  if (valorEl) valorEl.textContent = formatar(saldo);

  atualizarSaldoVisual(saldo);
  atualizarOrcamento(despesas, receitas);
}

/* ================= FORMATAR ================= */
function formatar(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

/* ================= SALDO VISUAL ================= */
function atualizarSaldoVisual(saldo) {
  const valorEl = document.getElementById("valor");
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