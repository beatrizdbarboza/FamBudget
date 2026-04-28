console.log("ORCAMENTOS OK");

document.addEventListener("DOMContentLoaded", () => {
  carregarUsuario();
});

function carregarUsuario() {
  const nome = sessionStorage.getItem("nomeUsuario");

  if (!nome) return;

  document.getElementById("nome-usuario").textContent = nome;
  document.getElementById("avatar").textContent = nome.charAt(0).toUpperCase();
}

const modal = document.getElementById("modal-orcamento");
const modalExcluir = document.getElementById("modal-excluir-orcamento");

const btnNovo = document.querySelector(".btn-add");
const fechar = document.getElementById("fechar-modal");
const salvar = document.getElementById("salvar-orcamento");

const selectCategoria = document.getElementById("categoria");
const filtroCategoria = document.getElementById("filtro-categoria");
const lista = document.getElementById("lista-orcamentos");
const selectMes = document.getElementById("filtro-mes");

const tituloModal = document.querySelector(".modal-content h2");

let orcamentos = JSON.parse(sessionStorage.getItem("orcamentos")) || [];
let transacoes = JSON.parse(sessionStorage.getItem("transacoes")) || [];

let editandoIndex = null;
let indexParaExcluir = null;

function carregarUsuario() {
  const nome = sessionStorage.getItem("nomeUsuario");

  if (!nome) return;

  document.getElementById("nome-usuario").textContent = nome;
  document.getElementById("avatar").textContent = nome.charAt(0).toUpperCase();
}

selectCategoria.addEventListener("change", () => {
  const container = document.getElementById("outra-categoria-container");

  container.style.display =
    selectCategoria.value === "Outros" ? "block" : "none";
});

const categoriasFixas = [
  "Salário",
  "Aluguel",
  "Alimentação",
  "Transporte",
  "Lazer",
  "Cartão de Crédito",
  "Outros"
];

function carregarCategorias() {
  selectCategoria.innerHTML = "";

  categoriasFixas.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    selectCategoria.appendChild(option);
  });
}

function carregarFiltroCategorias() {
  filtroCategoria.innerHTML = `<option value="">Categoria</option>`;

  categoriasFixas.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filtroCategoria.appendChild(option);
  });
}

filtroCategoria.addEventListener("change", renderizar);
selectMes.addEventListener("change", renderizar);

function abrirModal() {
  modal.classList.add("active");
}

function fecharModal() {
  modal.classList.remove("active");
  editandoIndex = null;
  tituloModal.textContent = "Novo Orçamento";
}

function abrirModalExcluir(index) {
  indexParaExcluir = index;
  modalExcluir.style.display = "flex";
}

function fecharModalExcluir() {
  modalExcluir.style.display = "none";
  indexParaExcluir = null;
}

window.onclick = function (event) {
  if (event.target === modalExcluir) fecharModalExcluir();
  if (event.target === modal) fecharModal();
};

function confirmarExclusao() {
  if (indexParaExcluir === null) return;

  orcamentos.splice(indexParaExcluir, 1);
  sessionStorage.setItem("orcamentos", JSON.stringify(orcamentos));

  fecharModalExcluir();
  renderizar();
}

function formatarMes(dataString) {
  const data = new Date(dataString);

  return data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
}

function pegarMesAtual() {
  const hoje = new Date();

  return hoje.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
}

function carregarMeses() {
  let meses = [...new Set(transacoes.map(t => formatarMes(t.data)))];

  const mesAtual = pegarMesAtual();

  if (!meses.includes(mesAtual)) {
    meses.push(mesAtual);
  }

  selectMes.innerHTML = "";

  meses.forEach(mes => {
    const option = document.createElement("option");
    option.value = mes;
    option.textContent = mes;
    selectMes.appendChild(option);
  });

  selectMes.value = mesAtual;
}

function filtrarPorMes(mes) {
  return transacoes.filter(t => formatarMes(t.data) === mes);
}

function aplicarFiltroCategoria(listaBase) {
  const categoriaSelecionada = filtroCategoria.value;

  if (!categoriaSelecionada) return listaBase;

  return listaBase.filter(o => o.categoria === categoriaSelecionada);
}

function renderizar() {
  lista.innerHTML = "";

  const mesSelecionado = selectMes.value;
  const transacoesFiltradas = filtrarPorMes(mesSelecionado);

  let orcamentosFiltrados = orcamentos.filter(o =>
    transacoesFiltradas.some(t => t.categoria === o.categoria)
  );

  orcamentosFiltrados = aplicarFiltroCategoria(orcamentosFiltrados);

  orcamentosFiltrados.forEach((o) => {

    const gasto = transacoesFiltradas
      .filter(t => t.categoria === o.categoria)
      .reduce((total, t) => total + Number(t.valor), 0);

    const restante = o.limite - gasto;

    const porcentagem = o.limite > 0
      ? Math.min((gasto / o.limite) * 100, 100)
      : 0;

    let cor = "#2e7d32";
    if (porcentagem > 60) cor = "#f9a825";
    if (porcentagem > 80) cor = "#d32f2f";

    const indexReal = orcamentos.indexOf(o);

    const card = document.createElement("div");
    card.classList.add("card-orcamento");

    card.innerHTML = `
      <div class="topo-orcamento">

        <div>
          <strong>${o.categoria}</strong><br>
          R$ ${o.limite.toFixed(2)}
        </div>

        <div style="display:flex; gap:8px; align-items:center;">

          <div style="color:${restante < 0 ? "red" : "green"}; font-weight:bold;">
            R$ ${restante.toFixed(2)}
          </div>

          <button class="btn-editar" style="border:none; background:none; cursor:pointer;">
            <img src="imagem/iconConfig/lapis.png" style="width:18px; height:18px;">
          </button>

          <button class="btn-excluir" style="border:none; background:none; cursor:pointer;">
            <img src="imagem/iconConfig/lixeira.png" style="width:18px; height:18px;">
          </button>

        </div>

      </div>

      <div class="barra">
        <div class="progresso" style="width:${porcentagem}%; background:${cor}"></div>
      </div>

      <div style="display:flex; justify-content:space-between; font-size:14px;">
        <span>R$ ${gasto.toFixed(2)}</span>
        <span>${porcentagem.toFixed(0)}% do limite</span>
      </div>
    `;

    lista.appendChild(card);

    card.querySelector(".btn-editar").onclick = () => {
      editandoIndex = indexReal;

      selectCategoria.value = o.categoria;
      document.getElementById("limite").value = o.limite;

      tituloModal.textContent = "Editar Orçamento";
      abrirModal();
    };

    card.querySelector(".btn-excluir").onclick = () => {
      abrirModalExcluir(indexReal);
    };
  });
}

btnNovo.onclick = () => {
  editandoIndex = null;

  document.getElementById("limite").value = "";
  document.getElementById("outra-categoria").value = "";
  document.getElementById("outra-categoria-container").style.display = "none";

  tituloModal.textContent = "Novo Orçamento";

  abrirModal();
};

fechar.onclick = fecharModal;

salvar.onclick = () => {
  let categoria = selectCategoria.value;
  const limite = parseFloat(document.getElementById("limite").value);

  if (categoria === "Outros") {
    categoria = document.getElementById("outra-categoria").value;

    if (!categoria) {
      alert("Digite a categoria personalizada!");
      return;
    }
  }

  if (!categoria || !limite) {
    alert("Preencha tudo!");
    return;
  }

  if (editandoIndex !== null) {
    orcamentos[editandoIndex].categoria = categoria;
    orcamentos[editandoIndex].limite = limite;
    editandoIndex = null;

  } else {
    if (orcamentos.find(o => o.categoria === categoria)) {
      alert("Já existe orçamento para essa categoria!");
      return;
    }

    orcamentos.push({ categoria, limite });
  }

  sessionStorage.setItem("orcamentos", JSON.stringify(orcamentos));

  fecharModal();
  renderizar();
};

carregarCategorias();
carregarFiltroCategorias();
carregarMeses();
renderizar();