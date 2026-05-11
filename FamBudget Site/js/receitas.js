console.log("RECEITAS.JS OK - API + EXCLUSÃO FORÇADA + HOME ATUALIZADA");

const RECEITAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";
const STORAGE_RECEITAS_EXCLUIDAS = "receitasExcluidas";

let receitas = [];
let receitasFiltradas = [];
let membrosFamiliaReceita = [];

let usuarioPertenceFamiliaReceita = false;
let mostrarUsuarioReceita = false;

let filtros = {
  tipo: null,
  busca: "",
  data: null
};

let dataMesAtual = new Date();

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
let paginacao;

let btnMesAnterior;
let btnProximoMes;
let textoMesAtual;

let modoEdicaoReceita = false;
let idReceitaEditando = null;
let salvandoReceita = false;

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

  await recarregarReceitasCompleto();
});

window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  if (
    event.key.includes("moedaUsuario") ||
    event.key === STORAGE_RECEITAS_EXCLUIDAS ||
    event.key === getChaveReceitasExcluidas() ||
    event.key.includes("_receitasExcluidas") ||
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia" ||
    event.key === "receitasAtualizadasEm" ||
    event.key === "dadosFinanceirosAtualizadosEm"
  ) {
    await recarregarReceitasCompleto();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  await recarregarReceitasCompleto();
});

window.addEventListener("dadosFinanceirosAtualizados", async () => {
  await recarregarReceitasCompleto();
});

window.addEventListener("focus", async () => {
  await recarregarReceitasCompleto();
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
  paginacao = document.getElementById("paginacao");

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

/* ================= RECARREGAR ================= */

async function recarregarReceitasCompleto() {
  usuarioPertenceFamiliaReceita = await usuarioEstaEmFamiliaReceitas();
  mostrarUsuarioReceita = usuarioPertenceFamiliaReceita;

  atualizarCabecalhoUsuarioReceitas();

  await carregarReceitasAPI();
  aplicarFiltros();
}

/* ================= CSS EXTRA ================= */

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
      font-size: 18px;
      font-weight: 700;
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

    body.tema-escuro .popup-btn-confirmar,
    body.dark .popup-btn-confirmar {
      background: #238636;
      color: #ffffff;
    }

    body.tema-escuro .popup-btn-perigo,
    body.dark .popup-btn-perigo {
      background: #dc2626;
      color: #ffffff;
    }

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

function mostrarMensagemReceita(mensagem) {
  abrirPopupReceitas({
    icone: "i",
    titulo: "Atenção",
    texto: mensagem,
    botoes: [
      {
        texto: "OK",
        classe: "popup-btn-confirmar"
      }
    ]
  });
}

/* ================= TOKEN / USUÁRIO ================= */

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
    payload.sub_email ||
    ""
  )
    .toLowerCase()
    .trim();
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

  return (
    localStorage.getItem(`${userKey}_${chave}`) ||
    sessionStorage.getItem(`${userKey}_${chave}`) ||
    localStorage.getItem(chave) ||
    sessionStorage.getItem(chave) ||
    ""
  );
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

function formatarNicknameReceita(nome) {
  const texto = String(nome || "").trim();

  if (!texto) return "Usuário";

  const primeiroNome = texto.split(" ")[0];

  return primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
}

function carregarUsuario() {
  const nome = getNicknameUsuarioAtualReceita();
  const email = getEmailUsuarioAtualReceita();
  const userKey = getUserKeyReceita(email);

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

  const nomeFormatado = formatarNicknameReceita(nome);

  if (nomeUsuario) {
    nomeUsuario.textContent = nomeFormatado;
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
      avatar.style.setProperty("background", "transparent", "important");
      avatar.style.setProperty("background-image", `url("${imagem}")`, "important");
      avatar.style.setProperty("color", "transparent", "important");
      avatar.textContent = "";
    } else {
      avatar.style.setProperty("background-image", "none", "important");
      avatar.style.setProperty(
        "background",
        "linear-gradient(135deg, #2e7d32, rgb(78, 187, 10))",
        "important"
      );
      avatar.style.setProperty("color", "#ffffff", "important");
      avatar.textContent = String(nomeFormatado || "U").charAt(0).toUpperCase();
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

/* ================= HELPERS ================= */

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
  )
    .toLowerCase()
    .trim();
}

function receitaPertenceAoUsuarioLogado(receita) {
  const idAtual = getIdUsuarioAtualReceita();
  const emailAtual = getEmailUsuarioAtualReceita();

  const idDono = pegarIdDonoReceita(receita);
  const emailDono = pegarEmailDonoReceita(receita);

  if (idsIguaisReceita(idAtual, idDono)) return true;
  if (emailsIguaisReceita(emailAtual, emailDono)) return true;

  if (!idDono && !emailDono) return true;

  return false;
}

function pegarNomeAutorReceita(receita) {
  const nomeDireto =
    receita?.autorNickname ||
    receita?.nicknameUsuario ||
    receita?.nomeUsuario ||
    receita?.createdByNickname ||
    receita?.createdByName ||
    receita?.createdBy?.nickname ||
    receita?.createdBy?.nickName ||
    receita?.createdBy?.name ||
    receita?.createdBy?.nome ||
    receita?.user?.nickname ||
    receita?.user?.nickName ||
    receita?.user?.name ||
    receita?.user?.nome ||
    receita?.usuario?.nickname ||
    receita?.usuario?.nickName ||
    receita?.usuario?.name ||
    receita?.usuario?.nome ||
    "";

  if (nomeDireto) {
    return formatarNicknameReceita(nomeDireto);
  }

  const idAtual = getIdUsuarioAtualReceita();
  const emailAtual = getEmailUsuarioAtualReceita();

  const idDono =
    receita?.autorId ||
    receita?.userId ||
    receita?.user_id ||
    receita?.usuarioId ||
    receita?.usuario_id ||
    receita?.createdById ||
    receita?.created_by_id ||
    receita?.userCreatedFamilyId ||
    receita?.user_created_family_id ||
    receita?.user?.id ||
    receita?.usuario?.id ||
    null;

  const emailDono = String(
    receita?.autorEmail ||
    receita?.userEmail ||
    receita?.user_email ||
    receita?.emailUsuario ||
    receita?.email_usuario ||
    receita?.createdByEmail ||
    receita?.created_by_email ||
    receita?.user?.email ||
    receita?.usuario?.email ||
    ""
  )
    .toLowerCase()
    .trim();

  const nomePeloMembro = buscarNomeMembroPorIdOuEmailReceita(idDono, emailDono);

  if (nomePeloMembro) {
    return formatarNicknameReceita(nomePeloMembro);
  }

  const pertenceAoUsuarioLogado =
    (idAtual && idDono && String(idAtual) === String(idDono)) ||
    (emailAtual && emailDono && emailAtual === emailDono) ||
    (!idDono && !emailDono);

  if (pertenceAoUsuarioLogado) {
    return formatarNicknameReceita(getNicknameUsuarioAtualReceita());
  }

  if (emailDono) {
    const nomeSalvo =
      buscarDadoUsuarioReceita("nicknameUsuario", emailDono) ||
      buscarDadoUsuarioReceita("nomeUsuario", emailDono);

    if (nomeSalvo) {
      return formatarNicknameReceita(nomeSalvo);
    }
  }

  return idDono ? `Usuário ${idDono}` : "Usuário";
}

/* ================= API ================= */

async function lerRespostaReceitas(resposta) {
  const texto = await resposta.text();

  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

function headersReceitas(json = false) {
  const token = getTokenReceitas();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function apiReceitas(path, options = {}) {
  const token = getTokenReceitas();

  if (!token) {
    mostrarMensagemReceita("Sessão expirada. Faça login novamente.");

    return {
      ok: false,
      status: 401,
      data: null
    };
  }

  try {
    const resposta = await fetch(`${RECEITAS_API_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        ...(options.headers || {})
      }
    });

    const data = await lerRespostaReceitas(resposta);

    if (!resposta.ok) {
      console.warn("API RECEITAS falhou:", path, resposta.status, data);
    }

    return {
      ok: resposta.ok,
      status: resposta.status,
      data
    };
  } catch (erro) {
    console.error("Erro na API de receitas:", erro);

    return {
      ok: false,
      status: 0,
      data: erro
    };
  }
}

function transformarEmArray(resposta) {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;

  const possibilidades = [
    resposta.data,
    resposta.items,
    resposta.results,
    resposta.content,
    resposta.list,
    resposta.lista,
    resposta.incomes,
    resposta.revenues,
    resposta.receitas,

    resposta.data?.items,
    resposta.data?.results,
    resposta.data?.content,
    resposta.data?.list,
    resposta.data?.lista,
    resposta.data?.incomes,
    resposta.data?.revenues,
    resposta.data?.receitas
  ];

  const lista = possibilidades.find((item) => Array.isArray(item));

  return lista || [];
}

async function carregarReceitasAPI() {
  const [ano, mes] = (filtros.data || pegarAnoMesData(dataMesAtual)).split("-");
  const mesNumero = Number(mes);
  const anoNumero = Number(ano);

  let listaAPI = [];

  usuarioPertenceFamiliaReceita = await usuarioEstaEmFamiliaReceitas();
  mostrarUsuarioReceita = usuarioPertenceFamiliaReceita;

  if (usuarioPertenceFamiliaReceita) {
    await carregarMembrosFamiliaReceita();

    const familyId = await obterFamilyIdReceita();

    const tentativasFamilia = [
      ...(familyId
        ? [
            `/income/family/${familyId}?month=${mesNumero}&year=${anoNumero}`,
            `/revenue/family/${familyId}?month=${mesNumero}&year=${anoNumero}`,
            `/family/${familyId}/income?month=${mesNumero}&year=${anoNumero}`,
            `/family/${familyId}/revenue?month=${mesNumero}&year=${anoNumero}`
          ]
        : []),

      `/income/family?month=${mesNumero}&year=${anoNumero}`,
      `/family/income?month=${mesNumero}&year=${anoNumero}`,
      `/revenue/family?month=${mesNumero}&year=${anoNumero}`
    ];

    for (const path of tentativasFamilia) {
      const resposta = await apiReceitas(path, {
        method: "GET",
        headers: headersReceitas(false)
      });

      console.log("TENTATIVA RECEITAS FAMÍLIA:", {
        path,
        status: resposta.status,
        ok: resposta.ok,
        data: resposta.data
      });

      if (!resposta.ok) continue;

      const lista = transformarEmArray(resposta.data);

      if (lista.length > 0) {
        listaAPI = lista;
        break;
      }
    }
  } else {
    membrosFamiliaReceita = [];

    const tentativasUsuario = [
      `/income/user?month=${mesNumero}&year=${anoNumero}`,
      `/income/user?month=${mes}&year=${ano}`,
      `/income/user?mes=${mesNumero}&ano=${anoNumero}`,
      `/revenue/user?month=${mesNumero}&year=${anoNumero}`,
      `/revenue/user?month=${mes}&year=${ano}`
    ];

    for (const path of tentativasUsuario) {
      const resposta = await apiReceitas(path, {
        method: "GET",
        headers: headersReceitas(false)
      });

      console.log("TENTATIVA RECEITAS USUÁRIO:", {
        path,
        status: resposta.status,
        ok: resposta.ok,
        data: resposta.data
      });

      if (!resposta.ok) continue;

      const lista = transformarEmArray(resposta.data);

      if (lista.length > 0) {
        listaAPI = lista;
        break;
      }
    }
  }

  receitas = removerDuplicadasReceitas(
    listaAPI
      .map((item, index) => normalizarReceitaAPI(item, index))
      .filter((receita) => !receitaFoiExcluida(receita))
      .filter((receita) => {
        if (usuarioPertenceFamiliaReceita) return true;
        return receitaPertenceAoUsuarioLogado(receita);
      })
  );

  atualizarCabecalhoUsuarioReceitas();

  console.log("RECEITAS API USADAS:", receitas);
}

async function criarReceitaAPI(payload) {
  const tentativas = [
    "/income",
    "/income/user",
    "/revenue",
    "/revenue/user"
  ];

  for (const path of tentativas) {
    const resposta = await apiReceitas(path, {
      method: "POST",
      headers: headersReceitas(true),
      body: JSON.stringify(payload)
    });

    if (resposta.ok) {
      return resposta;
    }

    if (resposta.status !== 404 && resposta.status !== 405) {
      return resposta;
    }
  }

  return {
    ok: false,
    status: 404,
    data: "Endpoint de criação de receita não encontrado."
  };
}

async function atualizarReceitaAPI(id, payload) {
  const tentativas = [
    `/income/${id}`,
    `/income/user/${id}`,
    `/revenue/${id}`,
    `/revenue/user/${id}`
  ];

  for (const path of tentativas) {
    const resposta = await apiReceitas(path, {
      method: "PUT",
      headers: headersReceitas(true),
      body: JSON.stringify(payload)
    });

    if (resposta.ok) {
      return resposta;
    }

    if (resposta.status !== 404 && resposta.status !== 405 && resposta.status !== 422) {
      return resposta;
    }
  }

  return {
    ok: false,
    status: 404,
    data: "Receita não encontrada para edição."
  };
}

async function excluirReceitaAPI(id) {
  const tentativas = [
    `/income/${id}`,
    `/income/user/${id}`,
    `/revenue/${id}`,
    `/revenue/user/${id}`
  ];

  let ultimaResposta = null;

  for (const path of tentativas) {
    const resposta = await apiReceitas(path, {
      method: "DELETE",
      headers: headersReceitas(false)
    });

    ultimaResposta = resposta;

    console.log("TENTATIVA EXCLUIR RECEITA:", {
      path,
      status: resposta.status,
      ok: resposta.ok,
      data: resposta.data
    });

    if (resposta.ok) {
      return resposta;
    }

    if (
      resposta.status !== 404 &&
      resposta.status !== 405 &&
      resposta.status !== 422
    ) {
      return resposta;
    }
  }

  return ultimaResposta || {
    ok: false,
    status: 0,
    data: "Não foi possível excluir a receita na API."
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
      headers: headersReceitas(false)
    });

    if (resposta.status === 404) return false;
    if (!resposta.ok) return false;

    const data = await lerRespostaReceitas(resposta);
    const membros = getMembersFromResponseReceita(data);

    if (!Array.isArray(membros)) return true;

    return membros.length > 0;
  } catch (erro) {
    console.warn("Erro ao verificar família em receitas:", erro);
    return false;
  }
}

async function carregarMembrosFamiliaReceita() {
  membrosFamiliaReceita = [];

  if (!usuarioPertenceFamiliaReceita) return [];

  try {
    const resposta = await apiReceitas("/family", {
      method: "GET",
      headers: headersReceitas(false)
    });

    if (!resposta.ok) {
      console.warn("Não foi possível carregar membros da família em receitas:", resposta);
      return [];
    }

    const data = resposta.data?.data || resposta.data;
    const membros = getMembersFromResponseReceita(data);

    membrosFamiliaReceita = Array.isArray(membros) ? membros : [];

    console.log("MEMBROS FAMÍLIA RECEITAS:", membrosFamiliaReceita);

    return membrosFamiliaReceita;
  } catch (erro) {
    console.warn("Erro ao carregar membros da família em receitas:", erro);
    membrosFamiliaReceita = [];
    return [];
  }
}

function pegarIdMembroReceita(membro) {
  return (
    membro?.userId ||
    membro?.user_id ||
    membro?.memberUserId ||
    membro?.member_user_id ||
    membro?.familyUserId ||
    membro?.family_user_id ||
    membro?.userCreatedFamilyId ||
    membro?.user_created_family_id ||
    membro?.user?.id ||
    membro?.user?.userId ||
    membro?.user?.user_id ||
    membro?.usuario?.id ||
    membro?.usuario?.userId ||
    membro?.usuario?.user_id ||
    membro?.member?.id ||
    membro?.member?.userId ||
    membro?.member?.user_id ||
    membro?.familyUser?.id ||
    membro?.familyUser?.userId ||
    membro?.familyUser?.user_id ||
    membro?.id ||
    null
  );
}

function pegarEmailMembroReceita(membro) {
  return String(
    membro?.email ||
    membro?.userEmail ||
    membro?.emailUser ||
    membro?.user_email ||
    membro?.email_user ||
    membro?.user?.email ||
    membro?.user?.userEmail ||
    membro?.usuario?.email ||
    membro?.usuario?.userEmail ||
    membro?.member?.email ||
    membro?.member?.userEmail ||
    membro?.familyUser?.email ||
    membro?.familyUser?.userEmail ||
    ""
  )
    .toLowerCase()
    .trim();
}

function pegarNomeMembroReceita(membro) {
  const nome =
    membro?.nickname ||
    membro?.nickName ||
    membro?.apelido ||
    membro?.user?.nickname ||
    membro?.user?.nickName ||
    membro?.user?.apelido ||
    membro?.usuario?.nickname ||
    membro?.usuario?.nickName ||
    membro?.usuario?.apelido ||
    membro?.member?.nickname ||
    membro?.member?.nickName ||
    membro?.member?.apelido ||
    membro?.familyUser?.nickname ||
    membro?.familyUser?.nickName ||
    membro?.familyUser?.apelido ||
    membro?.name ||
    membro?.nome ||
    membro?.username ||
    membro?.email ||
    membro?.user?.name ||
    membro?.user?.nome ||
    membro?.user?.username ||
    membro?.user?.email ||
    membro?.usuario?.name ||
    membro?.usuario?.nome ||
    membro?.usuario?.username ||
    membro?.usuario?.email ||
    membro?.member?.name ||
    membro?.member?.nome ||
    membro?.member?.username ||
    membro?.member?.email ||
    membro?.familyUser?.name ||
    membro?.familyUser?.nome ||
    membro?.familyUser?.username ||
    membro?.familyUser?.email ||
    "";

  return formatarNicknameReceita(nome);
}

function pegarNomeAutorReceita(receita) {
  const nomeDireto =
    receita?.autorNickname ||
    receita?.nicknameUsuario ||
    receita?.nomeUsuario ||
    receita?.createdByNickname ||
    receita?.createdByName ||
    receita?.createdBy?.nickname ||
    receita?.createdBy?.nickName ||
    receita?.createdBy?.name ||
    receita?.createdBy?.nome ||
    receita?.user?.nickname ||
    receita?.user?.nickName ||
    receita?.user?.name ||
    receita?.user?.nome ||
    receita?.usuario?.nickname ||
    receita?.usuario?.nickName ||
    receita?.usuario?.name ||
    receita?.usuario?.nome ||
    "";

  if (nomeDireto) {
    return formatarNicknameReceita(nomeDireto);
  }

  const idAtual = getIdUsuarioAtualReceita();
  const emailAtual = getEmailUsuarioAtualReceita();

  const idDono =
    receita?.autorId ||
    receita?.userId ||
    receita?.user_id ||
    receita?.usuarioId ||
    receita?.usuario_id ||
    receita?.createdById ||
    receita?.created_by_id ||
    receita?.userCreatedFamilyId ||
    receita?.user_created_family_id ||
    receita?.user?.id ||
    receita?.usuario?.id ||
    null;

  const emailDono = String(
    receita?.autorEmail ||
    receita?.userEmail ||
    receita?.user_email ||
    receita?.emailUsuario ||
    receita?.email_usuario ||
    receita?.createdByEmail ||
    receita?.created_by_email ||
    receita?.user?.email ||
    receita?.usuario?.email ||
    ""
  )
    .toLowerCase()
    .trim();

  const nomePeloMembro = buscarNomeMembroPorIdOuEmailReceita(idDono, emailDono);

  if (nomePeloMembro) {
    return formatarNicknameReceita(nomePeloMembro);
  }

  const pertenceAoUsuarioLogado =
    (idAtual && idDono && String(idAtual) === String(idDono)) ||
    (emailAtual && emailDono && emailAtual === emailDono) ||
    (!idDono && !emailDono);

  if (pertenceAoUsuarioLogado) {
    return formatarNicknameReceita(getNicknameUsuarioAtualReceita());
  }

  if (emailDono) {
    const nomeSalvo =
      buscarDadoUsuarioReceita("nicknameUsuario", emailDono) ||
      buscarDadoUsuarioReceita("nomeUsuario", emailDono);

    if (nomeSalvo) {
      return formatarNicknameReceita(nomeSalvo);
    }
  }

  return idDono ? `Usuário ${idDono}` : "Usuário";
}

function buscarNomeMembroPorIdOuEmailReceita(idUsuario, emailUsuario = "") {
  const id = idUsuario ? String(idUsuario) : "";
  const email = String(emailUsuario || "").toLowerCase().trim();

  const membro = membrosFamiliaReceita.find((item) => {
    const idMembro = pegarIdMembroReceita(item);
    const emailMembro = pegarEmailMembroReceita(item);

    const mesmoId =
      id &&
      idMembro !== null &&
      idMembro !== undefined &&
      String(idMembro) === id;

    const mesmoEmail =
      email &&
      emailMembro &&
      emailMembro === email;

    return mesmoId || mesmoEmail;
  });

  if (!membro) return "";

  const nome = pegarNomeMembroReceita(membro);

  return nome || "";
}

async function obterFamilyIdReceita() {
  const resposta = await apiReceitas("/family", {
    method: "GET",
    headers: headersReceitas(false)
  });

  if (!resposta.ok) return null;

  const data = resposta.data?.data || resposta.data;

  const familyId =
    data?.id ||
    data?.familyId ||
    data?.family_id ||
    data?.familiaId ||
    data?.familia_id ||
    data?.family?.id ||
    data?.familia?.id ||
    null;

  return familyId;
}

function atualizarCabecalhoUsuarioReceitas() {
  if (!tabela) return;

  const tabelaCompleta = tabela.closest("table");
  if (!tabelaCompleta) return;

  const linhaCabecalho = tabelaCompleta.querySelector("thead tr");
  if (!linhaCabecalho) return;

  linhaCabecalho.innerHTML = `
    <th>Data</th>
    <th>Descrição</th>
    <th>Categoria</th>
    <th>Tipo</th>
    <th class="valor-coluna">Valor</th>
    ${mostrarUsuarioReceita ? "<th data-coluna-usuario='receitas'>Usuário</th>" : ""}
    <th></th>
  `;
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
    inputBusca.addEventListener("input", (event) => {
      filtros.busca = event.target.value.toLowerCase().trim();
      aplicarFiltros();
    });
  }

  if (filtroTipo && dropdownTipo) {
    toggleDropdown(filtroTipo, dropdownTipo);
  }

  if (tabela) {
    tabela.addEventListener("click", (event) => {
      const btnEditar = event.target.closest(".btn-editar-receita");
      const btnExcluir = event.target.closest(".btn-excluir-receita");

      if (btnEditar) {
        confirmarEditarReceita(btnEditar.dataset.id);
        return;
      }

      if (btnExcluir) {
        confirmarExcluirReceita(btnExcluir.dataset.id);
      }
    });
  }

  configurarCategoria();
  configurarFiltros();
  configurarMenu();

  document.addEventListener("click", (event) => {
    if (dropdownCategoriaModal && selectCategoria && !selectCategoria.contains(event.target)) {
      dropdownCategoriaModal.style.display = "none";
    }

    if (dropdownTipo && filtroTipo && !filtroTipo.contains(event.target)) {
      dropdownTipo.style.display = "none";
    }
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      fecharModalReceita();
    }
  });
}

function configurarMenu() {
  document.querySelectorAll(".menu li[data-link]").forEach((item) => {
    item.addEventListener("click", () => {
      window.location.href = item.dataset.link;
    });
  });

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
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

function toggleDropdown(btn, drop) {
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    drop.style.display = drop.style.display === "block" ? "none" : "block";
  });
}

/* ================= CATEGORIA ================= */

function configurarCategoria() {
  if (!selectCategoria || !dropdownCategoriaModal || !textoSelecionado) return;

  selectCategoria.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdownCategoriaModal.style.display =
      dropdownCategoriaModal.style.display === "block" ? "none" : "block";
  });

  document.querySelectorAll(".item-categoria").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      selecionarCategoriaReceita(item);
      dropdownCategoriaModal.style.display = "none";
    });
  });
}

function selecionarCategoriaReceita(item) {
  const nome =
    item.getAttribute("data-categoria") ||
    item.dataset.categoria ||
    item.textContent.trim();

  if (!textoSelecionado || !selectCategoria) return;

  textoSelecionado.textContent = nome;
  textoSelecionado.className = "";

  selectCategoria.dataset.categoria = nome;

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

  const nomeFinal = nomeCategoria || "Selecione uma categoria";

  textoSelecionado.textContent = nomeFinal;
  textoSelecionado.className = "";

  if (selectCategoria) {
    if (nomeFinal === "Selecione uma categoria") {
      delete selectCategoria.dataset.categoria;
    } else {
      selectCategoria.dataset.categoria = nomeFinal;
    }
  }

  document.querySelectorAll(".item-categoria").forEach((item) => {
    item.classList.remove("ativo");

    const categoriaItem =
      item.getAttribute("data-categoria") ||
      item.dataset.categoria ||
      item.textContent.trim();

    if (categoriaItem === nomeFinal) {
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
    item.addEventListener("click", (event) => {
      event.stopPropagation();

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

function aplicarFiltros() {
  receitasFiltradas = receitas.filter((receita) => {
    if (receitaFoiExcluida(receita)) return false;

    if (!usuarioPertenceFamiliaReceita && !receitaPertenceAoUsuarioLogado(receita)) {
      return false;
    }

    if (filtros.busca) {
      const texto = normalizarTexto(filtros.busca);
      const descricao = normalizarTexto(receita.descricao || "");
      const categoria = normalizarTexto(receita.categoria || "");
      const autor = normalizarTexto(pegarNomeAutorReceita(receita) || "");

      if (!descricao.includes(texto) && !categoria.includes(texto) && !autor.includes(texto)) {
        return false;
      }
    }

    if (filtros.tipo && normalizarTexto(receita.tipo) !== normalizarTexto(filtros.tipo)) {
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

  renderizarReceitas(receitasFiltradas);
}

/* ================= MÊS ================= */

function configurarControleMes() {
  if (btnMesAnterior) {
    btnMesAnterior.addEventListener("click", async () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() - 1);
      filtros.data = pegarAnoMesData(dataMesAtual);
      atualizarTextoMes();

      await carregarReceitasAPI();
      aplicarFiltros();
    });
  }

  if (btnProximoMes) {
    btnProximoMes.addEventListener("click", async () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() + 1);
      filtros.data = pegarAnoMesData(dataMesAtual);
      atualizarTextoMes();

      await carregarReceitasAPI();
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

  textoMesAtual.textContent = `${meses[dataMesAtual.getMonth()]} ${dataMesAtual.getFullYear()}`;
}

function pegarAnoMesData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");

  return `${ano}-${mes}`;
}

function pegarAnoMes(dataValor) {
  const data = converterData(dataValor);

  if (!data) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");

  return `${ano}-${mes}`;
}

/* ================= MODAL ================= */

function abrirModalReceita() {
  modoEdicaoReceita = false;
  idReceitaEditando = null;

  limparCampos();

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

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar";
  }
}

function limparCampos() {
  if (inputDesc) inputDesc.value = "";
  if (inputValor) inputValor.value = "";
  if (inputData) inputData.value = "";
  if (checkMensal) checkMensal.checked = false;

  selecionarCategoriaPorNome("Selecione uma categoria");

  const radioFixa = document.querySelector('input[name="tipoReceita"][value="fixa"]');

  if (radioFixa) {
    radioFixa.checked = true;
  }
}

/* ================= SALVAR / EDITAR ================= */

function pegarDadosFormularioReceita() {
  const descricao = String(inputDesc?.value || "").trim();
  const valor = converterMoedaParaNumero(inputValor?.value || "");
  const data = String(inputData?.value || "").trim();

  const tipo =
    document.querySelector('input[name="tipoReceita"]:checked')?.value ||
    "variavel";

  return {
    descricao,
    valor,
    data,
    tipo
  };
}

function formularioReceitaInvalido({ descricao, valor, data }) {
  return (
    !descricao ||
    valor <= 0 ||
    !data
  );
}

async function salvarReceita() {
  if (salvandoReceita) return;

  salvandoReceita = true;

  try {
    if (modoEdicaoReceita) {
      await atualizarReceitaEditada();
      return;
    }

    const { descricao, valor, data, tipo } = pegarDadosFormularioReceita();

    if (formularioReceitaInvalido({ descricao, valor, data })) {
      mostrarMensagemReceita("Preencha todos os campos corretamente!");
      return;
    }

    const payload = montarPayloadReceita({
      descricao,
      valor,
      data,
      tipo
    });

    const resposta = await criarReceitaAPI(payload);

    if (!resposta.ok) {
      mostrarMensagemReceita(pegarMensagemErroReceita(resposta.data, "Não foi possível salvar a receita."));
      return;
    }

    fecharModalReceita();

    await carregarReceitasAPI();
    aplicarFiltros();

    mostrarMensagemReceita("Receita salva com sucesso!");

    avisarHomeSobreAtualizacao();
  } finally {
    salvandoReceita = false;
  }
}

async function atualizarReceitaEditada() {
  const receitaOriginal = receitas.find((receita) => String(receita.id) === String(idReceitaEditando));

  if (!receitaOriginal) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  const { descricao, valor, data, tipo } = pegarDadosFormularioReceita();

  if (formularioReceitaInvalido({ descricao, valor, data })) {
    mostrarMensagemReceita("Preencha todos os campos corretamente!");
    return;
  }

  const payload = montarPayloadReceita({
    descricao,
    valor,
    data,
    tipo
  });

  const idApi =
    receitaOriginal.incomeId ||
    receitaOriginal.income_id ||
    receitaOriginal.id;

  const resposta = await atualizarReceitaAPI(idApi, payload);

  if (!resposta.ok) {
    mostrarMensagemReceita(pegarMensagemErroReceita(resposta.data, "Não foi possível atualizar a receita."));
    return;
  }

  fecharModalReceita();

  await carregarReceitasAPI();
  aplicarFiltros();

  mostrarMensagemReceita("Receita atualizada com sucesso!");

  avisarHomeSobreAtualizacao();
}

function montarPayloadReceita({ descricao, valor, data, tipo }) {
  return {
    description: descricao,
    descricao,

    value: Number(valor),
    valor: Number(valor),

    dateInitial: data,
    data,
    date: data,

    type: tipo,
    tipo,
    incomeType: tipo
  };
}

function pegarMensagemErroReceita(data, fallback) {
  if (!data) return fallback;

  if (typeof data === "string") return data;

  if (data.message) return data.message;
  if (data.detail && typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return data.detail.map((item) => item.msg || item.message).join("\n");

  return fallback;
}

/* ================= EDITAR / EXCLUIR ================= */

function confirmarEditarReceita(id) {
  const receita = receitas.find((item) => String(item.id) === String(id));

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
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
        acao: () => prepararEdicaoReceita(id)
      }
    ]
  });
}

function prepararEdicaoReceita(id) {
  const receita = receitas.find((item) => String(item.id) === String(id));

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  modoEdicaoReceita = true;
  idReceitaEditando = id;

  if (inputDesc) inputDesc.value = receita.descricao || "";
  if (inputValor) inputValor.value = formatarMoeda(receita.valor);
  if (inputData) inputData.value = normalizarDataISO(receita.data);
  if (checkMensal) checkMensal.checked = Boolean(receita.salvarTodoMes || receita.recorrente);

  selecionarCategoriaPorNome(receita.categoria);

  const radioTipo = document.querySelector(`input[name="tipoReceita"][value="${receita.tipo || "variavel"}"]`);

  if (radioTipo) {
    radioTipo.checked = true;
  }

  abrirModalReceitaEdicao();
}

function confirmarExcluirReceita(id) {
  const receita = receitas.find((item) => String(item.id) === String(id));

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
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
        acao: () => excluirReceita(id)
      }
    ]
  });
}

async function excluirReceita(id) {
  const receita = receitas.find((item) => String(item.id) === String(id));

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  const idApi =
    receita.incomeId ||
    receita.income_id ||
    receita.id;

  console.log("EXCLUINDO RECEITA SELECIONADA:", {
    idTela: id,
    idApi,
    receita
  });

  const resposta = await excluirReceitaAPI(idApi);

  if (resposta.status === 401) {
    mostrarMensagemReceita("Sua sessão expirou. Faça login novamente.");
    return;
  }

  /*
    Se a API não apagar, ainda assim ocultamos localmente.
    Isso remove valores antigos/teste que a API continua retornando.
  */
  if (!resposta.ok) {
    console.warn("A API não excluiu a receita, mas ela será ocultada localmente:", resposta);
  }

  marcarReceitaComoExcluida(receita);

  receitas = receitas.filter((item) => String(item.id) !== String(id));

  aplicarFiltros();

  mostrarMensagemReceita("Receita excluída com sucesso!");

  avisarHomeSobreAtualizacao();

  setTimeout(async () => {
    await carregarReceitasAPI();
    aplicarFiltros();
  }, 500);
}

/* ================= EXCLUSÕES VISUAIS ================= */

function getChaveReceitasExcluidas() {
  return getChaveUsuarioReceita(STORAGE_RECEITAS_EXCLUIDAS);
}

function lerListaStorage(chave) {
  try {
    const dados = localStorage.getItem(chave);

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarListaStorage(chave, lista) {
  if (!Array.isArray(lista)) return;
  localStorage.setItem(chave, JSON.stringify(lista));
}

function lerReceitasExcluidas() {
  return [
    ...lerListaStorage(STORAGE_RECEITAS_EXCLUIDAS),
    ...lerListaStorage(getChaveReceitasExcluidas())
  ];
}

function salvarReceitasExcluidas(lista) {
  salvarListaStorage(STORAGE_RECEITAS_EXCLUIDAS, lista);
  salvarListaStorage(getChaveReceitasExcluidas(), lista);
}

function criarChaveExclusaoReceita(receita) {
  const dataISO = normalizarDataISO(
    receita.dateInitial ||
    receita.data ||
    receita.date ||
    receita.createdAt ||
    receita.created_at ||
    ""
  );

  const valor = Number(
    receita.value ??
    receita.valor ??
    receita.amount ??
    receita.total ??
    receita.valorTotal ??
    receita.totalValue ??
    0
  );

  const descricao = normalizarTexto(
    receita.description ||
    receita.descricao ||
    receita.name ||
    receita.nome ||
    receita.title ||
    ""
  );

  const categoria = normalizarTexto(
    receita.category ||
    receita.categoria ||
    receita.categoryName ||
    receita.nomeCategoria ||
    "receita"
  );

  return [
    "receita",
    descricao,
    categoria,
    Number(valor || 0).toFixed(2),
    dataISO
  ].join("|");
}

function marcarReceitaComoExcluida(receita) {
  if (!receita) return;

  const listaAtual = lerReceitasExcluidas();

  const ids = [
    receita.id,
    receita.incomeId,
    receita.income_id,
    receita.transactionId,
    receita.transaction_id
  ]
    .filter(Boolean)
    .map(String);

  const dataISO = normalizarDataISO(
    receita.dateInitial ||
    receita.data ||
    receita.date ||
    receita.createdAt ||
    receita.created_at ||
    ""
  );

  const valor = Number(
    receita.value ??
    receita.valor ??
    receita.amount ??
    receita.total ??
    receita.valorTotal ??
    receita.totalValue ??
    0
  );

  const descricao =
    receita.description ||
    receita.descricao ||
    receita.name ||
    receita.nome ||
    receita.title ||
    "";

  const categoria =
    receita.category ||
    receita.categoria ||
    receita.categoryName ||
    receita.nomeCategoria ||
    "Receita";

  const nova = {
    id: receita.id || null,
    incomeId: receita.incomeId || receita.income_id || receita.id || null,
    income_id: receita.income_id || receita.incomeId || receita.id || null,

    ids,

    description: descricao,
    descricao,

    category: categoria,
    categoria,

    value: valor,
    valor,
    amount: valor,

    dateInitial: dataISO,
    data: dataISO,
    date: dataISO,

    chave: criarChaveExclusaoReceita({
      ...receita,
      description: descricao,
      descricao,
      category: categoria,
      categoria,
      value: valor,
      valor,
      amount: valor,
      dateInitial: dataISO,
      data: dataISO,
      date: dataISO
    }),

    dataExclusao: new Date().toISOString()
  };

  const jaExiste = listaAtual.some((item) => {
    const idsItem = [
      item.id,
      item.incomeId,
      item.income_id,
      ...(Array.isArray(item.ids) ? item.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    const mesmoId =
      ids.length > 0 &&
      idsItem.length > 0 &&
      ids.some((id) => idsItem.includes(id));

    const mesmaChave =
      item.chave &&
      item.chave === nova.chave;

    return mesmoId || mesmaChave;
  });

  const novaLista = jaExiste ? listaAtual : [...listaAtual, nova];

  salvarReceitasExcluidas(novaLista);

  console.log("RECEITA MARCADA COMO EXCLUÍDA:", nova);
}

function receitaFoiExcluida(receita) {
  if (!receita) return false;

  const excluidas = lerReceitasExcluidas();

  const idsReceita = [
    receita.id,
    receita.incomeId,
    receita.income_id,
    receita.transactionId,
    receita.transaction_id
  ]
    .filter(Boolean)
    .map(String);

  const chaveReceita = criarChaveExclusaoReceita(receita);

  const valorReceita = Number(
    receita.value ??
    receita.valor ??
    receita.amount ??
    receita.total ??
    receita.valorTotal ??
    receita.totalValue ??
    0
  );

  const dataReceita = normalizarDataISO(
    receita.dateInitial ||
    receita.data ||
    receita.date ||
    receita.createdAt ||
    receita.created_at ||
    ""
  );

  const descricaoReceita = normalizarTexto(
    receita.description ||
    receita.descricao ||
    receita.name ||
    receita.nome ||
    receita.title ||
    ""
  );

  return excluidas.some((item) => {
    const idsItem = [
      item.id,
      item.incomeId,
      item.income_id,
      ...(Array.isArray(item.ids) ? item.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    if (
      idsReceita.length > 0 &&
      idsItem.length > 0 &&
      idsReceita.some((id) => idsItem.includes(id))
    ) {
      return true;
    }

    if (item.chave && item.chave === chaveReceita) {
      return true;
    }

    const valorItem = Number(
      item.value ??
      item.valor ??
      item.amount ??
      0
    );

    const dataItem = normalizarDataISO(
      item.dateInitial ||
      item.data ||
      item.date ||
      ""
    );

    const descricaoItem = normalizarTexto(
      item.description ||
      item.descricao ||
      item.name ||
      item.nome ||
      ""
    );

    return (
      descricaoReceita &&
      descricaoReceita === descricaoItem &&
      Number(valorReceita || 0).toFixed(2) === Number(valorItem || 0).toFixed(2) &&
      dataReceita &&
      dataReceita === dataItem
    );
  });
}

/* ================= NORMALIZAÇÃO ================= */

function normalizarReceitaAPI(receita, index = 0) {
  const dataISO = normalizarDataISO(
    receita.dateInitial ||
    receita.data ||
    receita.date ||
    receita.createdAt ||
    receita.created_at ||
    receita.dataTransacao ||
    receita.transactionDate ||
    ""
  );

  const valor = pegarValorReceita(receita);

  const categoriaObj =
    receita.category ||
    receita.categoria ||
    null;

  const categoria =
    categoriaObj && typeof categoriaObj === "object"
      ? (
          categoriaObj.name ||
          categoriaObj.nome ||
          categoriaObj.description ||
          categoriaObj.descricao ||
          "Receita"
        )
      : (
          receita.categoria ||
          receita.category ||
          receita.categoryName ||
          receita.category_name ||
          receita.descriptionCategory ||
          receita.typeCategory ||
          receita.nameCategory ||
          receita.nomeCategoria ||
          "Receita"
        );

  return {
    ...receita,

    id:
      receita.id ||
      receita.incomeId ||
      receita.income_id ||
      receita.transactionId ||
      receita.transaction_id ||
      `receita-api-${index}`,

    incomeId:
      receita.incomeId ||
      receita.income_id ||
      receita.id ||
      null,

    income_id:
      receita.income_id ||
      receita.incomeId ||
      receita.id ||
      null,

    descricao:
      receita.descricao ||
      receita.description ||
      receita.name ||
      receita.nome ||
      receita.title ||
      "Sem descrição",

    valor,
    data: dataISO,
    dataFormatada: receita.dataFormatada || formatarData(dataISO),

    categoria: String(categoria),

    tipo:
      receita.tipoReceita ||
      receita.tipo ||
      receita.incomeType ||
      receita.type ||
      receita.classificacao ||
      "variavel",

    origem: "api",

    autorId:
      receita.autorId ||
      receita.userId ||
      receita.user_id ||
      receita.usuarioId ||
      receita.usuario_id ||
      receita.createdById ||
      receita.created_by_id ||
      receita.userCreatedFamilyId ||
      receita.user_created_family_id ||
      receita.createdBy?.id ||
      receita.user?.id ||
      receita.usuario?.id ||
      null,

    userId:
      receita.userId ||
      receita.user_id ||
      receita.autorId ||
      receita.usuarioId ||
      receita.usuario_id ||
      receita.createdById ||
      receita.created_by_id ||
      receita.userCreatedFamilyId ||
      receita.user_created_family_id ||
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

function pegarValorReceita(receita) {
  const valorBruto =
    receita.amount ??
    receita.value ??
    receita.valor ??
    receita.total ??
    receita.price ??
    receita.valorTotal ??
    receita.totalValue ??
    receita.totalAmount ??
    0;

  if (typeof valorBruto === "number") {
    return Math.abs(valorBruto);
  }

  const valorTexto = String(valorBruto)
    .replace("R$", "")
    .replace("US$", "")
    .replace("€", "")
    .replace("£", "")
    .replace("¥", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace("-", "")
    .trim();

  return Math.abs(Number(valorTexto) || 0);
}

function criarChaveUnicaReceita(receita, index) {
  if (receita.id) {
    return `id|${receita.id}`;
  }

  return [
    normalizarTexto(receita.descricao || ""),
    normalizarDataISO(receita.data || ""),
    Number(receita.valor || 0).toFixed(2),
    normalizarTexto(receita.categoria || ""),
    index
  ].join("|");
}

function removerDuplicadasReceitas(lista) {
  const mapa = new Map();

  (Array.isArray(lista) ? lista : []).forEach((item, index) => {
    const chave = criarChaveUnicaReceita(item, index);

    if (!mapa.has(chave)) {
      mapa.set(chave, item);
    }
  });

  return Array.from(mapa.values());
}

/* ================= RENDER ================= */

function renderizarReceitas(lista) {
  if (!tabela) return;

  tabela.innerHTML = "";

  let total = 0;

  if (!lista.length) {
    if (semDados) {
      semDados.style.display = "block";
    }
  } else {
    if (semDados) {
      semDados.style.display = "none";
    }

    lista.forEach((receita) => {
      total += Number(receita.valor || 0);

      const tr = document.createElement("tr");

      const colunaUsuario = mostrarUsuarioReceita
        ? `<td class="usuario-receita">${escapeHTML(pegarNomeAutorReceita(receita))}</td>`
        : "";

      tr.innerHTML = `
        <td>${formatarData(receita.data)}</td>
        <td>${escapeHTML(receita.descricao)}</td>
        <td>${escapeHTML(receita.categoria)}</td>
        <td>${formatarTipoReceita(receita.tipo)}</td>
        <td class="valor positivo">${formatarMoeda(receita.valor)}</td>
        ${colunaUsuario}
        <td class="acoes-coluna">
          <div class="acoes-receita">
            <button type="button" class="btn-acao-receita btn-editar-receita" data-id="${receita.id}" title="Editar">
              <img src="imagem/iconConfig/lapis.png" alt="Editar" onerror="this.style.display='none'; this.parentElement.textContent='✎';">
            </button>

            <button type="button" class="btn-acao-receita btn-excluir-receita" data-id="${receita.id}" title="Excluir">
              <img src="imagem/iconConfig/lixeira.png" alt="Excluir" onerror="this.style.display='none'; this.parentElement.textContent='×';">
            </button>
          </div>
        </td>
      `;

      tabela.appendChild(tr);
    });
  }

  if (totalReceitas) {
    totalReceitas.textContent = formatarMoeda(total);
  }

  if (totalEntradas) {
    totalEntradas.textContent = formatarMoeda(total);
  }
}

function formatarTipoReceita(tipo) {
  const normalizado = normalizarTexto(tipo);

  if (normalizado.includes("fix")) return "Fixa";
  if (normalizado.includes("sazon")) return "Sazonal";
  if (normalizado.includes("vari")) return "Variável";

  return tipo || "Variável";
}

/* ================= DATA / MOEDA ================= */

function obterMoedaUsuario() {
  const email = getEmailUsuarioAtualReceita() || "usuario";
  const userKey = getUserKeyReceita(email);

  return (
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoeda(valor) {
  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaUsuario()
    });
  } catch {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}

function formatarMoedaInput(input) {
  let valor = input.value.replace(/\D/g, "");

  if (!valor) {
    input.value = "";
    return;
  }

  valor = (Number(valor) / 100).toFixed(2);

  input.value = Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function converterMoedaParaNumero(valor) {
  if (!valor) return 0;

  const numero = String(valor)
    .replace("R$", "")
    .replace("US$", "")
    .replace("€", "")
    .replace("£", "")
    .replace("¥", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace("-", "")
    .trim();

  return Math.abs(Number(numero) || 0);
}

function converterData(dataValor) {
  if (!dataValor) return null;

  const texto = String(dataValor).trim();

  if (texto.includes("-")) {
    const partes = texto.split("T")[0].split("-");

    if (partes.length === 3) {
      const ano = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const dia = Number(partes[2]);

      const data = new Date(ano, mes, dia, 12, 0, 0);

      return isNaN(data.getTime()) ? null : data;
    }
  }

  if (texto.includes("/")) {
    const partes = texto.split("/");

    if (partes.length === 3) {
      const dia = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const ano = Number(partes[2]);

      const data = new Date(ano, mes, dia, 12, 0, 0);

      return isNaN(data.getTime()) ? null : data;
    }
  }

  const data = new Date(texto);

  return isNaN(data.getTime()) ? null : data;
}

function normalizarDataISO(dataValor) {
  const data = converterData(dataValor);

  if (!data) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarData(dataValor) {
  const data = converterData(dataValor);

  if (!data) return "";

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

function escapeHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ================= ATUALIZAÇÃO GLOBAL ================= */

function avisarHomeSobreAtualizacao() {
  localStorage.setItem("receitasAtualizadasEm", String(Date.now()));
  localStorage.setItem("dadosFinanceirosAtualizadosEm", String(Date.now()));

  window.dispatchEvent(new CustomEvent("dadosFinanceirosAtualizados"));

  if (typeof window.carregarDadosFinanceiros === "function") {
    window.carregarDadosFinanceiros();
  }

  if (typeof window.recarregarHome === "function") {
    window.recarregarHome();
  }

  if (typeof window.recarregarExtratos === "function") {
    window.recarregarExtratos();
  } else if (typeof window.carregarExtratos === "function") {
    window.carregarExtratos();
  }
}

/* ================= GLOBAIS ================= */

window.carregarReceitasAPI = carregarReceitasAPI;

window.carregarReceitas = async function carregarReceitas() {
  await recarregarReceitasCompleto();
};

window.recarregarReceitas = window.carregarReceitas;

window.confirmarEditarReceita = confirmarEditarReceita;
window.confirmarExcluirReceita = confirmarExcluirReceita;
window.excluirReceita = excluirReceita;