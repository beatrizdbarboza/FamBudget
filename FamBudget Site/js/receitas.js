console.log("RECEITAS.JS OK");

const STORAGE_RECEITAS = "receitas";
const STORAGE_TRANSACOES = "transacoes";
const STORAGE_REGRAS_RECEITAS_FIXAS = "receitasFixas";
const RECEITAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

let receitas = [];
let regrasReceitasFixas = [];

/* ================= FAMÍLIA / USUÁRIO ================= */
let mostrarUsuarioReceita = false;

let filtros = {
  tipo: null,
  data: null,
  busca: ""
};

let modal;
let btnNova;
let btnCancelar;
let btnSalvar;

let inputDesc;
let inputValor;
let inputData;
let checkMensal;

let selectCategoria;
let dropdownCategoriaModal;
let textoSelecionado;

let inputBusca;
let filtroTipo;
let dropdownTipo;

let tabela;
let totalReceitas;
let totalEntradas;
let semDados;

let btnMesAnterior;
let btnProximoMes;
let textoMesAtual;

let dataMesAtual = new Date();

let modoEdicaoReceita = false;
let idReceitaEditando = null;
let escopoEdicaoReceita = "unico";

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  pegarElementos();
  inserirCssAcoesReceitas();
  criarPopupReceitas();
  carregarUsuario();
  configurarEventos();
  configurarControleMes();

  mostrarUsuarioReceita = await usuarioEstaEmFamiliaReceitas();
  atualizarCabecalhoUsuarioReceitas();

  /*
    IMPORTANTE:
    Aqui apenas carrega os dados existentes.
    Só salva se realmente gerar uma receita fixa nova.
  */
  carregarReceitasStorage();
  carregarRegrasReceitasFixasStorage();

  const gerouReceitaFixa = gerarReceitasFixasParaMes(dataMesAtual);

  if (gerouReceitaFixa) {
    salvarReceitasStorage();
  }

  filtros.data = pegarAnoMesData(dataMesAtual);
  atualizarTextoMes();
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
    mostrarUsuarioReceita = await usuarioEstaEmFamiliaReceitas();
    atualizarCabecalhoUsuarioReceitas();
    aplicarFiltros();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  mostrarUsuarioReceita = await usuarioEstaEmFamiliaReceitas();
  atualizarCabecalhoUsuarioReceitas();
  aplicarFiltros();
});

/* ================= PEGAR ELEMENTOS ================= */
function pegarElementos() {
  modal = document.getElementById("modalNovaReceita");

  btnNova =
    document.getElementById("btnNovaReceita") ||
    document.getElementById("btnNovaDespesa");

  btnCancelar = document.getElementById("cancelarReceita");
  btnSalvar = document.getElementById("salvarReceita");

  inputDesc = document.getElementById("descReceita");
  inputValor = document.getElementById("valorReceita");
  inputData = document.getElementById("dataReceita");

  checkMensal =
    document.getElementById("checkMensal") ||
    document.getElementById("checkPago");

  selectCategoria = document.getElementById("selectCategoria");
  dropdownCategoriaModal = document.getElementById("dropdownCategoriaModal");
  textoSelecionado = document.getElementById("categoriaSelecionada");

  inputBusca =
    document.getElementById("inputBuscaReceita") ||
    document.querySelector(".input-busca input");

  filtroTipo = document.getElementById("filtroTipo");
  dropdownTipo = document.getElementById("dropdownTipo");

  tabela = document.getElementById("lista-extratos");

  totalReceitas =
    document.getElementById("total-receitas") ||
    document.querySelector(".card-total h2");

  totalEntradas = document.getElementById("total-entradas");
  semDados = document.getElementById("sem-dados");

  btnMesAnterior = document.getElementById("mes-anterior");
  btnProximoMes = document.getElementById("proximo-mes");
  textoMesAtual = document.getElementById("mes-atual");

  if (inputValor) {
    inputValor.setAttribute("type", "text");
    inputValor.setAttribute("inputmode", "numeric");
    inputValor.setAttribute("autocomplete", "off");
    inputValor.setAttribute("placeholder", "R$ 0,00");
  }
}

/* ================= CSS AÇÕES / POPUP ================= */
function inserirCssAcoesReceitas() {
  if (document.getElementById("css-acoes-receitas")) return;

  const style = document.createElement("style");
  style.id = "css-acoes-receitas";

  style.textContent = `
    .acoes-coluna {
      text-align: center !important;
      width: 120px;
    }

    .acoes-receita {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-acao-receita {
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

    .btn-acao-receita img {
      width: 17px;
      height: 17px;
      object-fit: contain;
      display: block;
      pointer-events: none;
    }

    .btn-editar-receita {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .btn-editar-receita:hover {
      background: #c8e6c9;
      transform: scale(1.05);
    }

    .btn-excluir-receita {
      background: #ffebee;
      color: #d32f2f;
    }

    .btn-excluir-receita:hover {
      background: #ffcdd2;
      transform: scale(1.05);
    }

    .usuario-receita {
      font-weight: 600;
      color: #2e7d32;
      white-space: nowrap;
    }

    body.tema-escuro .usuario-receita,
    body.dark .usuario-receita {
      color: #22c55e;
    }

    .popup-receitas-overlay {
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

    .popup-receitas-box {
      width: 420px;
      max-width: 95%;
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
      text-align: center;
      animation: popupReceitasEntrada 0.2s ease;
    }

    @keyframes popupReceitasEntrada {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .popup-receitas-icone {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #e8f5e9;
      color: #2e7d32;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 700;
    }

    .popup-receitas-box h3 {
      font-size: 21px;
      color: #111827;
      margin-bottom: 8px;
    }

    .popup-receitas-box p {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .popup-receitas-acoes {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .popup-receitas-acoes button {
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

/* ================= POPUP ================= */
function criarPopupReceitas() {
  if (document.getElementById("popupReceitas")) return;

  const popup = document.createElement("div");
  popup.id = "popupReceitas";
  popup.className = "popup-receitas-overlay";

  popup.innerHTML = `
    <div class="popup-receitas-box">
      <div class="popup-receitas-icone" id="popupReceitasIcone">i</div>
      <h3 id="popupReceitasTitulo">Confirmação</h3>
      <p id="popupReceitasTexto">Tem certeza?</p>
      <div class="popup-receitas-acoes" id="popupReceitasAcoes"></div>
    </div>
  `;

  document.body.appendChild(popup);
}

function abrirPopupReceitas({ icone = "i", titulo, texto, botoes }) {
  const popup = document.getElementById("popupReceitas");
  const popupIcone = document.getElementById("popupReceitasIcone");
  const popupTitulo = document.getElementById("popupReceitasTitulo");
  const popupTexto = document.getElementById("popupReceitasTexto");
  const popupAcoes = document.getElementById("popupReceitasAcoes");

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
      fecharPopupReceitas();

      if (typeof botao.acao === "function") {
        botao.acao();
      }
    });

    popupAcoes.appendChild(btn);
  });

  popup.style.display = "flex";
}

function fecharPopupReceitas() {
  const popup = document.getElementById("popupReceitas");

  if (popup) {
    popup.style.display = "none";
  }
}

/* ================= USUÁRIO ================= */
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

/* ================= FAMÍLIA / AUTOR ================= */
function getTokenReceitas() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

async function usuarioEstaEmFamiliaReceitas() {
  const token = getTokenReceitas();

  if (!token) return false;

  try {
    const resposta = await fetch(`${RECEITAS_API_URL}/family`, {
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
    console.warn("Erro ao verificar família em receitas:", erro);
    return false;
  }
}

function getEmailUsuarioAtualReceita() {
  return (
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    ""
  ).toLowerCase().trim();
}

function getUserKeyReceita(email = null) {
  const emailFinal = email || getEmailUsuarioAtualReceita();
  return `fambudget_${String(emailFinal || "usuario").toLowerCase().trim()}`;
}

function buscarDadoUsuarioReceita(chave, email = null) {
  const userKey = getUserKeyReceita(email);
  return localStorage.getItem(`${userKey}_${chave}`) || "";
}

function getIdUsuarioAtualReceita() {
  const token = getTokenReceitas();

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

function getNicknameUsuarioAtualReceita() {
  const email = getEmailUsuarioAtualReceita();

  return (
    buscarDadoUsuarioReceita("nicknameUsuario", email) ||
    buscarDadoUsuarioReceita("nomeUsuario", email) ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário"
  );
}

function getAutorAtualReceita() {
  return {
    autorId: getIdUsuarioAtualReceita(),
    autorEmail: getEmailUsuarioAtualReceita(),
    autorNickname: getNicknameUsuarioAtualReceita()
  };
}

function buscarNicknamePorEmailReceita(email) {
  if (!email) return "";

  return (
    buscarDadoUsuarioReceita("nicknameUsuario", email) ||
    buscarDadoUsuarioReceita("nomeUsuario", email) ||
    ""
  );
}

function pegarNomeAutorReceita(receita) {
  const emailAutor =
    receita.autorEmail ||
    receita.userEmail ||
    receita.emailUsuario ||
    receita.createdByEmail ||
    receita.created_by_email ||
    receita.createdBy?.email ||
    receita.user?.email ||
    receita.usuario?.email ||
    "";

  const nicknameSalvo = buscarNicknamePorEmailReceita(emailAutor);

  return (
    nicknameSalvo ||
    receita.autorNickname ||
    receita.nicknameUsuario ||
    receita.nomeUsuario ||
    receita.createdByNickname ||
    receita.createdByName ||
    receita.createdBy?.nickname ||
    receita.createdBy?.name ||
    receita.user?.nickname ||
    receita.user?.name ||
    receita.usuario?.nickname ||
    receita.usuario?.nome ||
    ""
  );
}

/*
  Só usa o usuário logado quando está criando receita nova.
  Não use essa função para carregar dados antigos.
*/
function aplicarAutorNaReceita(receita) {
  const autor = getAutorAtualReceita();

  return {
    ...receita,
    autorId: receita.autorId || autor.autorId,
    autorEmail: receita.autorEmail || autor.autorEmail,
    autorNickname: receita.autorNickname || autor.autorNickname
  };
}

function atualizarCabecalhoUsuarioReceitas() {
  if (!tabela) return;

  const tabelaCompleta = tabela.closest("table");

  if (!tabelaCompleta) return;

  const linhaCabecalho = tabelaCompleta.querySelector("thead tr");

  if (!linhaCabecalho) return;

  const thUsuarioExistente = linhaCabecalho.querySelector("[data-coluna-usuario='receitas']");

  if (mostrarUsuarioReceita) {
    if (!thUsuarioExistente) {
      const thValor =
        linhaCabecalho.querySelector(".valor-coluna") ||
        linhaCabecalho.lastElementChild;

      const thUsuario = document.createElement("th");
      thUsuario.textContent = "Usuário";
      thUsuario.setAttribute("data-coluna-usuario", "receitas");

      if (thValor) {
        linhaCabecalho.insertBefore(thUsuario, thValor);
      } else {
        linhaCabecalho.appendChild(thUsuario);
      }
    }
  } else if (thUsuarioExistente) {
    thUsuarioExistente.remove();
  }
}

/* ================= EVENTOS ================= */
function configurarEventos() {
  if (btnNova) {
    btnNova.addEventListener("click", abrirModalReceita);
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", fecharModalReceita);
  }

  if (btnSalvar) {
    btnSalvar.addEventListener("click", salvarReceita);
  }

  if (inputValor) {
    inputValor.addEventListener("input", () => {
      formatarMoedaInput(inputValor);
    });
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

  if (tabela) {
    tabela.addEventListener("click", (e) => {
      const btnEditar = e.target.closest(".btn-editar-receita");
      const btnExcluir = e.target.closest(".btn-excluir-receita");

      if (btnEditar) {
        const id = btnEditar.dataset.id;
        confirmarEditarReceita(id);
        return;
      }

      if (btnExcluir) {
        const id = btnExcluir.dataset.id;
        confirmarExcluirReceita(id);
      }
    });
  }

  configurarCategoria();
  configurarFiltros();
  configurarMenu();

  document.addEventListener("click", (e) => {
    if (
      dropdownCategoriaModal &&
      selectCategoria &&
      !selectCategoria.contains(e.target)
    ) {
      dropdownCategoriaModal.style.display = "none";
    }

    if (
      dropdownTipo &&
      filtroTipo &&
      !filtroTipo.contains(e.target)
    ) {
      dropdownTipo.style.display = "none";
    }
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      fecharModalReceita();
    }
  });
}

/* ================= MENU ================= */
function configurarMenu() {
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

/* ================= MODAL ================= */
function abrirModalReceita() {
  modoEdicaoReceita = false;
  idReceitaEditando = null;
  escopoEdicaoReceita = "unico";

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar";
  }

  if (modal) {
    modal.style.display = "flex";
  }
}

function abrirModalReceitaEdicao() {
  if (btnSalvar) {
    btnSalvar.textContent = "Atualizar";
  }

  if (modal) {
    modal.style.display = "flex";
  }
}

function fecharModalReceita() {
  if (modal) {
    modal.style.display = "none";
  }

  limparCampos();

  modoEdicaoReceita = false;
  idReceitaEditando = null;
  escopoEdicaoReceita = "unico";

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar";
  }
}

/* ================= DROPDOWN PADRÃO ================= */
function toggleDropdown(btn, drop) {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    drop.style.display = drop.style.display === "block" ? "none" : "block";
  });
}

/* ================= CATEGORIA ================= */
function configurarCategoria() {
  if (!selectCategoria || !dropdownCategoriaModal || !textoSelecionado) return;

  selectCategoria.addEventListener("click", (e) => {
    e.stopPropagation();

    dropdownCategoriaModal.style.display =
      dropdownCategoriaModal.style.display === "block" ? "none" : "block";
  });

  document.querySelectorAll(".item-categoria").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();

      selecionarCategoriaReceita(item);
      dropdownCategoriaModal.style.display = "none";
    });
  });
}

function selecionarCategoriaReceita(item) {
  const nome = item.getAttribute("data-categoria");

  textoSelecionado.textContent = nome;
  textoSelecionado.className = "";

  item.classList.forEach((classe) => {
    if (classe.startsWith("cat-")) {
      textoSelecionado.classList.add(classe);
    }
  });

  document.querySelectorAll(".item-categoria").forEach((opcao) => {
    opcao.classList.remove("ativo");
  });

  item.classList.add("ativo");
}

function selecionarCategoriaPorNome(nomeCategoria) {
  if (!textoSelecionado) return;

  textoSelecionado.textContent = nomeCategoria || "Selecione uma categoria";
  textoSelecionado.className = "";

  document.querySelectorAll(".item-categoria").forEach((item) => {
    item.classList.remove("ativo");

    if (item.getAttribute("data-categoria") === nomeCategoria) {
      item.classList.add("ativo");

      item.classList.forEach((classe) => {
        if (classe.startsWith("cat-")) {
          textoSelecionado.classList.add(classe);
        }
      });
    }
  });
}

/* ================= FILTROS ================= */
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
}

/* ================= CONTROLE DE MÊS ================= */
function configurarControleMes() {
  if (btnMesAnterior) {
    btnMesAnterior.addEventListener("click", () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() - 1);

      const gerouReceitaFixa = gerarReceitasFixasParaMes(dataMesAtual);

      if (gerouReceitaFixa) {
        salvarReceitasStorage();
      }

      filtros.data = pegarAnoMesData(dataMesAtual);
      atualizarTextoMes();
      aplicarFiltros();
    });
  }

  if (btnProximoMes) {
    btnProximoMes.addEventListener("click", () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() + 1);

      const gerouReceitaFixa = gerarReceitasFixasParaMes(dataMesAtual);

      if (gerouReceitaFixa) {
        salvarReceitasStorage();
      }

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

/* ================= SALVAR / EDITAR RECEITA ================= */
function salvarReceita() {
  if (modoEdicaoReceita) {
    atualizarReceitaEditada();
    return;
  }

  const descricao = inputDesc.value.trim();
  const valor = converterMoedaParaNumero(inputValor.value);
  const data = inputData?.value || "";
  const categoria = textoSelecionado.textContent;

  let tipo =
    document.querySelector('input[name="tipoReceita"]:checked')?.value ||
    "fixa";

  const salvarTodoMes = checkMensal?.checked || false;

  if (
    !descricao ||
    valor <= 0 ||
    !data ||
    categoria === "Selecione uma categoria"
  ) {
    mostrarMensagemReceita("Preencha todos os campos corretamente!");
    return;
  }

  const deveRepetirTodoMes = tipo === "fixa" || salvarTodoMes;

  if (deveRepetirTodoMes) {
    tipo = "fixa";

    const novaRegra = criarRegraReceitaFixa({
      descricao,
      valor,
      data,
      categoria,
      tipo
    });

    regrasReceitasFixas.push(novaRegra);
    salvarRegrasReceitasFixasStorage();

    gerarReceitasFixasParaMes(dataMesAtual);
  } else {
    const novaReceita = aplicarAutorNaReceita({
      id: `receita-${Date.now()}`,
      descricao,
      valor,
      data,
      dataFormatada: formatarData(data),
      categoria,
      tipo,
      salvarTodoMes: false,
      origem: "receitas",
      recorrente: false
    });

    receitas.push(novaReceita);
  }

  salvarReceitasStorage();
  aplicarFiltros();
  fecharModalReceita();

  if (typeof carregarDadosFinanceiros === "function") {
    carregarDadosFinanceiros();
  }
}

function atualizarReceitaEditada() {
  const receitaOriginal = receitas.find((receita) => {
    return String(receita.id) === String(idReceitaEditando);
  });

  if (!receitaOriginal) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  const descricao = inputDesc.value.trim();
  const valor = converterMoedaParaNumero(inputValor.value);
  const data = inputData?.value || "";
  const categoria = textoSelecionado.textContent;

  const tipo =
    document.querySelector('input[name="tipoReceita"]:checked')?.value ||
    "fixa";

  const salvarTodoMes = checkMensal?.checked || false;

  if (
    !descricao ||
    valor <= 0 ||
    !data ||
    categoria === "Selecione uma categoria"
  ) {
    mostrarMensagemReceita("Preencha todos os campos corretamente!");
    return;
  }

  if (
    escopoEdicaoReceita === "todos" &&
    receitaOriginal.regraReceitaFixaId
  ) {
    editarRegraReceitaFixa(receitaOriginal.regraReceitaFixaId, {
      descricao,
      valor,
      data,
      categoria,
      tipo: "fixa"
    });
  } else {
    receitas = receitas.map((receita) => {
      if (String(receita.id) !== String(idReceitaEditando)) {
        return receita;
      }

      return {
        ...receita,
        descricao,
        valor,
        data,
        dataFormatada: formatarData(data),
        categoria,
        tipo,
        salvarTodoMes,
        recorrente: Boolean(salvarTodoMes || receita.regraReceitaFixaId)
      };
    });
  }

  salvarReceitasStorage();
  aplicarFiltros();
  fecharModalReceita();

  mostrarMensagemReceita("Receita atualizada com sucesso!");
}

function editarRegraReceitaFixa(regraId, dados) {
  const dataInicial = normalizarDataISO(dados.data);
  const [ano, mes, dia] = dataInicial.split("-").map(Number);

  regrasReceitasFixas = regrasReceitasFixas.map((regra) => {
    if (String(regra.id) !== String(regraId)) {
      return regra;
    }

    return {
      ...regra,
      descricao: dados.descricao,
      valor: dados.valor,
      categoria: dados.categoria,
      tipo: "fixa",
      dataInicial,
      diaRecebimento: dia
    };
  });

  receitas = receitas.filter((receita) => {
    return String(receita.regraReceitaFixaId) !== String(regraId);
  });

  salvarRegrasReceitasFixasStorage();

  const gerouReceitaFixa = gerarReceitasFixasParaMes(dataMesAtual);

  if (gerouReceitaFixa) {
    salvarReceitasStorage();
  }
}

/* ================= AÇÕES EDITAR / EXCLUIR ================= */
function confirmarEditarReceita(id) {
  const receita = receitas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  if (receita.regraReceitaFixaId) {
    abrirPopupReceitas({
      icone: "i",
      titulo: "Editar receita fixa",
      texto: "Essa receita faz parte de uma repetição mensal. Deseja editar apenas este mês ou todos os meses dessa receita fixa?",
      botoes: [
        {
          texto: "Cancelar",
          classe: "popup-btn-cancelar"
        },
        {
          texto: "Apenas este mês",
          classe: "popup-btn-secundario",
          acao: () => prepararEdicaoReceita(id, "unico")
        },
        {
          texto: "Todos os meses",
          classe: "popup-btn-confirmar",
          acao: () => prepararEdicaoReceita(id, "todos")
        }
      ]
    });

    return;
  }

  abrirPopupReceitas({
    icone: "i",
    titulo: "Editar receita",
    texto: "Deseja mesmo editar esta receita?",
    botoes: [
      {
        texto: "Cancelar",
        classe: "popup-btn-cancelar"
      },
      {
        texto: "Editar",
        classe: "popup-btn-confirmar",
        acao: () => prepararEdicaoReceita(id, "unico")
      }
    ]
  });
}

function prepararEdicaoReceita(id, escopo) {
  const receita = receitas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  modoEdicaoReceita = true;
  idReceitaEditando = id;
  escopoEdicaoReceita = escopo || "unico";

  if (inputDesc) inputDesc.value = receita.descricao || "";
  if (inputValor) inputValor.value = formatarMoeda(receita.valor);
  if (inputData) inputData.value = normalizarDataISO(receita.data);
  if (checkMensal) checkMensal.checked = Boolean(receita.salvarTodoMes || receita.recorrente);

  selecionarCategoriaPorNome(receita.categoria);

  const radioTipo = document.querySelector(
    `input[name="tipoReceita"][value="${receita.tipo || "fixa"}"]`
  );

  if (radioTipo) {
    radioTipo.checked = true;
  }

  abrirModalReceitaEdicao();
}

function confirmarExcluirReceita(id) {
  const receita = receitas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  if (receita.regraReceitaFixaId) {
    abrirPopupReceitas({
      icone: "!",
      titulo: "Excluir receita fixa",
      texto: "Essa receita faz parte de uma repetição mensal. Deseja excluir apenas este mês ou todos os meses dessa receita fixa?",
      botoes: [
        {
          texto: "Cancelar",
          classe: "popup-btn-cancelar"
        },
        {
          texto: "Apenas este mês",
          classe: "popup-btn-secundario",
          acao: () => excluirReceita(id, "unico")
        },
        {
          texto: "Todos os meses",
          classe: "popup-btn-perigo",
          acao: () => excluirReceita(id, "todos")
        }
      ]
    });

    return;
  }

  abrirPopupReceitas({
    icone: "!",
    titulo: "Excluir receita",
    texto: "Tem certeza que deseja excluir esta receita? Essa ação não poderá ser desfeita.",
    botoes: [
      {
        texto: "Cancelar",
        classe: "popup-btn-cancelar"
      },
      {
        texto: "Excluir",
        classe: "popup-btn-perigo",
        acao: () => excluirReceita(id, "unico")
      }
    ]
  });
}

function excluirReceita(id, escopo) {
  const receita = receitas.find((item) => {
    return String(item.id) === String(id);
  });

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  if (escopo === "todos" && receita.regraReceitaFixaId) {
    regrasReceitasFixas = regrasReceitasFixas.map((regra) => {
      if (String(regra.id) !== String(receita.regraReceitaFixaId)) {
        return regra;
      }

      return {
        ...regra,
        ativa: false
      };
    });

    receitas = receitas.filter((item) => {
      return String(item.regraReceitaFixaId) !== String(receita.regraReceitaFixaId);
    });

    salvarRegrasReceitasFixasStorage();
  } else {
    receitas = receitas.filter((item) => {
      return String(item.id) !== String(id);
    });
  }

  salvarReceitasStorage();
  aplicarFiltros();

  mostrarMensagemReceita("Receita excluída com sucesso!");
}

/* ================= RECEITA FIXA ================= */
function criarRegraReceitaFixa({ descricao, valor, data, categoria, tipo }) {
  const dataInicial = normalizarDataISO(data);
  const [ano, mes, dia] = dataInicial.split("-").map(Number);
  const autor = getAutorAtualReceita();

  return {
    id: `regra-receita-fixa-${Date.now()}`,
    descricao,
    valor,
    categoria,
    tipo,
    dataInicial,
    diaRecebimento: dia,
    origem: "receitasFixas",
    ativa: true,
    criadaEm: new Date().toISOString(),
    autorId: autor.autorId,
    autorEmail: autor.autorEmail,
    autorNickname: autor.autorNickname
  };
}

function gerarReceitasFixasParaMes(dataReferencia) {
  const ano = dataReferencia.getFullYear();
  const mes = dataReferencia.getMonth();

  let alterou = false;

  regrasReceitasFixas.forEach((regra) => {
    if (!regra.ativa) return;

    const dataInicial = converterData(regra.dataInicial);

    if (!dataInicial) return;

    const diferencaMeses =
      (ano - dataInicial.getFullYear()) * 12 +
      (mes - dataInicial.getMonth());

    if (diferencaMeses < 0) return;

    const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate();
    const diaFinal = Math.min(Number(regra.diaRecebimento || 1), ultimoDiaDoMes);

    const dataGerada = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(diaFinal).padStart(2, "0")}`;

    const jaExiste = receitas.some((receita) => {
      return (
        String(receita.regraReceitaFixaId) === String(regra.id) &&
        pegarAnoMes(receita.data) === pegarAnoMes(dataGerada)
      );
    });

    if (jaExiste) return;

    const novaReceita = {
      id: `${regra.id}-${ano}-${String(mes + 1).padStart(2, "0")}`,
      regraReceitaFixaId: regra.id,
      descricao: regra.descricao,
      valor: Number(regra.valor || 0),
      data: dataGerada,
      dataFormatada: formatarData(dataGerada),
      categoria: regra.categoria,
      tipo: "fixa",
      salvarTodoMes: true,
      origem: "receitas",
      recorrente: true,

      /*
        Usa o autor da regra.
        Se regra antiga não tiver autor, fica vazio.
      */
      autorId: regra.autorId || null,
      autorEmail: regra.autorEmail || "",
      autorNickname: regra.autorNickname || ""
    };

    receitas.push(novaReceita);
    alterou = true;
  });

  return alterou;
}

/* ================= STORAGE SEGURO ================= */
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

function salvarReceitasStorage() {
  if (!Array.isArray(receitas)) {
    console.warn("Receitas inválidas. Salvamento cancelado.");
    return;
  }

  const salvouReceitas = salvarListaSegura(STORAGE_RECEITAS, receitas);

  if (!salvouReceitas) {
    return;
  }

  salvarReceitasEmTransacoes();
}

function salvarReceitasEmTransacoes() {
  if (!Array.isArray(receitas)) {
    console.warn("Sincronização cancelada: receitas inválidas.");
    return;
  }

  /*
    Proteção:
    Se receitas estiver vazio, não remove receitas antigas de transações.
  */
  if (receitas.length === 0) {
    console.warn("Receitas vazias. Não vou alterar transações.");
    return;
  }

  const transacoesAntigas = lerStorage(STORAGE_TRANSACOES);

  const transacoesSemReceitasDaTela = transacoesAntigas.filter((item) => {
    return item.origem !== "receitas";
  });

  const receitasComoTransacoes = receitas.map((receita) => {
    return {
      id: receita.id,
      tipo: "receita",
      descricao: receita.descricao,
      categoria: receita.categoria,
      valor: receita.valor,
      data: receita.data,
      dataFormatada: receita.dataFormatada || formatarData(receita.data),
      tipoReceita: receita.tipo,
      origem: "receitas",
      salvarTodoMes: Boolean(receita.salvarTodoMes),
      recorrente: Boolean(receita.recorrente),
      regraReceitaFixaId: receita.regraReceitaFixaId || null,
      autorId: receita.autorId || null,
      autorEmail: receita.autorEmail || "",
      autorNickname: receita.autorNickname || ""
    };
  });

  const transacoesAtualizadas = [
    ...transacoesSemReceitasDaTela,
    ...receitasComoTransacoes
  ];

  salvarListaSegura(STORAGE_TRANSACOES, transacoesAtualizadas);
}

function carregarReceitasStorage() {
  const receitasStorage = lerStorage(STORAGE_RECEITAS);

  receitas = receitasStorage.map((receita) => {
    const dataISO = normalizarDataISO(receita.data);

    return {
      ...receita,
      valor: Number(receita.valor || 0),
      data: dataISO,
      dataFormatada: receita.dataFormatada || formatarData(dataISO),
      origem: receita.origem || "receitas",
      recorrente: Boolean(receita.recorrente),
      salvarTodoMes: Boolean(receita.salvarTodoMes),
      regraReceitaFixaId: receita.regraReceitaFixaId || null,

      /*
        IMPORTANTE:
        Aqui não usa o usuário logado como fallback.
        Se a receita antiga não tiver autor, fica "Sem autor".
      */
      autorId:
        receita.autorId ||
        receita.userId ||
        receita.user_id ||
        receita.createdById ||
        receita.created_by_id ||
        receita.createdBy?.id ||
        receita.user?.id ||
        receita.usuario?.id ||
        null,

      autorEmail:
        receita.autorEmail ||
        receita.userEmail ||
        receita.emailUsuario ||
        receita.createdByEmail ||
        receita.created_by_email ||
        receita.createdBy?.email ||
        receita.user?.email ||
        receita.usuario?.email ||
        "",

      autorNickname:
        receita.autorNickname ||
        receita.nicknameUsuario ||
        receita.nomeUsuario ||
        receita.createdByNickname ||
        receita.createdByName ||
        receita.createdBy?.nickname ||
        receita.createdBy?.name ||
        receita.user?.nickname ||
        receita.user?.name ||
        receita.usuario?.nickname ||
        receita.usuario?.nome ||
        ""
    };
  });
}

function carregarRegrasReceitasFixasStorage() {
  regrasReceitasFixas = lerStorage(STORAGE_REGRAS_RECEITAS_FIXAS).map((regra) => {
    return {
      ...regra,

      /*
        IMPORTANTE:
        Não usa usuário logado como dono de regra antiga.
      */
      autorId:
        regra.autorId ||
        regra.userId ||
        regra.user_id ||
        regra.createdById ||
        regra.created_by_id ||
        regra.createdBy?.id ||
        regra.user?.id ||
        regra.usuario?.id ||
        null,

      autorEmail:
        regra.autorEmail ||
        regra.userEmail ||
        regra.emailUsuario ||
        regra.createdByEmail ||
        regra.created_by_email ||
        regra.createdBy?.email ||
        regra.user?.email ||
        regra.usuario?.email ||
        "",

      autorNickname:
        regra.autorNickname ||
        regra.nicknameUsuario ||
        regra.nomeUsuario ||
        regra.createdByNickname ||
        regra.createdByName ||
        regra.createdBy?.nickname ||
        regra.createdBy?.name ||
        regra.user?.nickname ||
        regra.user?.name ||
        regra.usuario?.nickname ||
        regra.usuario?.nome ||
        ""
    };
  });
}

function salvarRegrasReceitasFixasStorage() {
  salvarListaSegura(STORAGE_REGRAS_RECEITAS_FIXAS, regrasReceitasFixas);
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

/* ================= FILTRAR ================= */
function aplicarFiltros() {
  const lista = receitas.filter((receita) => {
    if (filtros.busca) {
      const texto = filtros.busca;

      const descricao = String(receita.descricao || "").toLowerCase();
      const categoria = String(receita.categoria || "").toLowerCase();
      const autor = String(pegarNomeAutorReceita(receita) || "").toLowerCase();

      if (
        !descricao.includes(texto) &&
        !categoria.includes(texto) &&
        !autor.includes(texto)
      ) {
        return false;
      }
    }

    if (filtros.tipo && receita.tipo !== filtros.tipo) {
      return false;
    }

    if (filtros.data) {
      const mesAnoReceita = pegarAnoMes(receita.data);

      if (mesAnoReceita !== filtros.data) {
        return false;
      }
    }

    return true;
  });

  renderizarReceitas(lista);
}

/* ================= RENDER ================= */
function renderizarReceitas(lista = receitas) {
  if (!tabela) return;

  tabela.innerHTML = "";
  atualizarCabecalhoUsuarioReceitas();

  if (lista.length === 0) {
    if (semDados) {
      semDados.style.display = "block";
    }
  } else {
    if (semDados) {
      semDados.style.display = "none";
    }
  }

  lista.forEach((receita) => {
    const tr = document.createElement("tr");

    const colunaUsuario = mostrarUsuarioReceita
      ? `<td class="usuario-receita">${pegarNomeAutorReceita(receita)}</td>`
      : "";

    tr.innerHTML = `
      <td>${receita.dataFormatada || formatarData(receita.data)}</td>
      <td>${receita.descricao}</td>
      <td>${receita.categoria}</td>
      <td>${formatarTipoReceita(receita.tipo)}</td>
      ${colunaUsuario}
      <td class="valor positivo">${formatarMoeda(receita.valor)}</td>
      <td>
        <div class="acoes-receita">
          <button 
            type="button" 
            class="btn-acao-receita btn-editar-receita" 
            title="Editar"
            data-id="${receita.id}"
          >
            <img src="imagem/iconConfig/lapis.png" alt="Editar">
          </button>

          <button 
            type="button" 
            class="btn-acao-receita btn-excluir-receita" 
            title="Excluir"
            data-id="${receita.id}"
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

function atualizarTotais(lista = receitas) {
  const total = lista.reduce((soma, receita) => {
    return soma + Number(receita.valor || 0);
  }, 0);

  if (totalReceitas) {
    totalReceitas.textContent = formatarMoeda(total);
  }

  if (totalEntradas) {
    totalEntradas.textContent = formatarMoeda(total);
  }
}

/* ================= UTIL ================= */
function limparCampos() {
  if (inputDesc) inputDesc.value = "";
  if (inputValor) inputValor.value = "";
  if (inputData) inputData.value = "";
  if (checkMensal) checkMensal.checked = false;

  if (textoSelecionado) {
    textoSelecionado.textContent = "Selecione uma categoria";
    textoSelecionado.className = "select-categorias";
  }

  document.querySelectorAll(".item-categoria").forEach((opcao) => {
    opcao.classList.remove("ativo");
  });

  const tipoFixa = document.querySelector(
    'input[name="tipoReceita"][value="fixa"]'
  );

  if (tipoFixa) {
    tipoFixa.checked = true;
  }
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

function converterData(dataValor) {
  if (!dataValor) return null;

  const texto = String(dataValor).trim();

  if (texto.includes("-")) {
    const [ano, mes, dia] = texto.split("T")[0].split("-");
    return new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0);
  }

  if (texto.includes("/")) {
    const [dia, mes, ano] = texto.split("/");
    return new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0);
  }

  const data = new Date(texto);
  return isNaN(data.getTime()) ? null : data;
}

function pegarAnoMes(dataISO) {
  const data = normalizarDataISO(dataISO);

  if (!data || !data.includes("-")) {
    return "";
  }

  const [ano, mes] = data.split("-");

  return `${ano}-${mes}`;
}

function formatarTipoReceita(tipo) {
  const tipos = {
    fixa: "Fixa",
    variavel: "Variável",
    sazonal: "Sazonal"
  };

  return tipos[tipo] || tipo;
}

function mostrarMensagemReceita(mensagem) {
  abrirPopupReceitas({
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

/* ================= MOEDA ================= */
function obterMoedaReceitas() {
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
  let valor = String(input.value || "").replace(/\D/g, "");

  if (!valor) {
    input.value = "";
    return;
  }

  const numero = Number(valor) / 100;

  try {
    input.value = numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaReceitas()
    });
  } catch {
    input.value = numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  input.setSelectionRange(input.value.length, input.value.length);
}

function converterMoedaParaNumero(valor) {
  if (!valor) return 0;

  const somenteNumeros = String(valor).replace(/\D/g, "");

  if (!somenteNumeros) return 0;

  return Number(somenteNumeros) / 100;
}

function formatarMoeda(valor) {
  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaReceitas()
    });
  } catch {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}