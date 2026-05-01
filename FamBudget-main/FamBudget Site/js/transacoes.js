document.addEventListener("DOMContentLoaded", () => {
  carregarUsuario();
  renderizarTabela();
  calcularSaldoAtual();
});

/* ================= USER ================= */
function carregarUsuario() {
  const nome =
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nomeUsuario");

  if (!nome) return;

  document.getElementById("nome-usuario").textContent = nome;
  document.getElementById("avatar").textContent = nome.charAt(0).toUpperCase();
}

/* ================= MODAL NOVA TRANSAÇÃO ================= */
function abrirModal() {
  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

/* ================= MODAL EXCLUIR ================= */
let idParaExcluir = null;

function abrirModalExcluir(id) {
  idParaExcluir = id;
  document.getElementById("modal-excluir").style.display = "flex";
}

function fecharModalExcluir() {
  document.getElementById("modal-excluir").style.display = "none";
  idParaExcluir = null;
}

function confirmarExclusao() {
  if (idParaExcluir === null) return;

  let transacoes = getTransacoes();
  transacoes = transacoes.filter(t => Number(t.id) !== Number(idParaExcluir));

  salvarLocal(transacoes);

  fecharModalExcluir();
  renderizarTabela();
  calcularSaldoAtual();
}

/* ================= FECHAR AO CLICAR FORA ================= */
window.onclick = function (event) {
  const modal = document.getElementById("modal");
  const modalExcluir = document.getElementById("modal-excluir");

  if (event.target === modal) fecharModal();
  if (event.target === modalExcluir) fecharModalExcluir();
};

/* ================= STORAGE ================= */
function getTransacoes() {
  const transacoes =
    JSON.parse(sessionStorage.getItem("transacoes")) ||
    JSON.parse(localStorage.getItem("transacoes")) ||
    [];

  return Array.isArray(transacoes) ? transacoes : [];
}

function salvarLocal(transacoes) {
  localStorage.setItem("transacoes", JSON.stringify(transacoes));
  sessionStorage.setItem("transacoes", JSON.stringify(transacoes));
}

/* ================= FORM ================= */
function verificarCartao() {
  const categoria = document.getElementById("categoria").value;
  const parcelasDiv = document.getElementById("parcelas-container");

  parcelasDiv.style.display =
    categoria === "Cartão de Crédito" ? "block" : "none";
}

function salvarTransacao() {
  const tipo = document.getElementById("tipo").value;
  const categoria = document.getElementById("categoria").value;
  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const data = document.getElementById("data").value;
  const parcelas = parseInt(document.getElementById("parcelas").value) || 1;

  if (!descricao || !valor || !data || tipo === "Tipo" || categoria === "Categoria") {
    alert("Preencha todos os campos!");
    return;
  }

  let transacoes = getTransacoes();

  if (categoria === "Cartão de Crédito" && parcelas > 1) {
    const valorParcela = valor / parcelas;

    for (let i = 0; i < parcelas; i++) {
      const novaData = new Date(data + "T12:00:00");
      novaData.setMonth(novaData.getMonth() + i);

      transacoes.push({
        id: Date.now() + i,
        tipo,
        categoria,
        descricao: `${descricao} (${i + 1}/${parcelas})`,
        valor: Number(valorParcela.toFixed(2)),
        data: novaData.toISOString().split("T")[0]
      });
    }

  } else {
    transacoes.push({
      id: Date.now(),
      tipo,
      categoria,
      descricao,
      valor,
      data
    });
  }

  salvarLocal(transacoes);

  fecharModal();
  limparFormulario();
  renderizarTabela();
  calcularSaldoAtual();
}

/* ================= TABELA ================= */
function renderizarTabela() {
  const tabela = document.getElementById("tabela-body");
  tabela.innerHTML = "";

  const transacoes = getTransacoes();

  if (transacoes.length === 0) {
    tabela.innerHTML = `
      <tr id="sem-dados">
        <td colspan="6" style="text-align:center; padding: 20px;">
          Nenhuma transação cadastrada
        </td>
      </tr>`;
    return;
  }

  transacoes.forEach(t => {
    const dataObj = new Date(t.data + "T12:00:00");
    const dataFormatada = dataObj.toLocaleDateString("pt-BR");

    const valorFormatado = Number(t.valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${t.tipo}</td>
      <td>${t.categoria}</td>
      <td>${t.descricao}</td>
      <td>${dataFormatada}</td>
      <td class="${t.tipo === 'Receita' ? 'positivo' : 'negativo'}">
        ${t.tipo === 'Despesa' ? '- ' : ''}${valorFormatado}
      </td>
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
  const transacoes = getTransacoes();

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  let saldo = 0;

  transacoes.forEach(t => {
    const data = new Date(t.data + "T12:00:00");

    const mesmoMes =
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual;

    if (mesmoMes) {
      if (t.tipo === "Receita") saldo += Number(t.valor);
      else saldo -= Number(t.valor);
    }
  });

  atualizarSaldoNaTela(saldo);
}

function atualizarSaldoNaTela(saldo) {
  const saldoEl = document.getElementById("saldo");

  if (!saldoEl) return;

  saldoEl.textContent = saldo.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  saldoEl.classList.remove("positivo", "negativo");

  if (saldo >= 0) {
    saldoEl.classList.add("positivo");
  } else {
    saldoEl.classList.add("negativo");
  }
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

    const matchBusca = colDescricao.includes(busca);
    const matchCategoria = categoria === "" || colCategoria === categoria;
    const matchTipo = tipo === "" || colTipo === tipo;

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