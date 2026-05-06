console.log("DESPESAS.JS OK");

const QUANTIDADE_MESES_DESPESA_FIXA = 12;
const DESPESAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

// =======================
// ARRAY
// =======================
let despesas = [];

// =======================
// FAMÍLIA / AUTOR
// =======================
let mostrarUsuarioDespesa = false;

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
let modal;
let btnAbrir;
let btnCancelar;
let btnSalvar;

let inputDesc;
let inputValor;
let inputData;
let checkPago;

let inputParcelas;
let containerParcelas;
let previewParcelas;

let tabela;
let inputBusca;

let filtroTipo;
let dropdownTipo;

let filtroStatus;
let dropdownStatus;

let selectCategoria;
let dropdownCategoriaModal;
let categoriaTexto;

let totalDespesas;
let totalSaidas;
let semDados;

let btnMesAnterior;
let btnProximoMes;
let textoMesAtual;

let dataMesAtual = new Date();

let modoEdicaoDespesa = false;
let idDespesaEditando = null;
let escopoEdicaoDespesa = "unico";

// =======================
// CORES CATEGORIA
// =======================
const coresCategoria = {
  "Alimentação": "cat-orange",
  "Transporte": "cat-blue",
  "Lazer": "cat-pink",
  "Moradia": "cat-brown",
  "Saúde": "cat-green",
  "Cartão de crédito": "cat-purple",
  "Cartão de Crédito": "cat-purple",
  "Cartão de débito": "cat-yellow",
  "Cartão de Débito": "cat-yellow",
  "Outros": "cat-gray"
};

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", async () => {
  pegarElementos();
  inserirCssAcoesDespesas();
  criarPopupDespesas();
  carregarUsuario();
  configurarEventos();
  configurarControleMes();

  /*
    IMPORTANTE:
    Aqui apenas carrega os dados.
    Não salva nada automaticamente ao abrir a página.
  */
  carregarDespesasStorage();

  filtros.data = pegarAnoMesData(dataMesAtual);
  atualizarTextoMes();

  mostrarUsuarioDespesa = await usuarioEstaEmFamilia();
  atualizarCabecalhoUsuarioDespesas();

  aplicarFiltros();

  if (typeof carregarDadosFinanceiros === "function") {
    await carregarDadosFinanceiros();
  }
});

/* Atualiza valores quando a moeda mudar nas configurações */
window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  if (event.key.includes("moedaUsuario")) {
    aplicarFiltros();
  }

  if (
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia"
  ) {
    mostrarUsuarioDespesa = await usuarioEstaEmFamilia();
    atualizarCabecalhoUsuarioDespesas();
    aplicarFiltros();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  mostrarUsuarioDespesa = await usuarioEstaEmFamilia();
  atualizarCabecalhoUsuarioDespesas();
  aplicarFiltros();
});

// =======================
// PEGAR ELEMENTOS
// =======================
function pegarElementos() {
  modal = document.getElementById("modalNovaDespesa");
  btnAbrir = document.getElementById("btnNovaDespesa");
  btnCancelar = document.getElementById("cancelarDespesa");
  btnSalvar = document.getElementById("salvarDespesa");

  inputDesc = document.getElementById("descDespesa");
  inputValor = document.getElementById("valorDespesa");
  inputData = document.getElementById("dataDespesa");
  checkPago = document.getElementById("checkPago");

  inputParcelas = document.getElementById("parcelasDespesa");
  containerParcelas = document.getElementById("containerParcelasDespesa");
  previewParcelas = document.getElementById("previewParcelasDespesa");

  tabela = document.getElementById("lista-extratos");

  inputBusca =
    document.getElementById("inputBuscaDespesa") ||
    document.querySelector(".input-busca input");

  filtroTipo = document.getElementById("filtroTipo");
  dropdownTipo = document.getElementById("dropdownTipo");

  filtroStatus = document.getElementById("filtroStatus");
  dropdownStatus = document.getElementById("dropdownStatus");

  selectCategoria = document.getElementById("selectCategoria");
  dropdownCategoriaModal = document.getElementById("dropdownCategoriaModal");
  categoriaTexto = document.getElementById("categoriaSelecionada");

  totalDespesas = document.getElementById("total-despesas");
  totalSaidas = document.getElementById("total-saidas");
  semDados = document.getElementById("sem-dados");

  btnMesAnterior = document.getElementById("mes-anterior");
  btnProximoMes = document.getElementById("proximo-mes");
  textoMesAtual = document.getElementById("mes-atual");
}

// =======================
// CSS AÇÕES / POPUP
// =======================
function inserirCssAcoesDespesas() {
  if (document.getElementById("css-acoes-despesas")) return;

  const style = document.createElement("style");
  style.id = "css-acoes-despesas";

  style.textContent = `
    .acoes-coluna {
      text-align: center !important;
      width: 120px;
    }

    .acoes-despesa {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-acao-despesa {
      width: 34px;
      height: 34px;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: 0.2s ease;
    }

    .btn-acao-despesa img {
      width: 17px;
      height: 17px;
      object-fit: contain;
      display: block;
      pointer-events: none;
    }

    .btn-editar-despesa {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .btn-editar-despesa:hover {
      background: #c8e6c9;
      transform: scale(1.05);
    }

    .btn-excluir-despesa {
      background: #ffebee;
      color: #d32f2f;
    }

    .btn-excluir-despesa:hover {
      background: #ffcdd2;
      transform: scale(1.05);
    }

    .usuario-despesa {
      font-weight: 600;
      color: #2e7d32;
      white-space: nowrap;
    }

    body.tema-escuro .usuario-despesa,
    body.dark .usuario-despesa {
      color: #22c55e;
    }

    .popup-despesas-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(4px);
      z-index: 20000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .popup-despesas-box {
      width: 430px;
      max-width: 95%;
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
      text-align: center;
      animation: popupDespesasEntrada 0.2s ease;
    }

    @keyframes popupDespesasEntrada {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .popup-despesas-icone {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #ffebee;
      color: #d32f2f;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 700;
    }

    .popup-despesas-box h3 {
      font-size: 21px;
      color: #111827;
      margin-bottom: 8px;
    }

    .popup-despesas-box p {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .popup-despesas-acoes {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .popup-despesas-acoes button {
      border: none;
      border-radius: 10px;
      padding: 10px 16px;
      cursor: pointer;
      font-weight: 600;
      transition: 0.2s ease;
    }

    .popup-btn-cancelar {
      background: #f3f4f6;
      color: #374151;
    }

    .popup-btn-cancelar:hover {
      background: #e5e7eb;
    }

    .popup-btn-confirmar {
      background: #2e7d32;
      color: #fff;
    }

    .popup-btn-confirmar:hover {
      background: #256628;
    }

    .popup-btn-perigo {
      background: #d32f2f;
      color: #fff;
    }

    .popup-btn-perigo:hover {
      background: #b71c1c;
    }

    .popup-btn-secundario {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .popup-btn-secundario:hover {
      background: #c8e6c9;
    }
  `;

  document.head.appendChild(style);
}

function criarPopupDespesas() {
  if (document.getElementById("popupDespesas")) return;

  const popup = document.createElement("div");
  popup.id = "popupDespesas";
  popup.className = "popup-despesas-overlay";

  popup.innerHTML = `
    <div class="popup-despesas-box">
      <div class="popup-despesas-icone" id="popupDespesasIcone">i</div>
      <h3 id="popupDespesasTitulo">Confirmação</h3>
      <p id="popupDespesasTexto">Tem certeza?</p>
      <div class="popup-despesas-acoes" id="popupDespesasAcoes"></div>
    </div>
  `;

  document.body.appendChild(popup);
}

function abrirPopupDespesas({ icone = "i", titulo, texto, botoes }) {
  const popup = document.getElementById("popupDespesas");
  const popupIcone = document.getElementById("popupDespesasIcone");
  const popupTitulo = document.getElementById("popupDespesasTitulo");
  const popupTexto = document.getElementById("popupDespesasTexto");
  const popupAcoes = document.getElementById("popupDespesasAcoes");

  if (!popup || !popupIcone || !popupTitulo || !popupTexto || !popupAcoes) return;

  popupIcone.textContent = icone;
  popupTitulo.textContent = titulo;
  popupTexto.textContent = texto;
  popupAcoes.innerHTML = "";

  botoes.forEach((botao) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = botao.texto;
    btn.className = botao.classe || "popup-btn-confirmar";

    btn.addEventListener("click", () => {
      fecharPopupDespesas();

      if (typeof botao.acao === "function") {
        botao.acao();
      }
    });

    popupAcoes.appendChild(btn);
  });

  popup.style.display = "flex";
}

function fecharPopupDespesas() {
  const popup = document.getElementById("popupDespesas");

  if (popup) {
    popup.style.display = "none";
  }
}

// =======================
// USUÁRIO
// =======================
function carregarUsuario() {
  const nome =
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário";

  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) {
    nomeUsuario.textContent = nome;
  }

  if (avatar) {
    avatar.textContent = nome.charAt(0).toUpperCase();
  }
}

// =======================
// FAMÍLIA / AUTOR
// =======================
function getTokenDespesas() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

async function usuarioEstaEmFamilia() {
  const token = getTokenDespesas();

  if (!token) return false;

  try {
    const resposta = await fetch(`${DESPESAS_API_URL}/family`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (resposta.status === 404) {
      return false;
    }

    if (!resposta.ok) {
      return false;
    }

    const data = await resposta.json();

    const membros =
      data?.members ||
      data?.data?.members ||
      data?.family?.members ||
      [];

    return Array.isArray(membros) && membros.length > 0;
  } catch (erro) {
    console.warn("Erro ao verificar família em despesas:", erro);
    return false;
  }
}

function getEmailUsuarioAtualDespesa() {
  return (
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    ""
  ).toLowerCase().trim();
}

function getUserKeyDespesa(email = null) {
  const emailFinal = email || getEmailUsuarioAtualDespesa();
  return `fambudget_${String(emailFinal || "usuario").toLowerCase().trim()}`;
}

function buscarDadoUsuarioDespesa(chave, email = null) {
  const userKey = getUserKeyDespesa(email);
  return localStorage.getItem(`${userKey}_${chave}`) || "";
}

function getNicknameUsuarioAtualDespesa() {
  const email = getEmailUsuarioAtualDespesa();

  return (
    buscarDadoUsuarioDespesa("nicknameUsuario", email) ||
    buscarDadoUsuarioDespesa("nomeUsuario", email) ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário"
  );
}

function getIdUsuarioAtualDespesa() {
  const token = getTokenDespesas();

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    return (
      payload.user_id ||
      payload.userId ||
      payload.id ||
      payload.sub ||
      null
    );
  } catch {
    return null;
  }
}

function getAutorAtualDespesa() {
  return {
    autorId: getIdUsuarioAtualDespesa(),
    autorEmail: getEmailUsuarioAtualDespesa(),
    autorNickname: getNicknameUsuarioAtualDespesa()
  };
}

function buscarNicknamePorEmailDespesa(email) {
  if (!email) return "";

  return (
    buscarDadoUsuarioDespesa("nicknameUsuario", email) ||
    buscarDadoUsuarioDespesa("nomeUsuario", email) ||
    ""
  );
}

function pegarNomeAutorDespesa(despesa) {
  const emailAutor =
    despesa.autorEmail ||
    despesa.userEmail ||
    despesa.emailUsuario ||
    despesa.createdByEmail ||
    despesa.created_by_email ||
    despesa.createdBy?.email ||
    despesa.user?.email ||
    despesa.usuario?.email ||
    "";

  const nicknameSalvo = buscarNicknamePorEmailDespesa(emailAutor);

  return (
    nicknameSalvo ||
    despesa.autorNickname ||
    despesa.nicknameUsuario ||
    despesa.nomeUsuario ||
    despesa.createdByNickname ||
    despesa.createdByName ||
    despesa.createdBy?.nickname ||
    despesa.createdBy?.name ||
    despesa.user?.nickname ||
    despesa.user?.name ||
    despesa.usuario?.nickname ||
    despesa.usuario?.nome ||
    ""
  );
}

/*
  Só usa o usuário logado quando está criando uma despesa nova.
  Não use essa função para carregar dados antigos.
*/
function aplicarAutorNaDespesa(despesa) {
  const autor = getAutorAtualDespesa();

  return {
    ...despesa,
    autorId: despesa.autorId || autor.autorId,
    autorEmail: despesa.autorEmail || autor.autorEmail,
    autorNickname: despesa.autorNickname || autor.autorNickname
  };
}

function atualizarCabecalhoUsuarioDespesas() {
  if (!tabela) return;

  const tabelaCompleta = tabela.closest("table");

  if (!tabelaCompleta) return;

  const linhaCabecalho = tabelaCompleta.querySelector("thead tr");

  if (!linhaCabecalho) return;

  const thUsuarioExistente = linhaCabecalho.querySelector("[data-coluna-usuario='despesa']");

  if (mostrarUsuarioDespesa) {
    if (!thUsuarioExistente) {
      const thAcoes =
        linhaCabecalho.querySelector(".acoes-coluna") ||
        linhaCabecalho.lastElementChild;

      const thUsuario = document.createElement("th");
      thUsuario.textContent = "Usuário";
      thUsuario.setAttribute("data-coluna-usuario", "despesa");

      if (thAcoes) {
        linhaCabecalho.insertBefore(thUsuario, thAcoes);
      } else {
        linhaCabecalho.appendChild(thUsuario);
      }
    }
  } else if (thUsuarioExistente) {
    thUsuarioExistente.remove();
  }
}

// =======================
// EVENTOS
// =======================
function configurarEventos() {
  if (btnAbrir) {
    btnAbrir.addEventListener("click", abrirModalDespesa);
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", fecharModalDespesa);
  }

  if (btnSalvar) {
    btnSalvar.addEventListener("click", salvarDespesa);
  }

  if (inputValor) {
    inputValor.addEventListener("input", (event) => {
      const input = event.target;

      setTimeout(() => {
        formatarMoedaInput(input);
        atualizarPreviewParcelas();
      }, 0);
    });
  }

  if (inputParcelas) {
    inputParcelas.addEventListener("input", atualizarPreviewParcelas);
  }

  if (inputBusca) {
    inputBusca.addEventListener("input", (e) => {
      filtros.busca = e.target.value.toLowerCase().trim();
      aplicarFiltros();
    });
  }

  if (filtroTipo && dropdownTipo) {
    toggleDropdown(filtroTipo, dropdownTipo);
  }

  if (filtroStatus && dropdownStatus) {
    toggleDropdown(filtroStatus, dropdownStatus);
  }

  if (tabela) {
    tabela.addEventListener("click", (e) => {
      const btnEditar = e.target.closest(".btn-editar-despesa");
      const btnExcluir = e.target.closest(".btn-excluir-despesa");

      if (btnEditar) {
        const id = btnEditar.dataset.id;
        confirmarEditarDespesa(id);
        return;
      }

      if (btnExcluir) {
        const id = btnExcluir.dataset.id;
        confirmarExcluirDespesa(id);
      }
    });
  }

  configurarCategoria();
  configurarFiltros();

  document.addEventListener("click", (e) => {
    if (
      dropdownCategoriaModal &&
      selectCategoria &&
      !selectCategoria.contains(e.target)
    ) {
      dropdownCategoriaModal.style.display = "none";
    }

    if (dropdownTipo && filtroTipo && !filtroTipo.contains(e.target)) {
      dropdownTipo.style.display = "none";
    }

    if (dropdownStatus && filtroStatus && !filtroStatus.contains(e.target)) {
      dropdownStatus.style.display = "none";
    }
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      fecharModalDespesa();
    }
  });

  document.querySelectorAll(".menu li[data-link]").forEach((item) => {
    item.addEventListener("click", () => {
      window.location.href = item.dataset.link;
    });
  });

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.clear();

      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      window.location.href = "index.html";
    });
  }
}

// =======================
// MODAL
// =======================
function abrirModalDespesa() {
  modoEdicaoDespesa = false;
  idDespesaEditando = null;
  escopoEdicaoDespesa = "unico";

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar";
  }

  if (modal) {
    modal.style.display = "flex";
  }

  atualizarCampoParcelas();
  atualizarPreviewParcelas();
}

function abrirModalDespesaEdicao() {
  if (btnSalvar) {
    btnSalvar.textContent = "Atualizar";
  }

  if (modal) {
    modal.style.display = "flex";
  }

  atualizarCampoParcelas();
  atualizarPreviewParcelas();
}

function fecharModalDespesa() {
  if (modal) {
    modal.style.display = "none";
  }

  limparCampos();

  modoEdicaoDespesa = false;
  idDespesaEditando = null;
  escopoEdicaoDespesa = "unico";

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar";
  }
}

// =======================
// DROPDOWN PADRÃO
// =======================
function toggleDropdown(btn, drop) {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    drop.style.display = drop.style.display === "block" ? "none" : "block";
  });
}

// =======================
// CATEGORIA
// =======================
function configurarCategoria() {
  if (!selectCategoria || !dropdownCategoriaModal || !categoriaTexto) return;

  selectCategoria.addEventListener("click", (e) => {
    e.stopPropagation();

    dropdownCategoriaModal.style.display =
      dropdownCategoriaModal.style.display === "block" ? "none" : "block";
  });

  document.querySelectorAll(".item-categoria").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();

      selecionarCategoriaDespesa(item);

      dropdownCategoriaModal.style.display = "none";

      atualizarCampoParcelas();
      atualizarPreviewParcelas();
    });
  });
}

function selecionarCategoriaDespesa(item) {
  const categoria = item.dataset.categoria;

  categoriaTexto.innerText = categoria;
  selectCategoria.dataset.categoria = categoria;

  categoriaTexto.className = "";

  const classeCor = coresCategoria[categoria];

  if (classeCor) {
    categoriaTexto.classList.add(classeCor);
  }

  document.querySelectorAll(".item-categoria").forEach((opcao) => {
    opcao.classList.remove("ativo");
  });

  item.classList.add("ativo");
}

function selecionarCategoriaPorNome(categoria) {
  if (!categoriaTexto || !selectCategoria) return;

  categoriaTexto.innerText = categoria || "Selecione uma categoria";
  categoriaTexto.className = "";

  if (categoria) {
    selectCategoria.dataset.categoria = categoria;
  } else {
    delete selectCategoria.dataset.categoria;
  }

  const classeCor = coresCategoria[categoria];

  if (classeCor) {
    categoriaTexto.classList.add(classeCor);
  }

  document.querySelectorAll(".item-categoria").forEach((item) => {
    item.classList.remove("ativo");

    if (item.dataset.categoria === categoria) {
      item.classList.add("ativo");
    }
  });

  atualizarCampoParcelas();
  atualizarPreviewParcelas();
}

// =======================
// FILTROS
// =======================
function configurarFiltros() {
  document.querySelectorAll("[data-tipo]").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();

      const tipoClicado = item.dataset.tipo;

      filtros.tipo = filtros.tipo === tipoClicado ? null : tipoClicado;

      document.querySelectorAll("[data-tipo]").forEach((opcao) => {
        opcao.classList.remove("ativo");
      });

      if (filtros.tipo) {
        item.classList.add("ativo");
      }

      if (dropdownTipo) {
        dropdownTipo.style.display = "none";
      }

      aplicarFiltros();
    });
  });

  document.querySelectorAll("[data-status]").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();

      const statusClicado = item.dataset.status;

      filtros.status = filtros.status === statusClicado ? null : statusClicado;

      document.querySelectorAll("[data-status]").forEach((opcao) => {
        opcao.classList.remove("ativo");
      });

      if (filtros.status) {
        item.classList.add("ativo");
      }

      if (dropdownStatus) {
        dropdownStatus.style.display = "none";
      }

      aplicarFiltros();
    });
  });
}

// =======================
// CONTROLE DE MÊS
// =======================
function configurarControleMes() {
  if (btnMesAnterior) {
    btnMesAnterior.addEventListener("click", () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() - 1);

      filtros.data = pegarAnoMesData(dataMesAtual);

      atualizarTextoMes();
      aplicarFiltros();
    });
  }

  if (btnProximoMes) {
    btnProximoMes.addEventListener("click", () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() + 1);

      filtros.data = pegarAnoMesData(dataMesAtual);

      atualizarTextoMes();
      aplicarFiltros();
    });
  }
}

function atualizarTextoMes() {
  if (!textoMesAtual) return;

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const mes = meses[dataMesAtual.getMonth()];
  const ano = dataMesAtual.getFullYear();

  textoMesAtual.textContent = `${mes} ${ano}`;
}

function pegarAnoMesData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");

  return `${ano}-${mes}`;
}

// =======================
// SALVAR / EDITAR DESPESA
// =======================
function salvarDespesa() {
  if (modoEdicaoDespesa) {
    atualizarDespesaEditada();
    return;
  }

  const descricao = inputDesc.value.trim();
  const valorTotal = converterMoedaParaNumero(inputValor.value);
  const data = inputData.value;
  const pago = checkPago.checked;
  const categoria = selectCategoria.dataset.categoria;

  const tipo =
    document.querySelector('input[name="tipoDespesa"]:checked')?.value ||
    "fixa";

  if (!descricao || valorTotal <= 0 || !data || !categoria) {
    mostrarMensagemDespesa("Preencha todos os campos corretamente!");
    return;
  }

  if (ehCartaoCredito(categoria)) {
    salvarDespesaParcelada({
      descricao,
      valorTotal,
      data,
      pago,
      categoria,
      tipo: "variavel"
    });
  } else if (tipo === "fixa") {
    salvarDespesaFixaMensal({
      descricao,
      valorTotal,
      data,
      pago,
      categoria,
      tipo
    });
  } else {
    const novaDespesa = aplicarAutorNaDespesa({
      id: Date.now(),
      descricao,
      valor: valorTotal,
      valorTotal,
      data,
      dataFormatada: formatarData(data),
      tipo,
      pago,
      categoria,
      origem: "despesas",
      parcelada: false,
      fixaMensal: false
    });

    despesas.push(novaDespesa);
  }

  salvarDespesasStorage();
  aplicarFiltros();
  limparCampos();
  fecharModalDespesa();

  if (typeof carregarDadosFinanceiros === "function") {
    carregarDadosFinanceiros();
  }
}

function atualizarDespesaEditada() {
  const despesaOriginal = despesas.find((despesa) => {
    return String(despesa.id) === String(idDespesaEditando);
  });

  if (!despesaOriginal) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  const descricao = inputDesc.value.trim();
  const valorTotal = converterMoedaParaNumero(inputValor.value);
  const data = inputData.value;
  const pago = checkPago.checked;
  const categoria = selectCategoria.dataset.categoria;

  const tipo =
    document.querySelector('input[name="tipoDespesa"]:checked')?.value ||
    "fixa";

  if (!descricao || valorTotal <= 0 || !data || !categoria) {
    mostrarMensagemDespesa("Preencha todos os campos corretamente!");
    return;
  }

  if (
    escopoEdicaoDespesa === "todos" &&
    despesaOriginal.compraId &&
    despesaOriginal.parcelada
  ) {
    const compraId = despesaOriginal.compraId;

    despesas = despesas.filter((item) => {
      return String(item.compraId) !== String(compraId);
    });

    salvarDespesaParcelada({
      descricao,
      valorTotal,
      data,
      pago,
      categoria,
      tipo: "variavel"
    });
  } else if (
    escopoEdicaoDespesa === "todos" &&
    despesaOriginal.despesaFixaId &&
    despesaOriginal.fixaMensal
  ) {
    const despesaFixaId = despesaOriginal.despesaFixaId;

    despesas = despesas.filter((item) => {
      return String(item.despesaFixaId) !== String(despesaFixaId);
    });

    salvarDespesaFixaMensal({
      descricao,
      valorTotal,
      data,
      pago,
      categoria,
      tipo: "fixa",
      idDespesaFixa: despesaFixaId
    });
  } else {
    despesas = despesas.map((despesa) => {
      if (String(despesa.id) !== String(idDespesaEditando)) {
        return despesa;
      }

      return {
        ...despesa,
        descricao,
        descricaoOriginal: despesa.descricaoOriginal || descricao,
        valor: valorTotal,
        valorTotal,
        data,
        dataFormatada: formatarData(data),
        tipo,
        pago,
        categoria
      };
    });
  }

  salvarDespesasStorage();
  aplicarFiltros();
  fecharModalDespesa();

  mostrarMensagemDespesa("Despesa atualizada com sucesso!");

  if (typeof carregarDadosFinanceiros === "function") {
    carregarDadosFinanceiros();
  }
}

function salvarDespesaParcelada({ descricao, valorTotal, data, pago, categoria, tipo }) {
  const quantidadeParcelas = Math.max(1, Number(inputParcelas?.value || 1));
  const idCompra = Date.now();
  const valorParcela = arredondarValor(valorTotal / quantidadeParcelas);
  const autor = getAutorAtualDespesa();

  for (let i = 0; i < quantidadeParcelas; i++) {
    const dataParcela = adicionarMeses(data, i);

    const novaParcela = {
      id: idCompra + i,
      compraId: idCompra,
      descricao: `${descricao} (${i + 1}/${quantidadeParcelas})`,
      descricaoOriginal: descricao,
      valor: valorParcela,
      valorTotal,
      data: dataParcela,
      dataFormatada: formatarData(dataParcela),
      tipo,
      pago,
      categoria,
      origem: "despesas",
      parcelada: true,
      parcelaAtual: i + 1,
      totalParcelas: quantidadeParcelas,
      fixaMensal: false,
      autorId: autor.autorId,
      autorEmail: autor.autorEmail,
      autorNickname: autor.autorNickname
    };

    despesas.push(novaParcela);
  }
}

function salvarDespesaFixaMensal({ descricao, valorTotal, data, pago, categoria, tipo, idDespesaFixa = null }) {
  const despesaFixaId = idDespesaFixa || Date.now();
  const autor = getAutorAtualDespesa();

  for (let i = 0; i < QUANTIDADE_MESES_DESPESA_FIXA; i++) {
    const dataMensal = adicionarMeses(data, i);

    const novaDespesaMensal = {
      id: `${despesaFixaId}-${i + 1}`,
      despesaFixaId,
      descricao,
      valor: valorTotal,
      valorTotal,
      data: dataMensal,
      dataFormatada: formatarData(dataMensal),
      tipo,
      pago,
      categoria,
      origem: "despesas",
      parcelada: false,
      fixaMensal: true,
      recorrenciaAtual: i + 1,
      totalRecorrencias: QUANTIDADE_MESES_DESPESA_FIXA,
      autorId: autor.autorId,
      autorEmail: autor.autorEmail,
      autorNickname: autor.autorNickname
    };

    despesas.push(novaDespesaMensal);
  }
}

// =======================
// AÇÕES EDITAR / EXCLUIR
// =======================
function confirmarEditarDespesa(id) {
  const despesa = despesas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!despesa) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  if (despesa.parcelada && despesa.compraId) {
    abrirPopupDespesas({
      icone: "i",
      titulo: "Editar despesa parcelada",
      texto: "Essa despesa faz parte de uma compra parcelada. Deseja editar apenas esta parcela ou todas as parcelas da compra?",
      botoes: [
        {
          texto: "Cancelar",
          classe: "popup-btn-cancelar"
        },
        {
          texto: "Apenas esta parcela",
          classe: "popup-btn-secundario",
          acao: () => prepararEdicaoDespesa(id, "unico")
        },
        {
          texto: "Todas as parcelas",
          classe: "popup-btn-confirmar",
          acao: () => prepararEdicaoDespesa(id, "todos")
        }
      ]
    });

    return;
  }

  if (despesa.fixaMensal && despesa.despesaFixaId) {
    abrirPopupDespesas({
      icone: "i",
      titulo: "Editar despesa fixa",
      texto: "Essa despesa faz parte de uma repetição mensal. Deseja editar apenas este mês ou todos os meses dessa despesa fixa?",
      botoes: [
        {
          texto: "Cancelar",
          classe: "popup-btn-cancelar"
        },
        {
          texto: "Apenas este mês",
          classe: "popup-btn-secundario",
          acao: () => prepararEdicaoDespesa(id, "unico")
        },
        {
          texto: "Todos os meses",
          classe: "popup-btn-confirmar",
          acao: () => prepararEdicaoDespesa(id, "todos")
        }
      ]
    });

    return;
  }

  abrirPopupDespesas({
    icone: "i",
    titulo: "Editar despesa",
    texto: "Deseja mesmo editar esta despesa?",
    botoes: [
      {
        texto: "Cancelar",
        classe: "popup-btn-cancelar"
      },
      {
        texto: "Editar",
        classe: "popup-btn-confirmar",
        acao: () => prepararEdicaoDespesa(id, "unico")
      }
    ]
  });
}

function prepararEdicaoDespesa(id, escopo) {
  const despesa = despesas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!despesa) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  modoEdicaoDespesa = true;
  idDespesaEditando = id;
  escopoEdicaoDespesa = escopo || "unico";

  if (inputDesc) inputDesc.value = despesa.descricaoOriginal || limparDescricaoParcela(despesa.descricao || "");
  if (inputValor) inputValor.value = formatarMoedaPositiva(despesa.valorTotal || despesa.valor);
  if (inputData) inputData.value = normalizarDataISO(despesa.data);
  if (checkPago) checkPago.checked = Boolean(despesa.pago);

  if (inputParcelas) {
    inputParcelas.value = despesa.totalParcelas || 1;
  }

  selecionarCategoriaPorNome(despesa.categoria);

  const radioTipo = document.querySelector(
    `input[name="tipoDespesa"][value="${despesa.tipo || "fixa"}"]`
  );

  if (radioTipo) {
    radioTipo.checked = true;
  }

  abrirModalDespesaEdicao();
}

function confirmarExcluirDespesa(id) {
  const despesa = despesas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!despesa) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  if (despesa.parcelada && despesa.compraId) {
    abrirPopupDespesas({
      icone: "!",
      titulo: "Excluir despesa parcelada",
      texto: "Essa despesa faz parte de uma compra parcelada. Deseja excluir apenas esta parcela ou todas as parcelas da compra?",
      botoes: [
        {
          texto: "Cancelar",
          classe: "popup-btn-cancelar"
        },
        {
          texto: "Apenas esta parcela",
          classe: "popup-btn-secundario",
          acao: () => excluirDespesa(id, "unico")
        },
        {
          texto: "Todas as parcelas",
          classe: "popup-btn-perigo",
          acao: () => excluirDespesa(id, "todos")
        }
      ]
    });

    return;
  }

  if (despesa.fixaMensal && despesa.despesaFixaId) {
    abrirPopupDespesas({
      icone: "!",
      titulo: "Excluir despesa fixa",
      texto: "Essa despesa faz parte de uma repetição mensal. Deseja excluir apenas este mês ou todos os meses dessa despesa fixa?",
      botoes: [
        {
          texto: "Cancelar",
          classe: "popup-btn-cancelar"
        },
        {
          texto: "Apenas este mês",
          classe: "popup-btn-secundario",
          acao: () => excluirDespesa(id, "unico")
        },
        {
          texto: "Todos os meses",
          classe: "popup-btn-perigo",
          acao: () => excluirDespesa(id, "todos")
        }
      ]
    });

    return;
  }

  abrirPopupDespesas({
    icone: "!",
    titulo: "Excluir despesa",
    texto: "Tem certeza que deseja excluir esta despesa? Essa ação não poderá ser desfeita.",
    botoes: [
      {
        texto: "Cancelar",
        classe: "popup-btn-cancelar"
      },
      {
        texto: "Excluir",
        classe: "popup-btn-perigo",
        acao: () => excluirDespesa(id, "unico")
      }
    ]
  });
}

function excluirDespesa(id, escopo) {
  const despesa = despesas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!despesa) {
    mostrarMensagemDespesa("Despesa não encontrada.");
    return;
  }

  if (escopo === "todos" && despesa.compraId) {
    despesas = despesas.filter((item) => {
      return String(item.compraId) !== String(despesa.compraId);
    });
  } else if (escopo === "todos" && despesa.despesaFixaId) {
    despesas = despesas.filter((item) => {
      return String(item.despesaFixaId) !== String(despesa.despesaFixaId);
    });
  } else {
    despesas = despesas.filter((item) => {
      return String(item.id) !== String(id);
    });
  }

  salvarDespesasStorage();
  aplicarFiltros();

  mostrarMensagemDespesa("Despesa excluída com sucesso!");

  if (typeof carregarDadosFinanceiros === "function") {
    carregarDadosFinanceiros();
  }
}

// =======================
// STORAGE SEGURO
// =======================
function salvarListaSegura(chave, listaNova) {
  if (!Array.isArray(listaNova)) {
    console.warn(`Salvamento cancelado: ${chave} não é uma lista.`);
    return false;
  }

  const listaAntiga = lerStorage(chave);

  if (listaNova.length === 0 && listaAntiga.length > 0) {
    console.warn(`Bloqueado: tentativa de sobrescrever ${chave} com lista vazia.`);
    return false;
  }

  localStorage.setItem(chave, JSON.stringify(listaNova));
  return true;
}

function salvarDespesasStorage() {
  if (!Array.isArray(despesas)) {
    console.warn("Despesas inválidas. Salvamento cancelado.");
    return;
  }

  const salvouDespesas = salvarListaSegura("despesas", despesas);

  if (!salvouDespesas) {
    return;
  }

  sincronizarDespesasEmTransacoes();
}

function sincronizarDespesasEmTransacoes() {
  if (!Array.isArray(despesas)) {
    console.warn("Sincronização cancelada: despesas inválidas.");
    return;
  }

  /*
    Proteção:
    Se despesas estiver vazio, não remove despesas antigas de transações.
  */
  if (despesas.length === 0) {
    console.warn("Despesas vazias. Não vou alterar transações.");
    return;
  }

  const transacoesAntigas = lerStorage("transacoes");

  const transacoesSemDespesasDaTela = transacoesAntigas.filter((item) => {
    return item.origem !== "despesas";
  });

  const despesasComoTransacoes = despesas.map((despesa) => {
    return {
      id: despesa.id,
      compraId: despesa.compraId || null,
      despesaFixaId: despesa.despesaFixaId || null,
      tipo: "despesa",
      descricao: despesa.descricao,
      descricaoOriginal: despesa.descricaoOriginal || despesa.descricao,
      categoria: despesa.categoria,
      valor: despesa.valor,
      valorTotal: despesa.valorTotal || despesa.valor,
      data: despesa.data,
      pago: despesa.pago,
      tipoDespesa: despesa.tipo,
      origem: "despesas",
      parcelada: Boolean(despesa.parcelada),
      parcelaAtual: despesa.parcelaAtual || null,
      totalParcelas: despesa.totalParcelas || null,
      fixaMensal: Boolean(despesa.fixaMensal),
      recorrenciaAtual: despesa.recorrenciaAtual || null,
      totalRecorrencias: despesa.totalRecorrencias || null,
      autorId: despesa.autorId || null,
      autorEmail: despesa.autorEmail || "",
      autorNickname: despesa.autorNickname || ""
    };
  });

  const transacoesAtualizadas = [
    ...transacoesSemDespesasDaTela,
    ...despesasComoTransacoes
  ];

  salvarListaSegura("transacoes", transacoesAtualizadas);
}

function carregarDespesasStorage() {
  const despesasStorage = lerStorage("despesas");

  despesas = despesasStorage.map((despesa) => {
    const dataISO = normalizarDataISO(despesa.data);

    return {
      ...despesa,
      valor: Number(despesa.valor || 0),
      valorTotal: Number(despesa.valorTotal || despesa.valor || 0),
      data: dataISO,
      dataFormatada: despesa.dataFormatada || formatarData(dataISO),
      parcelada: Boolean(despesa.parcelada),
      parcelaAtual: despesa.parcelaAtual || null,
      totalParcelas: despesa.totalParcelas || null,
      compraId: despesa.compraId || null,
      fixaMensal: Boolean(despesa.fixaMensal),
      despesaFixaId: despesa.despesaFixaId || null,
      recorrenciaAtual: despesa.recorrenciaAtual || null,
      totalRecorrencias: despesa.totalRecorrencias || null,

      /*
        IMPORTANTE:
        Aqui não usa o usuário logado como fallback.
        Se a despesa antiga não tiver autor, fica "Sem autor".
      */
      autorId:
        despesa.autorId ||
        despesa.userId ||
        despesa.user_id ||
        despesa.createdById ||
        despesa.created_by_id ||
        despesa.createdBy?.id ||
        despesa.user?.id ||
        despesa.usuario?.id ||
        null,

      autorEmail:
        despesa.autorEmail ||
        despesa.userEmail ||
        despesa.emailUsuario ||
        despesa.createdByEmail ||
        despesa.created_by_email ||
        despesa.createdBy?.email ||
        despesa.user?.email ||
        despesa.usuario?.email ||
        "",

      autorNickname:
        despesa.autorNickname ||
        despesa.nicknameUsuario ||
        despesa.nomeUsuario ||
        despesa.createdByNickname ||
        despesa.createdByName ||
        despesa.createdBy?.nickname ||
        despesa.createdBy?.name ||
        despesa.user?.nickname ||
        despesa.user?.name ||
        despesa.usuario?.nickname ||
        despesa.usuario?.nome ||
        ""
    };
  });
}

function lerStorage(chave) {
  try {
    const dados = localStorage.getItem(chave);

    if (!dados) return [];

    const parseado = JSON.parse(dados);

    return Array.isArray(parseado) ? parseado : [];
  } catch (error) {
    console.warn(`Erro ao ler ${chave}:`, error);
    return [];
  }
}

// =======================
// FILTRAR
// =======================
function aplicarFiltros() {
  const lista = despesas.filter((despesa) => {
    if (filtros.busca) {
      const texto = filtros.busca;

      const descricao = String(despesa.descricao || "").toLowerCase();
      const descricaoOriginal = String(despesa.descricaoOriginal || "").toLowerCase();
      const categoria = String(despesa.categoria || "").toLowerCase();
      const autor = String(pegarNomeAutorDespesa(despesa) || "").toLowerCase();

      if (
        !descricao.includes(texto) &&
        !descricaoOriginal.includes(texto) &&
        !categoria.includes(texto) &&
        !autor.includes(texto)
      ) {
        return false;
      }
    }

    if (filtros.tipo && despesa.tipo !== filtros.tipo) {
      return false;
    }

    if (filtros.status) {
      const status = despesa.pago ? "pago" : "pendente";

      if (status !== filtros.status) {
        return false;
      }
    }

    if (filtros.data) {
      const mesAnoDespesa = pegarAnoMes(despesa.data);

      if (mesAnoDespesa !== filtros.data) {
        return false;
      }
    }

    return true;
  });

  renderizarDespesas(lista);
}

// =======================
// RENDER
// =======================
function renderizarDespesas(lista = despesas) {
  if (!tabela) return;

  tabela.innerHTML = "";
  atualizarCabecalhoUsuarioDespesas();

  if (lista.length === 0) {
    if (semDados) {
      semDados.style.display = "block";
    }
  } else {
    if (semDados) {
      semDados.style.display = "none";
    }
  }

  lista.forEach((despesa) => {
    const tr = document.createElement("tr");

    const status = despesa.pago ? "Pago" : "Pendente";
    const colunaUsuario = mostrarUsuarioDespesa
      ? `<td class="usuario-despesa">${pegarNomeAutorDespesa(despesa)}</td>`
      : "";

    tr.innerHTML = `
      <td>${despesa.dataFormatada || formatarData(despesa.data)}</td>
      <td>${despesa.descricao}</td>
      <td>${despesa.categoria}</td>
      <td>${formatarTipoDespesa(despesa.tipo)}</td>
      <td>${status}</td>
      <td class="valor negativo">${formatarMoeda(despesa.valor)}</td>
      ${colunaUsuario}
      <td>
        <div class="acoes-despesa">
          <button 
            type="button" 
            class="btn-acao-despesa btn-editar-despesa" 
            title="Editar"
            data-id="${despesa.id}"
          >
            <img src="imagem/iconConfig/lapis.png" alt="Editar">
          </button>

          <button 
            type="button" 
            class="btn-acao-despesa btn-excluir-despesa" 
            title="Excluir"
            data-id="${despesa.id}"
          >
            <img src="imagem/iconConfig/lixeira.png" alt="Excluir">
          </button>
        </div>
      </td>
    `;

    tabela.appendChild(tr);
  });

  atualizarTotais(lista);
}

function atualizarTotais(lista = despesas) {
  const total = lista.reduce((soma, despesa) => {
    return soma + Number(despesa.valor || 0);
  }, 0);

  if (totalDespesas) {
    totalDespesas.textContent = formatarMoeda(total);
  }

  if (totalSaidas) {
    totalSaidas.textContent = formatarMoeda(total);
  }
}

// =======================
// PARCELAMENTO
// =======================
function ehCartaoCredito(categoria) {
  if (!categoria) return false;

  const texto = String(categoria)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return texto.includes("cartao") && texto.includes("credito");
}

function atualizarCampoParcelas() {
  if (!containerParcelas || !selectCategoria) return;

  const categoria = selectCategoria.dataset.categoria;

  if (ehCartaoCredito(categoria)) {
    containerParcelas.style.display = "flex";
    containerParcelas.style.flexDirection = "column";

    if (inputParcelas && (!inputParcelas.value || Number(inputParcelas.value) < 1)) {
      inputParcelas.value = "1";
    }
  } else {
    containerParcelas.style.display = "none";

    if (inputParcelas) {
      inputParcelas.value = "1";
    }

    if (previewParcelas) {
      previewParcelas.textContent = "Informe em quantas vezes a compra foi dividida.";
    }
  }
}

function atualizarPreviewParcelas() {
  if (!previewParcelas || !inputValor || !inputParcelas || !selectCategoria) return;

  const categoria = selectCategoria.dataset.categoria;

  if (!ehCartaoCredito(categoria)) {
    previewParcelas.textContent = "Parcelamento disponível apenas para cartão de crédito.";
    return;
  }

  const valorTotal = converterMoedaParaNumero(inputValor.value);
  const parcelas = Math.max(1, Number(inputParcelas.value || 1));
  const valorParcela = valorTotal / parcelas;

  if (valorTotal <= 0) {
    previewParcelas.textContent = "Informe o valor total da compra.";
    return;
  }

  previewParcelas.textContent = `${parcelas}x de ${formatarMoedaPositiva(valorParcela)}`;
}

// =======================
// UTIL
// =======================
function limparCampos() {
  if (inputDesc) inputDesc.value = "";
  if (inputValor) inputValor.value = "";
  if (inputData) inputData.value = "";
  if (checkPago) checkPago.checked = false;

  if (inputParcelas) {
    inputParcelas.value = "1";
  }

  if (containerParcelas) {
    containerParcelas.style.display = "none";
  }

  if (previewParcelas) {
    previewParcelas.textContent = "Informe em quantas vezes a compra foi dividida.";
  }

  if (categoriaTexto) {
    categoriaTexto.innerText = "Selecione uma categoria";
    categoriaTexto.className = "";
  }

  if (selectCategoria) {
    delete selectCategoria.dataset.categoria;
  }

  document.querySelectorAll(".item-categoria").forEach((opcao) => {
    opcao.classList.remove("ativo");
  });

  const tipoFixa = document.querySelector(
    'input[name="tipoDespesa"][value="fixa"]'
  );

  if (tipoFixa) {
    tipoFixa.checked = true;
  }
}

function limparDescricaoParcela(descricao) {
  return String(descricao || "").replace(/\s*\(\d+\/\d+\)\s*$/g, "").trim();
}

function formatarData(dataISO) {
  if (!dataISO) return "";

  if (dataISO.includes("/")) {
    return dataISO;
  }

  const [ano, mes, dia] = dataISO.split("-");

  if (!ano || !mes || !dia) {
    return dataISO;
  }

  return `${dia}/${mes}/${ano}`;
}

function normalizarDataISO(data) {
  if (!data) return "";

  if (data.includes("-")) {
    return data;
  }

  if (data.includes("/")) {
    const [dia, mes, ano] = data.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  return data;
}

function pegarAnoMes(dataISO) {
  const data = normalizarDataISO(dataISO);

  if (!data || !data.includes("-")) {
    return "";
  }

  const [ano, mes] = data.split("-");

  return `${ano}-${mes}`;
}

function adicionarMeses(dataISO, quantidadeMeses) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);

  const data = new Date(ano, mes - 1, dia);
  const diaOriginal = data.getDate();

  data.setMonth(data.getMonth() + quantidadeMeses);

  if (data.getDate() !== diaOriginal) {
    data.setDate(0);
  }

  const novoAno = data.getFullYear();
  const novoMes = String(data.getMonth() + 1).padStart(2, "0");
  const novoDia = String(data.getDate()).padStart(2, "0");

  return `${novoAno}-${novoMes}-${novoDia}`;
}

function arredondarValor(valor) {
  return Math.round(Number(valor || 0) * 100) / 100;
}

function formatarTipoDespesa(tipo) {
  const tipos = {
    fixa: "Fixa",
    variavel: "Variável",
    sazonal: "Sazonal"
  };

  return tipos[tipo] || tipo;
}

function mostrarMensagemDespesa(mensagem) {
  abrirPopupDespesas({
    icone: "i",
    titulo: "Aviso",
    texto: mensagem,
    botoes: [
      {
        texto: "OK",
        classe: "popup-btn-confirmar"
      }
    ]
  });
}

// =======================
// MOEDA
// =======================
function obterMoedaDespesas() {
  const email =
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    "usuario";

  const userKey = `fambudget_${String(email).toLowerCase().trim()}`;

  return (
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoedaInput(input) {
  let valor = input.value;

  valor = valor.replace(/\D/g, "");

  if (valor === "") {
    input.value = "";
    return;
  }

  const numero = Number(valor) / 100;

  try {
    input.value = numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaDespesas()
    });
  } catch {
    input.value = numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}

function converterMoedaParaNumero(valor) {
  if (!valor) return 0;

  const somenteNumeros = String(valor).replace(/\D/g, "");

  if (!somenteNumeros) return 0;

  return Number(somenteNumeros) / 100;
}

function formatarMoeda(valor) {
  const numero = Math.abs(Number(valor || 0));

  try {
    return `- ${numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaDespesas()
    })}`;
  } catch {
    return `- ${numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })}`;
  }
}

function formatarMoedaPositiva(valor) {
  const numero = Math.abs(Number(valor || 0));

  try {
    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaDespesas()
    });
  } catch {
    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}