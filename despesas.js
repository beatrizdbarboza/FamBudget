console.log("DESPESAS.JS OK");

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  await carregarDadosFinanceiros();
});

// ARRAY DE DESPESAS
let despesas = [];

// ELEMENTOS
const modal = document.getElementById("modalNovaDespesa");
const btnAbrir = document.getElementById("btnNovaDespesa");
const btnCancelar = document.getElementById("cancelarDespesa");
const btnSalvar = document.getElementById("salvarDespesa");

const inputDesc = document.getElementById("descDespesa");
const inputValor = document.getElementById("valorDespesa");
const inputData = document.getElementById("dataDespesa");

const tabela = document.getElementById("tabelaDespesas");


// =======================
// ABRIR MODAL
// =======================
btnAbrir.addEventListener("click", () => {
  modal.style.display = "flex";
});


// =======================
// FECHAR MODAL
// =======================
btnCancelar.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});


// =======================
// SALVAR DESPESA
// =======================
btnSalvar.addEventListener("click", () => {

  const descricao = inputDesc.value;
  const valor = parseFloat(inputValor.value);
  const data = inputData.value;

  if (!descricao || !valor || !data) {
    alert("Preencha todos os campos!");
    return;
  }

  const novaDespesa = {
    categoria: "Geral",
    descricao,
    totalCategoria: valor,
    valor,
    data: formatarData(data)
  };

  despesas.push(novaDespesa);

  renderizarDespesas();

  limparCampos();
  modal.style.display = "none";
});


// =======================
// RENDERIZAR TABELA
// =======================
function renderizarDespesas() {

  // limpa tudo menos o header
  tabela.querySelectorAll(".linha:not(.header)").forEach(e => e.remove());

  despesas.forEach(despesa => {

    const linha = document.createElement("div");
    linha.classList.add("linha");

    linha.innerHTML = `
      <div class="categoria">
        <div class="icon-cat"></div>
        ${despesa.categoria}
      </div>

      <div>${despesa.descricao}</div>

      <div class="barra-box">
        <div class="barra">
          <div class="progresso" style="width: 100%"></div>
        </div>
        <span>R$ ${despesa.valor.toFixed(2)}</span>
      </div>

      <div>${despesa.data}</div>

      <div class="valor positivo">
        R$ ${despesa.valor.toFixed(2)}
      </div>
    `;

    tabela.appendChild(linha);
  });
}


// =======================
// LIMPAR CAMPOS
// =======================
function limparCampos() {
  inputDesc.value = "";
  inputValor.value = "";
  inputData.value = "";
}


// =======================
// FORMATAR DATA
// =======================
function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

document.addEventListener("DOMContentLoaded", () => {
    carregarUsuario();
  
  });
