console.log("CATEGORIAS.JS OK");

const CATEGORIAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

const CORES_CATEGORIAS = {
  "lazer": "#DA4175",
  "outros": "#4F595B",
  "contas pessoais": "#4B2B0A",
  "moradia": "#4B2B0A",
  "transporte": "#00CCFF",
  "alimentação": "#FF7700",
  "alimentacao": "#FF7700",
  "cartão de débito": "#E1CC0A",
  "cartao de debito": "#E1CC0A",
  "saúde": "#44B948",
  "saude": "#44B948",
  "cartão de crédito": "#7B55E3",
  "cartao de credito": "#7B55E3"
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

/* Atualiza se despesas, receitas ou moeda forem alteradas em outra aba */
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
    buscarDadoUsuarioCategorias("nicknameUsuario") ||
    buscarDadoUsuarioCategorias("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário";

  const imagem =
    buscarDadoUsuarioCategorias("avatarUsuario") ||
    buscarDadoUsuarioCategorias("fotoUsuario") ||
    buscarDadoUsuarioCategorias("imagemPerfil") ||
    buscarDadoUsuarioCategorias("fotoPerfil") ||
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
  return (
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token")
  );
}

function headersCategorias() {
  return {
    Authorization: `Bearer ${getTokenCategorias()}`
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

    return data?.data || data;
  } catch (erro) {
    console.warn("Erro na API de categorias. Usando localStorage:", erro);
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

  /*
    DESPESAS:
    Primeiro usa os dados locais da tela de despesas.
    Se não tiver dados locais, tenta buscar na API.
  */
  const despesasLocais = carregarDespesasDoStorage();

  const despesasApiResposta = await apiGetCategorias(`/expense/user?month=${mes}&year=${ano}`);
  const despesasApi = transformarEmArrayCategorias(despesasApiResposta);

  let despesasBase = [];

  if (despesasLocais.length > 0) {
    despesasBase = despesasLocais;
  } else {
    despesasBase = despesasApi;
  }

  const despesasDoMes = filtrarItensPorMesEAnoCategorias(despesasBase, mes, ano);

  /*
    RECEITAS:
    O percentual das categorias é calculado em cima do total de receitas do mês.
  */
  const receitasLocais = carregarReceitasDoStorage();

  const receitasApiResposta = await apiGetCategorias(`/income/user?month=${mes}&year=${ano}`);
  const receitasApi = transformarEmArrayCategorias(receitasApiResposta);

  let receitasBase = [];

  if (receitasLocais.length > 0) {
    receitasBase = receitasLocais;
  } else {
    receitasBase = receitasApi;
  }

  const receitasDoMes = filtrarItensPorMesEAnoCategorias(receitasBase, mes, ano);
  const totalReceitasMes = calcularTotalReceitasCategorias(receitasDoMes);

  console.log("DESPESAS USADAS EM CATEGORIAS:", despesasDoMes);
  console.log("RECEITAS USADAS EM CATEGORIAS:", receitasDoMes);
  console.log("TOTAL DE RECEITAS DO MÊS:", totalReceitasMes);

  const resumo = montarResumoCategorias(despesasDoMes);

  ultimoResumoCategorias = resumo;

  renderizarCategorias(resumo, totalReceitasMes);
}

/* ================= LOCALSTORAGE DESPESAS ================= */
function carregarDespesasDoStorage() {
  /*
    CORREÇÃO:
    Antes o código lia "despesas" e também "transacoes".
    Se a mesma despesa estivesse nas duas chaves, o valor era somado duas vezes.

    Agora:
    1. Se existir dados na chave "despesas", usa somente ela.
    2. Só usa "transacoes" se não tiver nenhuma despesa salva em "despesas".
  */

  const despesasSalvas = localStorage.getItem("despesas");

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
      console.error("Erro ao ler despesas do localStorage:", erro);
    }
  }

  const transacoesSalvas = localStorage.getItem("transacoes");

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
      console.error("Erro ao ler transações do localStorage:", erro);
    }
  }

  return [];
}

/* ================= LOCALSTORAGE RECEITAS ================= */
function carregarReceitasDoStorage() {
  /*
    Mesma regra das despesas:
    se existir a chave "receitas", usa somente ela.
    Só usa "transacoes" como reserva.
  */

  const receitasSalvas = localStorage.getItem("receitas");

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
      console.error("Erro ao ler receitas do localStorage:", erro);
    }
  }

  const transacoesSalvas = localStorage.getItem("transacoes");

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
      console.error("Erro ao ler transações do localStorage:", erro);
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

  const categoria = String(
    item.categoria ||
    item.category ||
    item.categoryName ||
    ""
  ).toLowerCase();

  const valorBruto =
    item.valor ??
    item.amount ??
    item.value ??
    item.total ??
    item.price ??
    0;

  const valorNumerico = Number(
    String(valorBruto)
      .replace("R$", "")
      .replace("US$", "")
      .replace("€", "")
      .replace("£", "")
      .replace("¥", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim()
  );

  return (
    tipo.includes("receita") ||
    tipo.includes("income") ||
    tipo.includes("entrada") ||
    tipo === "r" ||
    categoria.includes("salário") ||
    categoria.includes("salario") ||
    (valorNumerico > 0 && tipo.includes("credito") === false)
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

  const valorBruto =
    item.valor ??
    item.amount ??
    item.value ??
    item.total ??
    item.price ??
    0;

  const valorNumerico = Number(
    String(valorBruto)
      .replace("R$", "")
      .replace("US$", "")
      .replace("€", "")
      .replace("£", "")
      .replace("¥", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim()
  );

  return (
    tipo.includes("despesa") ||
    tipo.includes("expense") ||
    tipo.includes("saida") ||
    tipo.includes("saída") ||
    tipo === "d" ||
    valorNumerico < 0
  );
}

/* ================= TOTAL RECEITAS ================= */
function calcularTotalReceitasCategorias(receitas) {
  return receitas.reduce((total, item) => {
    return total + pegarValorCategoria(item);
  }, 0);
}

/* ================= FILTRAR POR MÊS ================= */
function filtrarItensPorMesEAnoCategorias(itens, mes, ano) {
  return itens.filter((item) => {
    const data = pegarDataCategoria(item);

    if (!data) return false;

    const dataConvertida = converterDataCategoria(data);

    if (!dataConvertida) return false;

    return (
      dataConvertida.getMonth() + 1 === mes &&
      dataConvertida.getFullYear() === ano
    );
  });
}

/*
  Mantive essa função com o nome antigo também,
  caso alguma parte do seu HTML/JS ainda esteja chamando ela.
*/
function filtrarDespesasPorMesEAno(despesas, mes, ano) {
  return filtrarItensPorMesEAnoCategorias(despesas, mes, ano);
}

function pegarDataCategoria(item) {
  return (
    item.dataISO ||
    item.date ||
    item.data ||
    item.createdAt ||
    item.paymentDate ||
    item.dueDate ||
    item.created_at ||
    item.updatedAt ||
    ""
  );
}

function converterDataCategoria(data) {
  if (!data) return null;

  if (data instanceof Date) {
    return data;
  }

  const texto = String(data).trim();

  /*
    Formato vindo da tela despesas:
    dataISO: 2026-05-04
  */
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    const [ano, mes, dia] = texto.substring(0, 10).split("-");
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }

  /*
    Formato exibido na tabela:
    data: 04/05/2026
  */
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

/* ================= NORMALIZAR ARRAY API ================= */
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

  if (resposta.data && typeof resposta.data === "object") {
    if (Array.isArray(resposta.data.items)) return resposta.data.items;
    if (Array.isArray(resposta.data.results)) return resposta.data.results;
    if (Array.isArray(resposta.data.expenses)) return resposta.data.expenses;
    if (Array.isArray(resposta.data.despesas)) return resposta.data.despesas;
    if (Array.isArray(resposta.data.incomes)) return resposta.data.incomes;
    if (Array.isArray(resposta.data.receitas)) return resposta.data.receitas;
    if (Array.isArray(resposta.data.revenues)) return resposta.data.revenues;
  }

  return [];
}

/* ================= RESUMO POR CATEGORIA ================= */
function montarResumoCategorias(despesas) {
  const resumo = {};

  CATEGORIAS_FIXAS.forEach((categoria) => {
    resumo[categoria] = 0;
  });

  despesas.forEach((item) => {
    const categoriaOriginal = pegarCategoria(item);
    const categoriaFinal = normalizarNomeCategoria(categoriaOriginal);
    const valor = pegarValorCategoria(item);

    if (!resumo[categoriaFinal]) {
      resumo[categoriaFinal] = 0;
    }

    resumo[categoriaFinal] += valor;
  });

  return resumo;
}

function pegarCategoria(item) {
  return (
    item.categoria ||
    item.category ||
    item.categoryName ||
    item.descriptionCategory ||
    item.typeCategory ||
    item.nameCategory ||
    item.nomeCategoria ||
    "Outros"
  );
}

function normalizarNomeCategoria(categoria) {
  const texto = removerAcentos(String(categoria || "Outros").toLowerCase().trim());

  if (texto.includes("alimentacao")) {
    return "Alimentação";
  }

  if (texto.includes("transporte")) {
    return "Transporte";
  }

  if (texto.includes("lazer")) {
    return "Lazer";
  }

  if (
    texto.includes("moradia") ||
    texto.includes("aluguel") ||
    texto.includes("casa")
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
    texto.includes("credito") ||
    texto.includes("cartao de credito")
  ) {
    return "Cartão de Crédito";
  }

  if (
    texto.includes("debito") ||
    texto.includes("cartao de debito")
  ) {
    return "Cartão de Débito";
  }

  if (
    texto.includes("conta") ||
    texto.includes("pessoal") ||
    texto.includes("pessoais")
  ) {
    return "Contas pessoais";
  }

  if (
    texto.includes("outros") ||
    texto.includes("outro")
  ) {
    return "Outros";
  }

  return "Outros";
}

function pegarValorCategoria(item) {
  const valorBruto =
    item.valor ??
    item.amount ??
    item.value ??
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
function renderizarCategorias(resumo, totalReceitasMes = 0) {
  const lista = document.getElementById("lista-categorias");
  const semDados = document.getElementById("sem-dados");
  const totalDonut = document.getElementById("total-donut");

  if (!lista) return;

  lista.innerHTML = "";

  const categorias = Object.entries(resumo)
    .map(([nome, valor]) => ({
      nome,
      valor,
      cor: pegarCorCategoria(nome)
    }))
    .sort((a, b) => b.valor - a.valor);

  const totalDespesas = categorias.reduce((soma, item) => soma + item.valor, 0);

  atualizarTotalGastoTopo(totalDespesas);

  if (totalDonut) {
    totalDonut.textContent = formatarMoedaCategorias(totalDespesas);
  }

  if (totalDespesas <= 0) {
    if (semDados) semDados.style.display = "block";
    renderizarDonutCategorias([], totalReceitasMes);
    return;
  } else {
    if (semDados) semDados.style.display = "none";
  }

  categorias.forEach((item) => {
    /*
      A porcentagem é calculada em cima do total de receitas do mês.

      Exemplo:
      Receitas: R$ 2.000,00
      Alimentação: R$ 500,00
      Porcentagem: 25%
    */
    const percentual =
      totalReceitasMes > 0 ? (item.valor / totalReceitasMes) * 100 : 0;

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

  const totalDespesas = categorias.reduce((soma, item) => soma + item.valor, 0);

  if (totalDespesas <= 0 || totalReceitasMes <= 0) {
    donut.style.background = "conic-gradient(#e5e7eb 0deg 360deg)";
    return;
  }

  let inicio = 0;
  const partes = [];

  categorias.forEach((item) => {
    if (item.valor <= 0) return;

    /*
      Cada fatia representa quanto aquela categoria consumiu
      do total de receitas do mês.
    */
    const percentual = (item.valor / totalReceitasMes) * 100;
    const grausCalculados = (item.valor / totalReceitasMes) * 360;

    /*
      Se as despesas passarem de 100% da receita,
      o gráfico não quebra.
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

  /*
    Se as despesas não consumiram toda a receita,
    o restante aparece em cinza.
  */
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
  const chave = removerAcentos(String(categoria).toLowerCase().trim());

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
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
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