document.addEventListener("DOMContentLoaded", () => {
  carregarUsuario();
  renderizarTabela();
  calcularSaldoAtual();
});

/* ================= USER ================= */
function carregarUsuario() {
  const nome = sessionStorage.getItem("nomeUsuario");

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
  transacoes = transacoes.filter(t => t.id !== idParaExcluir);

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
  return JSON.parse(sessionStorage.getItem("transacoes")) || [];
}

function salvarLocal(transacoes) {
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
  let tipo = document.getElementById("tipo").value;
  let categoria = document.getElementById("categoria").value;
  let descricao = document.getElementById("descricao").value;
  let valor = parseFloat(document.getElementById("valor").value);
  let data = document.getElementById("data").value;
  let parcelas = parseInt(document.getElementById("parcelas").value) || 1;

  if (!descricao || !valor || !data || tipo === "Tipo" || categoria === "Categoria") {
    alert("Preencha todos os campos!");
    return;
  }

  let transacoes = getTransacoes();

  if (categoria === "Cartão de Crédito" && parcelas > 1) {
    let valorParcela = valor / parcelas;

    for (let i = 0; i < parcelas; i++) {
      let novaData = new Date(data);
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

  let transacoes = getTransacoes();

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
    let dataObj = new Date(t.data + "T12:00:00");
    let dataFormatada = dataObj.toLocaleDateString("pt-BR");

    let valorFormatado = Number(t.valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    let linha = document.createElement("tr");

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
  let busca = document.getElementById("filtro-busca").value.toLowerCase();
  let categoria = document.getElementById("filtro-categoria").value;
  let tipo = document.getElementById("filtro-tipo").value;

  let linhas = document.querySelectorAll("#tabela-body tr");

  linhas.forEach(linha => {
    if (linha.id === "sem-dados") return;

    let colTipo = linha.children[0].textContent;
    let colCategoria = linha.children[1].textContent;
    let colDescricao = linha.children[2].textContent.toLowerCase();

    let matchBusca = colDescricao.includes(busca);
    let matchCategoria = categoria === "" || colCategoria === categoria;
    let matchTipo = tipo === "" || colTipo === tipo;

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