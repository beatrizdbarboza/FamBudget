console.log("HOME.JS OK");

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  await carregarDadosFinanceiros();
});

function carregarUsuario() {
  const nome = localStorage.getItem("nomeUsuario");

  if (!nome) return;

  document.getElementById("nome-usuario").textContent = nome;
  document.getElementById("saudacao").textContent = `Olá, ${nome}!`;
  document.getElementById("avatar").textContent = nome.charAt(0).toUpperCase();
}

async function carregarDadosFinanceiros() {
  const token = localStorage.getItem("accessToken");

  try {
    if (token) {
      const despesasRes = await fetch("https://www.manage-control-dev.com.br/api/v1/expense/user", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const receitasRes = await fetch("https://www.manage-control-dev.com.br/api/v1/income/user", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (despesasRes.ok && receitasRes.ok) {
        const despesasJson = await despesasRes.json();
        const receitasJson = await receitasRes.json();

        const despesas = despesasJson.data || despesasJson;
        const receitas = receitasJson.data || receitasJson;

        calcularResumoMesAtual(receitas, despesas);
        return;
      }
    }

  } catch (error) {
    console.log("API falhou, usando localStorage");
  }

  const transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];

  const receitas = transacoes.filter(t => t.tipo === "Receita");
  const despesas = transacoes.filter(t => t.tipo === "Despesa");

  calcularResumoMesAtual(receitas, despesas);
}

function calcularResumoMesAtual(receitas, despesas) {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let totalReceitas = 0;
  let totalDespesas = 0;

  receitas.forEach(r => {
    if (!r.data && !r.date) return;

    const data = new Date((r.data || r.date) + "T12:00:00");

    if (data.getMonth() === mesAtual && data.getFullYear() === anoAtual) {
      totalReceitas += Number(r.amount || r.value || r.valor || 0);
    }
  });

  despesas.forEach(d => {
    if (!d.data && !d.date) return;

    const data = new Date((d.data || d.date) + "T12:00:00");

    if (data.getMonth() === mesAtual && data.getFullYear() === anoAtual) {
      totalDespesas += Number(d.amount || d.value || d.valor || 0);
    }
  });

  atualizarResumo(totalReceitas, totalDespesas);
}

function atualizarResumo(receitas, despesas) {
  const saldo = receitas - despesas;

  document.getElementById("total-receitas").textContent = formatar(receitas);
  document.getElementById("total-despesas").textContent = formatar(despesas);
  document.getElementById("valor").textContent = formatar(saldo);

  atualizarSaldoVisual(saldo);
  atualizarOrcamento(despesas, receitas);
}

function formatar(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

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

function atualizarOrcamento(despesas, receitas) {
  const limite = receitas * 0.8;

  const porcentagem = limite > 0
    ? Math.min(Math.round((despesas / limite) * 100), 100)
    : 0;

  document.getElementById("orcamento").value = porcentagem;
  document.getElementById("texto-orcamento").textContent =
    `${porcentagem}% do limite`;
}