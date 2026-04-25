document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
});

function abrirModal() {
  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

function carregarUsuario() {
  const nome = localStorage.getItem("nomeUsuario");

  console.log("NOME:", nome);

  if (!nome) return;

  document.getElementById("nome-usuario").textContent = nome;
  document.getElementById("avatar").textContent = nome.charAt(0).toUpperCase();
}

function salvarTransacao() {
  let tipo = document.getElementById("tipo").value;
  let categoria = document.getElementById("categoria").value;
  let descricao = document.getElementById("descricao").value;
  let valor = document.getElementById("valor").value;
  let data = document.getElementById("data").value;

  if (!descricao || !valor || !data || tipo === "Tipo" || categoria === "Categoria") {
    alert("Preencha todos os campos!");
    return;
  }

  let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];

  let nova = {
    id: Date.now(),
    tipo,
    categoria,
    descricao,
    valor: parseFloat(valor),
    data
  };

  transacoes.push(nova);
  localStorage.setItem("transacoes", JSON.stringify(transacoes));

  fecharModal();
  limparFormulario();
  renderizarTabela();
}

function limparFormulario() {
  document.getElementById("tipo").value = "Tipo";
  document.getElementById("categoria").value = "Categoria";
  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("data").value = "";
}

function renderizarTabela(lista = null) {
  let tabela = document.getElementById("tabela-body");
  tabela.innerHTML = "";

  let transacoes = lista || JSON.parse(localStorage.getItem("transacoes")) || [];

  if (transacoes.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 20px;">
          Nenhuma transação cadastrada
        </td>
      </tr>
    `;
    atualizarSaldo();
    return;
  }

  transacoes.forEach(t => {
    let dataObj = new Date(t.data + "T12:00:00");
    let dataFormatada = dataObj.toLocaleDateString("pt-BR");

    let valorFormatado = t.valor.toLocaleString("pt-BR", {
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
        <button onclick="deletar(${t.id})" class="btn-delete">🗑</button>
      </td>
    `;

    tabela.appendChild(linha);
  });

  atualizarSaldo();
}

function deletar(id) {
  let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
  transacoes = transacoes.filter(t => t.id !== id);

  localStorage.setItem("transacoes", JSON.stringify(transacoes));
  renderizarTabela();
}

function filtrarTabela() {
  let busca = document.getElementById("filtro-busca").value.toLowerCase();
  let categoria = document.getElementById("filtro-categoria").value;
  let tipo = document.getElementById("filtro-tipo").value;

  let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];

  let filtradas = transacoes.filter(t => {
    let matchBusca =
      t.descricao.toLowerCase().includes(busca) ||
      t.categoria.toLowerCase().includes(busca);

    let matchCategoria = categoria === "" || t.categoria === categoria;
    let matchTipo = tipo === "" || t.tipo === tipo;

    return matchBusca && matchCategoria && matchTipo;
  });

  renderizarTabela(filtradas);
}

function limparFiltros() {
  document.getElementById("filtro-busca").value = "";
  document.getElementById("filtro-categoria").value = "";
  document.getElementById("filtro-tipo").value = "";

  renderizarTabela(); 
}

function resetarFiltros() {
  document.getElementById("filtro-busca").value = "";
  document.getElementById("filtro-categoria").value = "";
  document.getElementById("filtro-tipo").value = "";
}

function atualizarSaldo() {
  let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];

  let saldo = 0;

  transacoes.forEach(t => {
    if (t.tipo === "Receita") {
      saldo += Number(t.valor);
    } else {
      saldo -= Number(t.valor);
    }
  });

  const saldoEl = document.getElementById("saldo");
  const statusEl = document.getElementById("status-saldo");

  saldoEl.textContent = saldo.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  saldoEl.className = "";
  if (statusEl) statusEl.className = "";

  if (saldo >= 0) {
    saldoEl.classList.add("positivo");
    if (statusEl) {
      statusEl.classList.add("positivo");
    }
  } else {
    saldoEl.classList.add("negativo");
    if (statusEl) {
      statusEl.classList.add("negativo");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  resetarFiltros();
  renderizarTabela();
});