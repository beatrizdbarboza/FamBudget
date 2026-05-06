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

  setTimeout(() => {
    inicializarNotificacoes(true);
  }, 1000);

  if (intervaloNotificacoes) {
    clearInterval(intervaloNotificacoes);
  }

  intervaloNotificacoes = setInterval(() => {
    inicializarNotificacoes(true);
  }, 5000);

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
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoedaNotificacoes(valor) {
  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaNotificacoes()
    });
  } catch {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
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

    body.dark .badge,
    body.tema-escuro .badge {
      border-color: #1a1a1a !important;
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
      min-width: 42px;
      min-height: 42px;
      border-radius: 50%;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0;
      font-size: 20px;
      line-height: 1 !important;
      text-align: center !important;
      padding: 0 !important;
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
      min-width: 44px;
      min-height: 44px;
      border-radius: 50%;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0;
      font-size: 21px;
      line-height: 1 !important;
      text-align: center !important;
      padding: 0 !important;
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

    .toast-notificacao-global.familia,
    .toast-notificacao-global.despesa,
    .toast-notificacao-global.vencida,
    .toast-notificacao-global.vencimento,
    .toast-notificacao-global.cartao,
    .toast-notificacao-global.orcamento {
      border-left: 5px solid #2e7d32;
    }

    .toast-notificacao-global.familia .toast-icon {
      background: #e0f2fe;
    }

    .toast-notificacao-global.despesa .toast-icon {
      background: #fef3c7;
    }

    .toast-notificacao-global.vencida .toast-icon {
      background: #fee2e2;
    }

    .toast-notificacao-global.vencimento .toast-icon {
      background: #ffedd5;
    }

    .toast-notificacao-global.cartao .toast-icon {
      background: #ede9fe;
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

    body.dark .dropdown-notificacao,
    body.tema-escuro .dropdown-notificacao {
      background: #1e1e1e !important;
      border: 1px solid #333 !important;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.5) !important;
    }

    body.dark .dropdown-notificacao-header,
    body.tema-escuro .dropdown-notificacao-header {
      background: #1e1e1e !important;
      border-bottom: 1px solid #333 !important;
    }

    body.dark .dropdown-notificacao-header h3,
    body.tema-escuro .dropdown-notificacao-header h3 {
      color: #ffffff !important;
    }

    body.dark .dropdown-notificacao-header span,
    body.tema-escuro .dropdown-notificacao-header span {
      color: #d1d5db !important;
    }

    body.dark .notificacao-vazia,
    body.tema-escuro .notificacao-vazia {
      color: #d1d5db !important;
    }

    body.dark .notificacao-item,
    body.tema-escuro .notificacao-item {
      background: #1e1e1e !important;
      border: 1px solid #333 !important;
      color: #ffffff !important;
    }

    body.dark .notificacao-item:hover,
    body.tema-escuro .notificacao-item:hover {
      background: #2a2a2a !important;
    }

    body.dark .notificacao-conteudo strong,
    body.tema-escuro .notificacao-conteudo strong {
      color: #ffffff !important;
    }

    body.dark .notificacao-conteudo p,
    body.tema-escuro .notificacao-conteudo p {
      color: #d1d5db !important;
    }

    body.dark .toast-notificacao-global,
    body.tema-escuro .toast-notificacao-global {
      background: #1e1e1e !important;
      border: 1px solid #333 !important;
      color: #ffffff !important;
      box-shadow: 0 20px 55px rgba(0, 0, 0, 0.5) !important;
    }

    body.dark .toast-notificacao-global strong,
    body.tema-escuro .toast-notificacao-global strong {
      color: #ffffff !important;
    }

    body.dark .toast-notificacao-global p,
    body.tema-escuro .toast-notificacao-global p {
      color: #d1d5db !important;
    }

    body.dark .toast-notificacao-global .toast-fechar,
    body.tema-escuro .toast-notificacao-global .toast-fechar {
      color: #d1d5db !important;
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
        
      .notificacao-remover-texto {
        display: block;
        margin-top: 6px;
        color: #9ca3af;
        font-size: 11px;
      }

      .notificacao-item {
        cursor: pointer;
      }

      .notificacao-item:active {
        transform: scale(0.99);
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
  const inputLembreteFatura = document.getElementById("lembreteOrcamento");

  if (inputNotificacoes) {
    inputNotificacoes.checked = preferenciaAtiva("notificacoesSistema");
  }

  if (inputLembreteFatura) {
    inputLembreteFatura.checked = preferenciaAtiva("lembreteFaturaCartao");
  }
}

function configurarPreferenciasNotificacoes() {
  const inputNotificacoes = document.getElementById("notificacoesSistema");
  const inputLembreteFatura = document.getElementById("lembreteOrcamento");

  if (inputNotificacoes) {
    inputNotificacoes.addEventListener("change", () => {
      salvarPreferenciaNotificacao("notificacoesSistema", inputNotificacoes.checked);

      if (!inputNotificacoes.checked) {
        limparTodasNotificacoesDaTela();
      }

      mostrarToastNotificacao(
        inputNotificacoes.checked
          ? "Notificações ativadas."
          : "Notificações desativadas."
      );

      inicializarNotificacoes(true);
    });
  }

  if (inputLembreteFatura) {
    inputLembreteFatura.addEventListener("change", () => {
      salvarPreferenciaNotificacao("lembreteFaturaCartao", inputLembreteFatura.checked);

      mostrarToastNotificacao(
        inputLembreteFatura.checked
          ? "Lembrete da fatura ativado."
          : "Lembrete da fatura desativado."
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
  const valorBruto =
    item.amount ??
    item.value ??
    item.valor ??
    item.total ??
    item.price ??
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
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  return Math.abs(Number(valorTexto) || 0);
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

  const texto = String(dataValor).trim().split("T")[0];

  if (texto.includes("-")) {
    const partes = texto.split("-");

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

function diasAte(data) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const alvo = new Date(data);
  alvo.setHours(0, 0, 0, 0);

  const diff = alvo - hoje;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ================= DESPESAS LOCAIS ================= */
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

function buscarDespesasLocaisParaNotificacoes() {
  const despesasLocal = lerArrayStorageNotificacoes("despesas", localStorage);
  const despesasSession = lerArrayStorageNotificacoes("despesas", sessionStorage);

  const transacoesLocal = lerArrayStorageNotificacoes("transacoes", localStorage);
  const transacoesSession = lerArrayStorageNotificacoes("transacoes", sessionStorage);

  const despesasDiretas = [
    ...despesasLocal,
    ...despesasSession
  ].map((item) => ({
    ...item,
    tipo: "despesa",
    origem: item.origem || "despesas"
  }));

  const despesasEmTransacoes = [
    ...transacoesLocal,
    ...transacoesSession
  ]
    .filter((item) => {
      const tipo = String(item.tipo || item.type || "").toLowerCase();

      return (
        tipo.includes("despesa") ||
        item.origem === "despesas"
      );
    })
    .map((item) => ({
      ...item,
      tipo: "despesa",
      origem: item.origem || "transacoes"
    }));

  return removerDespesasDuplicadasNotificacoes([
    ...despesasDiretas,
    ...despesasEmTransacoes
  ]);
}

function formatarDataISOParaNotificacao(dataValor) {
  const data = converterDataNotificacao(dataValor);

  if (!data) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function removerDespesasDuplicadasNotificacoes(lista) {
  const mapa = new Map();

  transformarEmArrayNotificacoes(lista).forEach((item) => {
    const data = formatarDataISOParaNotificacao(pegarDataNotificacao(item));

    let chave = "";

    if (item.id) {
      chave = `id-${item.id}`;
    } else if (item.compraId && item.parcelaAtual) {
      chave = `parcela-${item.compraId}-${item.parcelaAtual}`;
    } else if (item.despesaFixaId && data) {
      chave = `fixa-${item.despesaFixaId}-${data}`;
    } else {
      chave = [
        String(pegarDescricaoNotificacao(item)).toLowerCase().trim(),
        data,
        String(item.categoria || item.category || "").toLowerCase().trim(),
        Number(pegarValorNotificacao(item) || 0).toFixed(2)
      ].join("|");
    }

    if (!mapa.has(chave)) {
      mapa.set(chave, item);
    }
  });

  return Array.from(mapa.values());
}

function despesaEstaNoMesAtualNotificacao(item) {
  const data = converterDataNotificacao(pegarDataNotificacao(item));

  if (!data) return false;

  const hoje = new Date();

  return (
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear()
  );
}

/* ================= DESPESAS PENDENTES / ATRASADAS ================= */
async function buscarNotificacoesDespesas() {
  const notificacoes = [];

  if (!preferenciaAtiva("notificacoesSistema")) {
    return notificacoes;
  }

  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  const dadosApi = await apiGetNotificacoes(
    `/expense/user?month=${mesAtual}&year=${anoAtual}`
  );

  const despesasApi = transformarEmArrayNotificacoes(dadosApi).map((item) => ({
    ...item,
    tipo: "despesa",
    origem: item.origem || "api"
  }));

  const despesasLocais = buscarDespesasLocaisParaNotificacoes();

  const despesasTodas = removerDespesasDuplicadasNotificacoes([
    ...despesasApi,
    ...despesasLocais
  ]).filter((despesa) => {
    return despesaEstaNoMesAtualNotificacao(despesa);
  });

  const despesasNaoPagas = despesasTodas.filter((despesa) => {
    return !despesaEstaPaga(despesa);
  });

  console.log("DESPESAS PARA NOTIFICAÇÃO:", despesasNaoPagas);

  if (!despesasNaoPagas.length) {
    return notificacoes;
  }

  const despesasAtrasadas = despesasNaoPagas.filter((despesa) => {
    const data = converterDataNotificacao(pegarDataNotificacao(despesa));

    if (!data) return false;

    return diasAte(data) < 0;
  });

  const despesasAVencer = despesasNaoPagas.filter((despesa) => {
    const data = converterDataNotificacao(pegarDataNotificacao(despesa));

    if (!data) return false;

    const dias = diasAte(data);

    return dias >= 0 && dias <= 3;
  });

  const totalAtrasado = despesasAtrasadas.reduce((soma, despesa) => {
    return soma + pegarValorNotificacao(despesa);
  }, 0);

  const totalPendente = despesasNaoPagas.reduce((soma, despesa) => {
    return soma + pegarValorNotificacao(despesa);
  }, 0);

  /*
    Notificação resumida de atrasos.
  */
  if (despesasAtrasadas.length > 0) {
    notificacoes.push({
      id: `resumo-despesas-atrasadas-${despesasAtrasadas.length}-${totalAtrasado}`,
      tipo: "vencida",
      titulo: "Pagamentos atrasados",
      texto: `Você tem ${despesasAtrasadas.length} despesa(s) vencida(s). Total em atraso: ${formatarMoedaNotificacoes(totalAtrasado)}.`,
      icone: "⚠️"
    });
  }

  /*
    Notificação separada para cada despesa atrasada.
  */
  despesasAtrasadas.forEach((despesa, index) => {
    const data = converterDataNotificacao(pegarDataNotificacao(despesa));

    if (!data) return;

    const dias = diasAte(data);
    const valor = pegarValorNotificacao(despesa);
    const descricao = pegarDescricaoNotificacao(despesa);
    const categoria =
      despesa.categoria ||
      despesa.category ||
      despesa.categoryName ||
      "Sem categoria";

    const idBase =
      despesa.id ||
      despesa.expenseId ||
      despesa.compraId ||
      despesa.despesaFixaId ||
      `${descricao}-${index}`;

    notificacoes.push({
      id: `despesa-atrasada-individual-${idBase}-${formatarDataISOParaNotificacao(data)}`,
      tipo: "vencida",
      titulo: "Despesa em atraso",
      texto: `${descricao} (${categoria}) venceu há ${Math.abs(dias)} dia(s). Valor: ${formatarMoedaNotificacoes(valor)}.`,
      icone: "⚠️"
    });
  });

  /*
    Notificação resumida de pendências.
  */
  if (despesasNaoPagas.length > 0) {
    notificacoes.push({
      id: `resumo-despesas-pendentes-${despesasNaoPagas.length}-${totalPendente}`,
      tipo: "despesa",
      titulo: "Despesas pendentes",
      texto: `Você tem ${despesasNaoPagas.length} despesa(s) não paga(s). Total pendente: ${formatarMoedaNotificacoes(totalPendente)}.`,
      icone: "💳"
    });
  }

  /*
    Notificação separada para despesas próximas do vencimento.
  */
  despesasAVencer.forEach((despesa, index) => {
    const data = converterDataNotificacao(pegarDataNotificacao(despesa));

    if (!data) return;

    const dias = diasAte(data);
    const valor = pegarValorNotificacao(despesa);
    const descricao = pegarDescricaoNotificacao(despesa);
    const categoria =
      despesa.categoria ||
      despesa.category ||
      despesa.categoryName ||
      "Sem categoria";

    const idBase =
      despesa.id ||
      despesa.expenseId ||
      despesa.compraId ||
      despesa.despesaFixaId ||
      `${descricao}-${index}`;

    notificacoes.push({
      id: `despesa-vencimento-individual-${idBase}-${dias}`,
      tipo: "vencimento",
      titulo:
        dias === 0
          ? "Despesa vence hoje"
          : "Vencimento próximo",
      texto:
        dias === 0
          ? `${descricao} (${categoria}) vence hoje. Valor: ${formatarMoedaNotificacoes(valor)}.`
          : `${descricao} (${categoria}) vence em ${dias} dia(s). Valor: ${formatarMoedaNotificacoes(valor)}.`,
      icone: "⏰"
    });
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

/* ================= CARTÃO / FATURA ================= */
function buscarNotificacaoCartao() {
  const notificacoes = [];

  if (!preferenciaAtiva("notificacoesSistema")) {
    return notificacoes;
  }

  if (!preferenciaAtiva("lembreteFaturaCartao")) {
    return notificacoes;
  }

  const userKey = getUserKeyNotificacoes();

  const diaSalvo =
    localStorage.getItem(`${userKey}_pagamentoCartao`) ||
    localStorage.getItem("pagamentoCartao") ||
    sessionStorage.getItem("pagamentoCartao");

  console.log("DIA DO CARTÃO SALVO:", diaSalvo);

  if (!diaSalvo) {
    console.warn("Nenhum dia de pagamento do cartão foi encontrado.");
    return notificacoes;
  }

  const dia = Number(diaSalvo);

  if (!dia || dia < 1 || dia > 31) {
    console.warn("Dia de pagamento do cartão inválido:", diaSalvo);
    return notificacoes;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  let dataPagamento = new Date(ano, mes, dia);
  dataPagamento.setHours(0, 0, 0, 0);

  /*
    Mantido como estava:
    se a data deste mês já passou, calcula o próximo vencimento.
  */
  if (dataPagamento < hoje) {
    dataPagamento = new Date(ano, mes + 1, dia);
    dataPagamento.setHours(0, 0, 0, 0);
  }

  const dias = diasAte(dataPagamento);

  console.log("DIAS ATÉ VENCIMENTO DA FATURA:", dias);

  /*
    Mantido como estava:
    notifica apenas 7 dias antes, 3 dias antes e no dia.
  */
  const deveNotificar =
    dias === 7 ||
    dias === 3 ||
    dias === 0;

  if (!deveNotificar) {
    return notificacoes;
  }

  let titulo = "Vencimento da fatura";
  let texto = "";

  if (dias === 7) {
    texto = `Sua fatura do cartão vence em 7 dias, no dia ${dia}.`;
  }

  if (dias === 3) {
    texto = `Atenção! Sua fatura do cartão vence em 3 dias, no dia ${dia}.`;
  }

  if (dias === 0) {
    titulo = "Fatura vence hoje";
    texto = `Sua fatura do cartão vence hoje, dia ${dia}.`;
  }

  notificacoes.push({
    id: `cartao-${dia}-${dataPagamento.getMonth()}-${dataPagamento.getFullYear()}-${dias}`,
    tipo: "cartao",
    titulo,
    texto,
    icone: "💳"
  });

  return notificacoes;
}

/* ================= ORÇAMENTO ================= */
function buscarNotificacoesOrcamento() {
  const notificacoes = [];

  if (!preferenciaAtiva("notificacoesSistema")) {
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

/* ================= STORAGE / TEXTO ================= */
function normalizarTextoNotificacao(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* ================= ASSINATURA ================= */
function criarAssinaturaNotificacao(notificacao) {
  return `${notificacao.id || ""}|${notificacao.tipo}|${notificacao.titulo}|${notificacao.texto}`;
}

/* ================= NOTIFICAÇÕES VISUALIZADAS ================= */
function getChaveNotificacoesVisualizadas() {
  return `${getUserKeyNotificacoes()}_notificacoesVisualizadas`;
}

function buscarNotificacoesVisualizadas() {
  try {
    const dados = localStorage.getItem(getChaveNotificacoesVisualizadas());

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarNotificacoesVisualizadas(lista) {
  localStorage.setItem(
    getChaveNotificacoesVisualizadas(),
    JSON.stringify(lista.slice(-300))
  );
}

function marcarNotificacoesComoVisualizadas(notificacoes) {
  if (!Array.isArray(notificacoes) || !notificacoes.length) return;

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

/* ================= MARCAR NOTIFICAÇÃO ================= */ 
function marcarUmaNotificacaoComoVisualizada(notificacao) {
  if (!notificacao) return;

  const visualizadas = buscarNotificacoesVisualizadas();
  const assinatura = criarAssinaturaNotificacao(notificacao);

  const atualizadas = Array.from(
    new Set([
      ...visualizadas,
      assinatura
    ])
  );

  salvarNotificacoesVisualizadas(atualizadas);
}

/* ================= INICIALIZAR ================= */
async function inicializarNotificacoes(verificarNovas = false) {
  const badge = document.getElementById("badge-notificacao");

  if (!preferenciaAtiva("notificacoesSistema")) {
    limparTodasNotificacoesDaTela();
    notificacoesAtuais = [];
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

  const notificacoesNaoVisualizadas =
    buscarNotificacoesNaoVisualizadas(notificacoes);

  if (badge) {
    badge.textContent = notificacoesNaoVisualizadas.length;
    badge.style.display =
      notificacoesNaoVisualizadas.length > 0 ? "inline-flex" : "none";
  }

  renderizarPainelNotificacoes(notificacoesNaoVisualizadas);

  if (verificarNovas) {
    verificarEMostrarNovasNotificacoes(notificacoesNaoVisualizadas);
  }
}

/* ================= LIMPAR TELA ================= */
function limparTodasNotificacoesDaTela() {
  const badge = document.getElementById("badge-notificacao");

  if (badge) {
    badge.textContent = "0";
    badge.style.display = "none";
  }

  notificacoesAtuais = [];
  renderizarPainelNotificacoes([]);
  esconderToastNotificacaoGlobal();
}

/* ================= RENDER PAINEL ================= */
function renderizarPainelNotificacoes(notificacoes) {
  const lista = document.getElementById("lista-notificacoes-global");
  const subtitulo = document.getElementById("notificacao-subtitulo");
  const badge = document.getElementById("badge-notificacao");

  if (!lista) return;

  if (subtitulo) {
    subtitulo.textContent =
      notificacoes.length > 0
        ? `${notificacoes.length} notificação(ões)`
        : "Nenhuma notificação";
  }

  if (badge) {
    badge.textContent = notificacoes.length;
    badge.style.display = notificacoes.length > 0 ? "inline-flex" : "none";
  }

  if (!notificacoes.length) {
    lista.innerHTML = `
      <div class="notificacao-vazia">
        Nenhuma notificação no momento.
      </div>
    `;
    return;
  }

  lista.innerHTML = "";

  notificacoes.forEach((notificacao) => {
    const item = document.createElement("div");
    item.className = `notificacao-item ${notificacao.tipo}`;
    item.style.cursor = "pointer";

    item.innerHTML = `
      <div class="notificacao-icon">
        ${notificacao.icone || "🔔"}
      </div>

      <div class="notificacao-conteudo">
        <strong>${notificacao.titulo}</strong>
        <p>${notificacao.texto}</p>
        <small class="notificacao-remover-texto">
          Clique para remover esta notificação
        </small>
      </div>
    `;

    item.addEventListener("click", () => {
      marcarUmaNotificacaoComoVisualizada(notificacao);

      const notificacoesAtualizadas =
        buscarNotificacoesNaoVisualizadas(notificacoesAtuais);

      renderizarPainelNotificacoes(notificacoesAtualizadas);
    });

    lista.appendChild(item);
  });
}

/* ================= CLIQUE NO SINO ================= */
function configurarCliqueSino() {
  const sino = document.getElementById("icone-notificacao");
  const dropdown = document.getElementById("dropdown-notificacao");

  if (!sino || !dropdown) return;

  sino.onclick = (e) => {
    e.stopPropagation();

    const vaiAbrir = dropdown.classList.contains("hidden");

    dropdown.classList.toggle("hidden");

    esconderToastNotificacaoGlobal();

    if (vaiAbrir) {
      const notificacoesNaoVisualizadas =
        buscarNotificacoesNaoVisualizadas(notificacoesAtuais);

      renderizarPainelNotificacoes(notificacoesNaoVisualizadas);
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

  const notificacoesNaoVisualizadas =
    buscarNotificacoesNaoVisualizadas(notificacoes);

  if (!notificacoesNaoVisualizadas.length) {
    console.log("Todas as notificações já foram visualizadas.");
    return;
  }

  const mostradasNestaAba = buscarNotificacoesMostradasNestaAba();

  const novas = notificacoesNaoVisualizadas.filter((notificacao) => {
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