console.log("DESPESAS.JS OK");

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  await carregarDadosFinanceiros();
});

// =======================
// ARRAY
// =======================
let despesas = [];

// =======================
// FILTROS
// =======================
let filtros = {
  tipo: null,
  status: null,
  data: null,
  busca: ""
};

// =======================
// ELEMENTOS
// =======================
const modal = document.getElementById("modalNovaDespesa");
const btnAbrir = document.getElementById("btnNovaDespesa");
const btnCancelar = document.getElementById("cancelarDespesa");
const btnSalvar = document.getElementById("salvarDespesa");

const inputDesc = document.getElementById("descDespesa");
const inputValor = document.getElementById("valorDespesa");
const inputData = document.getElementById("dataDespesa");
const checkPago = document.getElementById("checkPago");

const tabela = document.getElementById("tabelaDespesas");

// BUSCA
const inputBusca = document.querySelector(".input-busca input");

// DATA
const filtroDia = document.getElementById("filtroDia");

// DROPDOWNS
const filtroTipo = document.getElementById("filtroTipo");
const dropdownTipo = document.getElementById("dropdownTipo");

const filtroStatus = document.getElementById("filtroStatus");
const dropdownStatus = document.getElementById("dropdownStatus");

const filtroData = document.getElementById("filtroData");
const dropdownData = document.getElementById("dropdownData");

// CATEGORIA
const selectCategoria = document.getElementById("selectCategoria");
const dropdownCategoriaModal = document.getElementById("dropdownCategoriaModal");
const categoriaTexto = document.getElementById("categoriaSelecionada");

// =======================
// CORES
// =======================
const coresCategoria = {
  "Alimentação": "cat-orange",
  "Transporte": "cat-blue",
  "Lazer": "cat-pink",
  "Moradia": "cat-brown",
  "Saúde": "cat-green",
  "Cartão de crédito": "cat-purple",
  "Cartão de débito": "cat-yellow",
  "Outros": "cat-gray"
};

// =======================
// MODAL
// =======================
btnAbrir.onclick = () => modal.style.display = "flex";
btnCancelar.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// =======================
// DROPDOWN (abrir/fechar)
// =======================
function toggleDropdown(btn, drop) {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    drop.style.display = drop.style.display === "block" ? "none" : "block";
  });
}

toggleDropdown(filtroTipo, dropdownTipo);
toggleDropdown(filtroStatus, dropdownStatus);
toggleDropdown(filtroData, dropdownData);

document.addEventListener("click", () => {
  dropdownTipo.style.display = "none";
  dropdownStatus.style.display = "none";
  dropdownData.style.display = "none";
  dropdownCategoriaModal.style.display = "none";
});

// =======================
// CATEGORIA
// =======================
selectCategoria.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdownCategoriaModal.style.display =
    dropdownCategoriaModal.style.display === "block" ? "none" : "block";
});

document.querySelectorAll(".item-categoria").forEach(item => {
  item.addEventListener("click", (e) => {
    e.stopPropagation();

    const categoria = item.dataset.categoria;

    categoriaTexto.innerText = categoria;
    selectCategoria.dataset.categoria = categoria;

    dropdownCategoriaModal.style.display = "none";
  });
});

// =======================
// SALVAR
// =======================
btnSalvar.addEventListener("click", () => {

  const descricao = inputDesc.value;
  const valor = parseFloat(inputValor.value);
  const data = inputData.value;
  const pago = checkPago.checked;
  const categoria = selectCategoria.dataset.categoria;
  const tipo = document.querySelector('input[name="tipoDespesa"]:checked').value;

  if (!descricao || !valor || !data || !categoria) {
    alert("Preencha todos os campos!");
    return;
  }

  despesas.push({
    descricao,
    valor,
    data: formatarData(data),
    tipo,
    pago,
    categoria
  });

  aplicarFiltros();
  limparCampos();
  modal.style.display = "none";
});

// =======================
// FILTROS
// =======================

// BUSCA
inputBusca.addEventListener("input", (e) => {
  filtros.busca = e.target.value.toLowerCase();
  aplicarFiltros();
});

// TIPO
document.querySelectorAll("[data-tipo]").forEach(item => {
  item.addEventListener("click", () => {
    filtros.tipo = item.dataset.tipo;
    aplicarFiltros();
  });
});

// STATUS
document.querySelectorAll("[data-status]").forEach(item => {
  item.addEventListener("click", () => {
    filtros.status = item.dataset.status;
    aplicarFiltros();
  });
});

// =======================
// CALENDÁRIO
// =======================
const calGrid = document.getElementById("calGrid");
const mesAtualEl = document.getElementById("mesAtual");

const prevMes = document.getElementById("prevMes");
const nextMes = document.getElementById("nextMes");

let dataAtual = new Date();
let dataSelecionada = null;

const meses = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

function renderCalendario() {

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  mesAtualEl.innerText = `${meses[mes]} ${ano}`;

  calGrid.innerHTML = "";

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  // espaços vazios
  for (let i = 0; i < primeiroDia; i++) {
    calGrid.innerHTML += `<div></div>`;
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {

    const hoje = new Date();
    const isHoje =
      dia === hoje.getDate() &&
      mes === hoje.getMonth() &&
      ano === hoje.getFullYear();

    const div = document.createElement("div");
    div.classList.add("dia");

    if (isHoje) div.classList.add("hoje");

    div.innerText = dia;

    div.onclick = () => {

      dataSelecionada = `${ano}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;

      filtros.data = dataSelecionada;

      aplicarFiltros();

      renderCalendario();
    };

    // selecionado
    if (dataSelecionada) {
      const [y,m,d] = dataSelecionada.split("-");
      if (dia == d && mes+1 == m && ano == y) {
        div.classList.add("ativo");
      }
    }

    calGrid.appendChild(div);
  }
}

// navegação
prevMes.onclick = () => {
  dataAtual.setMonth(dataAtual.getMonth() - 1);
  renderCalendario();
};

nextMes.onclick = () => {
  dataAtual.setMonth(dataAtual.getMonth() + 1);
  renderCalendario();
};

// iniciar
renderCalendario();


// =======================
// APLICAR FILTROS
// =======================
function aplicarFiltros() {

  const lista = despesas.filter(d => {

    if (filtros.busca) {
      const texto = filtros.busca;
      if (
        !d.descricao.toLowerCase().includes(texto) &&
        !d.categoria.toLowerCase().includes(texto)
      ) return false;
    }

    if (filtros.tipo && d.tipo !== filtros.tipo) return false;

    if (filtros.status) {
      const status = d.pago ? "pago" : "pendente";
      if (status !== filtros.status) return false;
    }

    if (filtros.data) {
      const [ano, mes, dia] = filtros.data.split("-");
      const dataFormatada = `${dia}/${mes}/${ano}`;
      if (d.data !== dataFormatada) return false;
    }

    return true;
  });

  renderizarDespesas(lista);
}

// =======================
// RENDER
// =======================
function renderizarDespesas(lista = despesas) {

  tabela.querySelectorAll(".linha:not(.header)").forEach(e => e.remove());

  lista.forEach(despesa => {

    const linha = document.createElement("div");
    linha.classList.add("linha");

    const statusHTML = despesa.pago
      ? '<span class="status pago">Pago</span>'
      : '<span class="status pendente">Pendente</span>';

    const tipoClasse = `tipo-${despesa.tipo}`;
    const classeCategoria = coresCategoria[despesa.categoria] || "cat-gray";

    linha.innerHTML = `
      <span><span class="tipo-tag ${tipoClasse}">${despesa.tipo}</span></span>
      <span><span class="categoria-tag ${classeCategoria}">${despesa.categoria}</span></span>
      <span>${despesa.descricao}</span>
      <span>${despesa.data}</span>
      <span class="valor negativo">R$ ${despesa.valor.toFixed(2)}</span>
      <span>${statusHTML}</span>
    `;

    tabela.appendChild(linha);
  });
}

// =======================
// UTIL
// =======================
function limparCampos() {
  inputDesc.value = "";
  inputValor.value = "";
  inputData.value = "";
  checkPago.checked = false;

  categoriaTexto.innerText = "Selecione uma categoria";
  delete selectCategoria.dataset.categoria;
}

function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}
