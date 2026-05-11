console.log("RECEITAS.JS OK - API + EXCLUSÃO + FAMÍLIA + ATUALIZAÇÃO GLOBAL");

const RECEITAS_API_URL = "https://www.manage-control-dev.com.br/api/v1";
const STORAGE_RECEITAS_EXCLUIDAS = "receitasExcluidas";

let receitas = [];
let receitasFiltradas = [];

let usuarioPertenceFamiliaReceita = false;
let mostrarUsuarioReceita = false;

let filtros = {
  tipo: null,
  busca: "",
  data: null
};

let dataMesAtual = new Date();
let paginaAtual = 1;
let itensPorPagina = 8;

let modal;
let btnNova;
let btnCancelar;
let btnSalvar;
let tituloModalReceita;

let inputDesc;
let inputValor;
let inputData;
let checkMensal;

let inputBusca;
let filtroTipo;
let dropdownTipo;

let tabela;
let totalReceitas;
let totalEntradas;
let semDados;
let paginacao;

let btnMesAnterior;
let btnProximoMes;
let textoMesAtual;

let modoEdicaoReceita = false;
let idReceitaEditando = null;
let salvandoReceita = false;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  pegarElementos();
  inserirCssAcoesReceitas();
  criarPopupReceitas();
  configurarMenu();
  configurarEventos();
  configurarControleMes();
  carregarUsuario();

  filtros.data = pegarAnoMesData(dataMesAtual);
  atualizarTextoMes();

  await recarregarReceitasCompleto();
});

window.addEventListener("storage", async (event) => {
  if (!event.key) return;

  if (
    event.key.includes("moedaUsuario") ||
    event.key === STORAGE_RECEITAS_EXCLUIDAS ||
    event.key === getChaveReceitasExcluidas() ||
    event.key.includes("_receitasExcluidas") ||
    event.key === "familiaAtualizadaEm" ||
    event.key === "familiaAtual" ||
    event.key === "membrosFamilia" ||
    event.key === "receitasAtualizadasEm" ||
    event.key === "dadosFinanceirosAtualizadosEm"
  ) {
    await recarregarReceitasCompleto();
  }
});

window.addEventListener("familiaAtualizada", async () => {
  await recarregarReceitasCompleto();
});

window.addEventListener("dadosFinanceirosAtualizados", async () => {
  await recarregarReceitasCompleto();
});

window.addEventListener("focus", async () => {
  await recarregarReceitasCompleto();
});

/* ================= ELEMENTOS ================= */

function pegarElementos() {
  modal = document.getElementById("modalNovaReceita");
  btnNova = document.getElementById("btnNovaReceita");
  btnCancelar = document.getElementById("cancelarReceita");
  btnSalvar = document.getElementById("salvarReceita");
  tituloModalReceita = document.getElementById("tituloModalReceita");

  inputDesc = document.getElementById("descReceita");
  inputValor = document.getElementById("valorReceita");
  inputData = document.getElementById("dataReceita");
  checkMensal = document.getElementById("checkMensal");

  inputBusca = document.getElementById("inputBuscaReceita");

  filtroTipo = document.getElementById("filtroTipo");
  dropdownTipo = document.getElementById("dropdownTipo");

  tabela = document.getElementById("lista-extratos");

  totalReceitas =
    document.getElementById("total-receitas") ||
    document.querySelector(".card-total h2");

  totalEntradas = document.getElementById("total-entradas");
  semDados = document.getElementById("sem-dados");
  paginacao = document.getElementById("paginacao");

  btnMesAnterior = document.getElementById("mes-anterior");
  btnProximoMes = document.getElementById("proximo-mes");
  textoMesAtual = document.getElementById("mes-atual");

  if (inputValor) {
    inputValor.setAttribute("type", "text");
    inputValor.setAttribute("inputmode", "numeric");
    inputValor.setAttribute("autocomplete", "off");
    inputValor.setAttribute("placeholder", "R$ 0,00");
  }
}

/* ================= MENU ================= */

function configurarMenu() {
  document.querySelectorAll(".menu li[data-link]").forEach((item) => {
    item.addEventListener("click", () => {
      window.location.href = item.dataset.link;
    });
  });

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
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
}

/* ================= EVENTOS ================= */

function configurarEventos() {
  if (btnNova) {
    btnNova.addEventListener("click", abrirModalReceita);
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", fecharModalReceita);
  }

  if (btnSalvar) {
    btnSalvar.addEventListener("click", salvarReceita);
  }

  if (inputValor) {
    inputValor.addEventListener("input", () => {
      inputValor.value = aplicarMascaraMoeda(inputValor.value);
    });
  }

  if (inputBusca) {
    inputBusca.addEventListener("input", (event) => {
      filtros.busca = event.target.value.trim();
      paginaAtual = 1;
      aplicarFiltros();
    });
  }

  if (filtroTipo && dropdownTipo) {
    filtroTipo.addEventListener("click", (event) => {
      event.stopPropagation();

      const aberto = dropdownTipo.style.display === "block";
      dropdownTipo.style.display = aberto ? "none" : "block";
      filtroTipo.classList.toggle("ativo", !aberto);
    });

    dropdownTipo.querySelectorAll("[data-tipo]").forEach((item) => {
      item.addEventListener("click", (event) => {
        event.stopPropagation();

        const tipo = item.dataset.tipo;
        filtros.tipo = filtros.tipo === tipo ? null : tipo;

        dropdownTipo.querySelectorAll(".item-filtro").forEach((opcao) => {
          opcao.classList.toggle("ativo", opcao.dataset.tipo === filtros.tipo);
        });

        dropdownTipo.style.display = "none";
        filtroTipo.classList.remove("ativo");

        paginaAtual = 1;
        aplicarFiltros();
      });
    });
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        fecharModalReceita();
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (dropdownTipo && filtroTipo && !filtroTipo.contains(event.target)) {
      dropdownTipo.style.display = "none";
      filtroTipo.classList.remove("ativo");
    }
  });
}

function configurarControleMes() {
  if (btnMesAnterior) {
    btnMesAnterior.addEventListener("click", async () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() - 1);
      filtros.data = pegarAnoMesData(dataMesAtual);
      paginaAtual = 1;

      atualizarTextoMes();

      await carregarReceitasAPI();
      aplicarFiltros();
    });
  }

  if (btnProximoMes) {
    btnProximoMes.addEventListener("click", async () => {
      dataMesAtual.setMonth(dataMesAtual.getMonth() + 1);
      filtros.data = pegarAnoMesData(dataMesAtual);
      paginaAtual = 1;

      atualizarTextoMes();

      await carregarReceitasAPI();
      aplicarFiltros();
    });
  }
}

/* ================= RECARREGAR ================= */

async function recarregarReceitasCompleto() {
  usuarioPertenceFamiliaReceita = await usuarioEstaEmFamiliaReceitas();
  mostrarUsuarioReceita = usuarioPertenceFamiliaReceita;

  atualizarCabecalhoUsuarioReceitas();

  await carregarReceitasAPI();
  aplicarFiltros();
}

/* ================= TOKEN / USUÁRIO ================= */

function getTokenReceitas() {
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

function getPayloadTokenReceita() {
  const token = getTokenReceitas();

  if (!token) return {};

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function getEmailUsuarioAtualReceita() {
  const payload = getPayloadTokenReceita();

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

function getIdUsuarioAtualReceita() {
  const payload = getPayloadTokenReceita();

  return (
    payload.user_id ||
    payload.userId ||
    payload.id ||
    payload.sub ||
    null
  );
}

function getUserKeyReceita(email = null) {
  const emailFinal = email || getEmailUsuarioAtualReceita() || "usuario";

  return `fambudget_${String(emailFinal).toLowerCase().trim()}`;
}

function getChaveUsuarioReceita(chave) {
  return `${getUserKeyReceita()}_${chave}`;
}

function buscarDadoUsuarioReceita(chave, email = null) {
  const userKey = getUserKeyReceita(email);

  return (
    localStorage.getItem(`${userKey}_${chave}`) ||
    sessionStorage.getItem(`${userKey}_${chave}`) ||
    localStorage.getItem(chave) ||
    sessionStorage.getItem(chave) ||
    ""
  );
}

function getNicknameUsuarioAtualReceita() {
  const email = getEmailUsuarioAtualReceita();

  return (
    buscarDadoUsuarioReceita("nicknameUsuario", email) ||
    buscarDadoUsuarioReceita("nomeUsuario", email) ||
    "Usuário"
  );
}

function carregarUsuario() {
  const nome = getNicknameUsuarioAtualReceita();
  const email = getEmailUsuarioAtualReceita();
  const userKey = getUserKeyReceita(email);

  const imagem =
    localStorage.getItem(`${userKey}_avatarUsuario`) ||
    localStorage.getItem(`${userKey}_fotoUsuario`) ||
    localStorage.getItem(`${userKey}_imagemPerfil`) ||
    localStorage.getItem(`${userKey}_fotoPerfil`) ||
    localStorage.getItem(`${userKey}_imagemUsuario`) ||
    sessionStorage.getItem("avatarUsuario") ||
    sessionStorage.getItem("fotoUsuario") ||
    localStorage.getItem("avatarUsuario") ||
    localStorage.getItem("fotoUsuario") ||
    "";

  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) {
    nomeUsuario.textContent = nome;
  }

  corrigirFotoGiganteSoltaReceitas();

  if (avatar) {
    avatar.innerHTML = "";
    avatar.textContent = "";
    avatar.style.setProperty("width", "35px", "important");
    avatar.style.setProperty("height", "35px", "important");
    avatar.style.setProperty("min-width", "35px", "important");
    avatar.style.setProperty("max-width", "35px", "important");
    avatar.style.setProperty("min-height", "35px", "important");
    avatar.style.setProperty("max-height", "35px", "important");
    avatar.style.setProperty("border-radius", "50%", "important");
    avatar.style.setProperty("overflow", "hidden", "important");
    avatar.style.setProperty("display", "flex", "important");
    avatar.style.setProperty("align-items", "center", "important");
    avatar.style.setProperty("justify-content", "center", "important");
    avatar.style.setProperty("flex", "0 0 35px", "important");
    avatar.style.setProperty("background-size", "cover", "important");
    avatar.style.setProperty("background-position", "center", "important");
    avatar.style.setProperty("background-repeat", "no-repeat", "important");

    if (imagem) {
      avatar.style.setProperty("background-image", `url("${imagem}")`, "important");
      avatar.style.color = "transparent";
    } else {
      avatar.style.backgroundImage = "";
      avatar.style.color = "#ffffff";
      avatar.textContent = String(nome || "U").charAt(0).toUpperCase();
    }
  }
}

function corrigirFotoGiganteSoltaReceitas() {
  document
    .querySelectorAll("body > img, .layout > img, .content > img, .main-content > img, .conteudo > img, .topo > img")
    .forEach((img) => {
      const src = img.getAttribute("src") || "";

      if (src.startsWith("data:image")) {
        img.remove();
      }
    });

  ["body", ".layout", ".content", ".main-content", ".conteudo", ".topo"].forEach((seletor) => {
    document.querySelectorAll(seletor).forEach((el) => {
      if (el.id === "avatar" || el.classList.contains("avatar")) return;

      const bgInline = el.style.backgroundImage || "";

      if (
        bgInline.includes("data:image") ||
        bgInline.includes("avatarUsuario") ||
        bgInline.includes("fotoUsuario")
      ) {
        el.style.setProperty("background-image", "none", "important");
      }
    });
  });
}

/* ================= API ================= */

async function lerRespostaReceitas(resposta) {
  const texto = await resposta.text();

  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

function headersReceitas(json = false) {
  const token = getTokenReceitas();

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function apiReceitas(path, options = {}) {
  const token = getTokenReceitas();

  if (!token) {
    mostrarMensagemReceita("Sessão expirada. Faça login novamente.");

    return {
      ok: false,
      status: 401,
      data: null
    };
  }

  try {
    const resposta = await fetch(`${RECEITAS_API_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        ...(options.headers || {})
      }
    });

    const data = await lerRespostaReceitas(resposta);

    if (!resposta.ok) {
      console.warn("API RECEITAS falhou:", path, resposta.status, data);
    }

    return {
      ok: resposta.ok,
      status: resposta.status,
      data
    };
  } catch (erro) {
    console.error("Erro na API de receitas:", erro);

    return {
      ok: false,
      status: 0,
      data: erro
    };
  }
}

function transformarEmArray(resposta) {
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
    resposta.revenues,
    resposta.receitas,

    resposta.data?.items,
    resposta.data?.results,
    resposta.data?.content,
    resposta.data?.list,
    resposta.data?.lista,
    resposta.data?.incomes,
    resposta.data?.revenues,
    resposta.data?.receitas
  ];

  const lista = possibilidades.find((item) => Array.isArray(item));

  return lista || [];
}

async function carregarReceitasAPI() {
  const [ano, mes] = (filtros.data || pegarAnoMesData(dataMesAtual)).split("-");
  const mesNumero = Number(mes);
  const anoNumero = Number(ano);

  /*
    IMPORTANTE:
    Não pode parar no primeiro endpoint OK se ele vier vazio.
    Esse era um dos motivos de aparecer na Home/Relatórios, mas não aparecer em Receitas.
  */
  const tentativas = [
    `/income/user?month=${mesNumero}&year=${anoNumero}`,
    `/income/user?month=${mes}&year=${ano}`,
    `/income/user?mes=${mesNumero}&ano=${anoNumero}`,

    `/income/family?month=${mesNumero}&year=${anoNumero}`,
    `/family/income?month=${mesNumero}&year=${anoNumero}`
  ];

  let listaAPI = [];

  for (const path of tentativas) {
    const resposta = await apiReceitas(path, {
      method: "GET",
      headers: headersReceitas(false)
    });

    if (!resposta.ok) continue;

    const lista = transformarEmArray(resposta.data);

    if (lista.length > 0) {
      listaAPI = lista;
      break;
    }
  }

  receitas = removerDuplicadasReceitas(
    listaAPI
      .map((item, index) => normalizarReceitaAPI(item, index))
      .filter((receita) => !receitaFoiExcluida(receita))
      .filter((receita) => {
        if (usuarioPertenceFamiliaReceita) return true;
        return receitaPertenceAoUsuarioLogado(receita);
      })
  );

  console.log("RECEITAS API USADAS:", receitas);
}

async function criarReceitaAPI(payload) {
  const tentativas = [
    "/income",
    "/income/user"
  ];

  for (const path of tentativas) {
    const resposta = await apiReceitas(path, {
      method: "POST",
      headers: headersReceitas(true),
      body: JSON.stringify(payload)
    });

    if (resposta.ok) {
      return resposta;
    }

    if (resposta.status !== 404 && resposta.status !== 405) {
      return resposta;
    }
  }

  return {
    ok: false,
    status: 404,
    data: "Endpoint de criação de receita não encontrado."
  };
}

async function excluirReceitaAPI(id) {
  const tentativas = [
    `/income/${id}`,
    `/income/user/${id}`
  ];

  for (const path of tentativas) {
    const resposta = await apiReceitas(path, {
      method: "DELETE",
      headers: headersReceitas(false)
    });

    if (resposta.ok) {
      return resposta;
    }

    if (resposta.status !== 404 && resposta.status !== 405) {
      return resposta;
    }
  }

  return {
    ok: false,
    status: 404,
    data: "Receita não encontrada para exclusão."
  };
}

async function excluirReceitaAPI(id) {
  const tentativas = [
    `/income/${id}`,
    `/income/user/${id}`
  ];

  for (const path of tentativas) {
    const resposta = await apiReceitas(path, {
      method: "DELETE",
      headers: headersReceitas(false)
    });

    if (resposta.ok) {
      return resposta;
    }

    if (resposta.status !== 404 && resposta.status !== 405) {
      return resposta;
    }
  }

  return {
    ok: false,
    status: 404,
    data: "Receita não encontrada para exclusão."
  };
}

/* ================= FAMÍLIA ================= */

async function usuarioEstaEmFamiliaReceitas() {
  const token = getTokenReceitas();

  if (!token) return false;

  try {
    const resposta = await fetch(`${RECEITAS_API_URL}/family`, {
      method: "GET",
      cache: "no-store",
      headers: headersReceitas(false)
    });

    if (resposta.status === 404) return false;
    if (!resposta.ok) return false;

    const data = await lerRespostaReceitas(resposta);
    const membros = getMembersFromResponseReceita(data);

    if (!Array.isArray(membros)) return true;

    return membros.length > 0;
  } catch (erro) {
    console.warn("Erro ao verificar família em receitas:", erro);
    return false;
  }
}

function getMembersFromResponseReceita(data) {
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

/* ================= NORMALIZAR RECEITA ================= */

function normalizarReceitaAPI(receita, index = 0) {
  const categoriaObj = receita?.category || receita?.categoria || null;

  const categoria =
    categoriaObj && typeof categoriaObj === "object"
      ? (
          categoriaObj.name ||
          categoriaObj.nome ||
          categoriaObj.description ||
          categoriaObj.descricao ||
          "Receita"
        )
      : (
          receita?.categoria ||
          receita?.category ||
          receita?.categoryName ||
          receita?.category_name ||
          receita?.descriptionCategory ||
          receita?.typeCategory ||
          receita?.nameCategory ||
          receita?.nomeCategoria ||
          "Receita"
        );

  const tipo = normalizarTipoReceita(
    receita?.tipo ||
    receita?.type ||
    receita?.incomeType ||
    receita?.typeIncome ||
    receita?.tipoReceita ||
    "variavel"
  );

  return {
    ...receita,

    id:
      receita?.id ||
      receita?.incomeId ||
      receita?.income_id ||
      receita?.transactionId ||
      receita?.transaction_id ||
      `receita-api-${index}`,

    incomeId:
      receita?.incomeId ||
      receita?.income_id ||
      receita?.id ||
      null,

    descricao:
      receita?.descricao ||
      receita?.description ||
      receita?.name ||
      receita?.nome ||
      receita?.title ||
      "Sem descrição",

    categoria: String(categoria),
    tipo,

    data: normalizarDataISO(
      receita?.dateInitial ||
      receita?.data ||
      receita?.date ||
      receita?.createdAt ||
      receita?.created_at ||
      receita?.dataTransacao ||
      receita?.transactionDate ||
      receita?.receiptDate ||
      ""
    ),

    valor: extrairValorReceita(receita),

    salvarTodoMes:
      receita?.salvarTodoMes ||
      receita?.recorrente ||
      receita?.monthly ||
      receita?.repeatMonthly ||
      false,

    autorId:
      receita?.autorId ||
      receita?.userId ||
      receita?.user_id ||
      receita?.usuarioId ||
      receita?.usuario_id ||
      receita?.createdById ||
      receita?.created_by_id ||
      receita?.ownerId ||
      receita?.owner_id ||
      receita?.createdBy?.id ||
      receita?.user?.id ||
      receita?.usuario?.id ||
      null,

    autorEmail:
      receita?.autorEmail ||
      receita?.userEmail ||
      receita?.user_email ||
      receita?.emailUsuario ||
      receita?.email_usuario ||
      receita?.createdByEmail ||
      receita?.created_by_email ||
      receita?.ownerEmail ||
      receita?.owner_email ||
      receita?.createdBy?.email ||
      receita?.user?.email ||
      receita?.usuario?.email ||
      "",

    autorNickname:
      receita?.autorNickname ||
      receita?.nicknameUsuario ||
      receita?.nomeUsuario ||
      receita?.createdByNickname ||
      receita?.createdByName ||
      receita?.createdBy?.nickname ||
      receita?.createdBy?.name ||
      receita?.user?.nickname ||
      receita?.user?.name ||
      receita?.usuario?.nickname ||
      receita?.usuario?.nome ||
      ""
  };
}

function normalizarTipoReceita(tipo) {
  const texto = normalizarTexto(tipo);

  if (texto === "1" || texto.includes("fix")) return "fixa";
  if (texto === "3" || texto.includes("sazon")) return "sazonal";

  return "variavel";
}

function extrairValorReceita(receita) {
  const valorBruto =
    receita?.amount ??
    receita?.value ??
    receita?.valor ??
    receita?.total ??
    receita?.price ??
    receita?.valorTotal ??
    receita?.totalValue ??
    receita?.totalAmount ??
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

/* ================= FILTROS / RENDER ================= */

function aplicarFiltros() {
  const busca = normalizarTexto(filtros.busca);
  const anoMesAtual = filtros.data || pegarAnoMesData(dataMesAtual);

  receitasFiltradas = receitas.filter((receita) => {
    if (receitaFoiExcluida(receita)) return false;

    if (!usuarioPertenceFamiliaReceita && !receitaPertenceAoUsuarioLogado(receita)) {
      return false;
    }

    if (pegarAnoMes(receita.data) !== anoMesAtual) {
      return false;
    }

    if (filtros.tipo && normalizarTexto(receita.tipo) !== normalizarTexto(filtros.tipo)) {
      return false;
    }

    if (busca) {
      const texto = normalizarTexto(
        `${receita.descricao} ${receita.categoria} ${receita.tipo} ${pegarNomeAutorReceita(receita)}`
      );

      if (!texto.includes(busca)) {
        return false;
      }
    }

    return true;
  });

  renderizarReceitas();
  atualizarTotaisReceitas();
  renderizarPaginacaoReceitas();
}

function renderizarReceitas() {
  if (!tabela) return;

  tabela.innerHTML = "";

  if (!receitasFiltradas.length) {
    if (semDados) semDados.style.display = "block";
    return;
  }

  if (semDados) semDados.style.display = "none";

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const pagina = receitasFiltradas.slice(inicio, fim);

  pagina.forEach((receita) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${formatarDataBR(receita.data)}</td>

      <td>
        <div class="descricao-cell">
          <span class="icone-item icone-receita">↑</span>
          <span>${escapeHTML(receita.descricao)}</span>
        </div>
      </td>

      <td>
        <div class="categoria-cell">
          <span>${escapeHTML(receita.categoria || "Receita")}</span>
        </div>
      </td>

      <td>
        <div class="tipo-cell">
          <span class="ponto-tipo ponto-receita"></span>
          <span>${formatarTipoReceita(receita.tipo)}</span>
        </div>
      </td>

      ${
        mostrarUsuarioReceita
          ? `<td class="usuario-receita">${escapeHTML(pegarNomeAutorReceita(receita))}</td>`
          : ""
      }

      <td class="valor positivo">${formatarMoeda(receita.valor)}</td>

      <td class="acoes-coluna">
        <div class="acoes-receita">
          <button 
            class="btn-acao-receita btn-editar-receita" 
            title="Editar"
            data-id="${receita.id}"
          >
            ✎
          </button>

          <button 
            class="btn-acao-receita btn-excluir-receita" 
            title="Excluir"
            data-id="${receita.id}"
          >
            ×
          </button>
        </div>
      </td>
    `;

    tabela.appendChild(tr);
  });

  tabela.querySelectorAll(".btn-editar-receita").forEach((botao) => {
    botao.addEventListener("click", () => confirmarEditarReceita(botao.dataset.id));
  });

  tabela.querySelectorAll(".btn-excluir-receita").forEach((botao) => {
    botao.addEventListener("click", () => confirmarExcluirReceita(botao.dataset.id));
  });
}

function atualizarTotaisReceitas() {
  const total = receitasFiltradas.reduce((soma, receita) => {
    return soma + Number(receita.valor || 0);
  }, 0);

  if (totalReceitas) totalReceitas.textContent = formatarMoeda(total);
  if (totalEntradas) totalEntradas.textContent = formatarMoeda(total);
}

function atualizarCabecalhoUsuarioReceitas() {
  const linhaCabecalho = document.getElementById("cabecalho-receitas");

  if (!linhaCabecalho) return;

  linhaCabecalho.innerHTML = `
    <th>Data</th>
    <th>Descrição</th>
    <th>Categoria</th>
    <th>Tipo</th>
    ${mostrarUsuarioReceita ? "<th>Usuário</th>" : ""}
    <th class="valor-coluna">Valor</th>
    <th></th>
  `;
}

/* ================= PAGINAÇÃO ================= */

function renderizarPaginacaoReceitas() {
  if (!paginacao) return;

  paginacao.innerHTML = "";

  const totalPaginas = Math.ceil(receitasFiltradas.length / itensPorPagina);

  if (totalPaginas <= 1) return;

  const btnAnterior = document.createElement("button");
  btnAnterior.className = "pagina-btn";
  btnAnterior.textContent = "‹";
  btnAnterior.disabled = paginaAtual === 1;
  btnAnterior.onclick = () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      renderizarReceitas();
      renderizarPaginacaoReceitas();
    }
  };

  paginacao.appendChild(btnAnterior);

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.className = `pagina-numero ${i === paginaAtual ? "ativa" : ""}`;
    btn.textContent = i;

    btn.onclick = () => {
      paginaAtual = i;
      renderizarReceitas();
      renderizarPaginacaoReceitas();
    };

    paginacao.appendChild(btn);
  }

  const btnProximo = document.createElement("button");
  btnProximo.className = "pagina-btn";
  btnProximo.textContent = "›";
  btnProximo.disabled = paginaAtual === totalPaginas;
  btnProximo.onclick = () => {
    if (paginaAtual < totalPaginas) {
      paginaAtual++;
      renderizarReceitas();
      renderizarPaginacaoReceitas();
    }
  };

  paginacao.appendChild(btnProximo);
}

/* ================= MODAL ================= */

function abrirModalReceita() {
  modoEdicaoReceita = false;
  idReceitaEditando = null;

  limparCamposReceita();

  if (tituloModalReceita) tituloModalReceita.textContent = "Nova Receita";
  if (btnSalvar) btnSalvar.textContent = "Salvar";
  if (modal) modal.style.display = "flex";
}

function abrirModalReceitaEdicao() {
  if (tituloModalReceita) tituloModalReceita.textContent = "Editar Receita";
  if (btnSalvar) btnSalvar.textContent = "Atualizar";
  if (modal) modal.style.display = "flex";
}

function fecharModalReceita() {
  if (modal) modal.style.display = "none";

  limparCamposReceita();

  modoEdicaoReceita = false;
  idReceitaEditando = null;

  if (tituloModalReceita) tituloModalReceita.textContent = "Nova Receita";
  if (btnSalvar) btnSalvar.textContent = "Salvar";
}

function limparCamposReceita() {
  if (inputDesc) inputDesc.value = "";
  if (inputValor) inputValor.value = "";
  if (inputData) inputData.value = "";
  if (checkMensal) checkMensal.checked = false;

  const radioFixa = document.querySelector('input[name="tipoReceita"][value="fixa"]');

  if (radioFixa) {
    radioFixa.checked = true;
  }
}

/* ================= SALVAR / EDITAR ================= */

async function salvarReceita() {
  if (salvandoReceita) return;

  salvandoReceita = true;

  try {
    if (modoEdicaoReceita) {
      await atualizarReceitaEditada();
      return;
    }

    const dados = pegarDadosFormularioReceita();

    if (formularioReceitaInvalido(dados)) {
      mostrarMensagemReceita("Preencha descrição, valor e data corretamente!");
      return;
    }

    const payload = montarPayloadReceita(dados);
    const resposta = await criarReceitaAPI(payload);

    if (!resposta.ok) {
      mostrarMensagemReceita(
        pegarMensagemErroReceita(
          resposta.data,
          "Não foi possível salvar a receita."
        )
      );
      return;
    }

    fecharModalReceita();

    await carregarReceitasAPI();
    aplicarFiltros();

    mostrarMensagemReceita("Receita salva com sucesso!");
    avisarHomeSobreAtualizacao();
  } finally {
    salvandoReceita = false;
  }
}

async function atualizarReceitaEditada() {
  const receitaOriginal = receitas.find((receita) => {
    return String(receita.id) === String(idReceitaEditando);
  });

  if (!receitaOriginal) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  const dados = pegarDadosFormularioReceita();

  if (formularioReceitaInvalido(dados)) {
    mostrarMensagemReceita("Preencha descrição, valor e data corretamente!");
    return;
  }

  const payload = montarPayloadReceita(dados);

  const idApi =
    receitaOriginal.incomeId ||
    receitaOriginal.income_id ||
    receitaOriginal.id;

  const resposta = await atualizarReceitaAPI(idApi, payload);

  if (!resposta.ok) {
    mostrarMensagemReceita(
      pegarMensagemErroReceita(
        resposta.data,
        "Não foi possível atualizar a receita."
      )
    );
    return;
  }

  fecharModalReceita();

  await carregarReceitasAPI();
  aplicarFiltros();

  mostrarMensagemReceita("Receita atualizada com sucesso!");
  avisarHomeSobreAtualizacao();
}

function pegarDadosFormularioReceita() {
  const descricao = inputDesc?.value.trim() || "";
  const valor = converterMoedaParaNumero(inputValor?.value || "");
  const data = inputData?.value || "";
  const tipo = document.querySelector('input[name="tipoReceita"]:checked')?.value || "fixa";
  const mensal = Boolean(checkMensal?.checked);

  return {
    descricao,
    valor,
    data,
    tipo,
    mensal
  };
}

function formularioReceitaInvalido({ descricao, valor, data }) {
  return !descricao || Number(valor) <= 0 || !data;
}

function montarPayloadReceita({ descricao, valor, data, tipo, mensal }) {
  return {
    description: descricao,
    descricao,

    value: Number(valor),
    valor: Number(valor),

    dateInitial: data,
    data,
    date: data,

    type: tipo,
    tipo,
    incomeType: tipo,

    recurring: Boolean(mensal),
    recorrente: Boolean(mensal),
    monthly: Boolean(mensal)
  };
}

/* ================= EDITAR / EXCLUIR ================= */

function confirmarEditarReceita(id) {
  const receita = receitas.find((item) => String(item.id) === String(id));

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  abrirPopupReceitas({
    icone: "i",
    titulo: "Editar receita",
    texto: "Deseja mesmo editar esta receita?",
    botoes: [
      {
        texto: "Cancelar",
        classe: "popup-btn-cancelar"
      },
      {
        texto: "Editar",
        classe: "popup-btn-confirmar",
        acao: () => prepararEdicaoReceita(id)
      }
    ]
  });
}

function prepararEdicaoReceita(id) {
  const receita = receitas.find((item) => String(item.id) === String(id));

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  modoEdicaoReceita = true;
  idReceitaEditando = id;

  if (inputDesc) inputDesc.value = receita.descricao || "";
  if (inputValor) inputValor.value = formatarMoeda(receita.valor);
  if (inputData) inputData.value = normalizarDataISO(receita.data);
  if (checkMensal) checkMensal.checked = Boolean(receita.salvarTodoMes || receita.recorrente);

  const radioTipo = document.querySelector(`input[name="tipoReceita"][value="${receita.tipo || "fixa"}"]`);

  if (radioTipo) {
    radioTipo.checked = true;
  }

  abrirModalReceitaEdicao();
}

function confirmarExcluirReceita(id) {
  const receita = receitas.find((item) => String(item.id) === String(id));

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  abrirPopupReceitas({
    icone: "!",
    titulo: "Excluir receita",
    texto: "Tem certeza que deseja excluir esta receita? Essa ação não poderá ser desfeita.",
    botoes: [
      {
        texto: "Cancelar",
        classe: "popup-btn-cancelar"
      },
      {
        texto: "Excluir",
        classe: "popup-btn-perigo",
        acao: () => excluirReceita(id)
      }
    ]
  });
}

async function excluirReceita(id) {
  const receita = receitas.find((item) => String(item.id) === String(id));

  if (!receita) {
    mostrarMensagemReceita("Receita não encontrada.");
    return;
  }

  const idApi =
    receita.incomeId ||
    receita.income_id ||
    receita.id;

  console.log("EXCLUINDO RECEITA:", {
    idTela: id,
    idApi,
    receita
  });

  const resposta = await excluirReceitaAPI(idApi);

  /*
    Mesmo se a API falhar com 404, a receita será marcada como excluída localmente.
    Isso impede que ela continue aparecendo na Home, Receitas e outras telas.
  */
  if (resposta.ok || resposta.status === 404) {
    marcarReceitaComoExcluida(receita);
  } else {
    mostrarMensagemReceita(
      pegarMensagemErroReceita(
        resposta.data,
        "Não foi possível excluir a receita."
      )
    );
    return;
  }

  receitas = receitas.filter((item) => String(item.id) !== String(id));

  aplicarFiltros();

  mostrarMensagemReceita("Receita excluída com sucesso!");
  avisarHomeSobreAtualizacao();
}

/* ================= EXCLUSÕES VISUAIS ================= */

function getChaveReceitasExcluidas() {
  return getChaveUsuarioReceita(STORAGE_RECEITAS_EXCLUIDAS);
}

function lerListaStorage(chave) {
  try {
    const dados = localStorage.getItem(chave);

    if (!dados) return [];

    const lista = JSON.parse(dados);

    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarListaStorage(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(Array.isArray(lista) ? lista : []));
}

function lerReceitasExcluidas() {
  return [
    ...lerListaStorage(STORAGE_RECEITAS_EXCLUIDAS),
    ...lerListaStorage(getChaveReceitasExcluidas())
  ];
}

function salvarReceitasExcluidas(lista) {
  salvarListaStorage(STORAGE_RECEITAS_EXCLUIDAS, lista);
  salvarListaStorage(getChaveReceitasExcluidas(), lista);
}

function criarChaveExclusaoReceita(receita) {
  const dataISO = normalizarDataISO(
    receita.dateInitial ||
    receita.data ||
    receita.date ||
    receita.createdAt ||
    receita.created_at ||
    ""
  );

  const valor = Number(
    receita.value ??
    receita.valor ??
    receita.amount ??
    receita.total ??
    receita.valorTotal ??
    receita.totalValue ??
    receita.valorReceita ??
    0
  );

  const descricao = normalizarTexto(
    receita.description ||
    receita.descricao ||
    receita.name ||
    receita.nome ||
    receita.title ||
    ""
  );

  const categoria = normalizarTexto(
    receita.category ||
    receita.categoria ||
    receita.categoryName ||
    receita.nomeCategoria ||
    "receita"
  );

  return [
    "receita",
    descricao,
    categoria,
    valor.toFixed(2),
    dataISO
  ].join("|");
}

function marcarReceitaComoExcluida(receita) {
  if (!receita) return;

  const listaAtual = lerReceitasExcluidas();

  const ids = [
    receita.id,
    receita.incomeId,
    receita.income_id,
    receita.transactionId,
    receita.transaction_id
  ]
    .filter(Boolean)
    .map(String);

  const dataISO = normalizarDataISO(
    receita.dateInitial ||
    receita.data ||
    receita.date ||
    receita.createdAt ||
    receita.created_at ||
    ""
  );

  const valor = Number(
    receita.value ??
    receita.valor ??
    receita.amount ??
    receita.total ??
    receita.valorTotal ??
    receita.totalValue ??
    0
  );

  const descricao =
    receita.description ||
    receita.descricao ||
    receita.name ||
    receita.nome ||
    receita.title ||
    "";

  const categoria =
    receita.category ||
    receita.categoria ||
    receita.categoryName ||
    receita.nomeCategoria ||
    "Receita";

  const nova = {
    id: receita.id || null,
    incomeId: receita.incomeId || receita.income_id || receita.id || null,
    income_id: receita.income_id || receita.incomeId || receita.id || null,

    ids,

    description: descricao,
    descricao,

    category: categoria,
    categoria,

    value: valor,
    valor,

    amount: valor,

    dateInitial: dataISO,
    data: dataISO,
    date: dataISO,

    chave: criarChaveExclusaoReceita({
      ...receita,
      description: descricao,
      descricao,
      category: categoria,
      categoria,
      value: valor,
      valor,
      dateInitial: dataISO,
      data: dataISO
    })
  };

  const jaExiste = listaAtual.some((item) => {
    const idsItem = [
      item.id,
      item.incomeId,
      item.income_id,
      ...(Array.isArray(item.ids) ? item.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    const mesmoId =
      ids.length > 0 &&
      idsItem.length > 0 &&
      ids.some((id) => idsItem.includes(id));

    const mesmaChave =
      item.chave &&
      item.chave === nova.chave;

    return mesmoId || mesmaChave;
  });

  if (!jaExiste) {
    salvarReceitasExcluidas([...listaAtual, nova]);
  }

  console.log("RECEITA MARCADA COMO EXCLUÍDA:", nova);
}

function receitaFoiExcluida(receita) {
  const excluidas = lerReceitasExcluidas();

  const idsReceita = [
    receita.id,
    receita.incomeId,
    receita.income_id,
    receita.transactionId,
    receita.transaction_id
  ]
    .filter(Boolean)
    .map(String);

  const chaveReceita = criarChaveExclusaoReceita(receita);

  const valorReceita = Number(
    receita.value ??
    receita.valor ??
    receita.amount ??
    receita.total ??
    receita.valorTotal ??
    receita.totalValue ??
    0
  );

  const dataReceita = normalizarDataISO(
    receita.dateInitial ||
    receita.data ||
    receita.date ||
    receita.createdAt ||
    receita.created_at ||
    ""
  );

  const descricaoReceita = normalizarTexto(
    receita.description ||
    receita.descricao ||
    receita.name ||
    receita.nome ||
    receita.title ||
    ""
  );

  return excluidas.some((item) => {
    const idsItem = [
      item.id,
      item.incomeId,
      item.income_id,
      ...(Array.isArray(item.ids) ? item.ids : [])
    ]
      .filter(Boolean)
      .map(String);

    if (
      idsReceita.length > 0 &&
      idsItem.length > 0 &&
      idsReceita.some((id) => idsItem.includes(id))
    ) {
      return true;
    }

    if (item.chave && item.chave === chaveReceita) {
      return true;
    }

    const valorItem = Number(
      item.value ??
      item.valor ??
      item.amount ??
      0
    );

    const dataItem = normalizarDataISO(
      item.dateInitial ||
      item.data ||
      item.date ||
      ""
    );

    const descricaoItem = normalizarTexto(
      item.description ||
      item.descricao ||
      item.name ||
      item.nome ||
      ""
    );

    return (
      descricaoReceita &&
      descricaoReceita === descricaoItem &&
      valorReceita === valorItem &&
      dataReceita &&
      dataReceita === dataItem
    );
  });
}

/* ================= USUÁRIO / DUPLICADOS ================= */

function receitaPertenceAoUsuarioLogado(receita) {
  const idAtual = getIdUsuarioAtualReceita();
  const emailAtual = getEmailUsuarioAtualReceita();

  const idDono =
    receita?.autorId ||
    receita?.userId ||
    receita?.user_id ||
    receita?.usuarioId ||
    receita?.usuario_id ||
    receita?.createdById ||
    receita?.created_by_id ||
    receita?.ownerId ||
    receita?.owner_id ||
    receita?.createdBy?.id ||
    receita?.user?.id ||
    receita?.usuario?.id ||
    null;

  const emailDono = String(
    receita?.autorEmail ||
    receita?.userEmail ||
    receita?.user_email ||
    receita?.emailUsuario ||
    receita?.email_usuario ||
    receita?.createdByEmail ||
    receita?.created_by_email ||
    receita?.ownerEmail ||
    receita?.owner_email ||
    receita?.createdBy?.email ||
    receita?.user?.email ||
    receita?.usuario?.email ||
    ""
  )
    .toLowerCase()
    .trim();

  if (idAtual && idDono && String(idAtual) === String(idDono)) return true;
  if (emailAtual && emailDono && emailAtual === emailDono) return true;

  if (!idDono && !emailDono) return true;

  return false;
}

function pegarNomeAutorReceita(receita) {
  const nome =
    receita.autorNickname ||
    receita.nicknameUsuario ||
    receita.nomeUsuario ||
    receita.createdByNickname ||
    receita.createdByName ||
    receita.createdBy?.nickname ||
    receita.createdBy?.name ||
    receita.user?.nickname ||
    receita.user?.name ||
    receita.usuario?.nickname ||
    receita.usuario?.nome ||
    getNicknameUsuarioAtualReceita() ||
    "Usuário";

  return formatarNicknameReceita(nome);
}

function formatarNicknameReceita(nome) {
  const texto = String(nome || "").trim();

  if (!texto) return "Usuário";

  const primeiroNome = texto.split(" ")[0];

  return primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
}

function removerDuplicadasReceitas(lista) {
  const mapa = new Map();

  lista.forEach((receita) => {
    const chaveId = receita.id ? `id-${receita.id}` : "";

    const chaveFlexivel = [
      normalizarTexto(receita.descricao),
      normalizarTexto(receita.categoria),
      normalizarDataISO(receita.data),
      Number(receita.valor || 0).toFixed(2)
    ].join("|");

    const chave = chaveId || chaveFlexivel;

    if (!mapa.has(chave)) {
      mapa.set(chave, receita);
    }
  });

  return Array.from(mapa.values());
}

/* ================= FORMATAÇÕES ================= */

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obterMoedaUsuarioReceita() {
  const userKey = getUserKeyReceita();

  return (
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    sessionStorage.getItem(`${userKey}_moedaUsuario`) ||
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL"
  );
}

function formatarMoeda(valor) {
  try {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: obterMoedaUsuarioReceita()
    });
  } catch {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}

function converterMoedaParaNumero(valor) {
  if (typeof valor === "number") return valor;

  const texto = String(valor || "")
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  return Number(texto) || 0;
}

function aplicarMascaraMoeda(valor) {
  const apenasNumeros = String(valor || "").replace(/\D/g, "");
  const numero = Number(apenasNumeros || 0) / 100;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function normalizarDataISO(dataValor) {
  if (!dataValor) return "";

  const texto = String(dataValor).trim();

  if (texto.includes("-")) {
    const partes = texto.split("T")[0].split("-");

    if (partes.length === 3) {
      const ano = partes[0];
      const mes = partes[1].padStart(2, "0");
      const dia = partes[2].padStart(2, "0");

      return `${ano}-${mes}-${dia}`;
    }
  }

  if (texto.includes("/")) {
    const partes = texto.split("/");

    if (partes.length === 3) {
      const dia = partes[0].padStart(2, "0");
      const mes = partes[1].padStart(2, "0");
      const ano = partes[2];

      return `${ano}-${mes}-${dia}`;
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

function converterData(dataValor) {
  const iso = normalizarDataISO(dataValor);

  if (!iso) return null;

  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia, 12, 0, 0);

  return isNaN(data.getTime()) ? null : data;
}

function formatarDataBR(dataValor) {
  const iso = normalizarDataISO(dataValor);

  if (!iso) return "";

  const [ano, mes, dia] = iso.split("-");

  return `${dia}/${mes}/${ano}`;
}

function pegarAnoMes(dataValor) {
  const data = converterData(dataValor);

  if (!data) return "";

  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function pegarAnoMesData(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function atualizarTextoMes() {
  if (!textoMesAtual) return;

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  textoMesAtual.textContent = `${meses[dataMesAtual.getMonth()]} ${dataMesAtual.getFullYear()}`;
}

function formatarTipoReceita(tipo) {
  const texto = normalizarTexto(tipo);

  if (texto.includes("fix")) return "Fixa";
  if (texto.includes("sazon")) return "Sazonal";

  return "Variável";
}

function escapeHTML(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pegarMensagemErroReceita(data, fallback) {
  if (!data) return fallback;

  if (typeof data === "string") return data;

  if (data.message) return data.message;
  if (data.detail && typeof data.detail === "string") return data.detail;

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item.msg || item.message || "Campo inválido")
      .join("\n");
  }

  return fallback;
}

/* ================= POPUP ================= */

function criarPopupReceitas() {
  if (document.getElementById("popupReceitas")) return;

  const popup = document.createElement("div");
  popup.id = "popupReceitas";
  popup.className = "popup-receitas-overlay";

  popup.innerHTML = `
    <div class="popup-receitas-box">
      <div class="popup-receitas-icone" id="popupReceitasIcone">i</div>
      <h3 id="popupReceitasTitulo">Confirmação</h3>
      <p id="popupReceitasTexto">Tem certeza?</p>
      <div class="popup-receitas-acoes" id="popupReceitasAcoes"></div>
    </div>
  `;

  document.body.appendChild(popup);
}

function abrirPopupReceitas({ icone = "i", titulo, texto, botoes }) {
  const popup = document.getElementById("popupReceitas");
  const popupIcone = document.getElementById("popupReceitasIcone");
  const popupTitulo = document.getElementById("popupReceitasTitulo");
  const popupTexto = document.getElementById("popupReceitasTexto");
  const popupAcoes = document.getElementById("popupReceitasAcoes");

  if (!popup || !popupIcone || !popupTitulo || !popupTexto || !popupAcoes) return;

  popupIcone.textContent = icone;
  popupTitulo.textContent = titulo;
  popupTexto.textContent = texto;
  popupAcoes.innerHTML = "";

  botoes.forEach((botao) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = botao.texto;
    btn.className = botao.classe || "popup-btn-confirmar";

    btn.addEventListener("click", () => {
      fecharPopupReceitas();

      if (typeof botao.acao === "function") {
        botao.acao();
      }
    });

    popupAcoes.appendChild(btn);
  });

  popup.style.display = "flex";
}

function fecharPopupReceitas() {
  const popup = document.getElementById("popupReceitas");

  if (popup) {
    popup.style.display = "none";
  }
}

function mostrarMensagemReceita(mensagem) {
  abrirPopupReceitas({
    icone: "i",
    titulo: "Atenção",
    texto: mensagem,
    botoes: [
      {
        texto: "OK",
        classe: "popup-btn-confirmar"
      }
    ]
  });
}

/* ================= CSS EXTRA ================= */

function inserirCssAcoesReceitas() {
  if (document.getElementById("css-acoes-receitas")) return;

  const style = document.createElement("style");
  style.id = "css-acoes-receitas";

  style.textContent = `
    .acoes-coluna {
      text-align: center !important;
      width: 120px;
    }

    .acoes-receita {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-acao-receita {
      width: 34px;
      height: 34px;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: 0.2s ease;
      font-size: 18px;
      font-weight: 700;
    }

    .btn-editar-receita {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .btn-editar-receita:hover {
      background: #c8e6c9;
      transform: scale(1.05);
    }

    .btn-excluir-receita {
      background: #ffebee;
      color: #d32f2f;
    }

    .btn-excluir-receita:hover {
      background: #ffcdd2;
      transform: scale(1.05);
    }

    .usuario-receita {
      font-weight: 600;
      color: #2e7d32;
      white-space: nowrap;
      text-align: left !important;
    }

    body.tema-escuro .usuario-receita,
    body.dark .usuario-receita {
      color: #22c55e;
    }

    .popup-receitas-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(4px);
      z-index: 20000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .popup-receitas-box {
      width: 420px;
      max-width: 95%;
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
      text-align: center;
      animation: popupReceitasEntrada 0.2s ease;
    }

    @keyframes popupReceitasEntrada {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .popup-receitas-icone {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #e8f5e9;
      color: #2e7d32;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 700;
    }

    .popup-receitas-box h3 {
      font-size: 21px;
      color: #111827;
      margin-bottom: 8px;
    }

    .popup-receitas-box p {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .popup-receitas-acoes {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .popup-receitas-acoes button {
      border: none;
      border-radius: 10px;
      padding: 10px 16px;
      cursor: pointer;
      font-weight: 600;
      transition: 0.2s ease;
    }

    .popup-btn-cancelar {
      background: #f3f4f6;
      color: #374151;
    }

    .popup-btn-cancelar:hover {
      background: #e5e7eb;
    }

    .popup-btn-confirmar {
      background: #2e7d32;
      color: #ffffff;
    }

    .popup-btn-confirmar:hover {
      background: #256628;
    }

    .popup-btn-perigo {
      background: #d32f2f;
      color: #ffffff;
    }

    .popup-btn-perigo:hover {
      background: #b71c1c;
    }

    body.tema-escuro .popup-receitas-overlay,
    body.dark .popup-receitas-overlay {
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(5px);
    }

    body.tema-escuro .popup-receitas-box,
    body.dark .popup-receitas-box {
      background: #1e1e1e;
      color: #f9fafb;
      border: 1px solid #5e6063;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
    }

    body.tema-escuro .popup-receitas-box h3,
    body.dark .popup-receitas-box h3 {
      color: #f9fafb;
    }

    body.tema-escuro .popup-receitas-box p,
    body.dark .popup-receitas-box p {
      color: #d1d5db;
    }

    body.tema-escuro .popup-receitas-icone,
    body.dark .popup-receitas-icone {
      background: rgba(34, 197, 94, 0.16);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.35);
    }

    body.tema-escuro .popup-btn-cancelar,
    body.dark .popup-btn-cancelar {
      background: #2a2a2a;
      color: #f9fafb;
      border: 1px solid #5e6063;
    }

    body.tema-escuro .popup-btn-confirmar,
    body.dark .popup-btn-confirmar {
      background: #238636;
      color: #ffffff;
    }

    body.tema-escuro .popup-btn-perigo,
    body.dark .popup-btn-perigo {
      background: #dc2626;
      color: #ffffff;
    }
  `;

  document.head.appendChild(style);
}

/* ================= ATUALIZAÇÕES GLOBAIS ================= */

function avisarHomeSobreAtualizacao() {
  localStorage.setItem("receitasAtualizadasEm", String(Date.now()));
  localStorage.setItem("dadosFinanceirosAtualizadosEm", String(Date.now()));

  window.dispatchEvent(new CustomEvent("dadosFinanceirosAtualizados"));
}

/* ================= FUNÇÕES GLOBAIS ================= */

window.carregarReceitasAPI = carregarReceitasAPI;

window.carregarReceitas = async function carregarReceitas() {
  usuarioPertenceFamiliaReceita = await usuarioEstaEmFamiliaReceitas();
  mostrarUsuarioReceita = usuarioPertenceFamiliaReceita;

  atualizarCabecalhoUsuarioReceitas();

  await carregarReceitasAPI();
  aplicarFiltros();
};

window.recarregarReceitas = window.carregarReceitas;

window.confirmarEditarReceita = confirmarEditarReceita;
window.confirmarExcluirReceita = confirmarExcluirReceita;