console.log("NOTIFICACOES.JS OK");

const NOTIFICACOES_API_URL = "https://www.manage-control-dev.com.br/api/v1";

document.addEventListener("DOMContentLoaded", () => {
  carregarPreferenciasNotificacoes();
  configurarPreferenciasNotificacoes();
  inicializarNotificacoes();
});

/* ================= TOKEN ================= */
function getTokenNotificacoes() {
  return (
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")
  );
}

function headersNotificacoes() {
  const token = getTokenNotificacoes();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
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
    const res = await fetch(`${NOTIFICACOES_API_URL}${path}`, {
      cache: "no-store",
      headers: headersNotificacoes()
    });

    const data = await lerRespostaNotificacoes(res);

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

        inicializarNotificacoes();
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

      inicializarNotificacoes();
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

  const dados = await apiGetNotificacoes("/expense/user/unpaid");
  const despesas = transformarEmArrayNotificacoes(dados);

  if (!despesas.length) {
    return notificacoes;
  }

  notificacoes.push({
    tipo: "despesa",
    titulo: "Despesas pendentes",
    texto: `Você tem ${despesas.length} despesa(s) não paga(s).`,
    icone: "💳"
  });

  despesas.slice(0, 3).forEach((despesa) => {
    const data = converterDataNotificacao(pegarDataNotificacao(despesa));
    const valor = pegarValorNotificacao(despesa);
    const descricao = pegarDescricaoNotificacao(despesa);

    if (!data) return;

    const dias = diasAte(data);

    if (dias < 0) {
      notificacoes.push({
        tipo: "vencida",
        titulo: "Despesa vencida",
        texto: `${descricao} está vencida. Valor: ${formatarMoedaNotificacoes(valor)}.`,
        icone: "⚠️"
      });
    } else if (dias <= 3) {
      notificacoes.push({
        tipo: "vencimento",
        titulo: "Vencimento próximo",
        texto: `${descricao} vence em ${dias} dia(s). Valor: ${formatarMoedaNotificacoes(valor)}.`,
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

  if (!convites.length) {
    return notificacoes;
  }

  notificacoes.push({
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
      tipo: "cartao",
      titulo: "Pagamento do cartão",
      texto: `Seu cartão vence em ${dias} dia(s), no dia ${dia}.`,
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
        tipo: "orcamento",
        titulo: "Orçamento próximo do limite",
        texto: `${orcamento.categoria}: ${porcentagem.toFixed(0)}% usado. Gasto: ${formatarMoedaNotificacoes(gasto)} de ${formatarMoedaNotificacoes(limite)}.`,
        icone: "📊"
      });
    }
  });

  return notificacoes;
}

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
async function inicializarNotificacoes() {
  const badge = document.getElementById("badge-notificacao");

  if (!preferenciaAtiva("notificacoesSistema")) {
    if (badge) {
      badge.textContent = "0";
      badge.style.display = "none";
    }

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

  renderizarNotificacoes(notificacoes);
}

/* ================= RENDER ================= */
function renderizarNotificacoes(notificacoes) {
  const badge = document.getElementById("badge-notificacao");

  if (!badge) return;

  badge.textContent = notificacoes.length;
  badge.style.display = notificacoes.length > 0 ? "inline-flex" : "none";
}

function configurarCliqueSino() {
  const sino = document.getElementById("icone-notificacao");
  const dropdown = document.getElementById("dropdown-notificacao");

  if (!sino || !dropdown) return;

  sino.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  };

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !sino.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  });
}

/* ================= TOAST ================= */
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