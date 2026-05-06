console.log("EXTRATOS.JS OK - API ATUALIZADO");

const EXTRATOS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

const MESES_EXTRATOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const CATEGORIAS_DESPESA_POR_ID = {
  1: "Alimentação",
  2: "Transporte",
  3: "Lazer",
  4: "Moradia",
  5: "Saúde",
  6: "Cartão de Crédito",
  7: "Cartão de Débito",
  8: "Outros"
};

const CATEGORIAS_RECEITA_POR_ID = {
  1: "Salário",
  2: "Receita",
  3: "Outros",
  4: "Outros",
  5: "Outros",
  6: "Outros",
  7: "Outros",
  8: "Outros"
};

let dataReferenciaExtratos = new Date();
let filtroAtual = "todas";
let buscaAtual = "";
let paginaAtual = 1;
let itensPorPagina = 10;
let ordemDecrescente = false;
let ultimasTransacoes = [];

/* ================= FAMÍLIA / USUÁRIO ================= */
let mostrarUsuarioExtratos = false;

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuarioExtratos();
  configurarEventosExtratos();
  atualizarCabecalhoMoedaExtratos();

  mostrarUsuarioExtratos = await usuarioEstaEmFamiliaExtratos();
  atualizarCabecalhoUsuarioExtratos();

  await carregarExtratos();
});

window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  if (event.key.includes("moedaUsuario")) {
    atualizarCabecalhoMoedaExtratos();
    renderizarExtratos(ultimasTransacoes);
  }

  if (
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia"
  ) {
    mostrarUsuarioExtratos = await usuarioEstaEmFamiliaExtratos();
    atualizarCabecalhoUsuarioExtratos();
    await carregarExtratos();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  mostrarUsuarioExtratos = await usuarioEstaEmFamiliaExtratos();
  atualizarCabecalhoUsuarioExtratos();
  await carregarExtratos();
});

document.addEventListener("visibilitychange", async () => {
  if (!document.hidden) {
    await carregarExtratos();
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

function getUserKeyExtratos(email = null) {
  const emailFinal = email || getEmailUsuarioExtratos();
  return `fambudget_${String(emailFinal || "usuario").toLowerCase().trim()}`;
}

function buscarDadoUsuarioExtratos(chave, email = null) {
  const userKey = getUserKeyExtratos(email);
  return localStorage.getItem(`${userKey}_${chave}`) || "";
}

function carregarUsuarioExtratos() {
  const nome =
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário";

  const email =
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    "usuario";

  const userKey = `fambudget_${String(email).toLowerCase().trim()}`;

  const avatarImagem =
    sessionStorage.getItem("avatarUsuario") ||
    localStorage.getItem(`${userKey}_avatarUsuario`) ||
    localStorage.getItem("avatarUsuario") ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) {
    nomeUsuario.textContent = nome;
  }

  if (avatar) {
    if (avatarImagem) {
      avatar.innerHTML = `<img src="${avatarImagem}" alt="Avatar">`;
    } else {
      avatar.innerHTML = "";
      avatar.textContent = nome.charAt(0).toUpperCase();
    }
  }
}

/* ================= TOKEN / API ================= */
function getTokenExtratos() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function headersExtratos() {
  const token = getTokenExtratos();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

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

/* ================= FAMÍLIA / AUTOR ================= */
async function usuarioEstaEmFamiliaExtratos() {
  const token = getTokenExtratos();

  if (!token) return false;

  try {
    const resposta = await fetch(`${EXTRATOS_API_URL}/family`, {
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
    console.warn("Erro ao verificar família em extratos:", erro);
    return false;
  }
}

function buscarNicknamePorEmailExtratos(email) {
  if (!email) return "";

  return (
    buscarDadoUsuarioExtratos("nicknameUsuario", email) ||
    buscarDadoUsuarioExtratos("nomeUsuario", email) ||
    ""
  );
}

function pegarNomeAutorExtratos(item) {
  const emailAutor =
    item.autorEmail ||
    item.userEmail ||
    item.emailUsuario ||
    item.createdByEmail ||
    item.created_by_email ||
    item.createdBy?.email ||
    item.user?.email ||
    item.usuario?.email ||
    "";

  const nicknameSalvo = buscarNicknamePorEmailExtratos(emailAutor);

  return (
    nicknameSalvo ||
    item.autorNickname ||
    item.nicknameUsuario ||
    item.nomeUsuario ||
    item.createdByNickname ||
    item.createdByName ||
    item.createdBy?.nickname ||
    item.createdBy?.name ||
    item.user?.nickname ||
    item.user?.name ||
    item.usuario?.nickname ||
    item.usuario?.nome ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    ""
  );
}

function aplicarAutorExtratos(item) {
  return {
    ...item,

    autorId:
      item.autorId ||
      item.userId ||
      item.user_id ||
      item.createdById ||
      item.created_by_id ||
      item.createdBy?.id ||
      item.user?.id ||
      item.usuario?.id ||
      null,

    autorEmail:
      item.autorEmail ||
      item.userEmail ||
      item.emailUsuario ||
      item.createdByEmail ||
      item.created_by_email ||
      item.createdBy?.email ||
      item.user?.email ||
      item.usuario?.email ||
      "",

    autorNickname:
      item.autorNickname ||
      item.nicknameUsuario ||
      item.nomeUsuario ||
      item.createdByNickname ||
      item.createdByName ||
      item.createdBy?.nickname ||
      item.createdBy?.name ||
      item.user?.nickname ||
      item.user?.name ||
      item.usuario?.nickname ||
      item.usuario?.nome ||
      ""
  };
}

function atualizarCabecalhoUsuarioExtratos() {
  const tbody = document.getElementById("lista-extratos");

  if (!tbody) return;

  const tabela = tbody.closest("table");

  if (!tabela) return;

  const linhaCabecalho = tabela.querySelector("thead tr");

  if (!linhaCabecalho) return;

  const thUsuarioExistente = linhaCabecalho.querySelector("[data-coluna-usuario='extratos']");

  if (mostrarUsuarioExtratos) {
    if (!thUsuarioExistente) {
      const thValor =
        linhaCabecalho.querySelector(".valor-coluna") ||
        linhaCabecalho.lastElementChild;

      const thUsuario = document.createElement("th");
      thUsuario.textContent = "Usuário";
      thUsuario.setAttribute("data-coluna-usuario", "extratos");

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
  atualizarCabecalhoUsuarioExtratos();

  const mes = dataReferenciaExtratos.getMonth() + 1;
  const ano = dataReferenciaExtratos.getFullYear();

  const despesasApiResposta = await apiGetExtratos(`/expense/user?month=${mes}&year=${ano}`);
  const receitasApiResposta = await apiGetExtratos(`/income/user?month=${mes}&year=${ano}`);

  const despesasApi = transformarEmArrayExtratos(despesasApiResposta).map((item) => {
    return normalizarTransacaoExtratos(item, "despesa");
  });

  const receitasApi = transformarEmArrayExtratos(receitasApiResposta).map((item) => {
    return normalizarTransacaoExtratos(item, "receita");
  });

  /*
    IMPORTANTE:
    Não junta mais localStorage aqui.
    Extratos agora usa somente API, para não duplicar e funcionar em outro PC.
  */
  const transacoes = [
    ...receitasApi,
    ...despesasApi
  ];

  ultimasTransacoes = removerDuplicadosExtratos(transacoes);

  renderizarExtratos(ultimasTransacoes);
}

/* ================= ARRAY / NORMALIZAÇÃO ================= */
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

function normalizarTextoExtratos(texto) {
  return String(texto || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function removerDuplicadosExtratos(lista) {
  const mapa = new Map();

  transformarEmArrayExtratos(lista).forEach((item) => {
    const dataNormalizada = formatarDataISOExtratos(item.data);
    const categoriaNormalizada = normalizarTextoExtratos(item.categoria);
    const valorNormalizado = Number(item.valor || 0).toFixed(2);

    /*
      Não usa descrição na chave porque a API às vezes retorna "Sem descrição".
      Usa tipo + data + categoria + valor.
    */
    const chave = [
      item.tipo || "",
      dataNormalizada,
      categoriaNormalizada,
      valorNormalizado
    ].join("|");

    if (!mapa.has(chave)) {
      mapa.set(chave, item);
      return;
    }

    /*
      Se já existe item igual, mantém o que tem melhor descrição.
    */
    const atual = mapa.get(chave);

    const descricaoAtual = normalizarTextoExtratos(atual.descricao);
    const descricaoNova = normalizarTextoExtratos(item.descricao);

    const atualRuim =
      !descricaoAtual ||
      descricaoAtual === "sem descricao" ||
      descricaoAtual === "sem descrição";

    const novaBoa =
      descricaoNova &&
      descricaoNova !== "sem descricao" &&
      descricaoNova !== "sem descrição";

    if (atualRuim && novaBoa) {
      mapa.set(chave, item);
    }
  });

  return Array.from(mapa.values());
}

function normalizarTransacaoExtratos(item, tipoPadrao) {
  const tipo = normalizarTipoExtratos(
    item.tipo ||
    item.type ||
    item.transactionType ||
    item.natureza ||
    item.typeIncome ||
    item.typeExpense ||
    tipoPadrao
  );

  const itemComAutor = aplicarAutorExtratos(item);

  return {
    id: item.id || item.uuid || item.incomeId || item.expenseId || cryptoRandomIdExtratos(),
    data: pegarDataExtratos(item),
    descricao: pegarDescricaoExtratos(item),
    categoria: pegarCategoriaExtratos(item, tipo),
    tipo,
    valor: pegarValorExtratos(item),
    origem: "api",

    monthly: item.monthly ?? null,

    autorId: itemComAutor.autorId || null,
    autorEmail: itemComAutor.autorEmail || "",
    autorNickname: itemComAutor.autorNickname || ""
  };
}

function cryptoRandomIdExtratos() {
  return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizarTipoExtratos(tipo) {
  const texto = normalizarTextoExtratos(tipo);

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
    item.paymentDate ||
    item.receivedAt ||
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
    item.incomeName ||
    item.nameIncome ||
    item.descriptionIncome ||
    item.expenseName ||
    item.nameExpense ||
    item.descriptionExpense ||
    "Sem descrição"
  );
}

function pegarCategoriaExtratos(item, tipo) {
  const categoriaDireta =
    item.category?.name ||
    item.category?.description ||
    item.categoria ||
    item.categoryName ||
    item.descriptionCategory ||
    item.nameCategory ||
    "";

  if (categoriaDireta && Number.isNaN(Number(categoriaDireta))) {
    return categoriaDireta;
  }

  const categoryId =
    item.categoryId ||
    item.category_id ||
    item.idCategory ||
    item.category?.id ||
    item.category;

  if (tipo === "receita") {
    if (categoryId && CATEGORIAS_RECEITA_POR_ID[Number(categoryId)]) {
      return CATEGORIAS_RECEITA_POR_ID[Number(categoryId)];
    }

    return "Receita";
  }

  if (categoryId && CATEGORIAS_DESPESA_POR_ID[Number(categoryId)]) {
    return CATEGORIAS_DESPESA_POR_ID[Number(categoryId)];
  }

  return "Outros";
}

function pegarValorExtratos(item) {
  const valorBruto =
    item.value ??
    item.amount ??
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

/* ================= RENDER ================= */
function renderizarExtratos(transacoes) {
  atualizarTituloMesExtratos();
  atualizarCabecalhoMoedaExtratos();
  atualizarCabecalhoUsuarioExtratos();

  const transacoesFiltradas = filtrarTransacoesExtratos(transacoes);

  atualizarResumoExtratos(transacoesFiltradas);
  renderizarTabelaExtratos(transacoesFiltradas);
  renderizarPaginacaoExtratos(transacoesFiltradas.length);
}

function filtrarTransacoesExtratos(transacoes) {
  const mesAtual = dataReferenciaExtratos.getMonth();
  const anoAtual = dataReferenciaExtratos.getFullYear();

  let lista = transformarEmArrayExtratos(transacoes);

  lista = removerDuplicadosExtratos(lista);

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
      const autor = pegarNomeAutorExtratos(item);

      return (
        String(item.descricao || "").toLowerCase().includes(buscaAtual) ||
        String(item.categoria || "").toLowerCase().includes(buscaAtual) ||
        String(item.tipo || "").toLowerCase().includes(buscaAtual) ||
        String(autor || "").toLowerCase().includes(buscaAtual)
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

  return removerDuplicadosExtratos(lista);
}

function atualizarResumoExtratos(transacoes) {
  const listaSemDuplicar = removerDuplicadosExtratos(transacoes);

  const totalEntradas = listaSemDuplicar
    .filter((item) => item.tipo === "receita")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const totalSaidas = listaSemDuplicar
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

function renderizarTabelaExtratos(transacoes) {
  const tbody = document.getElementById("lista-extratos");
  const semDados = document.getElementById("sem-dados");

  if (!tbody) return;

  tbody.innerHTML = "";
  atualizarCabecalhoUsuarioExtratos();

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
    const ehUltimoDoDia =
      !proximo ||
      formatarDataISOExtratos(proximo.data) !== formatarDataISOExtratos(item.data);

    const tr = document.createElement("tr");

    if (ehUltimoDoDia) {
      tr.classList.add("grupo-final");
    }

    const classeValor = item.tipo === "receita" ? "positivo" : "negativo";
    const sinal = item.tipo === "receita" ? "" : "- ";

    const nomeAutor = pegarNomeAutorExtratos(item);

    const colunaUsuario = mostrarUsuarioExtratos
      ? `<td class="usuario-extratos">${nomeAutor}</td>`
      : "";

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

      ${colunaUsuario}

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

function formatarDataCompletaExtratos(dataISO) {
  const data = converterDataExtratos(dataISO);

  if (!data) return "";

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
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
  return item.tipo === "receita" ? "⇄" : "⇄";
}

function iconeCategoriaExtratos(categoria) {
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
    ARS: "$",
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

/* ================= CSS DA COLUNA USUÁRIO ================= */
(function inserirCssUsuarioExtratos() {
  if (document.getElementById("css-usuario-extratos")) return;

  const style = document.createElement("style");
  style.id = "css-usuario-extratos";

  style.textContent = `
    .usuario-extratos {
      font-weight: 600;
      color: #2e7d32;
      white-space: nowrap;
    }

    body.tema-escuro .usuario-extratos,
    body.dark .usuario-extratos {
      color: #22c55e;
    }
  `;

  document.head.appendChild(style);
})();