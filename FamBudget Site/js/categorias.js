console.log("CATEGORIAS.JS OK");

const CATEGORIAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

const CORES_CATEGORIAS = {
  "lazer": "#4B2B0A",
  "outros": "#FF7700",
  "contas pessoais": "#DA4175",
  "transporte": "#7B55E3",
  "alimentação": "#4F595B",
  "alimentacao": "#4F595B",
  "cartão de débito": "#00CCFF",
  "cartao de debito": "#00CCFF",
  "saúde": "#44B948",
  "saude": "#44B948",
  "cartão de crédito": "#E1CC0A",
  "cartao de credito": "#E1CC0A"
};

const CATEGORIAS_FIXAS = [
  "Saúde",
  "Cartão de Crédito",
  "Alimentação",
  "Cartão de Débito",
  "Contas pessoais",
  "Transporte",
  "Lazer",
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

/* Atualiza visualmente se a moeda mudar em outra aba */
window.addEventListener("storage", (event) => {
  if (!event.key) return;

  if (event.key.includes("moedaUsuario")) {
    if (ultimoResumoCategorias) {
      renderizarCategorias(ultimoResumoCategorias);
    }
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
    console.error("Erro na API de categorias:", erro);
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

  const despesasApi = await apiGetCategorias(`/expense/user?month=${mes}&year=${ano}`);
  const despesas = transformarEmArrayCategorias(despesasApi);

  console.log("CATEGORIAS DESPESAS API:", despesas);

  const resumo = montarResumoCategorias(despesas);

  ultimoResumoCategorias = resumo;

  renderizarCategorias(resumo);
}

/* ================= NORMALIZAR ARRAY ================= */
function transformarEmArrayCategorias(resposta) {
  if (!resposta) return [];

  if (Array.isArray(resposta)) return resposta;

  if (Array.isArray(resposta.data)) return resposta.data;
  if (Array.isArray(resposta.items)) return resposta.items;
  if (Array.isArray(resposta.results)) return resposta.results;
  if (Array.isArray(resposta.expenses)) return resposta.expenses;
  if (Array.isArray(resposta.despesas)) return resposta.despesas;

  if (resposta.data && typeof resposta.data === "object") {
    if (Array.isArray(resposta.data.items)) return resposta.data.items;
    if (Array.isArray(resposta.data.results)) return resposta.data.results;
    if (Array.isArray(resposta.data.expenses)) return resposta.data.expenses;
    if (Array.isArray(resposta.data.despesas)) return resposta.data.despesas;
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
    item.category ||
    item.categoria ||
    item.categoryName ||
    item.descriptionCategory ||
    item.typeCategory ||
    item.nameCategory ||
    item.description ||
    "Outros"
  );
}

function normalizarNomeCategoria(categoria) {
  const texto = removerAcentos(String(categoria || "Outros").toLowerCase().trim());

  if (texto.includes("lazer")) return "Lazer";

  if (texto.includes("outros") || texto.includes("outro")) {
    return "Outros";
  }

  if (
    texto.includes("conta") ||
    texto.includes("pessoal") ||
    texto.includes("pessoais")
  ) {
    return "Contas pessoais";
  }

  if (texto.includes("transporte")) {
    return "Transporte";
  }

  if (
    texto.includes("alimentacao") ||
    texto.includes("mercado") ||
    texto.includes("comida") ||
    texto.includes("restaurante")
  ) {
    return "Alimentação";
  }

  if (
    texto.includes("debito") ||
    texto.includes("débito")
  ) {
    return "Cartão de Débito";
  }

  if (
    texto.includes("credito") ||
    texto.includes("crédito") ||
    texto.includes("cartao") ||
    texto.includes("cartão")
  ) {
    return "Cartão de Crédito";
  }

  if (
    texto.includes("saude") ||
    texto.includes("saúde") ||
    texto.includes("farmacia") ||
    texto.includes("farmácia")
  ) {
    return "Saúde";
  }

  return "Outros";
}

function pegarValorCategoria(item) {
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

/* ================= RENDER ================= */
function renderizarCategorias(resumo) {
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

  const total = categorias.reduce((soma, item) => soma + item.valor, 0);

  atualizarTotalGastoTopo(total);

  if (totalDonut) {
    totalDonut.textContent = formatarMoedaCategorias(total);
  }

  if (total <= 0) {
    if (semDados) semDados.style.display = "block";
    renderizarDonutCategorias([]);
  } else {
    if (semDados) semDados.style.display = "none";
  }

  categorias.forEach((item) => {
    const percentual = total > 0 ? (item.valor / total) * 100 : 0;

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
          style="width:${percentual}%; background:${item.cor};"
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

  renderizarDonutCategorias(categorias);
}

/* ================= TOTAL DO CARD VERDE ================= */
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
function renderizarDonutCategorias(categorias) {
  const donut = document.getElementById("donut-categorias");
  const legenda = document.getElementById("legenda-donut");

  if (!donut || !legenda) return;

  legenda.innerHTML = "";

  const total = categorias.reduce((soma, item) => soma + item.valor, 0);

  if (total <= 0) {
    donut.style.background = "conic-gradient(#e5e7eb 0deg 360deg)";
    return;
  }

  let inicio = 0;
  const partes = [];

  categorias.forEach((item) => {
    if (item.valor <= 0) return;

    const graus = (item.valor / total) * 360;
    const fim = inicio + graus;

    partes.push(`${item.cor} ${inicio}deg ${fim}deg`);

    inicio = fim;

    const percentual = (item.valor / total) * 100;

    const div = document.createElement("div");
    div.className = "legenda-item";

    div.innerHTML = `
      <span class="legenda-cor" style="background:${item.cor}"></span>
      <span>${item.nome}</span>
      <span class="legenda-valor">${percentual.toFixed(1).replace(".", ",")}%</span>
    `;

    legenda.appendChild(div);
  });

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

  return CORES_CATEGORIAS[chave] || "#FF7700";
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