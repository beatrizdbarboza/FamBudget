console.log("EXTRATOS.JS OK");

const EXTRATOS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

const MESES_EXTRATOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

let dataReferenciaExtratos = new Date();
let filtroAtual = "todas";
let buscaAtual = "";
let paginaAtual = 1;
let itensPorPagina = 10;
let ordemDecrescente = false;
let ultimasTransacoes = [];

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuarioExtratos();
  configurarEventosExtratos();
  atualizarCabecalhoMoedaExtratos();
  await carregarExtratos();
});

/* Atualiza se a moeda for alterada em outra tela/aba */
window.addEventListener("storage", (event) => {
  if (!event.key) return;

  if (event.key.includes("moedaUsuario")) {
    atualizarCabecalhoMoedaExtratos();
    renderizarExtratos(ultimasTransacoes);
  }
});

/* ================= DADOS POR CONTA ================= */
function getEmailUsuarioExtratos() {
  return (
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    ""
  ).toLowerCase().trim();
}

function getUserKeyExtratos() {
  const email = getEmailUsuarioExtratos();
  return `fambudget_${email || "usuario"}`;
}

function buscarDadoUsuarioExtratos(chave) {
  const userKey = getUserKeyExtratos();
  return localStorage.getItem(`${userKey}_${chave}`);
}

/* ================= USUÁRIO ================= */
function carregarUsuarioExtratos() {
  const nome =
    buscarDadoUsuarioExtratos("nicknameUsuario") ||
    buscarDadoUsuarioExtratos("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário";

  const imagem =
    buscarDadoUsuarioExtratos("avatarUsuario") ||
    buscarDadoUsuarioExtratos("fotoUsuario") ||
    buscarDadoUsuarioExtratos("imagemPerfil") ||
    buscarDadoUsuarioExtratos("fotoPerfil") ||
    sessionStorage.getItem("avatarUsuario") ||
    localStorage.getItem("avatarUsuario") ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) {
    nomeUsuario.textContent = nome;
  }

  if (avatar) {
    if (imagem) {
      avatar.textContent = "";
      avatar.style.backgroundImage = `url("${imagem}")`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.style.backgroundRepeat = "no-repeat";
    } else {
      avatar.style.backgroundImage = "";
      avatar.textContent = nome.charAt(0).toUpperCase();
    }
  }
}

/* ================= TOKEN ================= */
function getTokenExtratos() {
  return (
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token")
  );
}

function headersExtratos() {
  return {
    Authorization: `Bearer ${getTokenExtratos()}`
  };
}

/* ================= API ================= */
async function lerRespostaExtratos(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiGetExtratos(path) {
  const token = getTokenExtratos();

  if (!token) {
    console.warn("Extratos: token não encontrado.");
    return null;
  }

  try {
    const res = await fetch(`${EXTRATOS_API_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: headersExtratos()
    });

    const data = await lerRespostaExtratos(res);

    if (!res.ok) {
      console.warn("GET EXTRATOS falhou:", path, res.status, data);
      return null;
    }

    return data?.data || data;
  } catch (erro) {
    console.error("Erro na API de extratos:", erro);
    return null;
  }
}

/* ================= EVENTOS ================= */
function configurarEventosExtratos() {
  const inputBusca = document.getElementById("buscar-transacoes");
  const btnAnterior = document.getElementById("mes-anterior");
  const btnProximo = document.getElementById("proximo-mes");
  const btnOrdenar = document.getElementById("btn-ordenar");

  if (inputBusca) {
    inputBusca.addEventListener("input", () => {
      buscaAtual = inputBusca.value.toLowerCase().trim();
      paginaAtual = 1;
      renderizarExtratos(ultimasTransacoes);
    });
  }

  document.querySelectorAll(".aba").forEach((aba) => {
    aba.addEventListener("click", () => {
      document.querySelectorAll(".aba").forEach((item) => {
        item.classList.remove("ativa");
      });

      aba.classList.add("ativa");

      filtroAtual = aba.dataset.filtro || "todas";
      paginaAtual = 1;

      renderizarExtratos(ultimasTransacoes);
    });
  });

  if (btnAnterior) {
    btnAnterior.addEventListener("click", async () => {
      dataReferenciaExtratos.setMonth(dataReferenciaExtratos.getMonth() - 1);
      paginaAtual = 1;
      await carregarExtratos();
    });
  }

  if (btnProximo) {
    btnProximo.addEventListener("click", async () => {
      dataReferenciaExtratos.setMonth(dataReferenciaExtratos.getMonth() + 1);
      paginaAtual = 1;
      await carregarExtratos();
    });
  }

  if (btnOrdenar) {
    btnOrdenar.addEventListener("click", () => {
      ordemDecrescente = !ordemDecrescente;
      paginaAtual = 1;
      renderizarExtratos(ultimasTransacoes);
    });
  }
}

/* ================= CARREGAR EXTRATOS ================= */
async function carregarExtratos() {
  atualizarTituloMesExtratos();
  atualizarCabecalhoMoedaExtratos();

  const mes = dataReferenciaExtratos.getMonth() + 1;
  const ano = dataReferenciaExtratos.getFullYear();

  const despesasApi = await apiGetExtratos(`/expense/user?month=${mes}&year=${ano}`);
  const receitasApi = await apiGetExtratos(`/income/user?month=${mes}&year=${ano}`);

  const despesas = transformarEmArrayExtratos(despesasApi).map((item) => {
    return normalizarTransacaoExtratos(item, "despesa");
  });

  const receitas = transformarEmArrayExtratos(receitasApi).map((item) => {
    return normalizarTransacaoExtratos(item, "receita");
  });

  let transacoes = [
    ...receitas,
    ...despesas
  ];

  if (transacoes.length === 0) {
    transacoes = buscarTransacoesLocaisExtratos();
  }

  ultimasTransacoes = transacoes;

  console.log("EXTRATOS RECEITAS API:", receitas);
  console.log("EXTRATOS DESPESAS API:", despesas);
  console.log("EXTRATOS TRANSAÇÕES FINAIS:", ultimasTransacoes);

  renderizarExtratos(ultimasTransacoes);
}

/* ================= NORMALIZAR ARRAY ================= */
function transformarEmArrayExtratos(resposta) {
  if (!resposta) return [];

  if (Array.isArray(resposta)) return resposta;

  if (Array.isArray(resposta.data)) return resposta.data;
  if (Array.isArray(resposta.items)) return resposta.items;
  if (Array.isArray(resposta.results)) return resposta.results;

  if (Array.isArray(resposta.expenses)) return resposta.expenses;
  if (Array.isArray(resposta.incomes)) return resposta.incomes;
  if (Array.isArray(resposta.revenues)) return resposta.revenues;

  if (Array.isArray(resposta.receitas)) return resposta.receitas;
  if (Array.isArray(resposta.despesas)) return resposta.despesas;

  if (resposta.data && typeof resposta.data === "object") {
    if (Array.isArray(resposta.data.items)) return resposta.data.items;
    if (Array.isArray(resposta.data.results)) return resposta.data.results;
    if (Array.isArray(resposta.data.expenses)) return resposta.data.expenses;
    if (Array.isArray(resposta.data.incomes)) return resposta.data.incomes;
    if (Array.isArray(resposta.data.revenues)) return resposta.data.revenues;
    if (Array.isArray(resposta.data.receitas)) return resposta.data.receitas;
    if (Array.isArray(resposta.data.despesas)) return resposta.data.despesas;
  }

  return [];
}

/* ================= LOCAL STORAGE / SESSION STORAGE ================= */
function lerStorageExtratos(chave, storage) {
  try {
    const dados = storage.getItem(chave);

    if (!dados) return [];

    const parseado = JSON.parse(dados);

    return Array.isArray(parseado) ? parseado : [];
  } catch (erro) {
    console.error(`Erro ao ler ${chave}:`, erro);
    return [];
  }
}

function buscarTransacoesLocaisExtratos() {
  const transacoesLocal = lerStorageExtratos("transacoes", localStorage);
  const transacoesSession = lerStorageExtratos("transacoes", sessionStorage);

  const receitasLocal = lerStorageExtratos("receitas", localStorage);
  const receitasSession = lerStorageExtratos("receitas", sessionStorage);

  const despesasLocal = lerStorageExtratos("despesas", localStorage);
  const despesasSession = lerStorageExtratos("despesas", sessionStorage);

  const todas = [
    ...transacoesLocal,
    ...transacoesSession,
    ...receitasLocal.map((item) => ({ ...item, tipo: "receita" })),
    ...receitasSession.map((item) => ({ ...item, tipo: "receita" })),
    ...despesasLocal.map((item) => ({ ...item, tipo: "despesa" })),
    ...despesasSession.map((item) => ({ ...item, tipo: "despesa" }))
  ];

  const mesAtual = dataReferenciaExtratos.getMonth();
  const anoAtual = dataReferenciaExtratos.getFullYear();

  return todas
    .map((item) => {
      const tipo = normalizarTipoExtratos(item.tipo || item.type || item.transactionType);
      return normalizarTransacaoExtratos(item, tipo);
    })
    .filter((item) => {
      const data = converterDataExtratos(item.data);

      if (!data) return false;

      return (
        data.getMonth() === mesAtual &&
        data.getFullYear() === anoAtual
      );
    });
}

/* ================= NORMALIZAR TRANSAÇÃO ================= */
function normalizarTransacaoExtratos(item, tipoPadrao) {
  const tipo = normalizarTipoExtratos(
    item.tipo ||
    item.type ||
    item.transactionType ||
    item.natureza ||
    tipoPadrao
  );

  return {
    id: item.id || item.uuid || cryptoRandomIdExtratos(),
    data: pegarDataExtratos(item),
    descricao: pegarDescricaoExtratos(item),
    categoria: pegarCategoriaExtratos(item, tipo),
    tipo,
    valor: pegarValorExtratos(item)
  };
}

function cryptoRandomIdExtratos() {
  return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizarTipoExtratos(tipo) {
  const texto = String(tipo || "").toLowerCase();

  if (
    texto.includes("receita") ||
    texto.includes("income") ||
    texto.includes("entrada") ||
    texto.includes("revenue")
  ) {
    return "receita";
  }

  return "despesa";
}

function pegarDataExtratos(item) {
  return (
    item.dateInitial ||
    item.data ||
    item.date ||
    item.createdAt ||
    item.dueDate ||
    item.updatedAt ||
    new Date().toISOString().split("T")[0]
  );
}

function pegarDescricaoExtratos(item) {
  return (
    item.description ||
    item.descricao ||
    item.name ||
    item.nome ||
    item.title ||
    "Sem descrição"
  );
}

function pegarCategoriaExtratos(item, tipo) {
  return (
    item.category ||
    item.categoria ||
    item.categoryName ||
    item.descriptionCategory ||
    item.typeCategory ||
    item.nameCategory ||
    (tipo === "receita" ? "Receita" : "Outros")
  );
}

function pegarValorExtratos(item) {
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

/* ================= RENDER PRINCIPAL ================= */
function renderizarExtratos(transacoes) {
  atualizarTituloMesExtratos();
  atualizarCabecalhoMoedaExtratos();

  const transacoesFiltradas = filtrarTransacoesExtratos(transacoes);

  atualizarResumoExtratos(transacoesFiltradas);
  renderizarTabelaExtratos(transacoesFiltradas);
  renderizarPaginacaoExtratos(transacoesFiltradas.length);
}

/* ================= FILTROS ================= */
function filtrarTransacoesExtratos(transacoes) {
  const mesAtual = dataReferenciaExtratos.getMonth();
  const anoAtual = dataReferenciaExtratos.getFullYear();

  let lista = transformarEmArrayExtratos(transacoes);

  lista = lista.filter((item) => {
    const data = converterDataExtratos(item.data);

    if (!data) return false;

    return (
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual
    );
  });

  if (filtroAtual !== "todas") {
    lista = lista.filter((item) => item.tipo === filtroAtual);
  }

  if (buscaAtual) {
    lista = lista.filter((item) => {
      return (
        String(item.descricao || "").toLowerCase().includes(buscaAtual) ||
        String(item.categoria || "").toLowerCase().includes(buscaAtual) ||
        String(item.tipo || "").toLowerCase().includes(buscaAtual)
      );
    });
  }

  lista.sort((a, b) => {
    const dataA = converterDataExtratos(a.data) || new Date(0);
    const dataB = converterDataExtratos(b.data) || new Date(0);

    if (ordemDecrescente) {
      return dataB - dataA;
    }

    return dataA - dataB;
  });

  return lista;
}

/* ================= RESUMO ================= */
function atualizarResumoExtratos(transacoes) {
  const totalEntradas = transacoes
    .filter((item) => item.tipo === "receita")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const totalSaidas = transacoes
    .filter((item) => item.tipo === "despesa")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const entradasEl = document.getElementById("total-entradas");
  const saidasEl = document.getElementById("total-saidas");

  if (entradasEl) {
    entradasEl.textContent = formatarMoedaExtratos(totalEntradas);
  }

  if (saidasEl) {
    saidasEl.textContent = formatarMoedaExtratos(totalSaidas);
  }
}

/* ================= TABELA ================= */
function renderizarTabelaExtratos(transacoes) {
  const tbody = document.getElementById("lista-extratos");
  const semDados = document.getElementById("sem-dados");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (transacoes.length === 0) {
    if (semDados) semDados.style.display = "block";
    return;
  }

  if (semDados) semDados.style.display = "none";

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const transacoesPagina = transacoes.slice(inicio, fim);

  transacoesPagina.forEach((item, index) => {
    const proximo = transacoesPagina[index + 1];
    const ehUltimoDoDia = !proximo || formatarDataISOExtratos(proximo.data) !== formatarDataISOExtratos(item.data);

    const tr = document.createElement("tr");

    if (ehUltimoDoDia) {
      tr.classList.add("grupo-final");
    }

    const classeValor = item.tipo === "receita" ? "positivo" : "negativo";
    const sinal = item.tipo === "receita" ? "" : "-";

    tr.innerHTML = `
      <td>${formatarDataCurtaExtratos(item.data)}</td>

      <td>
        <div class="descricao-cell">
          <span class="icone-item ${classeIconeExtratos(item)}">
            ${iconeDescricaoExtratos(item)}
          </span>
          <span>${item.descricao}</span>
        </div>
      </td>

      <td>
        <div class="categoria-cell">
          <span>${iconeCategoriaExtratos(item.categoria)}</span>
          <span>${item.categoria}</span>
        </div>
      </td>

      <td>
        <div class="tipo-cell">
          <span class="ponto-tipo ${item.tipo === "receita" ? "ponto-receita" : "ponto-despesa"}"></span>
          <span>${item.tipo === "receita" ? "Receita" : "Despesa"}</span>
        </div>
      </td>

      <td class="valor ${classeValor}">
        ${sinal}${formatarMoedaExtratos(item.valor)}
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* ================= PAGINAÇÃO ================= */
function renderizarPaginacaoExtratos(totalItens) {
  const paginacao = document.getElementById("paginacao");

  if (!paginacao) return;

  paginacao.innerHTML = "";

  const totalPaginas = Math.ceil(totalItens / itensPorPagina);

  if (totalPaginas <= 1) {
    return;
  }

  const btnAnterior = document.createElement("button");
  btnAnterior.className = "pagina-btn";
  btnAnterior.innerHTML = "‹";
  btnAnterior.disabled = paginaAtual === 1;

  btnAnterior.addEventListener("click", () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      renderizarExtratos(ultimasTransacoes);
    }
  });

  paginacao.appendChild(btnAnterior);

  const paginas = gerarPaginasExtratos(totalPaginas, paginaAtual);

  paginas.forEach((pagina) => {
    if (pagina === "...") {
      const span = document.createElement("span");
      span.className = "pagina-reticencias";
      span.textContent = "...";
      paginacao.appendChild(span);
      return;
    }

    const btn = document.createElement("button");
    btn.className = "pagina-numero";
    btn.textContent = pagina;

    if (pagina === paginaAtual) {
      btn.classList.add("ativa");
    }

    btn.addEventListener("click", () => {
      paginaAtual = pagina;
      renderizarExtratos(ultimasTransacoes);
    });

    paginacao.appendChild(btn);
  });

  const btnProximo = document.createElement("button");
  btnProximo.className = "pagina-btn";
  btnProximo.innerHTML = "›";
  btnProximo.disabled = paginaAtual === totalPaginas;

  btnProximo.addEventListener("click", () => {
    if (paginaAtual < totalPaginas) {
      paginaAtual++;
      renderizarExtratos(ultimasTransacoes);
    }
  });

  paginacao.appendChild(btnProximo);
}

function gerarPaginasExtratos(totalPaginas, paginaAtual) {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  if (paginaAtual <= 5) {
    return [1, 2, 3, 4, 5, "...", totalPaginas];
  }

  if (paginaAtual >= totalPaginas - 4) {
    return [
      1,
      "...",
      totalPaginas - 4,
      totalPaginas - 3,
      totalPaginas - 2,
      totalPaginas - 1,
      totalPaginas
    ];
  }

  return [
    1,
    "...",
    paginaAtual - 1,
    paginaAtual,
    paginaAtual + 1,
    "...",
    totalPaginas
  ];
}

/* ================= DATA ================= */
function converterDataExtratos(dataValor) {
  if (!dataValor) return null;

  const texto = String(dataValor).trim();

  if (texto.includes("-")) {
    const partes = texto.split("T")[0].split("-");

    if (partes.length === 3) {
      const ano = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const dia = Number(partes[2]);

      const data = new Date(ano, mes, dia, 12, 0, 0);

      return isNaN(data) ? null : data;
    }
  }

  if (texto.includes("/")) {
    const partes = texto.split("/");

    if (partes.length === 3) {
      const dia = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const ano = Number(partes[2]);

      const data = new Date(ano, mes, dia, 12, 0, 0);

      return isNaN(data) ? null : data;
    }
  }

  const data = new Date(texto);

  return isNaN(data) ? null : data;
}

function formatarDataISOExtratos(dataValor) {
  const data = converterDataExtratos(dataValor);

  if (!data) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarDataCurtaExtratos(dataValor) {
  const data = converterDataExtratos(dataValor);

  if (!data) return "-";

  const dia = data.getDate();
  const mes = MESES_EXTRATOS[data.getMonth()].substring(0, 3);

  return `${dia} ${mes}`;
}

function atualizarTituloMesExtratos() {
  const mesAtual = document.getElementById("mes-atual");

  if (!mesAtual) return;

  const mes = MESES_EXTRATOS[dataReferenciaExtratos.getMonth()];
  const ano = dataReferenciaExtratos.getFullYear();

  mesAtual.textContent = `${mes} ${ano}`;
}

/* ================= ÍCONES ================= */
function classeIconeExtratos(item) {
  if (item.tipo === "receita") {
    return "icone-receita";
  }

  const texto = `${item.descricao} ${item.categoria}`.toLowerCase();

  if (
    texto.includes("saúde") ||
    texto.includes("saude") ||
    texto.includes("farm")
  ) {
    return "icone-saude";
  }

  return "icone-despesa";
}

function iconeDescricaoExtratos(item) {
  const texto = `${item.descricao} ${item.categoria}`.toLowerCase();

  if (item.tipo === "receita") return "R$";
  if (texto.includes("aluguel") || texto.includes("moradia")) return "⌂";
  if (texto.includes("farm") || texto.includes("saúde") || texto.includes("saude")) return "+";
  if (texto.includes("aliment")) return "🍽";
  if (texto.includes("transporte")) return "⇄";
  if (texto.includes("cartão") || texto.includes("cartao")) return "▣";

  return "−";
}

function iconeCategoriaExtratos(categoria) {
  const texto = String(categoria || "").toLowerCase();

  if (texto.includes("renda") || texto.includes("receita") || texto.includes("salário") || texto.includes("salario")) return "💵";
  if (texto.includes("moradia") || texto.includes("aluguel")) return "🏠";
  if (texto.includes("saúde") || texto.includes("saude") || texto.includes("farm")) return "♡";
  if (texto.includes("alimentação") || texto.includes("alimentacao")) return "🍽";
  if (texto.includes("transporte")) return "🚌";
  if (texto.includes("cartão") || texto.includes("cartao")) return "💳";
  if (texto.includes("lazer")) return "★";

  return "•";
}

/* ================= MOEDA ================= */
function obterMoedaExtratos() {
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

function formatarMoedaExtratos(valor) {
  const moeda = obterMoedaExtratos();

  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: moeda
    });
  } catch (erro) {
    console.warn("Moeda inválida em extratos:", moeda, erro);

    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}

function pegarRotuloMoedaExtratos() {
  const moeda = obterMoedaExtratos();

  const simbolos = {
    BRL: "R$",
    USD: "US$",
    EUR: "€",
    GBP: "£",
    JPY: "¥"
  };

  return simbolos[moeda] || moeda;
}

function atualizarCabecalhoMoedaExtratos() {
  const colunaValor = document.querySelector(".valor-coluna");

  if (colunaValor) {
    colunaValor.textContent = `Valor (${pegarRotuloMoedaExtratos()})`;
  }
}