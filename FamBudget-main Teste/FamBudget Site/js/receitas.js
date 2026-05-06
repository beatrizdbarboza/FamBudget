console.log("RECEITAS.JS OK - ATUALIZADO COM USUÁRIO, FAMÍLIA E STORAGE POR CONTA");

const STORAGE_RECEITAS = "receitas";
const STORAGE_TRANSACOES = "transacoes";
const STORAGE_REGRAS_RECEITAS_FIXAS = "receitasFixas";
const RECEITAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

let receitas = [];
let regrasReceitasFixas = [];

/* ================= FAMÍLIA / USUÁRIO ================= */
let mostrarUsuarioReceita = false;
let usuarioPertenceFamiliaReceita = false;

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

  filtros.data = pegarAnoMesData(dataMesAtual);
  atualizarTextoMes();

  usuarioPertenceFamiliaReceita = await usuarioEstaEmFamiliaReceitas();
  mostrarUsuarioReceita = usuarioPertenceFamiliaReceita;

  carregarReceitasStorage();
  carregarRegrasReceitasFixasStorage();

  const gerouReceitaFixa = gerarReceitasFixasParaMes(dataMesAtual);

  if (gerouReceitaFixa) {
    salvarReceitasStorage();
  }

  atualizarCabecalhoUsuarioReceitas();
  aplicarFiltros();

  if (typeof carregarDadosFinanceiros === "function") {
    await carregarDadosFinanceiros();
  }
});

/* Atualiza valores quando a moeda, família ou dados mudarem */
window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  if (event.key.includes("moedaUsuario")) {
    aplicarFiltros();
  }

  if (
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia" ||
    event.key === "receitas" ||
    event.key === "transacoes" ||
    event.key.includes("_receitas") ||
    event.key.includes("_transacoes")
  ) {
    usuarioPertenceFamiliaReceita = await usuarioEstaEmFamiliaReceitas();
    mostrarUsuarioReceita = usuarioPertenceFamiliaReceita;

    carregarReceitasStorage();
    carregarRegrasReceitasFixasStorage();

    atualizarCabecalhoUsuarioReceitas();
    aplicarFiltros();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  usuarioPertenceFamiliaReceita = await usuarioEstaEmFamiliaReceitas();
  mostrarUsuarioReceita = usuarioPertenceFamiliaReceita;

  carregarReceitasStorage();
  carregarRegrasReceitasFixasStorage();

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
      background: #ffffff;
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
      color: #ffffff;
    }

    .popup-btn-confirmar:hover {
      background: #256628;
    }

    .popup-btn-perigo {
      background: #d32f2f;
      color: #ffffff;
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

    /* ================= MODO ESCURO - POPUP RECEITAS ================= */

    body.tema-escuro .popup-receitas-overlay,
    body.dark .popup-receitas-overlay {
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(5px);
    }

    body.tema-escuro .popup-receitas-box,
    body.dark .popup-receitas-box {
      background: #1e1e1e;
      color: #f9fafb;
      border: 1px solid #5e6063;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
    }

    body.tema-escuro .popup-receitas-box h3,
    body.dark .popup-receitas-box h3 {
      color: #f9fafb;
    }

    body.tema-escuro .popup-receitas-box p,
    body.dark .popup-receitas-box p {
      color: #d1d5db;
    }

    body.tema-escuro .popup-receitas-icone,
    body.dark .popup-receitas-icone {
      background: rgba(34, 197, 94, 0.16);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.35);
    }

    body.tema-escuro .popup-btn-cancelar,
    body.dark .popup-btn-cancelar {
      background: #2a2a2a;
      color: #f9fafb;
      border: 1px solid #5e6063;
    }

    body.tema-escuro .popup-btn-cancelar:hover,
    body.dark .popup-btn-cancelar:hover {
      background: #333333;
    }

    body.tema-escuro .popup-btn-confirmar,
    body.dark .popup-btn-confirmar {
      background: #238636;
      color: #ffffff;
    }

    body.tema-escuro .popup-btn-confirmar:hover,
    body.dark .popup-btn-confirmar:hover {
      background: #1f7a31;
    }

    body.tema-escuro .popup-btn-perigo,
    body.dark .popup-btn-perigo {
      background: #dc2626;
      color: #ffffff;
    }

    body.tema-escuro .popup-btn-perigo:hover,
    body.dark .popup-btn-perigo:hover {
      background: #b91c1c;
    }

    body.tema-escuro .popup-btn-secundario,
    body.dark .popup-btn-secundario {
      background: rgba(34, 197, 94, 0.14);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.35);
    }

    body.tema-escuro .popup-btn-secundario:hover,
    body.dark .popup-btn-secundario:hover {
      background: rgba(34, 197, 94, 0.22);
    }
      
    /* ================= MODO ESCURO - BOTÕES EDITAR / EXCLUIR DESPESAS ================= */

    body.tema-escuro .btn-editar-receita,
    body.dark .btn-editar-receita {
      background: rgba(223, 220, 128, 0.49);
    }

    body.tema-escuro .btn-editar-receita:hover,
    body.dark .btn-editar-receita:hover {
      background: rgba(194, 189, 52, 0.63);
      color: #4ade80;
      transform: scale(1.05);
    }

    body.tema-escuro .btn-excluir-receita,
    body.dark .btn-excluir-receita {
      background: rgba(239, 68, 68, 0.16);
  
    }

    body.tema-escuro .btn-excluir-receita:hover,
    body.dark .btn-excluir-receita:hover {
      background: rgba(239, 68, 68, 0.25);
      color: #fca5a5;
      transform: scale(1.05);
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
  const nome = getNicknameUsuarioAtualReceita();

  const email = getEmailUsuarioAtualReceita();
  const userKey = `fambudget_${String(email || "usuario").toLowerCase().trim()}`;

  const imagem =
    localStorage.getItem(`${userKey}_avatarUsuario`) ||
    localStorage.getItem(`${userKey}_fotoUsuario`) ||
    localStorage.getItem(`${userKey}_imagemPerfil`) ||
    localStorage.getItem(`${userKey}_fotoPerfil`) ||
    localStorage.getItem(`${userKey}_imagemUsuario`) ||
    sessionStorage.getItem("avatarUsuario") ||
    sessionStorage.getItem("fotoUsuario") ||
    localStorage.getItem("avatarUsuario") ||
    localStorage.getItem("fotoUsuario") ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) {
    nomeUsuario.textContent = nome;
  }

  corrigirFotoGiganteSoltaReceitas();

  if (avatar) {
    avatar.innerHTML = "";
    avatar.textContent = "";

    avatar.style.setProperty("width", "35px", "important");
    avatar.style.setProperty("height", "35px", "important");
    avatar.style.setProperty("min-width", "35px", "important");
    avatar.style.setProperty("max-width", "35px", "important");
    avatar.style.setProperty("min-height", "35px", "important");
    avatar.style.setProperty("max-height", "35px", "important");

    avatar.style.setProperty("border-radius", "50%", "important");
    avatar.style.setProperty("overflow", "hidden", "important");

    avatar.style.setProperty("display", "flex", "important");
    avatar.style.setProperty("align-items", "center", "important");
    avatar.style.setProperty("justify-content", "center", "important");
    avatar.style.setProperty("flex", "0 0 35px", "important");

    avatar.style.setProperty("background-size", "cover", "important");
    avatar.style.setProperty("background-position", "center", "important");
    avatar.style.setProperty("background-repeat", "no-repeat", "important");

    if (imagem) {
      avatar.style.setProperty("background-image", `url("${imagem}")`, "important");
      avatar.style.color = "transparent";
    } else {
      avatar.style.backgroundImage = "";
      avatar.style.color = "#ffffff";
      avatar.textContent = nome.charAt(0).toUpperCase();
    }
  }
}

function corrigirFotoGiganteSoltaReceitas() {
  document
    .querySelectorAll("body > img, .layout > img, .content > img, .main-content > img, .conteudo > img, .topo > img")
    .forEach((img) => {
      const src = img.getAttribute("src") || "";

      if (src.startsWith("data:image")) {
        img.remove();
      }
    });

  ["body", ".layout", ".content", ".main-content", ".conteudo", ".topo"].forEach((seletor) => {
    document.querySelectorAll(seletor).forEach((el) => {
      if (el.id === "avatar" || el.classList.contains("avatar")) return;

      const bgInline = el.style.backgroundImage || "";

      if (
        bgInline.includes("data:image") ||
        bgInline.includes("avatarUsuario") ||
        bgInline.includes("fotoUsuario")
      ) {
        el.style.setProperty("background-image", "none", "important");
      }
    });
  });
}

/* ================= TOKEN / AUTOR ================= */
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

function getPayloadTokenReceita() {
  const token = getTokenReceitas();

  if (!token) return {};

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function getEmailUsuarioAtualReceita() {
  const payload = getPayloadTokenReceita();

  return String(
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    payload.email ||
    payload.user_email ||
    ""
  ).toLowerCase().trim();
}

function getIdUsuarioAtualReceita() {
  const payload = getPayloadTokenReceita();

  return (
    payload.user_id ||
    payload.userId ||
    payload.id ||
    payload.sub ||
    null
  );
}

function getUserKeyReceita(email = null) {
  const emailFinal = email || getEmailUsuarioAtualReceita();
  return `fambudget_${String(emailFinal || "usuario").toLowerCase().trim()}`;
}

function getChaveUsuarioReceita(chave) {
  return `${getUserKeyReceita()}_${chave}`;
}

function buscarDadoUsuarioReceita(chave, email = null) {
  const userKey = getUserKeyReceita(email);
  return localStorage.getItem(`${userKey}_${chave}`) || "";
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

function idsIguaisReceita(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}

function emailsIguaisReceita(a, b) {
  if (!a || !b) return false;
  return String(a).toLowerCase().trim() === String(b).toLowerCase().trim();
}

function pegarIdDonoReceita(receita) {
  return (
    receita?.autorId ||
    receita?.userId ||
    receita?.user_id ||
    receita?.usuarioId ||
    receita?.usuario_id ||
    receita?.createdById ||
    receita?.created_by_id ||
    receita?.ownerId ||
    receita?.owner_id ||
    receita?.createdBy?.id ||
    receita?.user?.id ||
    receita?.usuario?.id ||
    null
  );
}

function pegarEmailDonoReceita(receita) {
  return String(
    receita?.autorEmail ||
    receita?.userEmail ||
    receita?.user_email ||
    receita?.emailUsuario ||
    receita?.email_usuario ||
    receita?.createdByEmail ||
    receita?.created_by_email ||
    receita?.ownerEmail ||
    receita?.owner_email ||
    receita?.createdBy?.email ||
    receita?.user?.email ||
    receita?.usuario?.email ||
    ""
  ).toLowerCase().trim();
}

function itemPertenceAFamiliaReceita(item) {
  if (!item || typeof item !== "object") return false;

  const origem = normalizarTexto(item.origem || item.source || item.tipoOrigem || item.origin || "");
  const escopo = normalizarTexto(item.escopo || item.scope || item.tipoEscopo || "");
  const tipoDado = normalizarTexto(item.tipoDado || item.dataType || "");

  return (
    origem.includes("familia") ||
    origem.includes("family") ||
    escopo.includes("familia") ||
    escopo.includes("family") ||
    tipoDado.includes("familia") ||
    tipoDado.includes("family") ||
    Boolean(item.familyId) ||
    Boolean(item.family_id) ||
    Boolean(item.idFamilia) ||
    Boolean(item.familiaId) ||
    Boolean(item.family) ||
    Boolean(item.familia) ||
    item.compartilhado === true ||
    item.shared === true ||
    item.isFamily === true ||
    item.familiar === true
  );
}

function receitaPertenceAoUsuarioLogado(receita) {
  const idAtual = getIdUsuarioAtualReceita();
  const emailAtual = getEmailUsuarioAtualReceita();

  const idDono = pegarIdDonoReceita(receita);
  const emailDono = pegarEmailDonoReceita(receita);

  if (idsIguaisReceita(idAtual, idDono)) return true;
  if (emailsIguaisReceita(emailAtual, emailDono)) return true;

  /*
    Receitas antigas que não tinham autor salvo.
    Mantém visível para não apagar dados antigos do usuário.
  */
  if (!idDono && !emailDono && !itemPertenceAFamiliaReceita(receita)) {
    return true;
  }

  return false;
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
  const emailAutor = pegarEmailDonoReceita(receita);
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
    "Usuário"
  );
}

function aplicarAutorNaReceita(receita) {
  const autor = getAutorAtualReceita();

  return {
    ...receita,
    autorId: receita.autorId || autor.autorId,
    autorEmail: receita.autorEmail || autor.autorEmail,
    autorNickname: receita.autorNickname || autor.autorNickname,
    escopo: receita.escopo || (usuarioPertenceFamiliaReceita ? "familia" : "individual"),
    compartilhado: receita.compartilhado ?? usuarioPertenceFamiliaReceita
  };
}

/* ================= FAMÍLIA ================= */
function getMembersFromResponseReceita(data) {
  const possiveisListas = [
    data?.members,
    data?.membros,
    data?.users,
    data?.usuarios,

    data?.data?.members,
    data?.data?.membros,
    data?.data?.users,
    data?.data?.usuarios,

    data?.family?.members,
    data?.family?.membros,
    data?.family?.users,
    data?.family?.usuarios,

    data?.data?.family?.members,
    data?.data?.family?.membros,
    data?.data?.family?.users,
    data?.data?.family?.usuarios,

    data?.familia?.members,
    data?.familia?.membros,
    data?.familia?.users,
    data?.familia?.usuarios,

    data?.data?.familia?.members,
    data?.data?.familia?.membros,
    data?.data?.familia?.users,
    data?.data?.familia?.usuarios,

    data?.familyMembers,
    data?.familiaMembers,
    data?.membersFamily,
    data?.membrosFamilia,

    data?.data?.familyMembers,
    data?.data?.familiaMembers,
    data?.data?.membersFamily,
    data?.data?.membrosFamilia
  ];

  return possiveisListas.find((lista) => Array.isArray(lista)) || [];
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

    const text = await resposta.text();
    const data = text ? JSON.parse(text) : null;
    const membros = getMembersFromResponseReceita(data);

    if (!Array.isArray(membros)) return true;

    return membros.length > 0;
  } catch (erro) {
    console.warn("Erro ao verificar família em receitas:", erro);
    return false;
  }
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
      const thAcoes =
        linhaCabecalho.querySelector(".acoes-coluna") ||
        linhaCabecalho.lastElementChild;

      const thUsuario = document.createElement("th");
      thUsuario.textContent = "Usuário";
      thUsuario.setAttribute("data-coluna-usuario", "receitas");

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
      /*
        Não use localStorage.clear().
        Assim as receitas continuam salvas por conta.
      */
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("nomeUsuario");
      sessionStorage.removeItem("nicknameUsuario");
      sessionStorage.removeItem("emailUsuario");

      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
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
  carregarReceitasStorage();
  aplicarFiltros();
  fecharModalReceita();

  if (typeof carregarDadosFinanceiros === "function") {
    carregarDadosFinanceiros();
  }

  window.dispatchEvent(new CustomEvent("dadosFinanceirosAtualizados"));
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

      return aplicarAutorNaReceita({
        ...receita,
        descricao,
        valor,
        data,
        dataFormatada: formatarData(data),
        categoria,
        tipo,
        salvarTodoMes,
        recorrente: Boolean(salvarTodoMes || receita.regraReceitaFixaId)
      });
    });
  }

  salvarReceitasStorage();
  carregarReceitasStorage();
  aplicarFiltros();
  fecharModalReceita();

  mostrarMensagemReceita("Receita atualizada com sucesso!");

  if (typeof carregarDadosFinanceiros === "function") {
    carregarDadosFinanceiros();
  }

  window.dispatchEvent(new CustomEvent("dadosFinanceirosAtualizados"));
}

function editarRegraReceitaFixa(regraId, dados) {
  const dataInicial = normalizarDataISO(dados.data);
  const [, , dia] = dataInicial.split("-").map(Number);

  regrasReceitasFixas = regrasReceitasFixas.map((regra) => {
    if (String(regra.id) !== String(regraId)) {
      return regra;
    }

    return aplicarAutorNaReceita({
      ...regra,
      descricao: dados.descricao,
      valor: dados.valor,
      categoria: dados.categoria,
      tipo: "fixa",
      dataInicial,
      diaRecebimento: dia
    });
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
  carregarReceitasStorage();
  aplicarFiltros();

  mostrarMensagemReceita("Receita excluída com sucesso!");

  if (typeof carregarDadosFinanceiros === "function") {
    carregarDadosFinanceiros();
  }

  window.dispatchEvent(new CustomEvent("dadosFinanceirosAtualizados"));
}

/* ================= RECEITA FIXA ================= */
function criarRegraReceitaFixa({ descricao, valor, data, categoria, tipo }) {
  const dataInicial = normalizarDataISO(data);
  const [, , dia] = dataInicial.split("-").map(Number);

  return aplicarAutorNaReceita({
    id: `regra-receita-fixa-${Date.now()}`,
    descricao,
    valor,
    categoria,
    tipo,
    dataInicial,
    diaRecebimento: dia,
    origem: "receitasFixas",
    ativa: true,
    criadaEm: new Date().toISOString()
  });
}

function gerarReceitasFixasParaMes(dataReferencia) {
  const ano = dataReferencia.getFullYear();
  const mes = dataReferencia.getMonth();

  let alterou = false;

  regrasReceitasFixas.forEach((regra) => {
    if (!regra.ativa) return;

    if (!usuarioPertenceFamiliaReceita) {
      if (itemPertenceAFamiliaReceita(regra)) return;
      if (!receitaPertenceAoUsuarioLogado(regra)) return;
    }

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
      escopo: regra.escopo || (usuarioPertenceFamiliaReceita ? "familia" : "individual"),
      compartilhado: Boolean(regra.compartilhado),
      autorId: regra.autorId || null,
      autorEmail: regra.autorEmail || "",
      autorNickname: regra.autorNickname || ""
    };

    receitas.push(novaReceita);
    alterou = true;
  });

  return alterou;
}

/* ================= STORAGE POR CONTA ================= */
function salvarListaSegura(chave, listaNova) {
  if (!Array.isArray(listaNova)) {
    console.warn(`Salvamento cancelado: ${chave} não é uma lista.`);
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

  const listaParaSalvar = receitas.filter((receita) => {
    if (usuarioPertenceFamiliaReceita) {
      return true;
    }

    return receitaPertenceAoUsuarioLogado(receita);
  });

  salvarListaSegura(getChaveUsuarioReceita(STORAGE_RECEITAS), listaParaSalvar);

  /*
    Mantém a chave global por compatibilidade com home, extratos e telas antigas,
    mas sem misturar receitas de outras contas.
  */
  salvarListaSegura(STORAGE_RECEITAS, listaParaSalvar);

  salvarReceitasEmTransacoes(listaParaSalvar);
}

function salvarReceitasEmTransacoes(listaReceitas = receitas) {
  if (!Array.isArray(listaReceitas)) {
    console.warn("Sincronização cancelada: receitas inválidas.");
    return;
  }

  const chaveTransacoesUsuario = getChaveUsuarioReceita(STORAGE_TRANSACOES);

  const transacoesAntigasUsuario = lerStorageEspecifico(chaveTransacoesUsuario, localStorage);
  const transacoesAntigasGlobais = lerStorageEspecifico(STORAGE_TRANSACOES, localStorage);

  const transacoesAntigas = juntarListasPorId([
    ...transacoesAntigasUsuario,
    ...transacoesAntigasGlobais
  ]);

  const transacoesSemReceitasDaTela = transacoesAntigas.filter((item) => {
    if (!ehTransacaoReceita(item)) return true;

    return false;
  });

  const receitasComoTransacoes = listaReceitas.map((receita) => {
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
      escopo: receita.escopo || (usuarioPertenceFamiliaReceita ? "familia" : "individual"),
      compartilhado: Boolean(receita.compartilhado),
      autorId: receita.autorId || null,
      autorEmail: receita.autorEmail || "",
      autorNickname: receita.autorNickname || ""
    };
  });

  const transacoesAtualizadas = [
    ...transacoesSemReceitasDaTela,
    ...receitasComoTransacoes
  ];

  salvarListaSegura(chaveTransacoesUsuario, transacoesAtualizadas);
  salvarListaSegura(STORAGE_TRANSACOES, transacoesAtualizadas);
}

function carregarReceitasStorage() {
  const chaveReceitasUsuario = getChaveUsuarioReceita(STORAGE_RECEITAS);
  const chaveTransacoesUsuario = getChaveUsuarioReceita(STORAGE_TRANSACOES);

  const receitasUsuario = lerStorageEspecifico(chaveReceitasUsuario, localStorage);
  const receitasGlobais = lerStorageEspecifico(STORAGE_RECEITAS, localStorage);

  const transacoesUsuario = lerStorageEspecifico(chaveTransacoesUsuario, localStorage);
  const transacoesGlobais = lerStorageEspecifico(STORAGE_TRANSACOES, localStorage);

  const receitasDasTransacoes = [
    ...transacoesUsuario,
    ...transacoesGlobais
  ].filter((item) => ehTransacaoReceita(item));

  const listaNormalizada = [
    ...receitasUsuario,
    ...receitasGlobais,
    ...receitasDasTransacoes
  ].map((receita, index) => {
    return normalizarReceitaStorage(receita, index);
  });

  const mapa = new Map();

  listaNormalizada.forEach((item, index) => {
    const chave = criarChaveUnicaReceita(item, index);

    if (!mapa.has(chave)) {
      mapa.set(chave, item);
    }
  });

  let lista = Array.from(mapa.values());

  /*
    REGRA PRINCIPAL:
    - Em família: mostra tudo salvo para a família/conta.
    - Fora da família: mostra só receitas individuais/do usuário logado.
      Receitas marcadas como família/compartilhadas somem da tela.
  */
  if (!usuarioPertenceFamiliaReceita) {
    lista = lista.filter((receita) => {
      if (itemPertenceAFamiliaReceita(receita)) {
        return false;
      }

      return receitaPertenceAoUsuarioLogado(receita);
    });
  }

  receitas = lista;
}

function normalizarReceitaStorage(receita, index = 0) {
  const dataISO = normalizarDataISO(
    receita.data ||
    receita.date ||
    receita.createdAt ||
    receita.created_at ||
    receita.dataTransacao ||
    receita.transactionDate
  );

  const valor = Number(
    receita.valor ||
    receita.value ||
    receita.amount ||
    receita.total ||
    0
  );

  return {
    ...receita,
    id:
      receita.id ||
      receita.incomeId ||
      receita.income_id ||
      receita.transactionId ||
      receita.transaction_id ||
      `receita-storage-${Date.now()}-${index}`,

    descricao:
      receita.descricao ||
      receita.description ||
      receita.nome ||
      receita.name ||
      receita.title ||
      "Sem descrição",

    valor,

    data: dataISO,
    dataFormatada: receita.dataFormatada || formatarData(dataISO),

    categoria:
      receita.categoria ||
      receita.category ||
      receita.categoryName ||
      receita.nomeCategoria ||
      "Outros",

    tipo:
      receita.tipoReceita ||
      receita.tipo ||
      receita.incomeType ||
      receita.classificacao ||
      "variavel",

    origem: receita.origem || "receitas",
    escopo: receita.escopo || receita.scope || "",
    compartilhado: Boolean(receita.compartilhado || receita.shared),

    recorrente: Boolean(receita.recorrente || receita.recurring),
    salvarTodoMes: Boolean(receita.salvarTodoMes),
    regraReceitaFixaId: receita.regraReceitaFixaId || null,

    autorId:
      receita.autorId ||
      receita.userId ||
      receita.user_id ||
      receita.usuarioId ||
      receita.usuario_id ||
      receita.createdById ||
      receita.created_by_id ||
      receita.createdBy?.id ||
      receita.user?.id ||
      receita.usuario?.id ||
      null,

    autorEmail:
      receita.autorEmail ||
      receita.userEmail ||
      receita.user_email ||
      receita.emailUsuario ||
      receita.email_usuario ||
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
}

function carregarRegrasReceitasFixasStorage() {
  const chaveRegrasUsuario = getChaveUsuarioReceita(STORAGE_REGRAS_RECEITAS_FIXAS);

  const regrasUsuario = lerStorageEspecifico(chaveRegrasUsuario, localStorage);
  const regrasGlobais = lerStorageEspecifico(STORAGE_REGRAS_RECEITAS_FIXAS, localStorage);

  const listaNormalizada = [...regrasUsuario, ...regrasGlobais].map((regra, index) => {
    return {
      ...regra,
      id: regra.id || `regra-receita-fixa-${Date.now()}-${index}`,
      ativa: regra.ativa !== false,

      escopo: regra.escopo || regra.scope || "",
      compartilhado: Boolean(regra.compartilhado || regra.shared),

      autorId:
        regra.autorId ||
        regra.userId ||
        regra.user_id ||
        regra.usuarioId ||
        regra.usuario_id ||
        regra.createdById ||
        regra.created_by_id ||
        regra.createdBy?.id ||
        regra.user?.id ||
        regra.usuario?.id ||
        null,

      autorEmail:
        regra.autorEmail ||
        regra.userEmail ||
        regra.user_email ||
        regra.emailUsuario ||
        regra.email_usuario ||
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

  const mapa = new Map();

  listaNormalizada.forEach((regra) => {
    if (!mapa.has(String(regra.id))) {
      mapa.set(String(regra.id), regra);
    }
  });

  let lista = Array.from(mapa.values());

  if (!usuarioPertenceFamiliaReceita) {
    lista = lista.filter((regra) => {
      if (itemPertenceAFamiliaReceita(regra)) {
        return false;
      }

      return receitaPertenceAoUsuarioLogado(regra);
    });
  }

  regrasReceitasFixas = lista;
}

function salvarRegrasReceitasFixasStorage() {
  const listaParaSalvar = regrasReceitasFixas.filter((regra) => {
    if (usuarioPertenceFamiliaReceita) {
      return true;
    }

    return receitaPertenceAoUsuarioLogado(regra);
  });

  salvarListaSegura(getChaveUsuarioReceita(STORAGE_REGRAS_RECEITAS_FIXAS), listaParaSalvar);
  salvarListaSegura(STORAGE_REGRAS_RECEITAS_FIXAS, listaParaSalvar);
}

function lerStorageEspecifico(chave, storage) {
  try {
    const dados = storage.getItem(chave);

    if (!dados) return [];

    const parseado = JSON.parse(dados);

    return Array.isArray(parseado) ? parseado : [];
  } catch (error) {
    console.warn(`Erro ao ler ${chave}:`, error);
    return [];
  }
}

function juntarListasPorId(lista) {
  const mapa = new Map();

  lista.forEach((item, index) => {
    const chave =
      item?.id ||
      item?.incomeId ||
      item?.expenseId ||
      item?.transactionId ||
      `${index}-${JSON.stringify(item)}`;

    if (!mapa.has(String(chave))) {
      mapa.set(String(chave), item);
    }
  });

  return Array.from(mapa.values());
}

function ehTransacaoReceita(item) {
  if (!item) return false;

  const tipo = normalizarTexto(
    item.tipo ||
    item.type ||
    item.transactionType ||
    item.tipoTransacao ||
    item.categoryType
  );

  const origem = normalizarTexto(item.origem || item.source || "");

  if (origem === "receitas") return true;

  return (
    tipo === "receita" ||
    tipo === "income" ||
    tipo === "entrada" ||
    tipo === "entradas" ||
    tipo.includes("receita") ||
    tipo.includes("income")
  );
}

function criarChaveUnicaReceita(item, index) {
  if (item.id) return `id-${String(item.id)}`;

  return [
    item.descricao,
    item.data,
    item.valor,
    item.categoria,
    item.autorEmail,
    index
  ].join("|");
}

/* ================= FILTRAR ================= */
function aplicarFiltros() {
  const lista = receitas.filter((receita) => {
    if (!usuarioPertenceFamiliaReceita) {
      if (itemPertenceAFamiliaReceita(receita)) {
        return false;
      }

      if (!receitaPertenceAoUsuarioLogado(receita)) {
        return false;
      }
    }

    if (filtros.busca) {
      const texto = normalizarTexto(filtros.busca);

      const descricao = normalizarTexto(receita.descricao || "");
      const categoria = normalizarTexto(receita.categoria || "");
      const autor = normalizarTexto(pegarNomeAutorReceita(receita) || "");

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

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarData(dataISO) {
  if (!dataISO) return "";

  const texto = String(dataISO).slice(0, 10);

  if (texto.includes("/")) {
    return texto;
  }

  const [ano, mes, dia] = texto.split("-");

  if (!ano || !mes || !dia) {
    return dataISO;
  }

  return `${dia}/${mes}/${ano}`;
}

function normalizarDataISO(data) {
  if (!data) return "";

  const texto = String(data);

  if (texto.includes("T")) {
    return texto.slice(0, 10);
  }

  if (texto.includes("-")) {
    return texto.slice(0, 10);
  }

  if (texto.includes("/")) {
    const [dia, mes, ano] = texto.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  return texto;
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

  return tipos[tipo] || tipo || "Variável";
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
    getEmailUsuarioAtualReceita() ||
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

/* ================= FUNÇÕES GLOBAIS ================= */
window.carregarReceitas = async function carregarReceitas() {
  usuarioPertenceFamiliaReceita = await usuarioEstaEmFamiliaReceitas();
  mostrarUsuarioReceita = usuarioPertenceFamiliaReceita;

  carregarReceitasStorage();
  carregarRegrasReceitasFixasStorage();

  atualizarCabecalhoUsuarioReceitas();
  aplicarFiltros();
};

window.recarregarReceitas = window.carregarReceitas;