const API_DADOS_URL = "https://www.manage-control-dev.com.br/api/v1";

const CORES_CATEGORIA_API_PDF = {
  categoryBrown: "#4B2B0A",
  categoryOrange: "#FF7700",
  categoryPink: "#DA4175",
  categoryPurple: "#7B55E3",
  categoryGray: "#4F595B",
  categoryBlue: "#00CCFF",
  categoryGreen: "#44B948",
  categoryYellow: "#E1CC0A",

  brown: "#4B2B0A",
  orange: "#FF7700",
  pink: "#DA4175",
  purple: "#7B55E3",
  gray: "#4F595B",
  blue: "#00CCFF",
  green: "#44B948",
  yellow: "#E1CC0A"
};

const CORES_CATEGORIA_NOME_PDF = {
  alimentacao: "#00CCFF",
  alimentação: "#00CCFF",
  assinaturas: "#FF7700",
  assinatura: "#FF7700",
  "contas pessoais": "#DA4175",
  contas: "#DA4175",
  educacao: "#E1CC0A",
  educação: "#E1CC0A",
  lazer: "#7B55E3",
  saude: "#44B948",
  saúde: "#44B948",
  outros: "#4F595B",
  outro: "#4F595B",
  moradia: "#4B2B0A",
  transporte: "#00CCFF",
  "cartao de credito": "#7B55E3",
  "cartão de crédito": "#7B55E3",
  "cartao de debito": "#E1CC0A",
  "cartão de débito": "#E1CC0A"
};

document.addEventListener("DOMContentLoaded", () => {
  configurarCardDados();
});

function configurarCardDados() {
  configurarBotaoExportarDados();
  configurarBotaoLimparDados();
}

function configurarBotaoExportarDados() {
  const btnExportarOriginal = document.getElementById("btn-exportar-dados");

  if (!btnExportarOriginal) return;

  const btnExportar = btnExportarOriginal.cloneNode(true);
  btnExportarOriginal.parentNode.replaceChild(btnExportar, btnExportarOriginal);

  btnExportar.setAttribute("type", "button");

  btnExportar.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    await gerarRelatorioFinanceiroPDF();
  });
}

function configurarBotaoLimparDados() {
  const btnLimpar = document.getElementById("btn-limpar-dados");

  const popup = document.getElementById("popup-dados");
  const btnCancelar = document.getElementById("btn-cancelar-dados");
  const btnConfirmar = document.getElementById("btn-confirmar-dados");

  if (btnLimpar) {
    btnLimpar.setAttribute("type", "button");

    btnLimpar.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (popup) {
        popup.classList.add("ativo");
      }
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      if (popup) {
        popup.classList.remove("ativo");
      }
    });
  }

  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", () => {
      limparDadosLocais();

      if (popup) {
        popup.classList.remove("ativo");
      }

      mostrarToastDados("Dados locais removidos com sucesso!");

      setTimeout(() => {
        window.location.reload();
      }, 900);
    });
  }

  if (popup) {
    popup.addEventListener("click", (event) => {
      if (event.target === popup) {
        popup.classList.remove("ativo");
      }
    });
  }
}

function getTokenDados() {
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

function getPayloadTokenDados() {
  const token = getTokenDados();

  if (!token || !token.includes(".")) {
    return {};
  }

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function getEmailUsuarioDados() {
  const payload = getPayloadTokenDados();

  return String(
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    payload.email ||
    payload.user_email ||
    ""
  )
    .toLowerCase()
    .trim();
}

function getIdUsuarioDados() {
  const payload = getPayloadTokenDados();

  return (
    payload.user_id ||
    payload.userId ||
    payload.id ||
    payload.sub ||
    null
  );
}

function getUserKeyDados(email = null) {
  const emailFinal = email || getEmailUsuarioDados() || "usuario";

  return `fambudget_${String(emailFinal).toLowerCase().trim()}`;
}

function getNomeUsuarioDados() {
  const email = getEmailUsuarioDados();
  const userKey = getUserKeyDados(email);

  return (
    localStorage.getItem(`${userKey}_nicknameUsuario`) ||
    sessionStorage.getItem(`${userKey}_nicknameUsuario`) ||
    localStorage.getItem(`${userKey}_nomeUsuario`) ||
    sessionStorage.getItem(`${userKey}_nomeUsuario`) ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    "Usuário"
  );
}

function headersDados(json = false) {
  const token = getTokenDados();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function lerRespostaDados(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiGetDados(path) {
  const token = getTokenDados();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_DADOS_URL}${path}`, {
      method: "GET",
      cache: "no-store",
      headers: headersDados(false)
    });

    const data = await lerRespostaDados(response);

    if (!response.ok) {
      console.warn("GET DADOS falhou:", path, response.status, data);
      return null;
    }

    return data?.data || data;
  } catch (erro) {
    console.warn("Erro ao buscar dados:", path, erro);
    return null;
  }
}

function transformarEmArrayDados(resposta) {
  if (!resposta) return [];

  if (Array.isArray(resposta)) return resposta;

  const possibilidades = [
    resposta.data,
    resposta.items,
    resposta.results,
    resposta.content,
    resposta.list,
    resposta.lista,

    resposta.incomes,
    resposta.receitas,
    resposta.revenues,

    resposta.expenses,
    resposta.despesas,

    resposta.categories,
    resposta.categorias,

    resposta.default,
    resposta.defaults,
    resposta.user,
    resposta.usuario,

    resposta.family?.categories,
    resposta.family?.categorias,
    resposta.familia?.categories,
    resposta.familia?.categorias,

    resposta.data?.items,
    resposta.data?.results,
    resposta.data?.content,
    resposta.data?.list,
    resposta.data?.lista,

    resposta.data?.incomes,
    resposta.data?.receitas,
    resposta.data?.revenues,

    resposta.data?.expenses,
    resposta.data?.despesas,

    resposta.data?.categories,
    resposta.data?.categorias,

    resposta.data?.default,
    resposta.data?.defaults,
    resposta.data?.user,
    resposta.data?.usuario,

    resposta.data?.family?.categories,
    resposta.data?.family?.categorias,
    resposta.data?.familia?.categories,
    resposta.data?.familia?.categorias
  ];

  return possibilidades.find((item) => Array.isArray(item)) || [];
}

function getMembersFromResponseDados(data) {
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

async function obterFamiliaDados() {
  const resposta = await apiGetDados("/family");

  if (!resposta) {
    return {
      emFamilia: false,
      familyId: null,
      dados: null,
      membros: []
    };
  }

  const membros = getMembersFromResponseDados(resposta);

  const familyId =
    resposta?.id ||
    resposta?.familyId ||
    resposta?.family_id ||
    resposta?.familiaId ||
    resposta?.familia_id ||
    resposta?.family?.id ||
    resposta?.familia?.id ||
    resposta?.data?.id ||
    resposta?.data?.familyId ||
    null;

  return {
    emFamilia: Boolean(familyId || membros.length > 0 || resposta),
    familyId,
    dados: resposta,
    membros
  };
}

function formatarNicknamePDF(nome) {
  const texto = String(nome || "").trim();

  if (!texto) return "Usuário";

  const primeiroNome = texto.split(" ")[0];

  return primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
}

function pegarIdMembroPDF(membro) {
  return (
    membro?.userId ||
    membro?.user_id ||
    membro?.memberUserId ||
    membro?.member_user_id ||
    membro?.familyUserId ||
    membro?.family_user_id ||
    membro?.userCreatedFamilyId ||
    membro?.user_created_family_id ||
    membro?.user?.id ||
    membro?.user?.userId ||
    membro?.user?.user_id ||
    membro?.usuario?.id ||
    membro?.usuario?.userId ||
    membro?.usuario?.user_id ||
    membro?.member?.id ||
    membro?.member?.userId ||
    membro?.member?.user_id ||
    membro?.familyUser?.id ||
    membro?.familyUser?.userId ||
    membro?.familyUser?.user_id ||
    membro?.id ||
    null
  );
}

function pegarEmailMembroPDF(membro) {
  return String(
    membro?.email ||
    membro?.userEmail ||
    membro?.emailUser ||
    membro?.user_email ||
    membro?.email_user ||
    membro?.user?.email ||
    membro?.user?.userEmail ||
    membro?.usuario?.email ||
    membro?.usuario?.userEmail ||
    membro?.member?.email ||
    membro?.member?.userEmail ||
    membro?.familyUser?.email ||
    membro?.familyUser?.userEmail ||
    ""
  )
    .toLowerCase()
    .trim();
}

function pegarNomeMembroPDF(membro) {
  const nome =
    membro?.nickname ||
    membro?.nickName ||
    membro?.apelido ||
    membro?.user?.nickname ||
    membro?.user?.nickName ||
    membro?.user?.apelido ||
    membro?.usuario?.nickname ||
    membro?.usuario?.nickName ||
    membro?.usuario?.apelido ||
    membro?.member?.nickname ||
    membro?.member?.nickName ||
    membro?.member?.apelido ||
    membro?.familyUser?.nickname ||
    membro?.familyUser?.nickName ||
    membro?.familyUser?.apelido ||
    membro?.name ||
    membro?.nome ||
    membro?.username ||
    membro?.email ||
    membro?.user?.name ||
    membro?.user?.nome ||
    membro?.user?.username ||
    membro?.user?.email ||
    membro?.usuario?.name ||
    membro?.usuario?.nome ||
    membro?.usuario?.username ||
    membro?.usuario?.email ||
    membro?.member?.name ||
    membro?.member?.nome ||
    membro?.member?.username ||
    membro?.member?.email ||
    membro?.familyUser?.name ||
    membro?.familyUser?.nome ||
    membro?.familyUser?.username ||
    membro?.familyUser?.email ||
    "";

  return formatarNicknamePDF(nome);
}

function buscarNomeMembroPorIdOuEmailPDF(idUsuario, emailUsuario, membros = []) {
  const id = idUsuario ? String(idUsuario) : "";
  const email = String(emailUsuario || "").toLowerCase().trim();

  const membro = membros.find((item) => {
    const idMembro = pegarIdMembroPDF(item);
    const emailMembro = pegarEmailMembroPDF(item);

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

  return pegarNomeMembroPDF(membro);
}

function pegarNomeAutorPDF(item, membros = []) {
  const nomeDireto =
    item?.autorNickname ||
    item?.nicknameUsuario ||
    item?.nomeUsuario ||
    item?.createdByNickname ||
    item?.createdByName ||
    item?.createdBy?.nickname ||
    item?.createdBy?.nickName ||
    item?.createdBy?.name ||
    item?.createdBy?.nome ||
    item?.user?.nickname ||
    item?.user?.nickName ||
    item?.user?.name ||
    item?.user?.nome ||
    item?.usuario?.nickname ||
    item?.usuario?.nickName ||
    item?.usuario?.name ||
    item?.usuario?.nome ||
    "";

  if (nomeDireto) {
    return formatarNicknamePDF(nomeDireto);
  }

  const idDono =
    item?.autorId ||
    item?.userId ||
    item?.user_id ||
    item?.usuarioId ||
    item?.usuario_id ||
    item?.createdById ||
    item?.created_by_id ||
    item?.userCreatedFamilyId ||
    item?.user_created_family_id ||
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
    item?.user?.email ||
    item?.usuario?.email ||
    ""
  )
    .toLowerCase()
    .trim();

  const nomePeloMembro = buscarNomeMembroPorIdOuEmailPDF(idDono, emailDono, membros);

  if (nomePeloMembro) {
    return formatarNicknamePDF(nomePeloMembro);
  }

  if (emailDono) {
    return formatarNicknamePDF(emailDono.split("@")[0]);
  }

  return idDono ? `Usuário ${idDono}` : formatarNicknamePDF(getNomeUsuarioDados());
}

async function carregarCategoriasDados() {
  const resposta = await apiGetDados("/category/user");
  const lista = transformarEmArrayDados(resposta);

  const categorias = lista
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

      const corClasse =
        item?.color ||
        item?.cor ||
        item?.colorName ||
        item?.color_name ||
        item?.typeColor ||
        item?.type_color ||
        item?.style ||
        item?.categoryColor ||
        item?.category_color ||
        "";

      const corHex =
        item?.hexColor ||
        item?.hex_color ||
        item?.colorHex ||
        item?.color_hex ||
        item?.backgroundColor ||
        item?.background_color ||
        "";

      return {
        id: Number(id),
        nome: String(nome || "").trim(),
        cor: obterCorCategoriaPDF(nome, corClasse, corHex),
        corClasse
      };
    })
    .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.nome);

  return categorias;
}

function pegarCategoriaIdDados(item) {
  const ids = [
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

  for (const id of ids) {
    const numero = Number(id);

    if (Number.isInteger(numero) && numero > 0) {
      return numero;
    }
  }

  return null;
}

function pegarNomeCategoriaPorIdDados(categoriaId, categorias) {
  const id = Number(categoriaId);

  if (!Number.isInteger(id) || id <= 0) return "";

  const categoria = categorias.find((item) => Number(item.id) === id);

  return categoria?.nome || "";
}

function pegarCategoriaPorIdDados(categoriaId, categorias) {
  const id = Number(categoriaId);

  if (!Number.isInteger(id) || id <= 0) return null;

  return categorias.find((item) => Number(item.id) === id) || null;
}

function inferirCategoriaPorDescricaoPDF(item) {
  const texto = normalizarTextoPDF(
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
    return {
      nome: "Alimentação",
      cor: "#00CCFF"
    };
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
    return {
      nome: "Transporte",
      cor: "#00CCFF"
    };
  }

  if (
    texto.includes("cinema") ||
    texto.includes("cine") ||
    texto.includes("show") ||
    texto.includes("jogo") ||
    texto.includes("lazer")
  ) {
    return {
      nome: "Lazer",
      cor: "#7B55E3"
    };
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
    return {
      nome: "Saúde",
      cor: "#44B948"
    };
  }

  if (
    texto.includes("aluguel") ||
    texto.includes("casa") ||
    texto.includes("moradia")
  ) {
    return {
      nome: "Moradia",
      cor: "#4B2B0A"
    };
  }

  return null;
}

function obterCorCategoriaPDF(nome, corClasse = "", corHex = "") {
  const hex = String(corHex || "").trim();

  if (/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
    return hex;
  }

  const classe = String(corClasse || "").trim();

  if (CORES_CATEGORIA_API_PDF[classe]) {
    return CORES_CATEGORIA_API_PDF[classe];
  }

  const chave = normalizarTextoPDF(nome);

  return CORES_CATEGORIA_NOME_PDF[chave] || "#4F595B";
}

function converterHexParaRgbPDF(hex) {
  let cor = String(hex || "").replace("#", "").trim();

  if (cor.length === 3) {
    cor = cor
      .split("")
      .map((letra) => letra + letra)
      .join("");
  }

  if (cor.length !== 6) {
    return { r: 79, g: 89, b: 91 };
  }

  return {
    r: parseInt(cor.substring(0, 2), 16),
    g: parseInt(cor.substring(2, 4), 16),
    b: parseInt(cor.substring(4, 6), 16)
  };
}

async function buscarDadosFinanceirosParaPDF() {
  const familia = await obterFamiliaDados();
  const categorias = await carregarCategoriasDados();

  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();

  let receitasResposta = [];
  let despesasResposta = [];

  if (familia.emFamilia && familia.familyId) {
    const [receitasFamilia, despesasFamilia] = await Promise.all([
      apiGetDados(`/income/family/${familia.familyId}?month=${mes}&year=${ano}`),
      apiGetDados(`/expense/family/${familia.familyId}?month=${mes}&year=${ano}`)
    ]);

    receitasResposta = transformarEmArrayDados(receitasFamilia);
    despesasResposta = transformarEmArrayDados(despesasFamilia);

  } else {
    const [receitasUsuario, despesasUsuario] = await Promise.all([
      apiGetDados(`/income/user?month=${mes}&year=${ano}`),
      apiGetDados(`/expense/user?month=${mes}&year=${ano}`)
    ]);

    receitasResposta = transformarEmArrayDados(receitasUsuario);
    despesasResposta = transformarEmArrayDados(despesasUsuario);

  }

  let receitas = transformarEmArrayDados(receitasResposta)
    .map((item) => normalizarItemPDF(item, "receita", categorias));

  let despesas = transformarEmArrayDados(despesasResposta)
    .map((item) => normalizarItemPDF(item, "despesa", categorias));

  despesas = aplicarEdicoesLocaisPDF(despesas);

  receitas = receitas.filter((item) => !receitaFoiExcluidaPDF(item));
  despesas = despesas.filter((item) => !despesaFoiExcluidaPDF(item));

  if (!familia.emFamilia) {
    receitas = receitas.filter(itemPertenceAoUsuarioLogadoPDF);
    despesas = despesas.filter(itemPertenceAoUsuarioLogadoPDF);
  }

  receitas = removerDuplicadosPDF(receitas);
  despesas = removerDuplicadosPDF(despesas);

  return {
    emFamilia: familia.emFamilia,
    familyId: familia.familyId,
    familia: familia.dados,
    membros: familia.membros || [],
    receitas,
    despesas,
    categorias
  };
}

function normalizarItemPDF(item, tipoPadrao, categorias) {
  const tipo = tipoPadrao === "receita" ? "receita" : "despesa";

  const categoriaId = pegarCategoriaIdDados(item);
  const categoriaAPI = pegarCategoriaPorIdDados(categoriaId, categorias);

  const categoriaObj =
    typeof item?.category === "object"
      ? item.category
      : typeof item?.categoria === "object"
        ? item.categoria
        : null;

  const categoriaInferida = inferirCategoriaPorDescricaoPDF(item);

  let nomeCategoria = "Outros";

  if (tipo === "receita") {
    nomeCategoria = "Receita";
  } else if (categoriaObj) {
    nomeCategoria =
      categoriaObj?.name ||
      categoriaObj?.nome ||
      categoriaObj?.description ||
      categoriaObj?.descricao ||
      categoriaAPI?.nome ||
      categoriaInferida?.nome ||
      "Outros";
  } else {
    nomeCategoria =
      item?.categoriaNome ||
      item?.nomeCategoria ||
      item?.categoryName ||
      item?.category_name ||
      item?.descriptionCategory ||
      item?.typeCategory ||
      item?.nameCategory ||
      categoriaAPI?.nome ||
      (
        typeof item?.categoria === "string" &&
        isNaN(Number(item.categoria))
          ? item.categoria
          : ""
      ) ||
      (
        typeof item?.category === "string" &&
        isNaN(Number(item.category))
          ? item.category
          : ""
      ) ||
      categoriaInferida?.nome ||
      "Outros";
  }

  const corCategoria =
    tipo === "receita"
      ? "#22c55e"
      : (
          item?.corCategoria ||
          item?.categoryColor ||
          item?.colorCategory ||
          categoriaAPI?.cor ||
          categoriaInferida?.cor ||
          obterCorCategoriaPDF(nomeCategoria)
        );

  const data =
    item?.dateInitial ||
    item?.data ||
    item?.date ||
    item?.createdAt ||
    item?.created_at ||
    item?.paymentDate ||
    item?.dueDate ||
    item?.transactionDate ||
    "";

  const valor = pegarValorPDF(item);

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

    income_id:
      item?.income_id ||
      item?.incomeId ||
      (tipo === "receita" ? item?.id : null) ||
      null,

    expenseId:
      item?.expenseId ||
      item?.expense_id ||
      (tipo === "despesa" ? item?.id : null) ||
      null,

    expense_id:
      item?.expense_id ||
      item?.expenseId ||
      (tipo === "despesa" ? item?.id : null) ||
      null,

    tipo,
    data,
    dateInitial: data,
    valor,
    value: valor,
    amount: valor,

    descricao:
      item?.description ||
      item?.descricao ||
      item?.name ||
      item?.nome ||
      item?.title ||
      "Sem descrição",

    description:
      item?.description ||
      item?.descricao ||
      item?.name ||
      item?.nome ||
      item?.title ||
      "Sem descrição",

    categoria: String(nomeCategoria),
    category: String(nomeCategoria),
    categoryName: String(nomeCategoria),
    nomeCategoria: String(nomeCategoria),

    categoriaId,
    categoryId: categoriaId,

    corCategoria,

    autorId:
      item?.autorId ||
      item?.userId ||
      item?.user_id ||
      item?.usuarioId ||
      item?.usuario_id ||
      item?.createdById ||
      item?.created_by_id ||
      item?.userCreatedFamilyId ||
      item?.user_created_family_id ||
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
      item?.user?.email ||
      item?.usuario?.email ||
      ""
  };
}

function pegarValorPDF(item) {
  const valorBruto =
    item?.value ??
    item?.valor ??
    item?.amount ??
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

function converterDataPDF(dataValor) {
  if (!dataValor) return null;

  const texto = String(dataValor).trim();

  if (texto.includes("-")) {
    const partes = texto.split("T")[0].split("-");

    if (partes.length === 3) {
      return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 12, 0, 0);
    }
  }

  if (texto.includes("/")) {
    const partes = texto.split("/");

    if (partes.length === 3) {
      return new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]), 12, 0, 0);
    }
  }

  const data = new Date(texto);

  return isNaN(data.getTime()) ? null : data;
}

function formatarDataPDF(dataValor) {
  const data = converterDataPDF(dataValor);

  if (!data) return "-";

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

function formatarDataISOPDF(dataValor) {
  const data = converterDataPDF(dataValor);

  if (!data) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarMoedaPDF(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function normalizarTextoPDF(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function itemPertenceAoUsuarioLogadoPDF(item) {
  const idAtual = getIdUsuarioDados();
  const emailAtual = getEmailUsuarioDados();

  const idDono =
    item?.autorId ||
    item?.userId ||
    item?.user_id ||
    item?.usuarioId ||
    item?.usuario_id ||
    item?.createdById ||
    item?.created_by_id ||
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
    item?.user?.email ||
    item?.usuario?.email ||
    ""
  )
    .toLowerCase()
    .trim();

  if (idAtual && idDono && String(idAtual) === String(idDono)) return true;
  if (emailAtual && emailDono && emailAtual === emailDono) return true;

  if (!idDono && !emailDono) return true;

  return false;
}

function getChaveDespesasEditadasPDF() {
  return `${getUserKeyDados()}_despesasEditadasLocalmente`;
}

function lerDespesasEditadasLocalmentePDF() {
  try {
    const dados = localStorage.getItem(getChaveDespesasEditadasPDF());
    if (!dados) return [];

    const lista = JSON.parse(dados);

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function criarChaveEdicaoDespesaPDF(item) {
  return String(
    item?.expenseId ||
    item?.expense_id ||
    item?.id ||
    ""
  );
}

function aplicarEdicoesLocaisPDF(lista) {
  const editadas = lerDespesasEditadasLocalmentePDF();

  if (!editadas.length) return lista;

  return lista.map((despesa) => {
    if (despesa.tipo !== "despesa") return despesa;

    const chaveDespesa = criarChaveEdicaoDespesaPDF(despesa);

    const editada = editadas.find((item) => {
      return criarChaveEdicaoDespesaPDF(item) === chaveDespesa;
    });

    return editada ? { ...despesa, ...editada } : despesa;
  });
}

function lerListaStoragePDF(chave) {
  try {
    const lista = JSON.parse(localStorage.getItem(chave) || "[]");

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function lerReceitasExcluidasPDF() {
  return [
    ...lerListaStoragePDF("receitasExcluidas"),
    ...lerListaStoragePDF(`${getUserKeyDados()}_receitasExcluidas`)
  ];
}

function lerDespesasExcluidasPDF() {
  return [
    ...lerListaStoragePDF("despesasExcluidas"),
    ...lerListaStoragePDF(`${getUserKeyDados()}_despesasExcluidas`)
  ];
}

function receitaFoiExcluidaPDF(item) {
  if (!item || item.tipo !== "receita") return false;

  const excluidas = lerReceitasExcluidasPDF();

  const idsItem = [
    item.id,
    item.incomeId,
    item.income_id,
    item.transactionId,
    item.transaction_id
  ]
    .filter(Boolean)
    .map(String);

  const descricaoItem = normalizarTextoPDF(item.description || item.descricao || "");
  const valorItem = Number(item.value ?? item.valor ?? item.amount ?? 0);

  return excluidas.some((excluida) => {
    const idsExcluidos = [
      excluida.id,
      excluida.incomeId,
      excluida.income_id,
      ...(Array.isArray(excluida.ids) ? excluida.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    if (
      idsItem.length &&
      idsExcluidos.length &&
      idsItem.some((id) => idsExcluidos.includes(id))
    ) {
      return true;
    }

    const descricaoExcluida = normalizarTextoPDF(excluida.description || excluida.descricao || "");
    const valorExcluido = Number(excluida.value ?? excluida.valor ?? excluida.amount ?? 0);

    return (
      descricaoItem &&
      descricaoItem === descricaoExcluida &&
      Number(valorItem || 0).toFixed(2) === Number(valorExcluido || 0).toFixed(2)
    );
  });
}

function despesaFoiExcluidaPDF(item) {
  if (!item || item.tipo !== "despesa") return false;

  const excluidas = lerDespesasExcluidasPDF();

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

  const descricaoItem = normalizarTextoPDF(
    item.description ||
    item.descricao ||
    item.name ||
    item.nome ||
    ""
  );

  const valorItem = Number(
    item.value ??
    item.valor ??
    item.amount ??
    item.total ??
    0
  );

  const dataItem = formatarDataISOPDF(
    item.dateInitial ||
    item.data ||
    item.date ||
    ""
  );

  return excluidas.some((excluida) => {
    const idsExcluidos = [
      excluida.id,
      excluida.expenseId,
      excluida.expense_id,
      excluida.compraId,
      excluida.purchaseId,
      ...(Array.isArray(excluida.ids) ? excluida.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    if (
      idsItem.length &&
      idsExcluidos.length &&
      idsItem.some((id) => idsExcluidos.includes(id))
    ) {
      return true;
    }

    const descricaoExcluida = normalizarTextoPDF(
      excluida.description ||
      excluida.descricao ||
      excluida.name ||
      excluida.nome ||
      ""
    );

    const valorExcluido = Number(
      excluida.value ??
      excluida.valor ??
      excluida.amount ??
      excluida.total ??
      0
    );

    const dataExcluida = formatarDataISOPDF(
      excluida.dateInitial ||
      excluida.data ||
      excluida.date ||
      ""
    );

    return (
      descricaoItem &&
      descricaoItem === descricaoExcluida &&
      Number(valorItem || 0).toFixed(2) === Number(valorExcluido || 0).toFixed(2) &&
      dataItem &&
      dataExcluida &&
      dataItem === dataExcluida
    );
  });
}

function criarChaveDuplicadoPDF(item) {
  const id =
    item?.expenseId ||
    item?.expense_id ||
    item?.incomeId ||
    item?.income_id ||
    item?.id ||
    "";

  if (id) {
    return `${item.tipo}|${id}`;
  }

  return [
    item.tipo,
    formatarDataISOPDF(item.data),
    normalizarTextoPDF(item.descricao),
    normalizarTextoPDF(item.categoria),
    Number(item.valor || 0).toFixed(2)
  ].join("|");
}

function removerDuplicadosPDF(lista) {
  const mapa = new Map();

  lista.forEach((item) => {
    const chave = criarChaveDuplicadoPDF(item);

    if (!mapa.has(chave)) {
      mapa.set(chave, item);
    }
  });

  return Array.from(mapa.values());
}

async function gerarRelatorioFinanceiroPDF() {
  const token = getTokenDados();
  const btnExportar = document.getElementById("btn-exportar-dados");

  if (!token) {
    mostrarToastDados("Sessão expirada. Faça login novamente.", "erro");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);

    return;
  }

  try {
    if (btnExportar) {
      btnExportar.disabled = true;
      btnExportar.textContent = "Gerando...";
    }

    mostrarToastDados("Gerando relatório financeiro...");

    const dados = await buscarDadosFinanceirosParaPDF();

    const JsPDFClass = window.jspdf?.jsPDF || window.jsPDF;

    if (!JsPDFClass) {
      mostrarToastDados(
        "Biblioteca jsPDF não carregada. Verifique o script no HTML.",
        "erro"
      );
      return;
    }

    await gerarPDFComJsPDF(dados);

    mostrarToastDados("Relatório financeiro baixado com sucesso!");
  } catch (erro) {
    console.error("Erro ao gerar relatório financeiro:", erro);
    mostrarToastDados("Não foi possível gerar o relatório financeiro.", "erro");
  } finally {
    if (btnExportar) {
      btnExportar.disabled = false;
      btnExportar.textContent = "Exportar";
    }
  }
}

function obterPeriodoAtualPDF() {
  const hoje = new Date();

  return {
    mes: hoje.getMonth(),
    ano: hoje.getFullYear()
  };
}

function filtrarPorMesAtualPDF(lista) {
  const periodo = obterPeriodoAtualPDF();

  return lista.filter((item) => {
    const data = converterDataPDF(item.data);

    if (!data) return false;

    return (
      data.getMonth() === periodo.mes &&
      data.getFullYear() === periodo.ano
    );
  });
}

async function gerarPDFComJsPDF({ emFamilia, familia, membros, receitas, despesas }) {
  const JsPDFClass = window.jspdf?.jsPDF || window.jsPDF;
  const doc = new JsPDFClass("p", "mm", "a4");

  const logoBase64 = await carregarImagemBase64PDF("imagem/logo_fambudget.png");

  const receitasMes = filtrarPorMesAtualPDF(receitas);
  const despesasMes = filtrarPorMesAtualPDF(despesas);

  const totalReceitas = receitasMes.reduce((soma, item) => soma + Number(item.valor || 0), 0);
  const totalDespesas = despesasMes.reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const totalPago = despesasMes
    .filter((item) => {
      const status = normalizarTextoPDF(item.status || "");

      return (
        item.pago === true ||
        item.paid === true ||
        status === "pago" ||
        status === "paid"
      );
    })
    .reduce((soma, item) => soma + Number(item.valor || 0), 0);

  const totalAPagar = totalDespesas - totalPago;
  const liquido = totalReceitas - totalDespesas;

  const nomeFamilia =
    familia?.name ||
    familia?.nome ||
    familia?.familyName ||
    familia?.data?.name ||
    familia?.data?.nome ||
    "Minha Família";

  let y = 12;

  y = desenharTopoRelatorioPDF(doc, {
    titulo: emFamilia ? "Relatório Familiar" : "Relatório Individual",
    subtitulo: emFamilia ? nomeFamilia : formatarNicknamePDF(getNomeUsuarioDados()),
    logoBase64,
    y
  });

  let membrosCompletos = [];

  if (emFamilia) {
    membrosCompletos = await enriquecerMembrosFamiliaPDF(membros);
    y = desenharMembrosPDF(doc, membrosCompletos, y);
  } else {
    y = desenharUsuarioIndividualPDF(doc, y);
  }

  y = desenharResumoCardsPDF(doc, {
    y,
    totalReceitas,
    totalDespesas,
    totalPago,
    totalAPagar,
    liquido
  });

  y = desenharReceitasPDF(doc, receitasMes, y, membrosCompletos);
  y = desenharDespesasPDF(doc, despesasMes, y, membrosCompletos);

  const nomeArquivo = emFamilia
    ? `relatorio-financeiro-familia-${gerarDataArquivoDados()}.pdf`
    : `relatorio-financeiro-usuario-${gerarDataArquivoDados()}.pdf`;

  doc.save(nomeArquivo);
}

function desenharTopoRelatorioPDF(doc, { titulo, subtitulo, logoBase64, y }) {
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 14, y, 8, 8);
  } else {
    doc.setFillColor(46, 125, 50);
    doc.roundedRect(14, y, 8, 8, 1.5, 1.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4);
    doc.text("FB", 16.1, y + 5.2);
  }

  doc.setTextColor(46, 125, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.2);
  doc.text("FamBudget", 24, y + 5);

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(titulo, 196, y + 5, { align: "right" });

  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(subtitulo || "", 196, y + 10, { align: "right" });

  doc.setDrawColor(229, 231, 235);
  doc.line(14, y + 19, 196, y + 19);

  return y + 30;
}

function desenharTituloSecaoPDF(doc, titulo, y) {
  y = verificarQuebraPaginaPDF(doc, y, 14);

  doc.setFillColor(34, 197, 94);
  doc.rect(14, y - 4, 1.2, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text(titulo, 18, y);

  return y + 8;
}

function desenharUsuarioIndividualPDF(doc, y) {
  y = desenharTituloSecaoPDF(doc, "Dados do Usuário", y);

  y = desenharCabecalhoVerdePDF(doc, y, [
    { texto: "Nome", x: 16 },
    { texto: "Email", x: 72 },
    { texto: "Telefone", x: 154 }
  ]);

  const nome = formatarNicknamePDF(getNomeUsuarioDados());

  const email =
    getEmailUsuarioDados() ||
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    "-";

  const telefone =
    sessionStorage.getItem("telefoneUsuario") ||
    localStorage.getItem(`${getUserKeyDados()}_telefoneUsuario`) ||
    localStorage.getItem("telefoneUsuario") ||
    "-";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(17, 24, 39);

  doc.text(cortarTextoPDF(nome, 30), 16, y);
  doc.text(cortarTextoPDF(email, 42), 72, y);
  doc.text(cortarTextoPDF(telefone, 18), 154, y);

  return y + 11;
}

async function enriquecerMembrosFamiliaPDF(membros) {
  if (!Array.isArray(membros) || !membros.length) return [];

  const resultado = [];

  for (const membro of membros) {
    const telefoneDireto = pegarTelefoneMembroPDF(membro);

    if (telefoneDireto && telefoneDireto !== "-") {
      resultado.push(membro);
      continue;
    }

    const userId = pegarIdMembroPDF(membro);

    if (!userId) {
      resultado.push(membro);
      continue;
    }

    const usuarioCompleto = await buscarUsuarioPorIdPDF(userId);

    resultado.push({
      ...membro,
      usuarioCompleto
    });
  }

  return resultado;
}

async function buscarUsuarioPorIdPDF(userId) {
  try {
    const resposta = await apiGetDados(`/user/${userId}`);
    return resposta?.data || resposta || null;
  } catch (erro) {
    console.warn("Não foi possível buscar usuário por ID para o PDF:", erro);
    return null;
  }
}

function pegarTelefoneMembroPDF(membro) {
  return (
    membro?.phone ||
    membro?.telefone ||
    membro?.telephone ||
    membro?.tel ||
    membro?.celular ||
    membro?.cellphone ||
    membro?.cellPhone ||
    membro?.mobile ||
    membro?.phoneNumber ||
    membro?.phone_number ||
    membro?.numberPhone ||
    membro?.number_phone ||

    membro?.user?.phone ||
    membro?.user?.telefone ||
    membro?.user?.telephone ||
    membro?.user?.celular ||
    membro?.user?.cellphone ||
    membro?.user?.cellPhone ||
    membro?.user?.mobile ||
    membro?.user?.phoneNumber ||
    membro?.user?.phone_number ||
    membro?.user?.numberPhone ||

    membro?.usuario?.phone ||
    membro?.usuario?.telefone ||
    membro?.usuario?.telephone ||
    membro?.usuario?.celular ||
    membro?.usuario?.cellphone ||
    membro?.usuario?.cellPhone ||
    membro?.usuario?.mobile ||
    membro?.usuario?.phoneNumber ||
    membro?.usuario?.phone_number ||
    membro?.usuario?.numberPhone ||

    membro?.usuarioCompleto?.phone ||
    membro?.usuarioCompleto?.telefone ||
    membro?.usuarioCompleto?.telephone ||
    membro?.usuarioCompleto?.tel ||
    membro?.usuarioCompleto?.celular ||
    membro?.usuarioCompleto?.cellphone ||
    membro?.usuarioCompleto?.cellPhone ||
    membro?.usuarioCompleto?.mobile ||
    membro?.usuarioCompleto?.phoneNumber ||
    membro?.usuarioCompleto?.phone_number ||
    membro?.usuarioCompleto?.numberPhone ||
    "-"
  );
}

function desenharMembrosPDF(doc, membros, y) {
  if (!Array.isArray(membros) || !membros.length) return y;

  y = desenharTituloSecaoPDF(doc, "Membros da Família", y);

  y = desenharCabecalhoVerdePDF(doc, y, [
    { texto: "Nome", x: 16 },
    { texto: "Email", x: 72 },
    { texto: "Telefone", x: 154 }
  ]);

  membros.forEach((membro, index) => {
    y = verificarQuebraPaginaPDF(doc, y, 9);

    const nome = pegarNomeMembroPDF(membro);

    const email =
      pegarEmailMembroPDF(membro) ||
      membro?.usuarioCompleto?.email ||
      membro?.usuarioCompleto?.userEmail ||
      "-";

    const telefone = pegarTelefoneMembroPDF(membro);

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4.5, 182, 7, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    doc.setTextColor(17, 24, 39);

    doc.text(cortarTextoPDF(nome, 30), 16, y);
    doc.text(cortarTextoPDF(email, 42), 72, y);
    doc.text(cortarTextoPDF(telefone, 18), 154, y);

    y += 6.2;
  });

  return y + 5;
}

function desenharResumoCardsPDF(doc, resumo) {
  let { y, totalReceitas, totalDespesas, totalPago, totalAPagar, liquido } = resumo;

  y = verificarQuebraPaginaPDF(doc, y, 40);

  const cards = [
    { titulo: "Receitas", valor: totalReceitas, verde: false },
    { titulo: "Despesas", valor: totalDespesas, verde: false },
    { titulo: "Pago", valor: totalPago, verde: false },
    { titulo: "A pagar", valor: totalAPagar, verde: false },
    { titulo: "Líquido", valor: liquido, verde: true }
  ];

  const largura = 87;
  const altura = 17;
  const gapX = 6;
  const gapY = 4;

  let x = 14;
  let linhaY = y;

  cards.forEach((card, index) => {
    if (index === 2) {
      x = 14;
      linhaY += altura + gapY;
    }

    if (index === 4) {
      x = 14;
      linhaY += altura + gapY;
    }

    if (card.verde) {
      doc.setFillColor(34, 166, 82);
      doc.setDrawColor(34, 166, 82);
    } else {
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
    }

    doc.roundedRect(x, linhaY, largura, altura, 2, 2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(card.verde ? 255 : 55, card.verde ? 255 : 65, card.verde ? 255 : 81);
    doc.text(card.titulo, x + 4, linhaY + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(card.verde ? 255 : 17, card.verde ? 255 : 24, card.verde ? 255 : 39);
    doc.text(formatarMoedaPDF(card.valor), x + 4, linhaY + 13);

    x += largura + gapX;
  });

  return linhaY + altura + 12;
}

function desenharReceitasPDF(doc, receitas, y, membros = []) {
  y = desenharTituloSecaoPDF(doc, "Receitas", y);

  y = desenharTabelaFinanceiraPDF(doc, {
    y,
    linhas: receitas,
    membros
  });

  return y + 6;
}

function desenharDespesasPDF(doc, despesas, y, membros = []) {
  y = desenharTituloSecaoPDF(doc, "Despesas", y);

  if (!despesas.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Nenhuma despesa encontrada.", 16, y);
    return y + 12;
  }

  y += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text("Variável", 18, y);

  y += 11;

  const grupos = agruparPorCategoriaPDF(despesas);

  Object.entries(grupos).forEach(([categoria, itens]) => {
    y = verificarQuebraPaginaPDF(doc, y, 42);

    const corCategoria = itens[0]?.corCategoria || obterCorCategoriaPDF(categoria);
    const rgb = converterHexParaRgbPDF(corCategoria);

    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.roundedRect(14, y, 182, 9, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(cortarTextoPDF(categoria, 55), 17, y + 5.7);

    y += 14;

    y = desenharTabelaFinanceiraPDF(doc, {
      y,
      linhas: itens,
      membros
    });

    y += 10;
  });

  return y;
}

function desenharTabelaFinanceiraPDF(doc, { y, linhas, membros = [] }) {
  y = verificarQuebraPaginaPDF(doc, y, 22);

  y = desenharCabecalhoVerdePDF(doc, y, [
    { texto: "Data", x: 16 },
    { texto: "Usuário", x: 56 },
    { texto: "Descrição", x: 118 },
    { texto: "Valor", x: 194, align: "right" }
  ]);

  if (!linhas.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Nenhum registro encontrado.", 16, y);
    return y + 9;
  }

  let total = 0;

  linhas.forEach((item, index) => {
    y = verificarQuebraPaginaPDF(doc, y, 10);

    total += Number(item.valor || 0);

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 8, "F");
    }

    const nomeUsuario = pegarNomeAutorPDF(item, membros);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(17, 24, 39);

    doc.text(formatarDataPDF(item.data), 16, y);
    doc.text(cortarTextoPDF(nomeUsuario, 28), 56, y);
    doc.text(cortarTextoPDF(item.descricao, 34), 118, y);
    doc.text(formatarMoedaPDF(item.valor), 194, y, { align: "right" });

    y += 7;
  });

  doc.setFillColor(243, 244, 246);
  doc.rect(14, y - 5, 182, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);
  doc.text("Total", 118, y);
  doc.text(formatarMoedaPDF(total), 194, y, { align: "right" });

  return y + 10;
}

function desenharCabecalhoVerdePDF(doc, y, colunas) {
  doc.setFillColor(72, 211, 112);
  doc.rect(14, y - 5, 182, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(17, 24, 39);

  colunas.forEach((coluna) => {
    doc.text(coluna.texto, coluna.x, y + 0.7, {
      align: coluna.align || "left"
    });
  });

  return y + 9;
}

function agruparPorCategoriaPDF(despesas) {
  const grupos = {};

  despesas.forEach((item) => {
    const categoria = item.categoria || "Outros";

    if (!grupos[categoria]) {
      grupos[categoria] = [];
    }

    grupos[categoria].push(item);
  });

  return grupos;
}

function verificarQuebraPaginaPDF(doc, y, alturaNecessaria = 20) {
  if (y + alturaNecessaria > 285) {
    doc.addPage();
    return 14;
  }

  return y;
}

function cortarTextoPDF(texto, limite) {
  const valor = String(texto || "");

  return valor.length > limite
    ? `${valor.slice(0, limite - 3)}...`
    : valor;
}


function limparDadosLocais() {
  const email =
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    "usuario";

  const userKey = `fambudget_${String(email).toLowerCase().trim()}`;

  const chavesParaRemover = [
    "transacoes",
    "transactions",
    "despesas",
    "expenses",
    "receitas",
    "incomes",
    "revenues",
    "orcamentos",
    "categorias",
    "extratos",

    `${userKey}_transacoes`,
    `${userKey}_transactions`,
    `${userKey}_despesas`,
    `${userKey}_expenses`,
    `${userKey}_receitas`,
    `${userKey}_incomes`,
    `${userKey}_revenues`,
    `${userKey}_orcamentos`,
    `${userKey}_categorias`,
    `${userKey}_extratos`
  ];

  chavesParaRemover.forEach((chave) => {
    localStorage.removeItem(chave);
    sessionStorage.removeItem(chave);
  });

  localStorage.setItem("dadosAtualizadosEm", String(Date.now()));
}


function gerarDataArquivoDados() {
  const hoje = new Date();

  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();

  return `${dia}-${mes}-${ano}`;
}


function mostrarToastDados(mensagem, tipo = "sucesso") {
  let toast = document.getElementById("toast-dados");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-dados";
    toast.className = "toast-dados";
    document.body.appendChild(toast);
  }

  toast.textContent = mensagem;
  toast.className = "toast-dados ativo";

  if (tipo === "erro") {
    toast.style.background = "#dc2626";
  } else if (tipo === "aviso") {
    toast.style.background = "#f59e0b";
  } else {
    toast.style.background = "#111827";
  }

  setTimeout(() => {
    toast.classList.remove("ativo");
  }, 3200);
}

function carregarImagemBase64PDF(caminho) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const base64 = canvas.toDataURL("image/png");

        resolve(base64);
      } catch (erro) {
        console.warn("Não foi possível carregar a logo no PDF:", erro);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.warn("Logo não encontrada para PDF:", caminho);
      resolve(null);
    };

    img.src = caminho;
  });
}