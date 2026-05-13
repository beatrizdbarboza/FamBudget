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

// ✅ CORRIGIDO AQUI
const tabela = document.getElementById("lista-extratos");

// BUSCA
const inputBusca = document.querySelector(".input-busca input");

// DROPDOWNS
const filtroTipo = document.getElementById("filtroTipo");
const dropdownTipo = document.getElementById("dropdownTipo");

const filtroStatus = document.getElementById("filtroStatus");
const dropdownStatus = document.getElementById("dropdownStatus");

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
// DROPDOWN PADRÃO
// =======================
function toggleDropdown(btn, drop) {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    drop.style.display = drop.style.display === "block" ? "none" : "block";
  });
}

toggleDropdown(filtroTipo, dropdownTipo);
toggleDropdown(filtroStatus, dropdownStatus);

// =======================
// CATEGORIA (CORRIGIDO)
// =======================

// abrir/fechar
selectCategoria.addEventListener("click", (e) => {
  e.stopPropagation();

  dropdownCategoriaModal.style.display =
    dropdownCategoriaModal.style.display === "block" ? "none" : "block";
});

// selecionar categoria
document.querySelectorAll(".item-categoria").forEach(item => {
  item.addEventListener("click", (e) => {
    e.stopPropagation();

    const categoria = item.dataset.categoria;

    categoriaTexto.innerText = categoria;
    selectCategoria.dataset.categoria = categoria;

    // fecha corretamente
    dropdownCategoriaModal.style.display = "none";
  });
});

document.querySelectorAll(".item-categoria").forEach(item => {
  item.addEventListener("click", (e) => {
    e.stopPropagation();

    const categoria = item.dataset.categoria;

    categoriaTexto.innerText = categoria;
    selectCategoria.dataset.categoria = categoria;

    // REMOVE TODAS as classes
    categoriaTexto.className = "";

    // ADICIONA A CLASSE DE COR DO ITEM
    item.classList.forEach(cls => {
      if (cls.startsWith("cat-")) {
        categoriaTexto.classList.add(cls);
      }
    });

    dropdownCategoriaModal.style.display = "none";
  });
});

// fechar ao clicar fora (CORRETO)
document.addEventListener("click", (e) => {

  if (!selectCategoria.contains(e.target)) {
    dropdownCategoriaModal.style.display = "none";
  }

  dropdownTipo.style.display = "none";
  dropdownStatus.style.display = "none";
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
// BUSCA
// =======================
inputBusca.addEventListener("input", (e) => {
  filtros.busca = e.target.value.toLowerCase();
  aplicarFiltros();
});

// =======================
// FILTROS
// =======================
document.querySelectorAll("[data-tipo]").forEach(item => {
  item.addEventListener("click", () => {
    filtros.tipo = item.dataset.tipo;
    aplicarFiltros();
  });
});

document.querySelectorAll("[data-status]").forEach(item => {
  item.addEventListener("click", () => {
    filtros.status = item.dataset.status;
    aplicarFiltros();
  });
});

// =======================
// RENDER
// =======================
function renderizarDespesas(lista = despesas) {

  tabela.innerHTML = "";

  lista.forEach(despesa => {

    const tr = document.createElement("tr");

    const status = despesa.pago ? "Pago" : "Pendente";

    tr.innerHTML = `
      <td>${despesa.data}</td>
      <td>${despesa.descricao}</td>
      <td>${despesa.categoria}</td>
      <td>${despesa.tipo}</td>
      <td>${status}</td>
      <td>R$ ${despesa.valor.toFixed(2)}</td>
    `;

    tabela.appendChild(tr);
  });
}

// =======================
// FILTRAR
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

    return true;
  });

  renderizarDespesas(lista);
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
