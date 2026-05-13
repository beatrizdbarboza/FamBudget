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

function pegarCategoriaIdExtratos(item) {
  const possiveisIds = [
    item?.categoryId,
    item?.category_id,
    item?.categoriaId,
    item?.categoria_id,
    item?.idCategory,
    item?.id_category,
    item?.category?.id,
    item?.categoria?.id,
    typeof item?.category === "number" ? item.category : null,
    typeof item?.categoria === "number" ? item.categoria : null,
    !isNaN(Number(item?.category)) ? item.category : null,
    !isNaN(Number(item?.categoria)) ? item.categoria : null
  ];

  for (const id of possiveisIds) {
    const numero = Number(id);

    if (Number.isInteger(numero) && numero > 0) {
      return numero;
    }
  }

  return null;
}

function pegarNomeCategoriaPorIdExtratos(categoriaId) {
  const id = Number(categoriaId);

  if (!Number.isInteger(id) || id <= 0) return "";

  const categoria = categoriasExtratos.find((item) => Number(item.id) === id);

  return categoria?.nome || "";
}

function inferirCategoriaPorDescricaoExtratos(item) {
  const texto = normalizarTextoExtratos(
    [
      item?.description,
      item?.descricao,
      item?.name,
      item?.nome,
      item?.title,
      item?.categoryName,
      item?.nomeCategoria
    ].join(" ")
  );

  if (
    texto.includes("pizza") ||
    texto.includes("mercado") ||
    texto.includes("supermercado") ||
    texto.includes("restaurante") ||
    texto.includes("lanche") ||
    texto.includes("comida") ||
    texto.includes("ifood") ||
    texto.includes("alimentacao") ||
    texto.includes("alimentação")
  ) {
    return "Alimentação";
  }

  if (
    texto.includes("cinema") ||
    texto.includes("cine") ||
    texto.includes("show") ||
    texto.includes("jogo") ||
    texto.includes("lazer")
  ) {
    return "Lazer";
  }

  if (
    texto.includes("uber") ||
    texto.includes("99") ||
    texto.includes("onibus") ||
    texto.includes("ônibus") ||
    texto.includes("gasolina") ||
    texto.includes("combustivel") ||
    texto.includes("combustível") ||
    texto.includes("transporte")
  ) {
    return "Transporte";
  }

  if (
    texto.includes("farmacia") ||
    texto.includes("farmácia") ||
    texto.includes("remedio") ||
    texto.includes("remédio") ||
    texto.includes("consulta") ||
    texto.includes("saude") ||
    texto.includes("saúde")
  ) {
    return "Saúde";
  }

  if (
    texto.includes("aluguel") ||
    texto.includes("casa") ||
    texto.includes("moradia")
  ) {
    return "Moradia";
  }

  return "";
}

function normalizarTextoExtratos(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function idsIguaisExtratos(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}

function emailsIguaisExtratos(a, b) {
  if (!a || !b) return false;
  return String(a).toLowerCase().trim() === String(b).toLowerCase().trim();
}

function pegarIdDonoExtratos(item) {
  return (
    item?.autorId ||
    item?.userId ||
    item?.user_id ||
    item?.usuarioId ||
    item?.usuario_id ||
    item?.createdById ||
    item?.created_by_id ||
    item?.ownerId ||
    item?.owner_id ||
    item?.createdBy?.id ||
    item?.user?.id ||
    item?.usuario?.id ||
    null
  );
}

function pegarEmailDonoExtratos(item) {
  return String(
    item?.autorEmail ||
    item?.userEmail ||
    item?.user_email ||
    item?.emailUsuario ||
    item?.email_usuario ||
    item?.createdByEmail ||
    item?.created_by_email ||
    item?.ownerEmail ||
    item?.owner_email ||
    item?.createdBy?.email ||
    item?.user?.email ||
    item?.usuario?.email ||
    ""
  )
    .toLowerCase()
    .trim();
}

function itemPertenceAoUsuarioLogadoExtratos(item) {
  if (item?._origemUsuario === true) {
    return true;
  }

  const idAtual = getIdUsuarioExtratos();
  const emailAtual = getEmailUsuarioExtratos();

  const idDono = pegarIdDonoExtratos(item);
  const emailDono = pegarEmailDonoExtratos(item);

  if (idsIguaisExtratos(idAtual, idDono)) return true;
  if (emailsIguaisExtratos(emailAtual, emailDono)) return true;

  if (!idDono && !emailDono) return true;

  return false;
}

function buscarMembroFamiliaPorEmailOuIdExtratos(email, id) {
  if (!Array.isArray(membrosFamiliaExtratos)) return null;

  return membrosFamiliaExtratos.find((membro) => {
    const idMembro =
      membro?.id ||
      membro?.userId ||
      membro?.user_id ||
      membro?.usuarioId ||
      membro?.usuario_id ||
      membro?.user?.id ||
      membro?.usuario?.id ||
      null;

    const emailMembro = String(
      membro?.email ||
      membro?.userEmail ||
      membro?.user_email ||
      membro?.emailUsuario ||
      membro?.user?.email ||
      membro?.usuario?.email ||
      ""
    )
      .toLowerCase()
      .trim();

    if (id && idsIguaisExtratos(id, idMembro)) return true;
    if (email && emailsIguaisExtratos(email, emailMembro)) return true;

    return false;
  }) || null;
}

function pegarNomeMembroFamiliaExtratos(membro) {
  if (!membro) return "";

  const nickname =
    membro.nickname ||
    membro.nickName ||
    membro.username ||
    membro.userName ||
    membro.user?.nickname ||
    membro.user?.nickName ||
    membro.user?.username ||
    membro.usuario?.nickname ||
    membro.usuario?.nickName ||
    membro.usuario?.username ||
    "";

  if (nickname) {
    return formatarNicknameExtratos(nickname);
  }

  const nome =
    membro.nome ||
    membro.name ||
    membro.fullName ||
    membro.full_name ||
    membro.user?.nome ||
    membro.user?.name ||
    membro.user?.fullName ||
    membro.user?.full_name ||
    membro.usuario?.nome ||
    membro.usuario?.name ||
    membro.usuario?.fullName ||
    membro.usuario?.full_name ||
    "";

  return formatarNicknameExtratos(nome);
}

function buscarNicknamePorEmailExtratos(email) {
  if (!email) return "";

  const emailLimpo = String(email).toLowerCase().trim();
  const userKey = getUserKeyExtratos(emailLimpo);

  const nicknameStorage =
    localStorage.getItem(`${userKey}_nicknameUsuario`) ||
    sessionStorage.getItem(`${userKey}_nicknameUsuario`) ||
    "";

  if (nicknameStorage) {
    return formatarNicknameExtratos(nicknameStorage);
  }

  const membro = buscarMembroFamiliaPorEmailOuIdExtratos(emailLimpo, null);
  const nomeMembro = pegarNomeMembroFamiliaExtratos(membro);

  if (nomeMembro) {
    return formatarNicknameExtratos(nomeMembro);
  }

  if (emailsIguaisExtratos(emailLimpo, getEmailUsuarioExtratos())) {
    return formatarNicknameExtratos(getNicknameUsuarioExtratos());
  }

  const nomeStorage =
    localStorage.getItem(`${userKey}_nomeUsuario`) ||
    sessionStorage.getItem(`${userKey}_nomeUsuario`) ||
    "";

  if (nomeStorage) {
    return formatarNicknameExtratos(nomeStorage);
  }

  return "";
}

function pegarNomeAutorExtratos(item) {
  const emailAutor = pegarEmailDonoExtratos(item);
  const idAutor = pegarIdDonoExtratos(item);

  const membro = buscarMembroFamiliaPorEmailOuIdExtratos(emailAutor, idAutor);
  const nomeMembro = pegarNomeMembroFamiliaExtratos(membro);

  if (nomeMembro) {
    return formatarNicknameExtratos(nomeMembro);
  }

  const nicknameDireto =
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
    "";

  if (nicknameDireto) {
    return formatarNicknameExtratos(nicknameDireto);
  }

  const nicknamePorEmail = buscarNicknamePorEmailExtratos(emailAutor);

  if (nicknamePorEmail) {
    return formatarNicknameExtratos(nicknamePorEmail);
  }

  if (itemPertenceAoUsuarioLogadoExtratos(item)) {
    return formatarNicknameExtratos(getNicknameUsuarioExtratos());
  }

  if (emailAutor) {
    return formatarNicknameExtratos(emailAutor.split("@")[0]);
  }

  return "Usuário";
}

function atualizarCabecalhoUsuarioExtratos() {
  const tbody = document.getElementById("lista-extratos");

  if (!tbody) return;

  const tabela = tbody.closest("table");

  if (!tabela) return;

  const linhaCabecalho = tabela.querySelector("thead tr");

  if (!linhaCabecalho) return;

  linhaCabecalho.innerHTML = `
    <th>Data</th>
    <th>Descrição</th>
    <th>Categoria</th>
    <th>Tipo</th>
    ${mostrarUsuarioExtratos ? "<th data-coluna-usuario='extratos'>Usuário</th>" : ""}
    <th class="valor-coluna">Valor (${pegarRotuloMoedaExtratos()})</th>
  `;
}

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

  document.querySelectorAll(".menu li[data-link]").forEach((item) => {
    item.addEventListener("click", () => {
      window.location.href = item.dataset.link;
    });
  });
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

function getChaveDespesasEditadasExtratos() {
  return `${getUserKeyExtratos()}_despesasEditadasLocalmente`;
}

function lerDespesasEditadasLocalmenteExtratos() {
  try {
    const dados = localStorage.getItem(getChaveDespesasEditadasExtratos());

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function criarChaveEdicaoDespesaExtratos(item) {
  return String(
    item?.expenseId ||
    item?.expense_id ||
    item?.id ||
    ""
  );
}

function encontrarDespesaEditadaExtratos(item, editadas) {
  const idsItem = [
    item?.id,
    item?.expenseId,
    item?.expense_id,
    item?.transactionId,
    item?.transaction_id
  ]
    .filter(Boolean)
    .map(String);

  const descricaoItem = normalizarTextoExtratos(
    item?.description ||
    item?.descricao ||
    item?.name ||
    item?.nome ||
    ""
  );

  const dataItem = formatarDataISOExtratos(
    item?.dateInitial ||
    item?.data ||
    item?.date ||
    ""
  );

  return editadas.find((editada) => {
    const idsEditada = [
      editada?.id,
      editada?.expenseId,
      editada?.expense_id,
      editada?.transactionId,
      editada?.transaction_id
    ]
      .filter(Boolean)
      .map(String);

    if (
      idsItem.length > 0 &&
      idsEditada.length > 0 &&
      idsItem.some((id) => idsEditada.includes(id))
    ) {
      return true;
    }

    const descricaoEditada = normalizarTextoExtratos(
      editada?.description ||
      editada?.descricao ||
      editada?.name ||
      editada?.nome ||
      ""
    );

    const dataEditada = formatarDataISOExtratos(
      editada?.dataOriginal ||
      editada?.dateInitialOriginal ||
      editada?.dateOriginal ||
      editada?.dateInitial ||
      editada?.data ||
      editada?.date ||
      ""
    );

    return (
      descricaoItem &&
      descricaoItem === descricaoEditada &&
      dataItem &&
      dataEditada &&
      dataItem === dataEditada
    );
  }) || null;
}

function aplicarEdicoesLocaisExtratos(lista) {
  const editadas = lerDespesasEditadasLocalmenteExtratos();

  if (!editadas.length) return lista;

  return lista.map((item) => {
    if (item.tipo !== "despesa") {
      return item;
    }

    const editada = encontrarDespesaEditadaExtratos(item, editadas);

    if (!editada) {
      return item;
    }

    return normalizarTransacaoExtratos(
      {
        ...item,
        ...editada,

        valor:
          editada.valor ??
          editada.value ??
          editada.amount ??
          item.valor ??
          item.value ??
          item.amount,

        value:
          editada.value ??
          editada.valor ??
          editada.amount ??
          item.value ??
          item.valor ??
          item.amount,

        amount:
          editada.amount ??
          editada.valor ??
          editada.value ??
          item.amount ??
          item.valor ??
          item.value,

        tipo: "despesa",
        _origemUsuario: item._origemUsuario,
        _editadoLocalmente: true
      },
      "despesa"
    );
  });
}

async function carregarExtratos() {
  atualizarTituloMesExtratos();
  atualizarCabecalhoMoedaExtratos();
  atualizarCabecalhoUsuarioExtratos();

  const mes = dataReferenciaExtratos.getMonth() + 1;
  const ano = dataReferenciaExtratos.getFullYear();

  let receitasLista = [];
  let despesasLista = [];

  let receitasVieramDoUsuario = false;
  let despesasVieramDoUsuario = false;

  if (usuarioPertenceFamiliaExtratos) {
    const familyId = await obterFamilyIdExtratos();

    if (familyId) {
      const [receitasFamilia, despesasFamilia] = await Promise.all([
        apiGetExtratos(`/income/family/${familyId}?month=${mes}&year=${ano}`),
        apiGetExtratos(`/expense/family/${familyId}?month=${mes}&year=${ano}`)
      ]);

      receitasLista = transformarEmArrayExtratos(receitasFamilia);
      despesasLista = transformarEmArrayExtratos(despesasFamilia);

    }

    if (!receitasLista.length) {
      const receitasUsuario = await apiGetExtratos(`/income/user?month=${mes}&year=${ano}`);
      receitasLista = transformarEmArrayExtratos(receitasUsuario);
      receitasVieramDoUsuario = true;

    }

    if (!despesasLista.length) {
      const despesasUsuario = await apiGetExtratos(`/expense/user?month=${mes}&year=${ano}`);
      despesasLista = transformarEmArrayExtratos(despesasUsuario);
      despesasVieramDoUsuario = true;

    }

  } else {
    const [receitasUsuario, despesasUsuario] = await Promise.all([
      apiGetExtratos(`/income/user?month=${mes}&year=${ano}`),
      apiGetExtratos(`/expense/user?month=${mes}&year=${ano}`)
    ]);

    receitasLista = transformarEmArrayExtratos(receitasUsuario);
    despesasLista = transformarEmArrayExtratos(despesasUsuario);

    receitasVieramDoUsuario = true;
    despesasVieramDoUsuario = true;

  }

  let receitasApi = receitasLista.map((item) => {
    return normalizarTransacaoExtratos(
      {
        ...item,
        _origemAPI: true,
        _origemUsuario: receitasVieramDoUsuario
      },
      "receita"
    );
  });

  let despesasApi = despesasLista.map((item) => {
    return normalizarTransacaoExtratos(
      {
        ...item,
        _origemAPI: true,
        _origemUsuario: despesasVieramDoUsuario
      },
      "despesa"
    );
  });

  let transacoesApi = [
    ...receitasApi,
    ...despesasApi
  ];

  transacoesApi = transacoesApi.filter((item) => {
    if (item.tipo === "receita") return !receitaFoiExcluidaExtratos(item);
    if (item.tipo === "despesa") return !despesaFoiExcluidaExtratos(item);
    return true;
  });

  if (!usuarioPertenceFamiliaExtratos) {
    transacoesApi = transacoesApi.filter((item) => {
      return itemPertenceAoUsuarioLogadoExtratos(item);
    });
  }

  ultimasTransacoes = removerDuplicadosExtratos(transacoesApi);

  renderizarExtratos(ultimasTransacoes);
}

function lerStorageExtratos(chave, storage = localStorage) {
  try {
    const dados = storage.getItem(chave);

    if (!dados) return [];

    const parseado = JSON.parse(dados);

    return Array.isArray(parseado) ? parseado : [];
  } catch {
    return [];
  }
}

function lerReceitasExcluidasExtratos() {
  const chaveUsuario = getChaveUsuarioExtratos("receitasExcluidas");

  return [
    ...lerStorageExtratos(chaveUsuario),
    ...lerStorageExtratos("receitasExcluidas")
  ];
}

function lerDespesasExcluidasExtratos() {
  const chaveUsuario = getChaveUsuarioExtratos("despesasExcluidas");

  return [
    ...lerStorageExtratos(chaveUsuario),
    ...lerStorageExtratos("despesasExcluidas")
  ];
}

function receitaFoiExcluidaExtratos(item) {
  if (!item || item.tipo !== "receita") return false;

  const excluidas = lerReceitasExcluidasExtratos();

  const idsItem = [
    item.id,
    item.incomeId,
    item.income_id,
    item.transactionId,
    item.transaction_id,
    item.regraReceitaFixaId
  ]
    .filter(Boolean)
    .map(String);

  return excluidas.some((excluida) => {
    const idsExcluidos = [
      excluida.id,
      excluida.incomeId,
      excluida.income_id,
      ...(Array.isArray(excluida.ids) ? excluida.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    if (idsItem.some((id) => idsExcluidos.includes(String(id)))) {
      return true;
    }

    const descricaoItem = normalizarTextoExtratos(item.description || item.descricao || "");
    const descricaoExcluida = normalizarTextoExtratos(excluida.description || excluida.descricao || "");

    const valorItem = Number(item.value ?? item.valor ?? item.amount ?? 0);
    const valorExcluido = Number(excluida.value ?? excluida.valor ?? excluida.amount ?? 0);

    return (
      descricaoItem &&
      descricaoItem === descricaoExcluida &&
      valorItem === valorExcluido
    );
  });
}

function despesaFoiExcluidaExtratos(item) {
  if (!item || item.tipo !== "despesa") return false;

  const excluidas = lerDespesasExcluidasExtratos();

  const idsItem = [
    item.id,
    item.expenseId,
    item.expense_id,
    item.transactionId,
    item.transaction_id,
    item.compraId,
    item.purchaseId
  ]
    .filter(Boolean)
    .map(String);

  if (idsItem.length > 0) {
    return excluidas.some((excluida) => {
      const idsExcluidos = [
        excluida.id,
        excluida.expenseId,
        excluida.expense_id,
        excluida.transactionId,
        excluida.transaction_id,
        excluida.compraId,
        excluida.purchaseId,
        ...(Array.isArray(excluida.ids) ? excluida.ids : [])
      ]
        .filter(Boolean)
        .map(String);

      return idsItem.some((id) => idsExcluidos.includes(id));
    });
  }

  return false;
}

function normalizarObjetoDespesaParaComparacaoExtratos(item) {
  const ids = [
    item?.id,
    item?.expenseId,
    item?.expense_id,
    item?.transactionId,
    item?.transaction_id,
    item?.compraId,
    item?.purchaseId,
    ...(Array.isArray(item?.ids) ? item.ids : [])
  ]
    .filter(Boolean)
    .map(String);

  const descricao = normalizarTextoExtratos(
    item?.description ||
    item?.descricao ||
    item?.name ||
    item?.nome ||
    item?.title ||
    ""
  );

  const categoria = normalizarTextoExtratos(
    item?.category ||
    item?.categoria ||
    item?.categoryName ||
    item?.nomeCategoria ||
    ""
  );

  const valor = Number(
    item?.value ??
    item?.valor ??
    item?.amount ??
    item?.total ??
    0
  );

  const data = formatarDataISOExtratos(
    item?.dateInitial ||
    item?.data ||
    item?.date ||
    item?.createdAt ||
    item?.created_at ||
    ""
  );

  return {
    ids,
    descricao,
    categoria,
    valor,
    data
  };
}

function compararPorIdsExtratos(a, b) {
  if (!a?.ids?.length || !b?.ids?.length) return false;

  return a.ids.some((id) => b.ids.includes(id));
}

function compararPorAssinaturaExtratos(a, b) {
  if (!a || !b) return false;

  const mesmoValor =
    Number(a.valor || 0).toFixed(2) === Number(b.valor || 0).toFixed(2);

  const mesmaData =
    a.data &&
    b.data &&
    a.data === b.data;

  const mesmaDescricao =
    a.descricao &&
    b.descricao &&
    a.descricao === b.descricao;

  const mesmaCategoria =
    !a.categoria ||
    !b.categoria ||
    a.categoria === b.categoria;

  return mesmaDescricao && mesmoValor && mesmaData && mesmaCategoria;
}

function chaveFlexivelExtratos(item) {
  const dataNormalizada = formatarDataISOExtratos(item.data);
  const tipo = item.tipo || "";
  const valor = Number(item.valor || 0).toFixed(2);

  const id =
    item.id ||
    item.incomeId ||
    item.expenseId ||
    item.transactionId ||
    "";

  if (id) {
    return `${tipo}|${id}`;
  }

  const descricao = normalizarTextoExtratos(item.descricao || "");
  const categoria = normalizarTextoExtratos(item.categoria || "");

  return [
    tipo,
    dataNormalizada,
    descricao,
    categoria,
    valor
  ].join("|");
}

function removerDuplicadosExtratos(lista) {
  const mapa = new Map();

  transformarEmArrayExtratos(lista).forEach((item) => {
    const chave = chaveFlexivelExtratos(item);

    if (!mapa.has(chave)) {
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
    tipoPadrao
  );

  return {
    ...item,

    id:
      item.id ||
      item.incomeId ||
      item.income_id ||
      item.expenseId ||
      item.expense_id ||
      item.transactionId ||
      item.transaction_id ||
      cryptoRandomIdExtratos(),

    incomeId:
      item.incomeId ||
      item.income_id ||
      (tipo === "receita" ? item.id : null) ||
      null,

    expenseId:
      item.expenseId ||
      item.expense_id ||
      (tipo === "despesa" ? item.id : null) ||
      null,

    expense_id:
      item.expense_id ||
      item.expenseId ||
      (tipo === "despesa" ? item.id : null) ||
      null,

    data: pegarDataExtratos(item),
    descricao: pegarDescricaoExtratos(item),
    categoria: pegarCategoriaExtratos(item, tipo),
    tipo,
    valor: pegarValorExtratos(item),

    autorId:
      item.autorId ||
      item.userId ||
      item.user_id ||
      item.usuarioId ||
      item.usuario_id ||
      item.createdById ||
      item.created_by_id ||
      item.createdBy?.id ||
      item.user?.id ||
      item.usuario?.id ||
      null,

    autorEmail:
      item.autorEmail ||
      item.userEmail ||
      item.user_email ||
      item.emailUsuario ||
      item.email_usuario ||
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
      "",

    compraId: item.compraId || item.purchaseId || null,
    parcelaAtual: item.parcelaAtual || item.currentInstallment || null,
    totalParcelas: item.totalParcelas || item.installments || null,

    _origemAPI: Boolean(item._origemAPI),
    _origemUsuario: Boolean(item._origemUsuario),
    _editadoLocalmente: Boolean(item._editadoLocalmente)
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
    item.created_at ||
    item.dueDate ||
    item.updatedAt ||
    item.dataTransacao ||
    item.transactionDate ||
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
  if (tipo === "receita") {
    return "Receita";
  }

  const categoriaId = pegarCategoriaIdExtratos(item);
  const categoriaPorId = pegarNomeCategoriaPorIdExtratos(categoriaId);
  const categoriaInferida = inferirCategoriaPorDescricaoExtratos(item);

  const categoriaObj =
    typeof item?.category === "object"
      ? item.category
      : typeof item?.categoria === "object"
        ? item.categoria
        : null;

  if (categoriaObj) {
    const nomeObj =
      categoriaObj.name ||
      categoriaObj.nome ||
      categoriaObj.description ||
      categoriaObj.descricao ||
      "";

    if (nomeObj && isNaN(Number(nomeObj))) {
      return String(nomeObj);
    }
  }

  const categoriaTexto =
    item?.categoriaNome ||
    item?.nomeCategoria ||
    item?.categoryName ||
    item?.category_name ||
    item?.descriptionCategory ||
    item?.typeCategory ||
    item?.nameCategory ||
    categoriaPorId ||
    "";

  if (categoriaTexto && isNaN(Number(categoriaTexto))) {
    return String(categoriaTexto);
  }

  if (
    typeof item.category === "string" &&
    item.category &&
    isNaN(Number(item.category))
  ) {
    return item.category;
  }

  if (
    typeof item.categoria === "string" &&
    item.categoria &&
    isNaN(Number(item.categoria))
  ) {
    return item.categoria;
  }

  if (categoriaInferida) {
    return categoriaInferida;
  }

  return "Outros";
}

function pegarValorExtratos(item) {
  const valorBruto =
    item.valor ??
    item.value ??
    item.totalValue ??
    item.totalAmount ??
    item.valorTotal ??
    item.amount ??
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
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace("-", "")
    .trim();

  return Math.abs(Number(valorTexto) || 0);
}

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

  lista = lista.filter((item) => {
    if (item.tipo === "receita") return !receitaFoiExcluidaExtratos(item);
    if (item.tipo === "despesa") return !despesaFoiExcluidaExtratos(item);
    return true;
  });

  lista = lista.filter((item) => {
    const data = converterDataExtratos(item.data);

    if (!data) return false;

    return (
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual
    );
  });

  if (!usuarioPertenceFamiliaExtratos) {
    lista = lista.filter((item) => itemPertenceAoUsuarioLogadoExtratos(item));
  }

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
      ? `<td class="usuario-extratos">${escapeHTMLExtratos(nomeAutor)}</td>`
      : "";

    tr.innerHTML = `
      <td>${formatarDataCurtaExtratos(item.data)}</td>

      <td>
        <div class="descricao-cell">
          <span class="icone-item ${classeIconeExtratos(item)}">
            ${iconeDescricaoExtratos(item)}
          </span>
          <span>${escapeHTMLExtratos(item.descricao)}</span>
        </div>
      </td>

      <td>
        <div class="categoria-cell">
          <span>${iconeCategoriaExtratos(item.categoria)}</span>
          <span>${escapeHTMLExtratos(item.categoria)}</span>
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

function atualizarTituloMesExtratos() {
  const mesAtual = document.getElementById("mes-atual");

  if (!mesAtual) return;

  const mes = MESES_EXTRATOS[dataReferenciaExtratos.getMonth()];
  const ano = dataReferenciaExtratos.getFullYear();

  mesAtual.textContent = `${mes} ${ano}`;
}

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

function iconeCategoriaExtratos() {
  return "•";
}

function obterMoedaExtratos() {
  const email =
    getEmailUsuarioExtratos() ||
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
  } catch {
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

function escapeHTMLExtratos(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.carregarExtratos = carregarExtratos;
window.recarregarExtratos = carregarExtratos;