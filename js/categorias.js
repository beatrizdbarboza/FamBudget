console.log("CATEGORIAS.JS OK - ATUALIZADO COM CATEGORY ID");

const CATEGORIAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

const CORES_CATEGORIAS = {
  "alimentacao": "#FF7700",
  "transporte": "#00CCFF",
  "lazer": "#DA4175",
  "moradia": "#4B2B0A",
  "saude": "#44B948",
  "cartao de credito": "#7B55E3",
  "cartao de debito": "#E1CC0A",
  "contas pessoais": "#4B2B0A",
  "outros": "#4F595B"
};

const CATEGORIAS_FIXAS = [
  "Alimentação",
  "Transporte",
  "Lazer",
  "Moradia",
  "Saúde",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Outros"
];

const CATEGORY_NAME_BY_ID_CATEGORIAS = {
  1: "Alimentação",
  2: "Transporte",
  3: "Lazer",
  4: "Moradia",
  5: "Saúde",
  6: "Cartão de Crédito",
  7: "Cartão de Débito",
  8: "Outros"
};

const MESES_CATEGORIAS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

let dataReferenciaCategorias = new Date();
let ultimoResumoCategorias = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuarioCategorias();
  configurarEventosCategorias();
  await carregarCategorias();
});

window.addEventListener("storage", (event) => {
  if (!event.key) return;

  if (
    event.key === "despesas" ||
    event.key === "receitas" ||
    event.key === "transacoes" ||
    event.key.includes("moedaUsuario")
  ) {
    carregarCategorias();
  }
});

/* ================= USUÁRIO ================= */

function carregarUsuarioCategorias() {
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

/* ================= DADOS POR CONTA ================= */

function getEmailUsuarioCategorias() {
  return (
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    ""
  ).toLowerCase().trim();
}

function getUserKeyCategorias() {
  const email = getEmailUsuarioCategorias();
  return `fambudget_${email || "usuario"}`;
}

function buscarDadoUsuarioCategorias(chave) {
  const userKey = getUserKeyCategorias();
  return localStorage.getItem(`${userKey}_${chave}`);
}

/* ================= TOKEN ================= */

function getTokenCategorias() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (
    !token ||
    token === "undefined" ||
    token === "null" ||
    token === "[object Object]"
  ) {
    return null;
  }

  return token;
}

function headersCategorias() {
  const token = getTokenCategorias();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

/* ================= API ================= */

async function lerRespostaCategorias(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiGetCategorias(path) {
  const token = getTokenCategorias();

  if (!token) {
    console.warn("Categorias: token não encontrado.");
    return null;
  }

  try {
    const res = await fetch(`${CATEGORIAS_API_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: headersCategorias()
    });

    const data = await lerRespostaCategorias(res);

    if (!res.ok) {
      console.warn("GET CATEGORIAS falhou:", path, res.status, data);
      return null;
    }

    return data;
  } catch (erro) {
    console.warn("Erro na API de categorias. Usando fallback local:", erro);
    return null;
  }
}

/* ================= EVENTOS ================= */

function configurarEventosCategorias() {
  const btnAnterior = document.getElementById("mes-anterior");
  const btnProximo = document.getElementById("proximo-mes");
  const btnAtualizar = document.getElementById("btn-atualizar");

  if (btnAnterior) {
    btnAnterior.addEventListener("click", async () => {
      dataReferenciaCategorias.setMonth(dataReferenciaCategorias.getMonth() - 1);
      await carregarCategorias();
    });
  }

  if (btnProximo) {
    btnProximo.addEventListener("click", async () => {
      dataReferenciaCategorias.setMonth(dataReferenciaCategorias.getMonth() + 1);
      await carregarCategorias();
    });
  }

  if (btnAtualizar) {
    btnAtualizar.addEventListener("click", async () => {
      await carregarCategorias();
    });
  }
}

/* ================= CARREGAR DADOS ================= */

async function carregarCategorias() {
  atualizarTituloMesCategorias();

  const mes = dataReferenciaCategorias.getMonth() + 1;
  const ano = dataReferenciaCategorias.getFullYear();

  const despesasApiResposta = await apiGetCategorias(`/expense/user?month=${mes}&year=${ano}`);
  const receitasApiResposta = await apiGetCategorias(`/income/user?month=${mes}&year=${ano}`);

  const despesasApi = transformarEmArrayCategorias(despesasApiResposta);
  const receitasApi = transformarEmArrayCategorias(receitasApiResposta);

  /*
    Prioridade: API.
    Só usa storage se a API não trouxer nada.
  */
  const despesasBase = despesasApi.length > 0
    ? despesasApi
    : carregarDespesasDoStorage();

  const receitasBase = receitasApi.length > 0
    ? receitasApi
    : carregarReceitasDoStorage();

  const despesasNormalizadas = despesasBase.map((item) => {
    return normalizarItemCategoria(item, "despesa");
  });

  const receitasNormalizadas = receitasBase.map((item) => {
    return normalizarItemCategoria(item, "receita");
  });

  const despesasDoMes = filtrarItensPorMesEAnoCategorias(despesasNormalizadas, mes, ano);
  const receitasDoMes = filtrarItensPorMesEAnoCategorias(receitasNormalizadas, mes, ano);

  const totalReceitasMes = calcularTotalReceitasCategorias(receitasDoMes);

  console.log("DESPESAS API CATEGORIAS:", despesasApiResposta);
  console.log("RECEITAS API CATEGORIAS:", receitasApiResposta);
  console.log("DESPESAS NORMALIZADAS CATEGORIAS:", despesasDoMes);
  console.log("RECEITAS NORMALIZADAS CATEGORIAS:", receitasDoMes);
  console.log("TOTAL RECEITAS CATEGORIAS:", totalReceitasMes);

  const resumo = montarResumoCategorias(despesasDoMes);

  ultimoResumoCategorias = resumo;

  renderizarCategorias(resumo, totalReceitasMes);
}

/* ================= NORMALIZAÇÃO ================= */

function transformarEmArrayCategorias(resposta) {
  if (!resposta) return [];

  if (Array.isArray(resposta)) return resposta;

  if (Array.isArray(resposta.data)) return resposta.data;
  if (Array.isArray(resposta.items)) return resposta.items;
  if (Array.isArray(resposta.results)) return resposta.results;

  if (Array.isArray(resposta.expenses)) return resposta.expenses;
  if (Array.isArray(resposta.despesas)) return resposta.despesas;

  if (Array.isArray(resposta.incomes)) return resposta.incomes;
  if (Array.isArray(resposta.receitas)) return resposta.receitas;
  if (Array.isArray(resposta.revenues)) return resposta.revenues;
  if (Array.isArray(resposta.revenves)) return resposta.revenves;

  if (resposta.data && typeof resposta.data === "object") {
    if (Array.isArray(resposta.data.items)) return resposta.data.items;
    if (Array.isArray(resposta.data.results)) return resposta.data.results;
    if (Array.isArray(resposta.data.expenses)) return resposta.data.expenses;
    if (Array.isArray(resposta.data.despesas)) return resposta.data.despesas;
    if (Array.isArray(resposta.data.incomes)) return resposta.data.incomes;
    if (Array.isArray(resposta.data.receitas)) return resposta.data.receitas;
    if (Array.isArray(resposta.data.revenues)) return resposta.data.revenues;
    if (Array.isArray(resposta.data.revenves)) return resposta.data.revenves;
  }

  return [];
}

function normalizarItemCategoria(item, tipoForcado = null) {
  const valor = pegarValorCategoria(item);
  const categoria = extrairCategoriaCategorias(item);
  const data = pegarDataCategoria(item);

  return {
    ...item,
    tipo: tipoForcado || detectarTipoCategoria(item),
    valor,
    categoria,
    data
  };
}

function detectarTipoCategoria(item) {
  const tipo = String(
    item.tipo ||
    item.type ||
    item.transactionType ||
    item.natureza ||
    item.kind ||
    ""
  ).toLowerCase();

  if (
    tipo.includes("receita") ||
    tipo.includes("income") ||
    tipo.includes("entrada") ||
    tipo.includes("revenue")
  ) {
    return "receita";
  }

  return "despesa";
}

function pegarTextoCampoCategorias(campo) {
  if (!campo) return "";

  if (typeof campo === "string") return campo;
  if (typeof campo === "number") return String(campo);

  if (typeof campo === "object") {
    return (
      campo.name ||
      campo.nome ||
      campo.description ||
      campo.descricao ||
      campo.title ||
      campo.titulo ||
      campo.type ||
      campo.tipo ||
      campo.category ||
      campo.categoria ||
      campo.categoryName ||
      campo.nomeCategoria ||
      ""
    );
  }

  return "";
}

function extrairCategoriaCategorias(item) {
  /*
    Correção principal:
    A API pode mandar categoryId ou category: 2.
    Então convertemos 2 para Transporte, 4 para Moradia, etc.
  */
  const idCategoria =
    item.categoryId ||
    item.category_id ||
    item.idCategory ||
    item.categoriaId ||
    item.category?.id ||
    item.category?.categoryId ||
    item.category ||
    null;

  if (
    idCategoria !== null &&
    idCategoria !== undefined &&
    !Number.isNaN(Number(idCategoria)) &&
    CATEGORY_NAME_BY_ID_CATEGORIAS[Number(idCategoria)]
  ) {
    return CATEGORY_NAME_BY_ID_CATEGORIAS[Number(idCategoria)];
  }

  const possiveis = [
    item.categoryName,
    item.nomeCategoria,
    item.descriptionCategory,
    item.typeCategory,
    item.nameCategory,
    item.categoria,

    item.category?.name,
    item.category?.nome,
    item.category?.description,
    item.category?.descricao,
    item.category?.title,

    item.typeExpense?.name,
    item.typeExpense?.nome,
    item.typeExpense?.description,
    item.typeExpense?.descricao,
    item.typeExpense?.title,

    item.expenseType?.name,
    item.expenseType?.nome,
    item.expenseType?.description,
    item.expenseType?.descricao,

    item.typeIncome?.name,
    item.typeIncome?.nome,
    item.typeIncome?.description,
    item.typeIncome?.descricao,

    item.incomeType?.name,
    item.incomeType?.nome,
    item.incomeType?.description,
    item.incomeType?.descricao
  ];

  for (const campo of possiveis) {
    const texto = pegarTextoCampoCategorias(campo).trim();

    if (
      texto &&
      texto !== "[object Object]" &&
      !["expense", "income", "despesa", "receita"].includes(texto.toLowerCase())
    ) {
      return normalizarNomeCategoria(texto);
    }
  }

  return "Outros";
}

/* ================= STORAGE DESPESAS ================= */

function carregarDespesasDoStorage() {
  const despesasSalvas =
    sessionStorage.getItem("despesas") ||
    localStorage.getItem("despesas");

  if (despesasSalvas) {
    try {
      const despesasParseadas = JSON.parse(despesasSalvas);

      if (Array.isArray(despesasParseadas) && despesasParseadas.length > 0) {
        return despesasParseadas.map((item) => ({
          ...item,
          origem: "despesas"
        }));
      }
    } catch (erro) {
      console.error("Erro ao ler despesas do storage:", erro);
    }
  }

  const transacoesSalvas =
    sessionStorage.getItem("transacoes") ||
    localStorage.getItem("transacoes");

  if (transacoesSalvas) {
    try {
      const transacoesParseadas = JSON.parse(transacoesSalvas);

      if (Array.isArray(transacoesParseadas)) {
        return transacoesParseadas
          .filter((item) => itemEhDespesaCategorias(item))
          .map((item) => ({
            ...item,
            origem: "transacoes"
          }));
      }
    } catch (erro) {
      console.error("Erro ao ler transações do storage:", erro);
    }
  }

  return [];
}

/* ================= STORAGE RECEITAS ================= */

function carregarReceitasDoStorage() {
  const receitasSalvas =
    sessionStorage.getItem("receitas") ||
    localStorage.getItem("receitas");

  if (receitasSalvas) {
    try {
      const receitasParseadas = JSON.parse(receitasSalvas);

      if (Array.isArray(receitasParseadas) && receitasParseadas.length > 0) {
        return receitasParseadas.map((item) => ({
          ...item,
          origem: "receitas"
        }));
      }
    } catch (erro) {
      console.error("Erro ao ler receitas do storage:", erro);
    }
  }

  const transacoesSalvas =
    sessionStorage.getItem("transacoes") ||
    localStorage.getItem("transacoes");

  if (transacoesSalvas) {
    try {
      const transacoesParseadas = JSON.parse(transacoesSalvas);

      if (Array.isArray(transacoesParseadas)) {
        return transacoesParseadas
          .filter((item) => itemEhReceitaCategorias(item))
          .map((item) => ({
            ...item,
            origem: "transacoes"
          }));
      }
    } catch (erro) {
      console.error("Erro ao ler transações do storage:", erro);
    }
  }

  return [];
}

/* ================= IDENTIFICAR TIPO ================= */

function itemEhReceitaCategorias(item) {
  const tipo = String(
    item.tipo ||
    item.type ||
    item.transactionType ||
    item.natureza ||
    item.kind ||
    ""
  ).toLowerCase();

  return (
    tipo.includes("receita") ||
    tipo.includes("income") ||
    tipo.includes("entrada") ||
    tipo.includes("revenue")
  );
}

function itemEhDespesaCategorias(item) {
  const tipo = String(
    item.tipo ||
    item.type ||
    item.transactionType ||
    item.natureza ||
    item.kind ||
    ""
  ).toLowerCase();

  return (
    tipo.includes("despesa") ||
    tipo.includes("expense") ||
    tipo.includes("saida") ||
    tipo.includes("saída") ||
    tipo === "d"
  );
}

/* ================= VALOR ================= */

function pegarValorCategoria(item) {
  const valorBruto =
    item.valor ??
    item.amount ??
    item.value ??
    item.total ??
    item.price ??
    item.totalValue ??
    item.installmentValue ??
    0;

  if (typeof valorBruto === "number") {
    return Math.abs(valorBruto);
  }

  let texto = String(valorBruto)
    .replace("R$", "")
    .replace("US$", "")
    .replace("€", "")
    .replace("£", "")
    .replace("¥", "")
    .replace(/\s/g, "")
    .trim();

  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (texto.includes(",")) {
    texto = texto.replace(",", ".");
  }

  return Math.abs(Number(texto) || 0);
}

function calcularTotalReceitasCategorias(receitas) {
  return receitas.reduce((total, item) => {
    return total + pegarValorCategoria(item);
  }, 0);
}

/* ================= DATA ================= */

function pegarDataCategoria(item) {
  return (
    item.dataISO ||
    item.dateInitial ||
    item.date ||
    item.data ||
    item.createdAt ||
    item.paymentDate ||
    item.dueDate ||
    item.created_at ||
    item.updatedAt ||
    item.transactionDate ||
    item.expenseDate ||
    item.incomeDate ||
    ""
  );
}

function converterDataCategoria(data) {
  if (!data) return null;

  if (data instanceof Date) {
    return data;
  }

  const texto = String(data).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    const [ano, mes, dia] = texto.substring(0, 10).split("-");
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split("/");
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }

  const dataConvertida = new Date(texto);

  if (isNaN(dataConvertida.getTime())) {
    return null;
  }

  return dataConvertida;
}

function filtrarItensPorMesEAnoCategorias(itens, mes, ano) {
  return itens.filter((item) => {
    const data = converterDataCategoria(pegarDataCategoria(item));

    if (!data) return false;

    return (
      data.getMonth() + 1 === mes &&
      data.getFullYear() === ano
    );
  });
}

function filtrarDespesasPorMesEAno(despesas, mes, ano) {
  return filtrarItensPorMesEAnoCategorias(despesas, mes, ano);
}

/* ================= RESUMO POR CATEGORIA ================= */

function montarResumoCategorias(despesas) {
  const resumo = {};

  CATEGORIAS_FIXAS.forEach((categoria) => {
    resumo[categoria] = 0;
  });

  despesas.forEach((item) => {
    const categoriaFinal = normalizarNomeCategoria(
      item.categoria || extrairCategoriaCategorias(item)
    );

    const valor = pegarValorCategoria(item);

    if (!resumo[categoriaFinal]) {
      resumo[categoriaFinal] = 0;
    }

    resumo[categoriaFinal] += valor;
  });

  return resumo;
}

function normalizarNomeCategoria(categoria) {
  const textoOriginal = String(categoria || "Outros").trim();

  if (
    !Number.isNaN(Number(textoOriginal)) &&
    CATEGORY_NAME_BY_ID_CATEGORIAS[Number(textoOriginal)]
  ) {
    return CATEGORY_NAME_BY_ID_CATEGORIAS[Number(textoOriginal)];
  }

  const texto = removerAcentos(textoOriginal.toLowerCase());

  if (texto.includes("alimentacao")) return "Alimentação";
  if (texto.includes("transporte")) return "Transporte";
  if (texto.includes("lazer")) return "Lazer";

  if (
    texto.includes("moradia") ||
    texto.includes("aluguel") ||
    texto.includes("casa") ||
    texto.includes("agua") ||
    texto.includes("luz")
  ) {
    return "Moradia";
  }

  if (
    texto.includes("saude") ||
    texto.includes("farmacia") ||
    texto.includes("hospital") ||
    texto.includes("medico")
  ) {
    return "Saúde";
  }

  if (
    texto.includes("cartao de credito") ||
    texto.includes("credito")
  ) {
    return "Cartão de Crédito";
  }

  if (
    texto.includes("cartao de debito") ||
    texto.includes("debito")
  ) {
    return "Cartão de Débito";
  }

  if (
    texto.includes("contas pessoais") ||
    texto.includes("conta pessoal") ||
    texto.includes("pessoal") ||
    texto.includes("pessoais")
  ) {
    return "Contas pessoais";
  }

  if (
    texto.includes("outro") ||
    texto.includes("outros")
  ) {
    return "Outros";
  }

  return "Outros";
}

/* ================= RENDER ================= */

function renderizarCategorias(resumo, totalReceitasMes = 0) {
  const lista = document.getElementById("lista-categorias");
  const semDados = document.getElementById("sem-dados");
  const totalDonut = document.getElementById("total-donut");

  if (!lista) return;

  lista.innerHTML = "";

  /*
    Aqui NÃO filtramos valor > 0.
    Assim todas as categorias aparecem na tela,
    mesmo que estejam com R$ 0,00.
  */
  const categorias = Object.entries(resumo)
    .map(([nome, valor]) => ({
      nome,
      valor,
      cor: pegarCorCategoria(nome)
    }))
    .sort((a, b) => b.valor - a.valor);

  const totalDespesas = categorias.reduce((soma, item) => {
    return soma + item.valor;
  }, 0);

  atualizarTotalGastoTopo(totalDespesas);

  if (totalDonut) {
    totalDonut.textContent = formatarMoedaCategorias(totalDespesas);
  }

  if (totalDespesas <= 0) {
    if (semDados) semDados.style.display = "block";
  } else {
    if (semDados) semDados.style.display = "none";
  }

  categorias.forEach((item) => {
    /*
      Percentual referente ao TOTAL DE RECEITAS do mês.

      Exemplo:
      Receitas: R$ 1.500,00
      Moradia: R$ 250,00
      Percentual: 16,7%
    */
    const percentual = totalReceitasMes > 0
      ? (item.valor / totalReceitasMes) * 100
      : 0;

    /*
      A barra visual fica limitada a 100% para não quebrar o layout,
      mas o texto mostra o percentual real.
    */
    const larguraBarra = Math.min(percentual, 100);

    const div = document.createElement("div");
    div.className = "categoria-item";

    div.innerHTML = `
      <div class="categoria-nome">
        <span class="categoria-bolinha" style="background:${item.cor}"></span>
        <span>${item.nome}</span>
      </div>

      <div class="barra-container">
        <div 
          class="barra-preenchida" 
          style="width:${larguraBarra}%; background:${item.cor};"
        ></div>
      </div>

      <div class="categoria-percentual">
        ${percentual.toFixed(1).replace(".", ",")}%
      </div>

      <div class="categoria-valor">
        ${formatarMoedaCategorias(item.valor)}
      </div>
    `;

    lista.appendChild(div);
  });

  renderizarDonutCategorias(categorias, totalReceitasMes);
}

/* ================= TOTAL DO CARD ================= */

function atualizarTotalGastoTopo(total) {
  const valorFormatado = formatarMoedaCategorias(total);

  const totalPorId = document.getElementById("total-gasto-mes");

  if (totalPorId) {
    totalPorId.textContent = valorFormatado;
  }

  const totalNoCard = document.querySelector(".resumo-categorias h2");

  if (totalNoCard) {
    totalNoCard.textContent = valorFormatado;
  }

  console.log("TOTAL CATEGORIAS FORMATADO:", valorFormatado);
}

/* ================= DONUT ================= */

function renderizarDonutCategorias(categorias, totalReceitasMes = 0) {
  const donut = document.getElementById("donut-categorias");
  const legenda = document.getElementById("legenda-donut");

  if (!donut || !legenda) return;

  legenda.innerHTML = "";

  const totalDespesas = categorias.reduce((soma, item) => {
    return soma + item.valor;
  }, 0);

  if (totalDespesas <= 0 || totalReceitasMes <= 0) {
    donut.style.background = "conic-gradient(#e5e7eb 0deg 360deg)";

    categorias.forEach((item) => {
      const div = document.createElement("div");
      div.className = "legenda-item";

      div.innerHTML = `
        <span class="legenda-cor" style="background:${item.cor}"></span>
        <span>${item.nome}</span>
        <span class="legenda-valor">0,0%</span>
      `;

      legenda.appendChild(div);
    });

    return;
  }

  let inicio = 0;
  const partes = [];

  categorias.forEach((item) => {
    if (item.valor <= 0) {
      const div = document.createElement("div");
      div.className = "legenda-item";

      div.innerHTML = `
        <span class="legenda-cor" style="background:${item.cor}"></span>
        <span>${item.nome}</span>
        <span class="legenda-valor">0,0%</span>
      `;

      legenda.appendChild(div);
      return;
    }

    /*
      Cada fatia representa quanto aquela categoria consumiu
      do total de receitas do mês.
    */
    const percentual = (item.valor / totalReceitasMes) * 100;
    const grausCalculados = (item.valor / totalReceitasMes) * 360;

    /*
      Evita quebrar o gráfico caso as despesas passem de 100% da receita.
    */
    const graus = Math.min(grausCalculados, 360 - inicio);

    if (graus <= 0) return;

    const fim = inicio + graus;

    partes.push(`${item.cor} ${inicio}deg ${fim}deg`);

    inicio = fim;

    const div = document.createElement("div");
    div.className = "legenda-item";

    div.innerHTML = `
      <span class="legenda-cor" style="background:${item.cor}"></span>
      <span>${item.nome}</span>
      <span class="legenda-valor">${percentual.toFixed(1).replace(".", ",")}%</span>
    `;

    legenda.appendChild(div);
  });

  if (inicio < 360) {
    partes.push(`#e5e7eb ${inicio}deg 360deg`);
  }

  donut.style.background = `conic-gradient(${partes.join(", ")})`;
}

/* ================= MÊS ================= */

function atualizarTituloMesCategorias() {
  const mesAtual = document.getElementById("mes-atual");

  if (!mesAtual) return;

  const mes = MESES_CATEGORIAS[dataReferenciaCategorias.getMonth()];
  const ano = dataReferenciaCategorias.getFullYear();

  mesAtual.textContent = `${mes} ${ano}`;
}

/* ================= COR ================= */

function pegarCorCategoria(categoria) {
  const chave = removerAcentos(String(categoria || "").toLowerCase().trim());

  return CORES_CATEGORIAS[chave] || "#4F595B";
}

function removerAcentos(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* ================= MOEDA ================= */

function obterMoedaCategorias() {
  const email =
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    "usuario";

  const userKey = `fambudget_${String(email).toLowerCase().trim()}`;

  return (
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    sessionStorage.getItem("moedaUsuario") ||
    localStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoedaCategorias(valor) {
  const moeda = obterMoedaCategorias();

  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: moeda
    });
  } catch (erro) {
    console.warn("Moeda inválida em categorias:", moeda, erro);

    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}