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

let filtroCategoriaExtratos = "todas";
let filtroValorMinExtratos = "";
let filtroValorMaxExtratos = "";

let mostrarUsuarioExtratos = false;
let usuarioPertenceFamiliaExtratos = false;
let membrosFamiliaExtratos = [];
let categoriasExtratos = [];

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuarioExtratos();
  configurarEventosExtratos();
  configurarLogoutExtratos();
  atualizarCabecalhoMoedaExtratos();

  await atualizarEstadoFamiliaExtratos();
  await carregarCategoriasExtratos();

  atualizarCabecalhoUsuarioExtratos();

  await carregarExtratos();
});

window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  if (
    event.key.includes("moedaUsuario") ||
    event.key === "receitasExcluidas" ||
    event.key === "despesasExcluidas" ||
    event.key.includes("_receitasExcluidas") ||
    event.key.includes("_despesasExcluidas") ||
    event.key.includes("_despesasEditadasLocalmente") ||
    event.key === "receitasAtualizadasEm" ||
    event.key === "despesasAtualizadasEm" ||
    event.key === "dadosFinanceirosAtualizadosEm" ||
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia"
  ) {
    atualizarCabecalhoMoedaExtratos();

    await atualizarEstadoFamiliaExtratos();
    await carregarCategoriasExtratos();

    atualizarCabecalhoUsuarioExtratos();

    await carregarExtratos();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  await atualizarEstadoFamiliaExtratos();
  await carregarCategoriasExtratos();

  atualizarCabecalhoUsuarioExtratos();

  await carregarExtratos();
});

window.addEventListener("dadosFinanceirosAtualizados", async () => {
  await carregarCategoriasExtratos();
  await carregarExtratos();
});

window.addEventListener("focus", async () => {
  await carregarExtratos();
});

function getTokenExtratos() {
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

function getPayloadTokenExtratos() {
  const token = getTokenExtratos();

  if (!token) return {};

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function getEmailUsuarioExtratos() {
  const payload = getPayloadTokenExtratos();

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

function getIdUsuarioExtratos() {
  const payload = getPayloadTokenExtratos();

  return (
    payload.user_id ||
    payload.userId ||
    payload.id ||
    payload.sub ||
    null
  );
}

function getUserKeyExtratos(email = null) {
  const emailFinal = email || getEmailUsuarioExtratos();

  return `fambudget_${String(emailFinal || "usuario").toLowerCase().trim()}`;
}

function getChaveUsuarioExtratos(chave) {
  return `${getUserKeyExtratos()}_${chave}`;
}

function formatarNicknameExtratos(nome) {
  if (!nome) return "";

  const texto = String(nome).trim();

  if (!texto) return "";

  const primeiroNome = texto.split(" ")[0];

  return primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
}

function getNicknameUsuarioExtratos() {
  const email = getEmailUsuarioExtratos();

  return formatarNicknameExtratos(
    localStorage.getItem(`${getUserKeyExtratos(email)}_nicknameUsuario`) ||
    sessionStorage.getItem(`${getUserKeyExtratos(email)}_nicknameUsuario`) ||
    localStorage.getItem(`${getUserKeyExtratos(email)}_nomeUsuario`) ||
    sessionStorage.getItem(`${getUserKeyExtratos(email)}_nomeUsuario`) ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário"
  );
}

function carregarUsuarioExtratos() {
  const nome = getNicknameUsuarioExtratos();
  const email = getEmailUsuarioExtratos();
  const userKey = getUserKeyExtratos(email);

  const imagem =
    localStorage.getItem(`${userKey}_avatarUsuario`) ||
    localStorage.getItem(`${userKey}_fotoUsuario`) ||
    localStorage.getItem(`${userKey}_imagemPerfil`) ||
    localStorage.getItem(`${userKey}_fotoPerfil`) ||
    sessionStorage.getItem("avatarUsuario") ||
    localStorage.getItem("avatarUsuario") ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) {
    nomeUsuario.textContent = nome;
  }

  if (avatar) {
    avatar.innerHTML = "";
    avatar.textContent = "";

    avatar.style.width = "35px";
    avatar.style.height = "35px";
    avatar.style.minWidth = "35px";
    avatar.style.maxWidth = "35px";
    avatar.style.minHeight = "35px";
    avatar.style.maxHeight = "35px";
    avatar.style.borderRadius = "50%";
    avatar.style.overflow = "hidden";
    avatar.style.display = "flex";
    avatar.style.alignItems = "center";
    avatar.style.justifyContent = "center";
    avatar.style.backgroundSize = "cover";
    avatar.style.backgroundPosition = "center";
    avatar.style.backgroundRepeat = "no-repeat";

    if (imagem) {
      avatar.style.backgroundImage = `url("${imagem}")`;
    } else {
      avatar.style.backgroundImage = "";
      avatar.textContent = String(nome || "U").charAt(0).toUpperCase();
    }
  }
}

function headersExtratos(json = false) {
  const token = getTokenExtratos();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function lerRespostaExtratos(res) {
  const text = await res.text();

  if (!text) return null;

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
      headers: headersExtratos(false)
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

function transformarEmArrayExtratos(resposta) {
  if (!resposta) return [];

  if (Array.isArray(resposta)) return resposta;

  const possiveisListas = [
    resposta.data,
    resposta.items,
    resposta.results,
    resposta.content,
    resposta.expenses,
    resposta.incomes,
    resposta.revenues,
    resposta.receitas,
    resposta.despesas,
    resposta.userExpenses,
    resposta.user_expenses,
    resposta.userIncomes,
    resposta.user_incomes,
    resposta.categories,
    resposta.categorias,
    resposta.default,
    resposta.defaults,
    resposta.user,
    resposta.usuario,
    resposta.list,
    resposta.lista,

    resposta.family?.categories,
    resposta.family?.categorias,
    resposta.familia?.categories,
    resposta.familia?.categorias,

    resposta.data?.items,
    resposta.data?.results,
    resposta.data?.content,
    resposta.data?.expenses,
    resposta.data?.incomes,
    resposta.data?.revenues,
    resposta.data?.receitas,
    resposta.data?.despesas,
    resposta.data?.userExpenses,
    resposta.data?.user_expenses,
    resposta.data?.userIncomes,
    resposta.data?.user_incomes,
    resposta.data?.categories,
    resposta.data?.categorias,
    resposta.data?.default,
    resposta.data?.defaults,
    resposta.data?.user,
    resposta.data?.usuario,
    resposta.data?.list,
    resposta.data?.lista,

    resposta.data?.family?.categories,
    resposta.data?.family?.categorias,
    resposta.data?.familia?.categories,
    resposta.data?.familia?.categorias
  ];

  for (const lista of possiveisListas) {
    if (Array.isArray(lista)) return lista;
  }

  return [];
}

async function atualizarEstadoFamiliaExtratos() {
  usuarioPertenceFamiliaExtratos = await usuarioEstaEmFamiliaExtratos();
  mostrarUsuarioExtratos = usuarioPertenceFamiliaExtratos;

  if (usuarioPertenceFamiliaExtratos) {
    membrosFamiliaExtratos = await carregarMembrosFamiliaExtratos();
  } else {
    membrosFamiliaExtratos = [];
  }
}

function getMembersFromResponseExtratos(data) {
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

async function usuarioEstaEmFamiliaExtratos() {
  const token = getTokenExtratos();

  if (!token) return false;

  try {
    const resposta = await fetch(`${EXTRATOS_API_URL}/family`, {
      method: "GET",
      cache: "no-store",
      headers: headersExtratos(false)
    });

    if (resposta.status === 404) return false;
    if (!resposta.ok) return false;

    const text = await resposta.text();
    const data = text ? JSON.parse(text) : null;
    const membros = getMembersFromResponseExtratos(data);

    localStorage.setItem("familiaAtual", JSON.stringify(data || {}));
    localStorage.setItem("membrosFamilia", JSON.stringify(membros || []));

    return membros.length > 0 || Boolean(data);
  } catch (erro) {
    console.warn("Erro ao verificar família em extratos:", erro);
    return false;
  }
}

async function carregarMembrosFamiliaExtratos() {
  const token = getTokenExtratos();

  if (!token) return [];

  try {
    const resposta = await fetch(`${EXTRATOS_API_URL}/family`, {
      method: "GET",
      cache: "no-store",
      headers: headersExtratos(false)
    });

    if (!resposta.ok) return [];

    const text = await resposta.text();
    const data = text ? JSON.parse(text) : null;
    const membros = getMembersFromResponseExtratos(data);

    localStorage.setItem("familiaAtual", JSON.stringify(data || {}));
    localStorage.setItem("membrosFamilia", JSON.stringify(membros || []));

    return membros;
  } catch (erro) {
    console.warn("Erro ao carregar membros da família em extratos:", erro);
    return [];
  }
}

async function obterFamilyIdExtratos() {
  const resposta = await apiGetExtratos("/family");

  if (!resposta) return null;

  return (
    resposta?.id ||
    resposta?.familyId ||
    resposta?.family_id ||
    resposta?.familiaId ||
    resposta?.familia_id ||
    resposta?.family?.id ||
    resposta?.familia?.id ||
    resposta?.data?.id ||
    resposta?.data?.familyId ||
    null
  );
}

async function carregarCategoriasExtratos() {
  const resposta = await apiGetExtratos("/category/user");
  const lista = transformarEmArrayExtratos(resposta);

  categoriasExtratos = lista
    .map((item) => {
      const id =
        item?.id ||
        item?.categoryId ||
        item?.category_id ||
        item?.categoriaId ||
        item?.categoria_id ||
        item?.idCategory ||
        item?.id_category ||
        item?.category?.id ||
        item?.categoria?.id ||
        null;

      const nome =
        item?.name ||
        item?.nome ||
        item?.description ||
        item?.descricao ||
        item?.categoryName ||
        item?.category_name ||
        item?.category?.name ||
        item?.category?.nome ||
        item?.category?.description ||
        item?.category?.descricao ||
        item?.categoria?.name ||
        item?.categoria?.nome ||
        item?.categoria?.description ||
        item?.categoria?.descricao ||
        "";

      return {
        id: Number(id),
        nome: String(nome || "").trim()
      };
    })
    .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.nome);
}

function configurarLogoutExtratos() {
  const logoutBtn = document.getElementById("logout-btn");

  if (!logoutBtn) return;

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

function configurarEventosExtratos() {
  document.querySelectorAll("[data-link]").forEach((item) => {
    item.addEventListener("click", () => {
      const link = item.dataset.link;
      if (link) window.location.href = link;
    });
  });

  const inputBusca =
    document.getElementById("inputBuscaExtratos") ||
    document.getElementById("inputBuscaTransacoes") ||
    document.querySelector(".buscar");

  if (inputBusca) {
    inputBusca.addEventListener("input", () => {
      buscaAtual = inputBusca.value.trim();
      paginaAtual = 1;
      aplicarFiltrosExtratos();
    });
  }

  const btnMesAnterior =
    document.getElementById("mes-anterior") ||
    document.getElementById("mesAnterior");

  const btnProximoMes =
    document.getElementById("proximo-mes") ||
    document.getElementById("proximoMes");

  if (btnMesAnterior) {
    btnMesAnterior.addEventListener("click", async () => {
      dataReferenciaExtratos.setMonth(dataReferenciaExtratos.getMonth() - 1);
      paginaAtual = 1;
      atualizarTextoMesExtratos();
      await carregarExtratos();
    });
  }

  if (btnProximoMes) {
    btnProximoMes.addEventListener("click", async () => {
      dataReferenciaExtratos.setMonth(dataReferenciaExtratos.getMonth() + 1);
      paginaAtual = 1;
      atualizarTextoMesExtratos();
      await carregarExtratos();
    });
  }

  document.querySelectorAll("[data-filtro]").forEach((btn) => {
    btn.addEventListener("click", () => {
      filtroAtual = btn.dataset.filtro || "todas";
      paginaAtual = 1;

      document.querySelectorAll("[data-filtro]").forEach((item) => {
        item.classList.toggle("ativa", item === btn);
      });

      aplicarFiltrosExtratos();
    });
  });

  const btnOrdenar = document.getElementById("btnOrdenar") || document.querySelector(".btn-ordenar");

  if (btnOrdenar) {
    btnOrdenar.addEventListener("click", () => {
      ordemDecrescente = !ordemDecrescente;
      aplicarFiltrosExtratos();
    });
  }
}

function atualizarCabecalhoMoedaExtratos() {
  atualizarTextoMesExtratos();
}

function atualizarCabecalhoUsuarioExtratos() {
  const cabecalho =
    document.getElementById("cabecalho-extratos") ||
    document.querySelector(".tabela-extratos thead tr");

  if (!cabecalho) return;

  cabecalho.innerHTML = `
    <th>Data</th>
    <th>Descrição</th>
    <th>Categoria</th>
    <th>Tipo</th>
    <th>Valor</th>
    ${mostrarUsuarioExtratos ? "<th>Usuário</th>" : ""}
  `;
}

function atualizarTextoMesExtratos() {
  const textoMes =
    document.getElementById("mes-atual") ||
    document.getElementById("mesAtual");

  if (!textoMes) return;

  textoMes.textContent = `${MESES_EXTRATOS[dataReferenciaExtratos.getMonth()]} ${dataReferenciaExtratos.getFullYear()}`;
}

async function carregarExtratos() {
  const mes = dataReferenciaExtratos.getMonth() + 1;
  const ano = dataReferenciaExtratos.getFullYear();

  let receitasAPI = [];
  let despesasAPI = [];

  if (usuarioPertenceFamiliaExtratos) {
    const familyId = await obterFamilyIdExtratos();

    if (familyId) {
      const receitasFamilia = await apiGetExtratos(`/income/family/${familyId}?month=${mes}&year=${ano}`);
      const despesasFamilia = await apiGetExtratos(`/expense/family/${familyId}?month=${mes}&year=${ano}`);

      receitasAPI = transformarEmArrayExtratos(receitasFamilia);
      despesasAPI = transformarEmArrayExtratos(despesasFamilia);
    }

    if (!receitasAPI.length) {
      const receitasUsuario = await apiGetExtratos(`/income/user?month=${mes}&year=${ano}`);
      receitasAPI = transformarEmArrayExtratos(receitasUsuario);
    }

    if (!despesasAPI.length) {
      const despesasUsuario = await apiGetExtratos(`/expense/user?month=${mes}&year=${ano}`);

      const despesasFixasUsuario = await apiGetExtratos(`/expense/user/type/1?month=${mes}&year=${ano}`);

      despesasAPI = removerDuplicadasExtratos([
        ...transformarEmArrayExtratos(despesasUsuario),
        ...transformarEmArrayExtratos(despesasFixasUsuario)
      ]);
    }
  } else {
    const receitasUsuario = await apiGetExtratos(`/income/user?month=${mes}&year=${ano}`);
    const despesasUsuario = await apiGetExtratos(`/expense/user?month=${mes}&year=${ano}`);

    receitasAPI = transformarEmArrayExtratos(receitasUsuario);
    despesasAPI = transformarEmArrayExtratos(despesasUsuario);
  }

  const receitasNormalizadas = receitasAPI
    .map((item, index) => normalizarTransacaoExtratos(item, "receita", index))
    .filter((item) => !transacaoFoiExcluidaExtratos(item));

  const despesasNormalizadas = despesasAPI
    .map((item, index) => normalizarTransacaoExtratos(item, "despesa", index))
    .filter((item) => !transacaoFoiExcluidaExtratos(item));

  ultimasTransacoes = removerDuplicadasExtratos([
    ...receitasNormalizadas,
    ...despesasNormalizadas
  ]);

  aplicarFiltrosExtratos();
}

function normalizarTransacaoExtratos(item, tipoMovimento, index = 0) {
  const categoriaId = pegarCategoriaIdExtratos(item);
  const categoriaPorId = pegarNomeCategoriaPorIdExtratos(categoriaId);

  const valor = extrairValorExtratos(item);

  const data = normalizarDataISOExtratos(
    item?.dateInitial ||
    item?.date ||
    item?.data ||
    item?.createdAt ||
    item?.created_at ||
    item?.dataTransacao ||
    ""
  );

  const descricao =
    item?.description ||
    item?.descricao ||
    item?.name ||
    item?.nome ||
    item?.title ||
    (tipoMovimento === "receita" ? "Receita" : "Despesa");

  const categoria =
    categoriaPorId ||
    item?.categoryName ||
    item?.categoriaNome ||
    item?.nomeCategoria ||
    item?.category?.name ||
    item?.category?.nome ||
    item?.categoria?.name ||
    item?.categoria?.nome ||
    item?.category ||
    item?.categoria ||
    "Outros";

  return {
    ...item,

    id:
      item?.id ||
      item?.incomeId ||
      item?.income_id ||
      item?.expenseId ||
      item?.expense_id ||
      `${tipoMovimento}-${index}`,

    tipoMovimento,
    tipo: tipoMovimento,

    descricao: String(descricao),
    categoria: String(categoria),
    categoriaId,

    valor,
    data,

    autorId:
      item?.userId ||
      item?.user_id ||
      item?.autorId ||
      item?.usuarioId ||
      item?.usuario_id ||
      item?.createdBy?.id ||
      item?.user?.id ||
      item?.usuario?.id ||
      null,

    autorEmail:
      item?.userEmail ||
      item?.user_email ||
      item?.autorEmail ||
      item?.emailUsuario ||
      item?.email_usuario ||
      item?.createdBy?.email ||
      item?.user?.email ||
      item?.usuario?.email ||
      "",

    autorNickname:
      item?.nicknameUsuario ||
      item?.nomeUsuario ||
      item?.autorNickname ||
      item?.createdBy?.nickname ||
      item?.createdBy?.name ||
      item?.user?.nickname ||
      item?.user?.name ||
      item?.usuario?.nickname ||
      item?.usuario?.name ||
      ""
  };
}

function aplicarFiltrosExtratos() {
  const anoMesAtual = pegarAnoMesDataExtratos(dataReferenciaExtratos);
  const busca = normalizarTextoExtratos(buscaAtual);

  let lista = ultimasTransacoes.filter((item) => {
    const mesmoMes = pegarAnoMesExtratos(item.data) === anoMesAtual;

    if (!mesmoMes) return false;

    if (filtroAtual === "receitas" || filtroAtual === "receita") {
      if (item.tipoMovimento !== "receita") return false;
    }

    if (filtroAtual === "despesas" || filtroAtual === "despesa") {
      if (item.tipoMovimento !== "despesa") return false;
    }

    if (filtroCategoriaExtratos !== "todas") {
      if (normalizarTextoExtratos(item.categoria) !== normalizarTextoExtratos(filtroCategoriaExtratos)) {
        return false;
      }
    }

    const valor = Number(item.valor || 0);

    if (filtroValorMinExtratos !== "" && valor < Number(filtroValorMinExtratos)) return false;
    if (filtroValorMaxExtratos !== "" && valor > Number(filtroValorMaxExtratos)) return false;

    if (busca) {
      const texto = normalizarTextoExtratos(
        `${item.descricao} ${item.categoria} ${item.tipoMovimento} ${pegarNomeAutorExtratos(item)}`
      );

      if (!texto.includes(busca)) return false;
    }

    return true;
  });

  lista.sort((a, b) => {
    const dataA = converterDataExtratos(a.data)?.getTime() || 0;
    const dataB = converterDataExtratos(b.data)?.getTime() || 0;

    return ordemDecrescente ? dataB - dataA : dataA - dataB;
  });

  ultimasTransacoesFiltradas = lista;

  renderizarExtratos(lista);
  atualizarTotaisExtratos(lista);
}

function renderizarExtratos(lista = []) {
  const tbody =
    document.getElementById("lista-extratos") ||
    document.getElementById("lista-transacoes") ||
    document.querySelector(".tabela-extratos tbody");

  const semDados = document.getElementById("sem-dados");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista.length) {
    if (semDados) semDados.style.display = "block";
    return;
  }

  if (semDados) semDados.style.display = "none";

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const pagina = lista.slice(inicio, fim);

  pagina.forEach((item) => {
    const tr = document.createElement("tr");

    const ehReceita = item.tipoMovimento === "receita";

    tr.innerHTML = `
      <td>${formatarDataBRExtratos(item.data)}</td>

      <td>
        <div class="descricao-cell">
          <span class="icone-item ${ehReceita ? "icone-receita" : "icone-despesa"}">
            ${ehReceita ? "↑" : "↓"}
          </span>
          <span>${escapeHTMLExtratos(item.descricao)}</span>
        </div>
      </td>

      <td>
        <div class="categoria-cell">
          <span>${escapeHTMLExtratos(item.categoria)}</span>
        </div>
      </td>

      <td>${ehReceita ? "Receita" : "Despesa"}</td>

      <td class="valor ${ehReceita ? "positivo" : "negativo"}">
        ${ehReceita ? "+" : "-"} ${formatarMoedaExtratos(item.valor)}
      </td>

      ${
        mostrarUsuarioExtratos
          ? `<td class="usuario-extratos">${escapeHTMLExtratos(pegarNomeAutorExtratos(item))}</td>`
          : ""
      }
    `;

    tbody.appendChild(tr);
  });

  renderizarPaginacaoExtratos(lista);
}

function atualizarTotaisExtratos(lista = []) {
  const totalReceitas = lista
    .filter((item) => item.tipoMovimento === "receita")
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const totalDespesas = lista
    .filter((item) => item.tipoMovimento === "despesa")
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const elReceitas =
    document.getElementById("total-entradas") ||
    document.getElementById("total-receitas");

  const elDespesas =
    document.getElementById("total-saidas") ||
    document.getElementById("total-despesas");

  if (elReceitas) elReceitas.textContent = formatarMoedaExtratos(totalReceitas);
  if (elDespesas) elDespesas.textContent = formatarMoedaExtratos(totalDespesas);
}

function renderizarPaginacaoExtratos(lista = []) {
  const paginacao = document.getElementById("paginacao");

  if (!paginacao) return;

  paginacao.innerHTML = "";

  const totalPaginas = Math.ceil(lista.length / itensPorPagina);

  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `pagina-numero ${paginaAtual === i ? "ativa" : ""}`;
    btn.textContent = i;

    btn.addEventListener("click", () => {
      paginaAtual = i;
      renderizarExtratos(lista);
    });

    paginacao.appendChild(btn);
  }
}

function pegarCategoriaIdExtratos(item) {
  const ids = [
    item?.categoryId,
    item?.category_id,
    item?.categoriaId,
    item?.categoria_id,
    item?.category?.id,
    item?.categoria?.id,
    typeof item?.category === "number" ? item.category : null,
    typeof item?.categoria === "number" ? item.categoria : null
  ];

  for (const id of ids) {
    const numero = Number(id);
    if (Number.isInteger(numero) && numero > 0) return numero;
  }

  return null;
}

function pegarNomeCategoriaPorIdExtratos(categoriaId) {
  const id = Number(categoriaId);

  if (!Number.isInteger(id) || id <= 0) return "";

  const categoria = categoriasExtratos.find((item) => Number(item.id) === id);

  return categoria?.nome || "";
}

function extrairValorExtratos(item) {
  const valorBruto =
    item?.amount ??
    item?.value ??
    item?.valor ??
    item?.total ??
    item?.price ??
    item?.valorTotal ??
    item?.totalValue ??
    item?.totalAmount ??
    0;

  if (typeof valorBruto === "number") return Math.abs(valorBruto);

  const texto = String(valorBruto)
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  return Math.abs(Number(texto) || 0);
}

function normalizarTextoExtratos(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarDataISOExtratos(dataValor) {
  if (!dataValor) return "";

  const texto = String(dataValor).trim();

  if (texto.includes("-")) {
    const partes = texto.split("T")[0].split("-");

    if (partes.length === 3) {
      return `${partes[0]}-${partes[1].padStart(2, "0")}-${partes[2].padStart(2, "0")}`;
    }
  }

  if (texto.includes("/")) {
    const partes = texto.split("/");

    if (partes.length === 3) {
      return `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}`;
    }
  }

  const data = new Date(texto);

  if (isNaN(data.getTime())) return "";

  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0")
  ].join("-");
}

function converterDataExtratos(dataValor) {
  const iso = normalizarDataISOExtratos(dataValor);

  if (!iso) return null;

  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia, 12, 0, 0);

  return isNaN(data.getTime()) ? null : data;
}

function pegarAnoMesExtratos(dataValor) {
  const data = converterDataExtratos(dataValor);

  if (!data) return "";

  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function pegarAnoMesDataExtratos(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function formatarDataBRExtratos(dataValor) {
  const iso = normalizarDataISOExtratos(dataValor);

  if (!iso) return "";

  const [ano, mes, dia] = iso.split("-");

  return `${dia}/${mes}/${ano}`;
}

function obterMoedaUsuarioExtratos() {
  return (
    localStorage.getItem(getChaveUsuarioExtratos("moedaUsuario")) ||
    sessionStorage.getItem(getChaveUsuarioExtratos("moedaUsuario")) ||
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoedaExtratos(valor) {
  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaUsuarioExtratos()
    });
  } catch {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}

function escapeHTMLExtratos(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pegarNomeAutorExtratos(item) {
  const nomeDireto =
    item?.autorNickname ||
    item?.nicknameUsuario ||
    item?.nomeUsuario ||
    item?.createdByNickname ||
    item?.createdByName ||
    item?.createdBy?.nickname ||
    item?.createdBy?.name ||
    item?.user?.nickname ||
    item?.user?.name ||
    item?.usuario?.nickname ||
    item?.usuario?.name ||
    "";

  if (nomeDireto) {
    return formatarNicknameExtratos(nomeDireto);
  }

  const idDono =
    item?.autorId ||
    item?.userId ||
    item?.user_id ||
    item?.usuarioId ||
    item?.usuario_id ||
    item?.createdById ||
    item?.created_by_id ||
    item?.createdBy?.id ||
    item?.user?.id ||
    item?.usuario?.id ||
    null;

  const emailDono = String(
    item?.autorEmail ||
    item?.userEmail ||
    item?.user_email ||
    item?.emailUsuario ||
    item?.email_usuario ||
    item?.createdByEmail ||
    item?.created_by_email ||
    item?.createdBy?.email ||
    item?.user?.email ||
    item?.usuario?.email ||
    ""
  )
    .toLowerCase()
    .trim();

  const nomeMembro = buscarNomeMembroExtratos(idDono, emailDono);

  if (nomeMembro) {
    return nomeMembro;
  }

  const idAtual = getIdUsuarioExtratos();
  const emailAtual = getEmailUsuarioExtratos();

  const pertenceAoUsuarioLogado =
    (idAtual && idDono && String(idAtual) === String(idDono)) ||
    (emailAtual && emailDono && emailAtual === emailDono) ||
    (!idDono && !emailDono);

  if (pertenceAoUsuarioLogado) {
    return getNicknameUsuarioExtratos() || "Usuário";
  }

  if (emailDono) {
    return emailDono.split("@")[0];
  }

  if (idDono) {
    return `Usuário ${idDono}`;
  }

  return "Usuário";
}

function buscarNomeMembroExtratos(idUsuario, emailUsuario = "") {
  const id = idUsuario ? String(idUsuario) : "";
  const email = String(emailUsuario || "").toLowerCase().trim();

  const membro = membrosFamiliaExtratos.find((item) => {
    const idMembro = pegarIdMembroExtratos(item);
    const emailMembro = pegarEmailMembroExtratos(item);

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

  const nome = pegarNomeMembroExtratos(membro);

  return nome ? formatarNicknameExtratos(nome) : "";
}

function pegarIdMembroExtratos(membro) {
  return (
    membro?.userId ||
    membro?.user_id ||
    membro?.memberUserId ||
    membro?.member_user_id ||
    membro?.familyUserId ||
    membro?.family_user_id ||
    membro?.user?.id ||
    membro?.user?.userId ||
    membro?.user?.user_id ||
    membro?.usuario?.id ||
    membro?.usuario?.userId ||
    membro?.usuario?.user_id ||
    membro?.member?.id ||
    membro?.member?.userId ||
    membro?.member?.user_id ||
    membro?.id ||
    null
  );
}

function pegarEmailMembroExtratos(membro) {
  return String(
    membro?.email ||
    membro?.userEmail ||
    membro?.emailUser ||
    membro?.user_email ||
    membro?.email_user ||
    membro?.user?.email ||
    membro?.usuario?.email ||
    membro?.member?.email ||
    ""
  )
    .toLowerCase()
    .trim();
}

function pegarNomeMembroExtratos(membro) {
  return (
    membro?.nickname ||
    membro?.nickName ||
    membro?.name ||
    membro?.nome ||
    membro?.username ||
    membro?.email ||
    membro?.user?.nickname ||
    membro?.user?.nickName ||
    membro?.user?.name ||
    membro?.user?.nome ||
    membro?.user?.username ||
    membro?.user?.email ||
    membro?.usuario?.nickname ||
    membro?.usuario?.nickName ||
    membro?.usuario?.name ||
    membro?.usuario?.nome ||
    membro?.usuario?.username ||
    membro?.usuario?.email ||
    membro?.member?.nickname ||
    membro?.member?.nickName ||
    membro?.member?.name ||
    membro?.member?.nome ||
    membro?.member?.username ||
    membro?.member?.email ||
    ""
  );
}

function getChaveExcluidasExtratos(tipo) {
  const chaveBase = tipo === "receita" ? "receitasExcluidas" : "despesasExcluidas";
  return `${getUserKeyExtratos()}_${chaveBase}`;
}

function lerListaExcluidasExtratos(tipo) {
  const chaveBase = tipo === "receita" ? "receitasExcluidas" : "despesasExcluidas";

  const listas = [];

  try {
    const global = localStorage.getItem(chaveBase);
    if (global) listas.push(...JSON.parse(global));
  } catch {}

  try {
    const porUsuario = localStorage.getItem(getChaveExcluidasExtratos(tipo));
    if (porUsuario) listas.push(...JSON.parse(porUsuario));
  } catch {}

  return Array.isArray(listas) ? listas : [];
}

function criarChaveTransacaoExtratos(item) {
  const descricao = normalizarTextoExtratos(
    item?.descricao ||
    item?.description ||
    item?.name ||
    item?.nome ||
    ""
  );

  const categoria = normalizarTextoExtratos(
    item?.categoria ||
    item?.category ||
    item?.categoryName ||
    item?.nomeCategoria ||
    ""
  );

  const valor = Number(
    item?.valor ??
    item?.value ??
    item?.amount ??
    0
  );

  const data = normalizarDataISOExtratos(
    item?.data ||
    item?.dateInitial ||
    item?.date ||
    ""
  );

  return [
    item.tipoMovimento || item.tipo || "",
    descricao,
    categoria,
    Number(valor || 0).toFixed(2),
    data
  ].join("|");
}

function transacaoFoiExcluidaExtratos(item) {
  const tipo = item.tipoMovimento === "receita" ? "receita" : "despesa";
  const excluidas = lerListaExcluidasExtratos(tipo);

  if (!excluidas.length) return false;

  const idsItem = [
    item.id,
    item.incomeId,
    item.income_id,
    item.expenseId,
    item.expense_id
  ]
    .filter(Boolean)
    .map(String);

  const chaveItem = criarChaveTransacaoExtratos(item);

  return excluidas.some((excluida) => {
    const idsExcluida = [
      excluida.id,
      excluida.incomeId,
      excluida.income_id,
      excluida.expenseId,
      excluida.expense_id,
      ...(Array.isArray(excluida.ids) ? excluida.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    const mesmoId =
      idsItem.length > 0 &&
      idsExcluida.length > 0 &&
      idsItem.some((id) => idsExcluida.includes(id));

    if (mesmoId) return true;

    const chaveExcluida =
      excluida.chave ||
      criarChaveTransacaoExtratos({
        ...excluida,
        tipoMovimento: tipo
      });

    return chaveExcluida === chaveItem;
  });
}

function removerDuplicadasExtratos(lista) {
  const mapa = new Map();

  lista.forEach((item) => {
    const id =
      item?.id ||
      item?.incomeId ||
      item?.income_id ||
      item?.expenseId ||
      item?.expense_id ||
      "";

    const descricao =
      item?.descricao ||
      item?.description ||
      item?.name ||
      item?.nome ||
      "";

    const data =
      item?.data ||
      item?.dateInitial ||
      item?.date ||
      "";

    const valor =
      item?.valor ??
      item?.value ??
      item?.amount ??
      0;

    const tipo =
      item?.tipoMovimento ||
      item?.tipo ||
      "";

    const chave = id
      ? `${tipo}-id-${id}`
      : `${tipo}-${normalizarTextoExtratos(descricao)}-${normalizarDataISOExtratos(data)}-${Number(valor || 0).toFixed(2)}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, item);
    }
  });

  return Array.from(mapa.values());
}