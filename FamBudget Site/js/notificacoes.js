console.log("NOTIFICACOES.JS OK");

const NOTIFICACOES_API_URL = "https://www.manage-control-dev.com.br/api/v1";

let intervaloNotificacoes = null;
let notificacoesAtuais = [];

/* ================= INIT GLOBAL ================= */
document.addEventListener("DOMContentLoaded", () => {
  inserirCssNotificacoes();
  criarEstruturaNotificacoes();
  carregarPreferenciasNotificacoes();
  configurarPreferenciasNotificacoes();
  configurarCliqueSino();

  inicializarNotificacoes(true);

  if (intervaloNotificacoes) {
    clearInterval(intervaloNotificacoes);
  }

  intervaloNotificacoes = setInterval(() => {
    inicializarNotificacoes(true);
  }, 10000);

  window.testarToastNotificacao = testarToastNotificacao;
});

/* ================= TOKEN ================= */
function getTokenNotificacoes() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function headersNotificacoes() {
  const token = getTokenNotificacoes();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function esperarTokenNotificacoes() {
  let tentativas = 0;

  while (tentativas < 10) {
    const token = getTokenNotificacoes();

    if (token) return token;

    await new Promise((resolve) => setTimeout(resolve, 150));
    tentativas++;
  }

  return null;
}

/* ================= CONTA ================= */
function getEmailNotificacoes() {
  return (
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    "usuario"
  ).toLowerCase().trim();
}

function getUserKeyNotificacoes() {
  return `fambudget_${getEmailNotificacoes()}`;
}

function salvarPreferenciaNotificacao(chave, valor) {
  const userKey = getUserKeyNotificacoes();
  localStorage.setItem(`${userKey}_${chave}`, String(valor));
}

function buscarPreferenciaNotificacao(chave, padrao = "true") {
  const userKey = getUserKeyNotificacoes();
  const valor = localStorage.getItem(`${userKey}_${chave}`);

  if (valor === null || valor === undefined) return padrao;

  return valor;
}

function preferenciaAtiva(chave) {
  return buscarPreferenciaNotificacao(chave, "true") === "true";
}

/* ================= MOEDA ================= */
function obterMoedaNotificacoes() {
  const userKey = getUserKeyNotificacoes();

  return (
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoedaNotificacoes(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: obterMoedaNotificacoes()
  });
}

/* ================= CSS GLOBAL ================= */
function inserirCssNotificacoes() {
  if (document.getElementById("notificacoes-style")) return;

  const style = document.createElement("style");
  style.id = "notificacoes-style";

  style.textContent = `
    .notificacao {
      position: relative;
    }

    .icone-sino,
    #icone-notificacao {
      cursor: pointer;
    }

    .badge {
      position: absolute;
      top: -7px;
      right: -7px;

      min-width: 18px;
      height: 18px;

      padding: 0 5px;

      background: #ef4444;
      color: #ffffff;

      border-radius: 999px;

      display: none;
      align-items: center;
      justify-content: center;

      font-size: 11px;
      font-weight: 700;

      border: 2px solid #ffffff;
      z-index: 20;
    }

    .dropdown-notificacao {
      position: fixed;
      top: 72px;
      right: 24px;

      width: 360px;
      max-width: calc(100vw - 32px);
      max-height: 430px;

      background: #ffffff;
      border-radius: 18px;

      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
      border: 1px solid #e5e7eb;

      z-index: 99998;

      overflow: hidden;
      animation: notificacaoDropdownShow 0.2s ease;
    }

    .dropdown-notificacao.hidden {
      display: none;
    }

    @keyframes notificacaoDropdownShow {
      from {
        opacity: 0;
        transform: translateY(-8px) scale(0.98);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .dropdown-notificacao-header {
      padding: 16px 18px;

      display: flex;
      align-items: center;
      justify-content: space-between;

      background: linear-gradient(135deg, #ecfdf5, #ffffff);
      border-bottom: 1px solid #e5e7eb;
    }

    .dropdown-notificacao-header h3 {
      margin: 0;
      font-size: 16px;
      color: #111827;
      font-weight: 700;
    }

    .dropdown-notificacao-header span {
      font-size: 12px;
      color: #6b7280;
    }

    .dropdown-notificacao-lista {
      padding: 10px;
      max-height: 355px;
      overflow-y: auto;
    }

    .notificacao-vazia {
      padding: 28px 18px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }

    .notificacao-item {
      display: flex;
      gap: 12px;

      padding: 13px;
      border-radius: 14px;

      background: #f9fafb;
      border: 1px solid #eef2f7;

      margin-bottom: 10px;
    }

    .notificacao-item:last-child {
      margin-bottom: 0;
    }

    .notificacao-item:hover {
      background: #f3f4f6;
    }

    .notificacao-icon {
      width: 42px;
      height: 42px;

      border-radius: 50%;

      display: flex;
      align-items: center;
      justify-content: center;

      flex-shrink: 0;

      font-size: 20px;
    }

    .notificacao-conteudo {
      flex: 1;
    }

    .notificacao-conteudo strong {
      display: block;
      font-size: 14px;
      color: #111827;
      margin-bottom: 4px;
    }

    .notificacao-conteudo p {
      margin: 0;
      color: #4b5563;
      font-size: 13px;
      line-height: 1.35;
    }

    .notificacao-item.familia .notificacao-icon {
      background: #e0f2fe;
    }

    .notificacao-item.despesa .notificacao-icon {
      background: #fef3c7;
    }

    .notificacao-item.vencida .notificacao-icon {
      background: #fee2e2;
    }

    .notificacao-item.vencimento .notificacao-icon {
      background: #ffedd5;
    }

    .notificacao-item.cartao .notificacao-icon {
      background: #ede9fe;
    }

    .notificacao-item.orcamento .notificacao-icon {
      background: #dcfce7;
    }

    .toast-notificacao-global {
      position: fixed;
      top: 90px;
      right: 24px;

      width: 360px;
      max-width: calc(100vw - 32px);

      background: #ffffff;
      border-radius: 18px;

      box-shadow: 0 20px 55px rgba(15, 23, 42, 0.25);
      border: 1px solid #e5e7eb;

      padding: 14px;

      display: none;
      align-items: flex-start;
      gap: 12px;

      z-index: 999999;

      animation: toastNotificacaoShow 0.25s ease;
    }

    @keyframes toastNotificacaoShow {
      from {
        opacity: 0;
        transform: translateX(22px);
      }

      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .toast-notificacao-global.show {
      display: flex !important;
    }

    .toast-notificacao-global .toast-icon {
      width: 44px;
      height: 44px;

      border-radius: 50%;

      display: flex;
      align-items: center;
      justify-content: center;

      flex-shrink: 0;

      font-size: 21px;
    }

    .toast-notificacao-global .toast-texto {
      flex: 1;
    }

    .toast-notificacao-global strong {
      display: block;
      font-size: 15px;
      color: #111827;
      margin-bottom: 4px;
    }

    .toast-notificacao-global p {
      margin: 0;
      color: #4b5563;
      font-size: 13px;
      line-height: 1.4;
    }

    .toast-notificacao-global .toast-fechar {
      background: transparent;
      border: none;
      color: #9ca3af;
      font-size: 18px;
      cursor: pointer;
      line-height: 1;
    }

    .toast-notificacao-global.familia {
      border-left: 5px solid #2e7d32;
    }

    .toast-notificacao-global.familia .toast-icon {
      background: #e0f2fe;
    }

    .toast-notificacao-global.despesa {
      border-left: 5px solid #2e7d32;
    }

    .toast-notificacao-global.despesa .toast-icon {
      background: #fef3c7;
    }

    .toast-notificacao-global.vencida {
      border-left: 5px solid #2e7d32;
    }

    .toast-notificacao-global.vencida .toast-icon {
      background: #fee2e2;
    }

    .toast-notificacao-global.vencimento {
      border-left: 5px solid #2e7d32;
    }

    .toast-notificacao-global.vencimento .toast-icon {
      background: #ffedd5;
    }

    .toast-notificacao-global.cartao {
      border-left: 5px solid #2e7d32;
    }

    .toast-notificacao-global.cartao .toast-icon {
      background: #ede9fe;
    }

    .toast-notificacao-global.orcamento {
      border-left: 5px solid #2e7d32;
    }

    .toast-notificacao-global.orcamento .toast-icon {
      background: #dcfce7;
    }

    .toast-notificacao {
      position: fixed;
      bottom: 24px;
      right: 24px;

      background: #111827;
      color: #ffffff;

      padding: 12px 16px;
      border-radius: 12px;

      font-size: 14px;
      font-weight: 600;

      display: none;
      z-index: 999999;

      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    }

    @media (max-width: 600px) {
      .dropdown-notificacao {
        top: 76px;
        right: 16px;
        width: calc(100vw - 32px);
      }

      .toast-notificacao-global {
        top: 82px;
        right: 16px;
        width: calc(100vw - 32px);
      }
    }
  `;

  document.head.appendChild(style);
}

/* ================= ESTRUTURA GLOBAL ================= */
function criarEstruturaNotificacoes() {
  let dropdown = document.getElementById("dropdown-notificacao");

  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.id = "dropdown-notificacao";
    dropdown.className = "dropdown-notificacao hidden";

    dropdown.innerHTML = `
      <div class="dropdown-notificacao-header">
        <div>
          <h3>Notificações</h3>
          <span id="notificacao-subtitulo">Nenhuma notificação</span>
        </div>
      </div>

      <div class="dropdown-notificacao-lista" id="lista-notificacoes-global">
        <div class="notificacao-vazia">Nenhuma notificação no momento.</div>
      </div>
    `;

    document.body.appendChild(dropdown);
  }

  let toast = document.getElementById("toast-notificacao-global");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notificacao-global";
    toast.className = "toast-notificacao-global";

    toast.innerHTML = `
      <div class="toast-icon" id="toast-notificacao-icon">🔔</div>

      <div class="toast-texto">
        <strong id="toast-notificacao-titulo">Nova notificação</strong>
        <p id="toast-notificacao-texto">Você recebeu uma notificação.</p>
      </div>

      <button class="toast-fechar" id="toast-notificacao-fechar" type="button">
        ×
      </button>
    `;

    document.body.appendChild(toast);
  }

  const fechar = document.getElementById("toast-notificacao-fechar");

  if (fechar) {
    fechar.onclick = () => {
      esconderToastNotificacaoGlobal();
    };
  }
}

/* ================= API ================= */
async function lerRespostaNotificacoes(res) {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiGetNotificacoes(path) {
  try {
    const token = await esperarTokenNotificacoes();

    if (!token) {
      console.warn("Sem token para buscar notificações:", path);
      return null;
    }

    let res = await fetch(`${NOTIFICACOES_API_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: headersNotificacoes()
    });

    let data = await lerRespostaNotificacoes(res);

    if (res.status === 401) {
      console.warn("Token inválido/expirado em notificações. Tentando novamente...");

      await new Promise((resolve) => setTimeout(resolve, 800));

      res = await fetch(`${NOTIFICACOES_API_URL}${path}`, {
        method: "GET",
        cache: "no-store",
        headers: headersNotificacoes()
      });

      data = await lerRespostaNotificacoes(res);
    }

    if (!res.ok) {
      console.warn("API notificações falhou:", path, res.status, data);
      return null;
    }

    return data?.data || data;

  } catch (erro) {
    console.warn("Erro ao buscar notificações:", erro);
    return null;
  }
}

/* ================= ARRAY ================= */
function transformarEmArrayNotificacoes(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.expenses)) return data.expenses;
  if (Array.isArray(data.despesas)) return data.despesas;
  if (Array.isArray(data.solicitations)) return data.solicitations;
  if (Array.isArray(data.convites)) return data.convites;
  if (Array.isArray(data.content)) return data.content;

  return [];
}

/* ================= PREFERÊNCIAS ================= */
function carregarPreferenciasNotificacoes() {
  const inputNotificacoes = document.getElementById("notificacoesSistema");
  const inputOrcamento = document.getElementById("lembreteOrcamento");

  if (inputNotificacoes) {
    inputNotificacoes.checked = preferenciaAtiva("notificacoesSistema");
  }

  if (inputOrcamento) {
    inputOrcamento.checked = preferenciaAtiva("lembreteOrcamento");
  }
}

function configurarPreferenciasNotificacoes() {
  const inputNotificacoes = document.getElementById("notificacoesSistema");
  const inputOrcamento = document.getElementById("lembreteOrcamento");

  if (inputNotificacoes) {
    inputNotificacoes.addEventListener("change", () => {
      salvarPreferenciaNotificacao("notificacoesSistema", inputNotificacoes.checked);

      const badge = document.getElementById("badge-notificacao");

      if (!inputNotificacoes.checked && badge) {
        badge.textContent = "0";
        badge.style.display = "none";
      }

      mostrarToastNotificacao(
        inputNotificacoes.checked
          ? "Notificações ativadas."
          : "Notificações desativadas."
      );

      inicializarNotificacoes(true);
    });
  }

  if (inputOrcamento) {
    inputOrcamento.addEventListener("change", () => {
      salvarPreferenciaNotificacao("lembreteOrcamento", inputOrcamento.checked);

      mostrarToastNotificacao(
        inputOrcamento.checked
          ? "Lembrete de orçamento ativado."
          : "Lembrete de orçamento desativado."
      );

      inicializarNotificacoes(true);
    });
  }
}

/* ================= DADOS DAS DESPESAS ================= */
function pegarDescricaoNotificacao(item) {
  return (
    item.description ||
    item.descricao ||
    item.name ||
    item.nome ||
    item.title ||
    item.titulo ||
    "Despesa"
  );
}

function pegarValorNotificacao(item) {
  return Number(
    item.amount ||
    item.value ||
    item.valor ||
    item.total ||
    0
  );
}

function pegarDataNotificacao(item) {
  return (
    item.dueDate ||
    item.dateInitial ||
    item.date ||
    item.data ||
    item.createdAt ||
    null
  );
}

function despesaEstaPaga(item) {
  const status = String(
    item.status ||
    item.paymentStatus ||
    item.situacao ||
    ""
  ).toLowerCase();

  return (
    item.paid === true ||
    item.pago === true ||
    item.isPaid === true ||
    status.includes("paid") ||
    status.includes("pago") ||
    status.includes("paga")
  );
}

function converterDataNotificacao(dataValor) {
  if (!dataValor) return null;

  const texto = String(dataValor).split("T")[0];

  if (texto.includes("-")) {
    const partes = texto.split("-");
    const ano = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const dia = Number(partes[2]);

    const data = new Date(ano, mes, dia, 12, 0, 0);
    return isNaN(data) ? null : data;
  }

  if (texto.includes("/")) {
    const partes = texto.split("/");
    const dia = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const ano = Number(partes[2]);

    const data = new Date(ano, mes, dia, 12, 0, 0);
    return isNaN(data) ? null : data;
  }

  const data = new Date(texto);
  return isNaN(data) ? null : data;
}

function diasAte(data) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const alvo = new Date(data);
  alvo.setHours(0, 0, 0, 0);

  const diff = alvo - hoje;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ================= DESPESAS PENDENTES ================= */
async function buscarNotificacoesDespesas() {
  const notificacoes = [];

  if (!preferenciaAtiva("notificacoesSistema")) {
    return notificacoes;
  }

  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  const dados = await apiGetNotificacoes(
    `/expense/user?month=${mesAtual}&year=${anoAtual}`
  );

  const despesas = transformarEmArrayNotificacoes(dados).filter((despesa) => {
    return !despesaEstaPaga(despesa);
  });

  console.log("DESPESAS PARA NOTIFICAÇÃO:", despesas);

  if (!despesas.length) {
    return notificacoes;
  }

  notificacoes.push({
    id: `despesas-pendentes-${despesas.length}`,
    tipo: "despesa",
    titulo: "Despesas pendentes",
    texto: `Você tem ${despesas.length} despesa(s) não paga(s).`,
    icone: "💳"
  });

  despesas.slice(0, 3).forEach((despesa, index) => {
    const data = converterDataNotificacao(pegarDataNotificacao(despesa));
    const valor = pegarValorNotificacao(despesa);
    const descricao = pegarDescricaoNotificacao(despesa);

    if (!data) return;

    const dias = diasAte(data);
    const idBase = despesa.id || despesa.expenseId || descricao || index;

    if (dias < 0) {
      notificacoes.push({
        id: `despesa-vencida-${idBase}`,
        tipo: "vencida",
        titulo: "Despesa vencida",
        texto: `${descricao} está vencida. Valor: ${formatarMoedaNotificacoes(valor)}.`,
        icone: "⚠️"
      });
    } else if (dias <= 3) {
      notificacoes.push({
        id: `despesa-vencimento-${idBase}-${dias}`,
        tipo: "vencimento",
        titulo:
          dias === 0
            ? "Despesa vence hoje"
            : "Vencimento próximo",
        texto:
          dias === 0
            ? `${descricao} vence hoje. Valor: ${formatarMoedaNotificacoes(valor)}.`
            : `${descricao} vence em ${dias} dia(s). Valor: ${formatarMoedaNotificacoes(valor)}.`,
        icone: "⏰"
      });
    }
  });

  return notificacoes;
}

/* ================= CONVITES DE FAMÍLIA ================= */
async function buscarNotificacoesConvitesFamilia() {
  const notificacoes = [];

  if (!preferenciaAtiva("notificacoesSistema")) {
    return notificacoes;
  }

  const dados = await apiGetNotificacoes("/family/solicitation/pending");
  const convites = transformarEmArrayNotificacoes(dados);

  console.log("CONVITES PARA NOTIFICAÇÃO:", convites);

  if (!convites.length) {
    return notificacoes;
  }

  const idsConvites = convites
    .map((convite) => {
      return (
        convite.id ||
        convite.solicitationId ||
        convite.solicitation_id ||
        convite.familySolicitationId ||
        convite.fromUserId ||
        ""
      );
    })
    .join("-");

  notificacoes.push({
    id: `convites-familia-${idsConvites || convites.length}`,
    tipo: "familia",
    titulo: "Convites de família",
    texto: `Você tem ${convites.length} convite(s) pendente(s) para participar de uma família.`,
    icone: "👨‍👩‍👧‍👦"
  });

  return notificacoes;
}

/* ================= CARTÃO ================= */
function buscarNotificacaoCartao() {
  const notificacoes = [];

  if (!preferenciaAtiva("notificacoesSistema")) {
    return notificacoes;
  }

  const userKey = getUserKeyNotificacoes();

  const diaSalvo =
    localStorage.getItem(`${userKey}_pagamentoCartao`) ||
    sessionStorage.getItem("pagamentoCartao");

  if (!diaSalvo) return notificacoes;

  const dia = Number(diaSalvo);

  if (!dia || dia < 1 || dia > 31) {
    return notificacoes;
  }

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  let dataPagamento = new Date(ano, mes, dia, 12, 0, 0);

  if (dataPagamento < hoje) {
    dataPagamento = new Date(ano, mes + 1, dia, 12, 0, 0);
  }

  const dias = diasAte(dataPagamento);

  if (dias <= 3) {
    notificacoes.push({
      id: `cartao-${dia}-${dataPagamento.getMonth()}-${dataPagamento.getFullYear()}`,
      tipo: "cartao",
      titulo: "Pagamento do cartão",
      texto: dias === 0
        ? `Seu cartão vence hoje, dia ${dia}.`
        : `Seu cartão vence em ${dias} dia(s), no dia ${dia}.`,
      icone: "💳"
    });
  }

  return notificacoes;
}

/* ================= ORÇAMENTO ================= */
function buscarNotificacoesOrcamento() {
  const notificacoes = [];

  if (!preferenciaAtiva("notificacoesSistema")) {
    return notificacoes;
  }

  if (!preferenciaAtiva("lembreteOrcamento")) {
    return notificacoes;
  }

  const orcamentos = lerArrayStorageNotificacoes("orcamentos", localStorage);

  const transacoes =
    lerArrayStorageNotificacoes("transacoesFamilia", sessionStorage) ||
    lerArrayStorageNotificacoes("transacoes", sessionStorage) ||
    lerArrayStorageNotificacoes("transacoes", localStorage) ||
    [];

  if (!orcamentos.length || !transacoes.length) {
    return notificacoes;
  }

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  orcamentos.forEach((orcamento) => {
    const categoria = normalizarTextoNotificacao(orcamento.categoria);
    const limite = Number(orcamento.limite || 0);

    if (!categoria || !limite) return;

    let gasto = 0;

    transacoes.forEach((transacao) => {
      const tipo = normalizarTextoNotificacao(transacao.tipo || transacao.type);
      const categoriaTransacao = normalizarTextoNotificacao(
        transacao.categoria ||
        transacao.category ||
        transacao.categoryName
      );

      if (!tipo.includes("despesa")) return;
      if (categoriaTransacao !== categoria) return;

      const data = converterDataNotificacao(
        transacao.data ||
        transacao.date ||
        transacao.dateInitial ||
        transacao.createdAt
      );

      if (!data) return;

      if (data.getMonth() === mesAtual && data.getFullYear() === anoAtual) {
        gasto += Number(transacao.valor || transacao.value || transacao.amount || 0);
      }
    });

    const porcentagem = limite > 0 ? (gasto / limite) * 100 : 0;

    if (porcentagem >= 80) {
      notificacoes.push({
        id: `orcamento-${categoria}-${mesAtual}-${anoAtual}-${Math.floor(porcentagem)}`,
        tipo: "orcamento",
        titulo: "Orçamento próximo do limite",
        texto: `${orcamento.categoria}: ${porcentagem.toFixed(0)}% usado. Gasto: ${formatarMoedaNotificacoes(gasto)} de ${formatarMoedaNotificacoes(limite)}.`,
        icone: "📊"
      });
    }
  });

  return notificacoes;
}

/* ================= STORAGE HELPERS ================= */
function lerArrayStorageNotificacoes(chave, storage = localStorage) {
  try {
    const dados = storage.getItem(chave);

    if (!dados) return [];

    const convertido = JSON.parse(dados);

    return Array.isArray(convertido) ? convertido : [];
  } catch {
    return [];
  }
}

function normalizarTextoNotificacao(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* ================= INICIALIZAR ================= */
async function inicializarNotificacoes(verificarNovas = false) {
  const badge = document.getElementById("badge-notificacao");

  if (!preferenciaAtiva("notificacoesSistema")) {
    if (badge) {
      badge.textContent = "0";
      badge.style.display = "none";
    }

    notificacoesAtuais = [];
    renderizarPainelNotificacoes([]);
    return;
  }

  const notificacoes = [];

  const notificacoesConvites = await buscarNotificacoesConvitesFamilia();
  const notificacoesDespesas = await buscarNotificacoesDespesas();
  const notificacaoCartao = buscarNotificacaoCartao();
  const notificacoesOrcamento = buscarNotificacoesOrcamento();

  notificacoes.push(
    ...notificacoesConvites,
    ...notificacoesDespesas,
    ...notificacaoCartao,
    ...notificacoesOrcamento
  );

  console.log("NOTIFICAÇÕES FINAIS:", notificacoes);

  notificacoesAtuais = notificacoes;

  renderizarNotificacoes(notificacoes);
  renderizarPainelNotificacoes(notificacoes);

  if (verificarNovas) {
    verificarEMostrarNovasNotificacoes(notificacoes);
  }
}

/* ================= NOTIFICAÇÕES VISUALIZADAS ================= */
function getChaveNotificacoesVisualizadas() {
  return `${getUserKeyNotificacoes()}_notificacoesVisualizadasNestaAba`;
}

function buscarNotificacoesVisualizadas() {
  try {
    const dados = sessionStorage.getItem(getChaveNotificacoesVisualizadas());

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarNotificacoesVisualizadas(lista) {
  sessionStorage.setItem(
    getChaveNotificacoesVisualizadas(),
    JSON.stringify(lista.slice(-120))
  );
}

function marcarNotificacoesComoVisualizadas(notificacoes) {
  const visualizadas = buscarNotificacoesVisualizadas();

  const novasAssinaturas = notificacoes.map(criarAssinaturaNotificacao);

  const atualizadas = Array.from(
    new Set([
      ...visualizadas,
      ...novasAssinaturas
    ])
  );

  salvarNotificacoesVisualizadas(atualizadas);
}

function buscarNotificacoesNaoVisualizadas(notificacoes) {
  const visualizadas = buscarNotificacoesVisualizadas();

  return notificacoes.filter((notificacao) => {
    const assinatura = criarAssinaturaNotificacao(notificacao);
    return !visualizadas.includes(assinatura);
  });
}

/* ================= RENDER BADGE ================= */
function renderizarNotificacoes(notificacoes) {
  const badge = document.getElementById("badge-notificacao");

  if (!badge) return;

  const naoVisualizadas = buscarNotificacoesNaoVisualizadas(notificacoes);

  badge.textContent = naoVisualizadas.length;
  badge.style.display = naoVisualizadas.length > 0 ? "inline-flex" : "none";
}

/* ================= RENDER PAINEL ================= */
function renderizarPainelNotificacoes(notificacoes) {
  const lista = document.getElementById("lista-notificacoes-global");
  const subtitulo = document.getElementById("notificacao-subtitulo");

  if (!lista) return;

  if (subtitulo) {
    subtitulo.textContent =
      notificacoes.length > 0
        ? `${notificacoes.length} notificação(ões)`
        : "Nenhuma notificação";
  }

  if (!notificacoes.length) {
    lista.innerHTML = `
      <div class="notificacao-vazia">
        Nenhuma notificação no momento.
      </div>
    `;
    return;
  }

  lista.innerHTML = notificacoes.map((notificacao) => `
    <div class="notificacao-item ${notificacao.tipo}">
      <div class="notificacao-icon">
        ${notificacao.icone || "🔔"}
      </div>

      <div class="notificacao-conteudo">
        <strong>${notificacao.titulo}</strong>
        <p>${notificacao.texto}</p>
      </div>
    </div>
  `).join("");
}

/* ================= CLIQUE NO SINO ================= */
function configurarCliqueSino() {
  const sino = document.getElementById("icone-notificacao");
  const dropdown = document.getElementById("dropdown-notificacao");
  const badge = document.getElementById("badge-notificacao");

  if (!sino || !dropdown) return;

  sino.onclick = (e) => {
    e.stopPropagation();

    dropdown.classList.toggle("hidden");

    esconderToastNotificacaoGlobal();

    marcarNotificacoesComoVisualizadas(notificacoesAtuais);

    if (badge) {
      badge.textContent = "0";
      badge.style.display = "none";
    }
  };

  dropdown.onclick = (e) => {
    e.stopPropagation();
  };

  document.addEventListener("click", () => {
    dropdown.classList.add("hidden");
  });
}

/* ================= DETECTAR NOVAS PARA TOAST ================= */
function criarAssinaturaNotificacao(notificacao) {
  return `${notificacao.id || ""}|${notificacao.tipo}|${notificacao.titulo}|${notificacao.texto}`;
}

function getChaveSessaoNotificacoes() {
  return `${getUserKeyNotificacoes()}_notificacoesMostradasNestaAba`;
}

function buscarNotificacoesMostradasNestaAba() {
  try {
    const dados = sessionStorage.getItem(getChaveSessaoNotificacoes());

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarNotificacoesMostradasNestaAba(lista) {
  sessionStorage.setItem(
    getChaveSessaoNotificacoes(),
    JSON.stringify(lista.slice(-80))
  );
}

function verificarEMostrarNovasNotificacoes(notificacoes) {
  console.log("VERIFICANDO TOAST:", notificacoes);

  if (!notificacoes.length) {
    console.log("Nenhuma notificação para toast.");
    return;
  }

  const mostradasNestaAba = buscarNotificacoesMostradasNestaAba();

  const novas = notificacoes.filter((notificacao) => {
    const assinatura = criarAssinaturaNotificacao(notificacao);
    return !mostradasNestaAba.includes(assinatura);
  });

  console.log("NOVAS PARA TOAST:", novas);

  if (!novas.length) {
    console.log("Todas as notificações já foram mostradas nesta aba.");
    return;
  }

  const primeiraNova = novas[0];

  mostrarToastNotificacaoGlobal(primeiraNova);

  const novasAssinaturas = novas.map(criarAssinaturaNotificacao);

  salvarNotificacoesMostradasNestaAba([
    ...mostradasNestaAba,
    ...novasAssinaturas
  ]);
}

/* ================= ESCONDER TOAST GLOBAL ================= */
function esconderToastNotificacaoGlobal() {
  const toast = document.getElementById("toast-notificacao-global");

  if (!toast) return;

  toast.classList.remove("show");
  toast.style.display = "none";
}

/* ================= TOAST GLOBAL ESTILIZADO ================= */
function mostrarToastNotificacaoGlobal(notificacao) {
  criarEstruturaNotificacoes();

  const toast = document.getElementById("toast-notificacao-global");
  const icon = document.getElementById("toast-notificacao-icon");
  const titulo = document.getElementById("toast-notificacao-titulo");
  const texto = document.getElementById("toast-notificacao-texto");

  console.log("TENTANDO MOSTRAR TOAST:", notificacao);
  console.log("ELEMENTO DO TOAST:", toast);

  if (!toast || !icon || !titulo || !texto) {
    console.error("Toast não encontrado no HTML.");
    return;
  }

  toast.className = `toast-notificacao-global ${notificacao.tipo || ""}`;

  icon.textContent = notificacao.icone || "🔔";
  titulo.textContent = notificacao.titulo || "Nova notificação";
  texto.textContent = notificacao.texto || "Você recebeu uma nova notificação.";

  toast.style.display = "flex";

  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.style.display = "none";
    }, 300);
  }, 6500);
}

/* ================= TOAST SIMPLES CONFIG ================= */
function mostrarToastNotificacao(mensagem) {
  let toast = document.getElementById("toast-notificacao");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notificacao";
    toast.className = "toast-notificacao";
    document.body.appendChild(toast);
  }

  toast.textContent = mensagem;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}

/* ================= TESTE MANUAL ================= */
function testarToastNotificacao() {
  mostrarToastNotificacaoGlobal({
    id: "teste-toast",
    tipo: "familia",
    titulo: "Teste de notificação",
    texto: "Se você está vendo isso, o toast está funcionando.",
    icone: "🔔"
  });
}

window.testarToastNotificacao = testarToastNotificacao;