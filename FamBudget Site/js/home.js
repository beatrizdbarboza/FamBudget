console.log("HOME.JS OK");

// ==========================
// TOKEN
// ==========================
function getToken() {
  return sessionStorage.getItem("accessToken");
}

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  await carregarDadosFinanceiros();
});

// ==========================
// USUÁRIO
// ==========================
function carregarUsuario() {
  const nome = sessionStorage.getItem("nomeUsuario");

  if (!nome) return;

  document.getElementById("nome-usuario").textContent = nome;
  document.getElementById("saudacao").textContent = `Olá, ${nome}!`;
  document.getElementById("avatar").textContent = nome.charAt(0).toUpperCase();
}

// ==========================
// FETCH SEGURO
// ==========================
async function fetchSeguro(url) {
  const token = getToken();

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    alert("Sessão expirada. Faça login novamente.");
    sessionStorage.clear();
    window.location.href = "index.html";
    return null;
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ==========================
// DADOS FINANCEIROS
// ==========================
async function carregarDadosFinanceiros() {
  const token = getToken();

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  try {
    const hoje = new Date();
    const mes = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();

    const despesasJson = await fetchSeguro(
      `https://www.manage-control-dev.com.br/api/v1/expense/user?month=${mes}&year=${ano}`
    );

    const receitasJson = await fetchSeguro(
      `https://www.manage-control-dev.com.br/api/v1/income/user?month=${mes}&year=${ano}`
    );

    if (!despesasJson || !receitasJson) return;

    const despesas = despesasJson.data || despesasJson;
    const receitas = receitasJson.data || receitasJson;

    calcularResumo(receitas, despesas);

  } catch (error) {
    console.log("API falhou, usando localStorage");

    let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];

    let receitas = transacoes.filter(t => t.tipo === "Receita");
    let despesas = transacoes.filter(t => t.tipo === "Despesa");

    calcularResumo(receitas, despesas);
  }
}

// ==========================
// RESUMO
// ==========================
function calcularResumo(receitas, despesas) {
  const totalReceitas = (receitas || []).reduce((acc, r) =>
    acc + (r.amount || r.value || r.valor || 0), 0
  );

  const totalDespesas = (despesas || []).reduce((acc, d) =>
    acc + (d.amount || d.value || d.valor || 0), 0
  );

  const saldo = totalReceitas - totalDespesas;

  document.getElementById("total-receitas").textContent = formatar(totalReceitas);
  document.getElementById("total-despesas").textContent = formatar(totalDespesas);
  document.getElementById("valor").textContent = formatar(saldo);

  atualizarSaldoVisual(saldo);
}

// ==========================
// VISUAL SALDO
// ==========================
function atualizarSaldoVisual(saldo) {
  const valorEl = document.getElementById("valor");
  const mensagem = document.getElementById("mensagem-saldo");
  const seta = document.getElementById("seta");

  if (saldo >= 0) {
    valorEl.className = "positivo";
    mensagem.textContent = "Seu saldo está positivo!";
    mensagem.className = "mensagem positivo";

    seta.textContent = "↑";
    seta.className = "seta-positiva";
  } else {
    valorEl.className = "negativo";
    mensagem.textContent = "Saldo negativo";
    mensagem.className = "mensagem negativo";

    seta.textContent = "↓";
    seta.className = "seta-negativa";
  }
}

// ==========================
// FORMATAR
// ==========================
function formatar(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}