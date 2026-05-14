const HOME_API_URL = "https://www.manage-control-dev.com.br/api/v1";

let usuarioPertenceFamiliaHome = false;
let carregandoHome = false;

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuarioHome();
  configurarLogoutHome();

  if (typeof configurarModalFamilia === "function") {
    configurarModalFamilia();
  }

  usuarioPertenceFamiliaHome = await usuarioEstaEmFamiliaHome();

  await carregarDadosFinanceiros();
});

window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  const chavesFamilia = [
    "familiaAtualizadaEm",
    "familiaAtual",
    "familia",
    "family",
    "membrosFamilia",
    "familiaMembros"
  ];

  const chavesFinanceiras = [
    "receitasAtualizadasEm",
    "despesasAtualizadasEm",
    "dadosFinanceirosAtualizadosEm",
    "receitasExcluidas",
    "despesasExcluidas"
  ];

  const mudouFamilia = chavesFamilia.includes(event.key);

  const mudouFinanceiro =
    chavesFinanceiras.includes(event.key) ||
    event.key.includes("moedaUsuario") ||
    event.key.includes("_receitasExcluidas") ||
    event.key.includes("_despesasExcluidas");

  if (mudouFamilia) {
    usuarioPertenceFamiliaHome = await usuarioEstaEmFamiliaHome();
    await carregarDadosFinanceiros();
  }

  if (mudouFinanceiro) {
    await carregarDadosFinanceiros();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  usuarioPertenceFamiliaHome = await usuarioEstaEmFamiliaHome();
  await carregarDadosFinanceiros();
});

window.addEventListener("dadosFinanceirosAtualizados", async () => {
  await carregarDadosFinanceiros();
});

window.addEventListener("focus", async () => {
  await carregarDadosFinanceiros();
});

function getTokenHome() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function getPayloadTokenHome() {
  const token = getTokenHome();

  if (!token) return {};

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function headersHome(json = false) {
  const token = getTokenHome();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function getEmailUsuarioLogadoHome() {
  const payload = getPayloadTokenHome();

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

function getIdUsuarioLogadoHome() {
  const payload = getPayloadTokenHome();

  return (
    payload.user_id ||
    payload.userId ||
    payload.id ||
    payload.sub ||
    null
  );
}

function getUserKeyHome(email = null) {
  const emailFinal = email || getEmailUsuarioLogadoHome() || "usuario";

  return `fambudget_${String(emailFinal).toLowerCase().trim()}`;
}

function buscarDadoUsuarioHome(chave, email = null) {
  const userKey = getUserKeyHome(email);

  return (
    sessionStorage.getItem(`${userKey}_${chave}`) ||
    localStorage.getItem(`${userKey}_${chave}`) ||
    sessionStorage.getItem(chave) ||
    localStorage.getItem(chave) ||
    ""
  );
}

function carregarUsuarioHome() {
  const nome =
    buscarDadoUsuarioHome("nicknameUsuario") ||
    buscarDadoUsuarioHome("nomeUsuario") ||
    "Usuário";

  const imagem =
    buscarDadoUsuarioHome("avatarUsuario") ||
    buscarDadoUsuarioHome("fotoUsuario") ||
    buscarDadoUsuarioHome("imagemPerfil") ||
    buscarDadoUsuarioHome("fotoPerfil") ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const saudacao = document.getElementById("saudacao");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) nomeUsuario.textContent = nome;
  if (saudacao) saudacao.textContent = `Olá, ${nome}!`;

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

function configurarLogoutHome() {
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

function obterMoedaUsuarioHome() {
  const userKey = getUserKeyHome();

  return (
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    sessionStorage.getItem(`${userKey}_moedaUsuario`) ||
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoedaHome(valor) {
  const numero = Number(valor || 0);

  try {
    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaUsuarioHome()
    });
  } catch {
    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}

async function lerRespostaHome(res) {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiGetHome(path, mostrarErro = false) {
  const token = getTokenHome();

  if (!token) {
    console.warn("HOME: sem token.");
    return null;
  }

  try {
    const res = await fetch(`${HOME_API_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: headersHome()
    });

    const data = await lerRespostaHome(res);

    if (!res.ok) {
      if (mostrarErro) {
        console.warn("GET HOME falhou:", path, res.status, data);
      }

      return null;
    }

    return data?.data || data;
  } catch (erro) {
    console.warn("HOME ERRO ENDPOINT:", path, erro);

    if (mostrarErro) {
      console.warn("Erro ao buscar API Home:", erro);
    }

    return null;
  }
}

async function apiGetPrimeiroValidoHome(paths) {
  for (const path of paths) {
    const data = await apiGetHome(path, false);

    const lista = transformarEmArrayHome(data);

    if (lista.length > 0) {
      return lista;
    }

    if (data && typeof data === "object") {
      const possivelLista = transformarEmArrayHome(data);

      if (possivelLista.length > 0) {
        return possivelLista;
      }
    }
  }

  return [];
}

function transformarEmArrayHome(resposta) {
  if (!resposta) return [];

  if (Array.isArray(resposta)) return resposta;

  const possibilidades = [
    resposta.data,
    resposta.items,
    resposta.results,
    resposta.content,
    resposta.list,
    resposta.lista,
    resposta.expenses,
    resposta.incomes,
    resposta.revenues,
    resposta.receitas,
    resposta.despesas,

    resposta.data?.items,
    resposta.data?.results,
    resposta.data?.content,
    resposta.data?.list,
    resposta.data?.lista,
    resposta.data?.expenses,
    resposta.data?.incomes,
    resposta.data?.revenues,
    resposta.data?.receitas,
    resposta.data?.despesas
  ];

  const lista = possibilidades.find((item) => Array.isArray(item));

  return lista || [];
}

function getMembersFromResponseHome(data) {
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

    data?.data?.familia?.members,
    data?.data?.familia?.membros,
    data?.data?.familia?.users,
    data?.data?.familia?.usuarios,

    data?.familyMembers,
    data?.familiaMembers,
    data?.membersFamily,
    data?.membrosFamilia
  ];

  return possiveisListas.find((lista) => Array.isArray(lista)) || [];
}

async function usuarioEstaEmFamiliaHome() {
  const token = getTokenHome();

  if (!token) return false;

  try {
    const resposta = await fetch(`${HOME_API_URL}/family`, {
      method: "GET",
      cache: "no-store",
      headers: headersHome()
    });

    if (resposta.status === 404) {
      return false;
    }

    if (!resposta.ok) {
      return false;
    }

    const data = await lerRespostaHome(resposta);
    const membros = getMembersFromResponseHome(data);

    if (!Array.isArray(membros)) {
      return true;
    }

    return membros.length > 0;
  } catch (erro) {
    console.warn("Erro ao verificar família na Home:", erro);
    return false;
  }
}

async function obterFamilyIdHome() {
  const data = await apiGetHome("/family", true);

  if (!data) return null;

  const familyId =
    data?.id ||
    data?.familyId ||
    data?.family_id ||
    data?.familiaId ||
    data?.familia_id ||
    data?.family?.id ||
    data?.familia?.id ||
    data?.data?.id ||
    data?.data?.familyId ||
    data?.data?.family_id ||
    data?.data?.familiaId ||
    data?.data?.familia_id ||
    data?.data?.family?.id ||
    data?.data?.familia?.id ||
    null;

  return familyId;
}

function normalizarTextoHome(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pegarDataHome(item) {
  return (
    item?.dateInitial ||
    item?.data ||
    item?.date ||
    item?.createdAt ||
    item?.created_at ||
    item?.dueDate ||
    item?.updatedAt ||
    item?.dataTransacao ||
    item?.transactionDate ||
    item?.paymentDate ||
    item?.receiptDate ||
    null
  );
}

function converterDataHome(dataValor) {
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

function formatarDataISOHome(dataValor) {
  const data = converterDataHome(dataValor);

  if (!data) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function pegarValorHome(item) {
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

  if (typeof valorBruto === "number") {
    return Math.abs(valorBruto);
  }

  const texto = String(valorBruto)
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

  return Math.abs(Number(texto) || 0);
}

function pegarCategoriaHome(item, tipo) {
  const categoriaObj = item?.category || item?.categoria || null;

  if (categoriaObj && typeof categoriaObj === "object") {
    return String(
      categoriaObj.name ||
      categoriaObj.nome ||
      categoriaObj.description ||
      categoriaObj.descricao ||
      (tipo === "receita" ? "Receita" : "Outros")
    );
  }

  return String(
    item?.categoria ||
    item?.category ||
    item?.categoryName ||
    item?.category_name ||
    item?.descriptionCategory ||
    item?.typeCategory ||
    item?.nameCategory ||
    item?.nomeCategoria ||
    (tipo === "receita" ? "Receita" : "Outros")
  );
}

function normalizarItemHome(item, tipoPadrao) {
  const tipoTexto = normalizarTextoHome(
    item?.tipo ||
    item?.type ||
    item?.transactionType ||
    item?.tipoTransacao ||
    item?.categoryType ||
    tipoPadrao
  );

  const tipo =
    tipoTexto.includes("receita") ||
    tipoTexto.includes("income") ||
    tipoTexto.includes("revenue") ||
    tipoTexto.includes("entrada") ||
    normalizarTextoHome(tipoPadrao).includes("receita")
      ? "receita"
      : "despesa";

  return {
    ...item,

    id:
      item?.id ||
      item?.incomeId ||
      item?.income_id ||
      item?.expenseId ||
      item?.expense_id ||
      item?.transactionId ||
      item?.transaction_id ||
      null,

    incomeId:
      item?.incomeId ||
      item?.income_id ||
      (tipo === "receita" ? item?.id : null) ||
      null,

    expenseId:
      item?.expenseId ||
      item?.expense_id ||
      (tipo === "despesa" ? item?.id : null) ||
      null,

    tipo,
    data: pegarDataHome(item),

    descricao:
      item?.descricao ||
      item?.description ||
      item?.name ||
      item?.nome ||
      item?.title ||
      "Sem descrição",

    categoria: pegarCategoriaHome(item, tipo),
    valor: pegarValorHome(item),

    autorId:
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
      null,

    autorEmail:
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
  };
}

function itemPertenceUsuarioLogadoHome(item) {
  const idLogado = getIdUsuarioLogadoHome();
  const emailLogado = getEmailUsuarioLogadoHome();

  const autorId =
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

  const autorEmail = String(
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

  if (!autorId && !autorEmail) return true;

  if (idLogado && autorId && String(idLogado) === String(autorId)) {
    return true;
  }

  if (emailLogado && autorEmail && emailLogado === autorEmail) {
    return true;
  }

  return false;
}

function lerListaStorageHome(chave) {
  try {
    const dados = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function lerReceitasExcluidasHome() {
  return [
    ...lerListaStorageHome("receitasExcluidas"),
    ...lerListaStorageHome(`${getUserKeyHome()}_receitasExcluidas`)
  ];
}

function lerDespesasExcluidasHome() {
  return [
    ...lerListaStorageHome("despesasExcluidas"),
    ...lerListaStorageHome(`${getUserKeyHome()}_despesasExcluidas`)
  ];
}

function criarAssinaturaItemHome(item) {
  return [
    normalizarTextoHome(item?.tipo || ""),
    formatarDataISOHome(pegarDataHome(item)),
    normalizarTextoHome(item?.descricao || item?.description || item?.name || item?.nome || ""),
    normalizarTextoHome(item?.categoria || item?.category || item?.categoryName || ""),
    Number(pegarValorHome(item) || 0).toFixed(2)
  ].join("|");
}

function itemEstaExcluidoHome(item, tipo) {
  const excluidos =
    tipo === "receita"
      ? lerReceitasExcluidasHome()
      : lerDespesasExcluidasHome();

  const idsItem = [
    item?.id,
    item?.incomeId,
    item?.income_id,
    item?.expenseId,
    item?.expense_id,
    item?.transactionId,
    item?.transaction_id,
    item?.compraId,
    item?.purchaseId
  ]
    .filter(Boolean)
    .map(String);

  const descricaoItem = normalizarTextoHome(
    item?.description ||
    item?.descricao ||
    item?.name ||
    item?.nome ||
    item?.title ||
    ""
  );

  const categoriaItem = normalizarTextoHome(
    item?.category?.name ||
    item?.category?.nome ||
    item?.categoria?.name ||
    item?.categoria?.nome ||
    item?.category ||
    item?.categoria ||
    item?.categoryName ||
    item?.nomeCategoria ||
    (tipo === "receita" ? "Receita" : "Outros")
  );

  const valorItem = Number(
    item?.value ??
    item?.valor ??
    item?.amount ??
    item?.total ??
    item?.valorTotal ??
    item?.totalValue ??
    0
  );

  const dataItem = formatarDataISOHome(
    item?.dateInitial ||
    item?.data ||
    item?.date ||
    item?.createdAt ||
    item?.created_at ||
    ""
  );

  const assinaturaItem = [
    tipo,
    descricaoItem,
    categoriaItem,
    Number(valorItem || 0).toFixed(2),
    dataItem
  ].join("|");

  return excluidos.some((excluido) => {
    const idsExcluidos = [
      excluido?.id,
      excluido?.incomeId,
      excluido?.income_id,
      excluido?.expenseId,
      excluido?.expense_id,
      excluido?.transactionId,
      excluido?.transaction_id,
      excluido?.compraId,
      excluido?.purchaseId,
      ...(Array.isArray(excluido?.ids) ? excluido.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    if (
      idsItem.length > 0 &&
      idsExcluidos.length > 0 &&
      idsItem.some((id) => idsExcluidos.includes(id))
    ) {
      return true;
    }

    const descricaoExcluido = normalizarTextoHome(
      excluido?.description ||
      excluido?.descricao ||
      excluido?.name ||
      excluido?.nome ||
      excluido?.title ||
      ""
    );

    const categoriaExcluido = normalizarTextoHome(
      excluido?.category ||
      excluido?.categoria ||
      excluido?.categoryName ||
      excluido?.nomeCategoria ||
      (tipo === "receita" ? "Receita" : "Outros")
    );

    const valorExcluido = Number(
      excluido?.value ??
      excluido?.valor ??
      excluido?.amount ??
      0
    );

    const dataExcluido = formatarDataISOHome(
      excluido?.dateInitial ||
      excluido?.data ||
      excluido?.date ||
      ""
    );

    const assinaturaExcluido = [
      tipo,
      descricaoExcluido,
      categoriaExcluido,
      Number(valorExcluido || 0).toFixed(2),
      dataExcluido
    ].join("|");

    if (assinaturaItem === assinaturaExcluido) {
      return true;
    }

    return (
      descricaoItem &&
      descricaoItem === descricaoExcluido &&
      Number(valorItem || 0).toFixed(2) === Number(valorExcluido || 0).toFixed(2) &&
      dataItem &&
      dataItem === dataExcluido
    );
  });
}

function criarChaveIdHome(item) {
  const id =
    item?.id ||
    item?.incomeId ||
    item?.income_id ||
    item?.expenseId ||
    item?.expense_id ||
    item?.transactionId ||
    item?.transaction_id ||
    "";

  if (!id) return "";

  return `${item?.tipo || ""}|${id}`;
}

function removerDuplicadosHome(lista) {
  const mapa = new Map();

  transformarEmArrayHome(lista).forEach((item) => {
    const chaveId = criarChaveIdHome(item);
    const chaveFlexivel = criarAssinaturaItemHome(item);
    const chaveFinal = chaveId || chaveFlexivel;

    if (!mapa.has(chaveFinal)) {
      mapa.set(chaveFinal, item);
    }
  });

  const mapaFlexivel = new Map();

  Array.from(mapa.values()).forEach((item) => {
    const chaveFlexivel = criarAssinaturaItemHome(item);

    if (!mapaFlexivel.has(chaveFlexivel)) {
      mapaFlexivel.set(chaveFlexivel, item);
    }
  });

  return Array.from(mapaFlexivel.values());
}

async function carregarDadosFinanceiros() {
  if (carregandoHome) return;

  carregandoHome = true;

  try {
    const hoje = new Date();
    const mes = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();

    usuarioPertenceFamiliaHome = await usuarioEstaEmFamiliaHome();

    let familyId = null;

    if (usuarioPertenceFamiliaHome) {
      familyId = await obterFamilyIdHome();
    }

    let endpointsReceitas = [];
    let endpointsDespesas = [];

    if (usuarioPertenceFamiliaHome) {

      endpointsReceitas = familyId
        ? [
            `/income/family/${familyId}?month=${mes}&year=${ano}`,
            `/revenue/family/${familyId}?month=${mes}&year=${ano}`,
            `/family/${familyId}/income?month=${mes}&year=${ano}`,
            `/family/${familyId}/revenue?month=${mes}&year=${ano}`,
            `/income/family?month=${mes}&year=${ano}`,
            `/family/income?month=${mes}&year=${ano}`,
            `/revenue/family?month=${mes}&year=${ano}`
          ]
        : [
            `/income/family?month=${mes}&year=${ano}`,
            `/family/income?month=${mes}&year=${ano}`,
            `/revenue/family?month=${mes}&year=${ano}`
          ];

      endpointsDespesas = familyId
        ? [
            `/expense/family/${familyId}?month=${mes}&year=${ano}`,
            `/family/${familyId}/expense?month=${mes}&year=${ano}`,
            `/family/${familyId}/expenses?month=${mes}&year=${ano}`,
            `/expense/family?month=${mes}&year=${ano}`,
            `/family/expense?month=${mes}&year=${ano}`,
            `/family/expenses?month=${mes}&year=${ano}`
          ]
        : [
            `/expense/family?month=${mes}&year=${ano}`,
            `/family/expense?month=${mes}&year=${ano}`,
            `/family/expenses?month=${mes}&year=${ano}`
          ];
    } else {
      endpointsReceitas = [
        `/income/user?month=${mes}&year=${ano}`,
        `/revenue/user?month=${mes}&year=${ano}`
      ];

      endpointsDespesas = [
        `/expense/user?month=${mes}&year=${ano}`
      ];
    }

    const [receitasApi, despesasApi] = await Promise.all([
      apiGetPrimeiroValidoHome(endpointsReceitas),
      apiGetPrimeiroValidoHome(endpointsDespesas)
    ]);

    let receitas = transformarEmArrayHome(receitasApi)
      .map((item) => normalizarItemHome(item, "receita"))
      .filter((item) => !itemEstaExcluidoHome(item, "receita"));

    let despesas = transformarEmArrayHome(despesasApi)
      .map((item) => normalizarItemHome(item, "despesa"))
      .filter((item) => !itemEstaExcluidoHome(item, "despesa"));

    if (!usuarioPertenceFamiliaHome) {
      receitas = receitas.filter(itemPertenceUsuarioLogadoHome);
      despesas = despesas.filter(itemPertenceUsuarioLogadoHome);
    }

    receitas = removerDuplicadosHome(receitas);
    despesas = removerDuplicadosHome(despesas);

    calcularResumoMesAtualHome(receitas, despesas);
  } catch (erro) {
    console.error("Erro ao carregar dados financeiros da Home:", erro);
    atualizarResumoHome(0, 0);
  } finally {
    carregandoHome = false;
  }
}

function calcularResumoMesAtualHome(receitas, despesas) {
  const listaReceitas = removerDuplicadosHome(transformarEmArrayHome(receitas));
  const listaDespesas = removerDuplicadosHome(transformarEmArrayHome(despesas));

  let totalReceitas = 0;
  let totalDespesas = 0;

  listaReceitas.forEach((receita) => {
    totalReceitas += pegarValorHome(receita);
  });

  listaDespesas.forEach((despesa) => {
    totalDespesas += pegarValorHome(despesa);
  });

  atualizarResumoHome(totalReceitas, totalDespesas);
}

function atualizarResumoHome(receitas, despesas) {
  const totalReceitas = Number(receitas || 0);
  const totalDespesas = Number(despesas || 0);
  const saldo = totalReceitas - totalDespesas;

  const totalReceitasEl = document.getElementById("total-receitas");
  const totalDespesasEl = document.getElementById("total-despesas");

  const valorEl =
    document.getElementById("valor") ||
    document.getElementById("saldo") ||
    document.getElementById("saldo-atual");

  if (totalReceitasEl) {
    totalReceitasEl.textContent = formatarMoedaHome(totalReceitas);
  }

  if (totalDespesasEl) {
    totalDespesasEl.textContent = formatarMoedaHome(totalDespesas);
  }

  if (valorEl) {
    valorEl.textContent = formatarMoedaHome(saldo);
  }

  atualizarSaldoVisualHome(saldo);
  atualizarOrcamentoHome(totalDespesas, totalReceitas);
}

function atualizarSaldoVisualHome(saldo) {
  const valorEl =
    document.getElementById("valor") ||
    document.getElementById("saldo") ||
    document.getElementById("saldo-atual");

  const mensagem = document.getElementById("mensagem-saldo");
  const seta = document.getElementById("seta");

  if (!valorEl || !mensagem || !seta) return;

  valorEl.classList.remove("positivo", "negativo");
  mensagem.classList.remove("positivo", "negativo");
  seta.classList.remove("seta-positiva", "seta-negativa");

  if (saldo >= 0) {
    valorEl.classList.add("positivo");

    mensagem.textContent = "Seu saldo está positivo!";
    mensagem.classList.add("positivo");

    seta.textContent = "↑";
    seta.classList.add("seta-positiva");
  } else {
    valorEl.classList.add("negativo");

    mensagem.textContent = "Atenção! Você está no negativo";
    mensagem.classList.add("negativo");

    seta.textContent = "↓";
    seta.classList.add("seta-negativa");
  }
}

function atualizarOrcamentoHome(despesas, receitas) {
  const barra = document.getElementById("orcamento");
  const texto = document.getElementById("texto-orcamento");

  if (!barra || !texto) return;

  const limite = Number(receitas || 0) * 0.8;

  const porcentagem =
    limite > 0
      ? Math.min(Math.round((Number(despesas || 0) / limite) * 100), 100)
      : 0;

  barra.value = porcentagem;
  texto.textContent = `${porcentagem}% do limite`;
}

window.carregarDadosFinanceiros = carregarDadosFinanceiros;
window.recarregarHome = carregarDadosFinanceiros;
window.carregarUsuarioHome = carregarUsuarioHome;