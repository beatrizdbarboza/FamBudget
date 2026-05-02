console.log("ORCAMENTOS OK");

/* =========================
   USUÁRIO / AVATAR
========================= */

function getTokenOrcamento() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function decodificarTokenOrcamento() {
  const token = getTokenOrcamento();

  if (!token || !token.includes(".")) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    const payloadCorrigido = payload.replace(/-/g, "+").replace(/_/g, "/");

    const json = decodeURIComponent(
      atob(payloadCorrigido)
        .split("")
        .map((char) => {
          return `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`;
        })
        .join("")
    );

    return JSON.parse(json);
  } catch (error) {
    console.warn("Não foi possível decodificar o token:", error);
    return null;
  }
}

function getUserKeyOrcamento() {
  const dadosToken = decodificarTokenOrcamento();

  const email =
    sessionStorage.getItem("emailUsuario") ||
    dadosToken?.email ||
    "usuario";

  return `fambudget_${String(email).toLowerCase().trim()}`;
}

function buscarDadoUsuarioOrcamento(chave) {
  const userKey = getUserKeyOrcamento();
  return localStorage.getItem(`${userKey}_${chave}`);
}

function salvarStorageUsuario(chave, valor) {
  const userKey = getUserKeyOrcamento();
  localStorage.setItem(`${userKey}_${chave}`, JSON.stringify(valor));
}

function lerStorageUsuario(chave, padrao = []) {
  const userKey = getUserKeyOrcamento();
  const dados = localStorage.getItem(`${userKey}_${chave}`);

  if (!dados) return padrao;

  try {
    return JSON.parse(dados);
  } catch {
    return padrao;
  }
}

function carregarUsuario() {
  const dadosToken = decodificarTokenOrcamento();

  const nome =
    buscarDadoUsuarioOrcamento("nicknameUsuario") ||
    buscarDadoUsuarioOrcamento("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    dadosToken?.nickname ||
    dadosToken?.name ||
    dadosToken?.nome ||
    dadosToken?.username ||
    "Usuário";

  const imagem =
    buscarDadoUsuarioOrcamento("avatarUsuario") ||
    sessionStorage.getItem("avatarUsuario") ||
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

/* =========================
   MOEDA
========================= */

function obterMoedaUsuarioReceitas() {
  const email =
    sessionStorage.getItem("emailUsuario") ||
    localStorage.getItem("emailUsuario") ||
    "usuario";

  const userKey = `fambudget_${String(email).toLowerCase().trim()}`;

  const moeda =
    localStorage.getItem(`${userKey}_moedaUsuario`) ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL";

  console.log("MOEDA USADA EM RECEITAS:", moeda);

  return moeda;
}

function formatarMoedaReceitas(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: obterMoedaUsuarioReceitas()
  });
}

/* =========================
   ELEMENTOS
========================= */

const modal = document.getElementById("modal-orcamento");
const modalExcluir = document.getElementById("modal-excluir-orcamento");

const btnNovo = document.querySelector(".btn-add");
const fechar = document.getElementById("fechar-modal");
const salvar = document.getElementById("salvar-orcamento");

const selectCategoria = document.getElementById("categoria");
const filtroCategoria = document.getElementById("filtro-categoria");
const lista = document.getElementById("lista-orcamentos");
const selectMes = document.getElementById("filtro-mes");

const tituloModal = document.querySelector("#modal-orcamento .modal-content h2");

let orcamentos = [];
let transacoes = [];

let editandoIndex = null;
let indexParaExcluir = null;

/* =========================
   TRANSAÇÕES / CÁLCULO
========================= */

function carregarTransacoes() {
  /*
    Orçamento é individual.
    Não usa transacoesFamilia.
  */

  const transacoesUsuario =
    lerStorageUsuario("transacoes", null);

  if (Array.isArray(transacoesUsuario)) {
    return transacoesUsuario;
  }

  const locaisSession = sessionStorage.getItem("transacoes");
  if (locaisSession) {
    try {
      const lista = JSON.parse(locaisSession);
      if (Array.isArray(lista)) return lista;
    } catch {}
  }

  const locais = localStorage.getItem("transacoes");
  if (locais) {
    try {
      const lista = JSON.parse(locais);
      if (Array.isArray(lista)) return lista;
    } catch {}
  }

  return [];
}

function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pegarCategoriaTransacao(transacao) {
  return (
    transacao.categoria ||
    transacao.category ||
    transacao.nomeCategoria ||
    transacao.categoryName ||
    transacao.typeExpense?.name ||
    transacao.typeIncome?.name ||
    ""
  );
}

function pegarValorTransacao(transacao) {
  const valor =
    transacao.valor ??
    transacao.amount ??
    transacao.preco ??
    transacao.value ??
    0;

  if (typeof valor === "number") {
    return valor;
  }

  return Number(
    String(valor)
      .replace("R$", "")
      .replace("US$", "")
      .replace("€", "")
      .replace("£", "")
      .replace("¥", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim()
  ) || 0;
}

function pegarDataTransacao(transacao) {
  return (
    transacao.data ||
    transacao.date ||
    transacao.dateInitial ||
    transacao.createdAt ||
    transacao.dataTransacao ||
    transacao.transactionDate ||
    ""
  );
}

function transacaoEhDespesa(transacao) {
  const tipo = normalizarTexto(
    transacao.tipo ||
    transacao.type ||
    transacao.tipoTransacao ||
    transacao.transactionType ||
    ""
  );

  return (
    tipo.includes("despesa") ||
    tipo.includes("expense") ||
    tipo.includes("saida") ||
    tipo.includes("debito") ||
    tipo.includes("débito") ||
    tipo === "d"
  );
}

function calcularGastoCategoria(transacoesDoMes, categoriaOrcamento) {
  const categoriaNormalizada = normalizarTexto(categoriaOrcamento);

  return transacoesDoMes
    .filter((transacao) => {
      const categoriaTransacao = normalizarTexto(pegarCategoriaTransacao(transacao));

      return (
        categoriaTransacao === categoriaNormalizada &&
        transacaoEhDespesa(transacao)
      );
    })
    .reduce((total, transacao) => {
      return total + pegarValorTransacao(transacao);
    }, 0);
}

/* =========================
   CATEGORIAS
========================= */

const categoriasFixas = [
  "Salário",
  "Aluguel",
  "Alimentação",
  "Transporte",
  "Lazer",
  "Cartão de Crédito",
  "Outros"
];

function carregarCategorias() {
  if (!selectCategoria) return;

  selectCategoria.innerHTML = "";

  categoriasFixas.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    selectCategoria.appendChild(option);
  });
}

function carregarFiltroCategorias() {
  if (!filtroCategoria) return;

  filtroCategoria.innerHTML = `<option value="">Categoria</option>`;

  categoriasFixas.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filtroCategoria.appendChild(option);
  });

  orcamentos.forEach((orcamento) => {
    if (!categoriasFixas.includes(orcamento.categoria)) {
      const jaExiste = [...filtroCategoria.options].some(
        (option) => option.value === orcamento.categoria
      );

      if (!jaExiste) {
        const option = document.createElement("option");
        option.value = orcamento.categoria;
        option.textContent = orcamento.categoria;
        filtroCategoria.appendChild(option);
      }
    }
  });
}

/* =========================
   MESES / FILTROS
========================= */

function formatarMes(dataString) {
  if (!dataString) {
    return pegarMesAtual();
  }

  let data;

  if (typeof dataString === "string" && dataString.includes("-")) {
    const partes = dataString.split("T")[0].split("-");
    const ano = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const dia = Number(partes[2]) || 1;

    data = new Date(ano, mes, dia);
  } else {
    data = new Date(dataString);
  }

  if (isNaN(data.getTime())) {
    return pegarMesAtual();
  }

  return data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
}

function pegarMesAtual() {
  const hoje = new Date();

  return hoje.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
}

function carregarMeses() {
  if (!selectMes) return;

  transacoes = carregarTransacoes();

  const mesesTransacoes = transacoes
    .filter((transacao) => pegarDataTransacao(transacao))
    .map((transacao) => formatarMes(pegarDataTransacao(transacao)));

  const mesesOrcamentos = orcamentos
    .filter((orcamento) => orcamento.mes)
    .map((orcamento) => orcamento.mes);

  let meses = [...new Set([...mesesTransacoes, ...mesesOrcamentos])];

  const mesAtual = pegarMesAtual();

  if (!meses.includes(mesAtual)) {
    meses.push(mesAtual);
  }

  selectMes.innerHTML = "";

  meses.forEach((mes) => {
    const option = document.createElement("option");
    option.value = mes;
    option.textContent = mes;
    selectMes.appendChild(option);
  });

  selectMes.value = mesAtual;
}

function filtrarPorMes(mes) {
  transacoes = carregarTransacoes();

  return transacoes.filter((transacao) => {
    const data = pegarDataTransacao(transacao);
    return formatarMes(data) === mes;
  });
}

function aplicarFiltroCategoria(listaBase) {
  const categoriaSelecionada = filtroCategoria?.value || "";

  if (!categoriaSelecionada) return listaBase;

  return listaBase.filter((orcamento) => {
    return normalizarTexto(orcamento.categoria) === normalizarTexto(categoriaSelecionada);
  });
}

/* =========================
   MODAIS
========================= */

function abrirModal() {
  if (modal) {
    modal.classList.add("active");
  }
}

function fecharModal() {
  if (modal) {
    modal.classList.remove("active");
  }

  editandoIndex = null;

  if (tituloModal) {
    tituloModal.textContent = "Novo Orçamento";
  }
}

function abrirModalExcluir(index) {
  indexParaExcluir = index;

  if (modalExcluir) {
    modalExcluir.style.display = "flex";
  }
}

function fecharModalExcluir() {
  if (modalExcluir) {
    modalExcluir.style.display = "none";
  }

  indexParaExcluir = null;
}

window.fecharModalExcluir = fecharModalExcluir;

function confirmarExclusao() {
  if (indexParaExcluir === null) return;

  orcamentos.splice(indexParaExcluir, 1);
  salvarStorageUsuario("orcamentos", orcamentos);

  fecharModalExcluir();
  carregarFiltroCategorias();
  carregarMeses();
  renderizar();
}

window.confirmarExclusao = confirmarExclusao;

window.onclick = function (event) {
  if (event.target === modalExcluir) fecharModalExcluir();
  if (event.target === modal) fecharModal();
};

/* =========================
   RENDERIZAR
========================= */

function renderizar() {
  if (!lista) return;

  lista.innerHTML = "";

  const mesSelecionado = selectMes?.value || pegarMesAtual();
  const transacoesFiltradas = filtrarPorMes(mesSelecionado);

  let orcamentosFiltrados = orcamentos.filter((orcamento) => {
    if (!orcamento.mes) return true;
    return orcamento.mes === mesSelecionado;
  });

  orcamentosFiltrados = aplicarFiltroCategoria(orcamentosFiltrados);

  if (orcamentosFiltrados.length === 0) {
    lista.innerHTML = `
      <div class="card-orcamento">
        <p style="text-align:center; color:#666;">
          Nenhum orçamento cadastrado para este mês.
        </p>
      </div>
    `;
    return;
  }

  orcamentosFiltrados.forEach((orcamento) => {
    const gasto = calcularGastoCategoria(transacoesFiltradas, orcamento.categoria);

    const limite = Number(orcamento.limite || 0);
    const restante = limite - gasto;

    const porcentagem = limite > 0
      ? Math.min((gasto / limite) * 100, 100)
      : 0;

    let cor = "#2e7d32";

    if (porcentagem > 60) cor = "#f9a825";
    if (porcentagem > 80) cor = "#d32f2f";

    const indexReal = orcamentos.indexOf(orcamento);

    const card = document.createElement("div");
    card.classList.add("card-orcamento");

    card.innerHTML = `
      <div class="topo-orcamento">

        <div>
          <strong>${orcamento.categoria}</strong><br>
          ${formatarMoedaReceita(limite)}
        </div>

        <div style="display:flex; gap:8px; align-items:center;">

          <div style="color:${restante < 0 ? "red" : "green"}; font-weight:bold;">
            ${formatarMoedaReceita(restante)}
          </div>

          <button class="btn-editar" style="border:none; background:none; cursor:pointer;">
            <img src="imagem/iconConfig/lapis.png" style="width:18px; height:18px;">
          </button>

          <button class="btn-excluir" style="border:none; background:none; cursor:pointer;">
            <img src="imagem/iconConfig/lixeira.png" style="width:18px; height:18px;">
          </button>

        </div>

      </div>

      <div class="barra">
        <div class="progresso" style="width:${porcentagem}%; background:${cor}"></div>
      </div>

      <div style="display:flex; justify-content:space-between; font-size:14px;">
        <span>${formatarMoedaReceita(gasto)}</span>
        <span>${porcentagem.toFixed(0)}% do limite</span>
      </div>
    `;

    lista.appendChild(card);

    card.querySelector(".btn-editar").onclick = () => {
      editandoIndex = indexReal;

      const containerOutraCategoria = document.getElementById("outra-categoria-container");
      const inputOutraCategoria = document.getElementById("outra-categoria");

      if (categoriasFixas.includes(orcamento.categoria)) {
        selectCategoria.value = orcamento.categoria;

        if (containerOutraCategoria) {
          containerOutraCategoria.style.display = "none";
        }

        if (inputOutraCategoria) {
          inputOutraCategoria.value = "";
        }
      } else {
        selectCategoria.value = "Outros";

        if (containerOutraCategoria) {
          containerOutraCategoria.style.display = "block";
        }

        if (inputOutraCategoria) {
          inputOutraCategoria.value = orcamento.categoria;
        }
      }

      const inputLimite = document.getElementById("limite");

      if (inputLimite) {
        inputLimite.value = orcamento.limite;
      }

      if (tituloModal) {
        tituloModal.textContent = "Editar Orçamento";
      }

      abrirModal();
    };

    card.querySelector(".btn-excluir").onclick = () => {
      abrirModalExcluir(indexReal);
    };
  });
}

/* =========================
   EVENTOS
========================= */

document.addEventListener("DOMContentLoaded", () => {
  carregarUsuario();

  orcamentos = lerStorageUsuario("orcamentos", []);
  transacoes = carregarTransacoes();

  carregarCategorias();
  carregarFiltroCategorias();
  carregarMeses();
  renderizar();

  if (selectCategoria) {
    selectCategoria.addEventListener("change", () => {
      const container = document.getElementById("outra-categoria-container");

      if (container) {
        container.style.display =
          selectCategoria.value === "Outros" ? "block" : "none";
      }
    });
  }

  if (filtroCategoria) {
    filtroCategoria.addEventListener("change", renderizar);
  }

  if (selectMes) {
    selectMes.addEventListener("change", renderizar);
  }

  if (btnNovo) {
    btnNovo.onclick = () => {
      editandoIndex = null;

      const inputLimite = document.getElementById("limite");
      const inputOutraCategoria = document.getElementById("outra-categoria");
      const containerOutraCategoria = document.getElementById("outra-categoria-container");

      if (inputLimite) {
        inputLimite.value = "";
      }

      if (inputOutraCategoria) {
        inputOutraCategoria.value = "";
      }

      if (containerOutraCategoria) {
        containerOutraCategoria.style.display = "none";
      }

      if (selectCategoria) {
        selectCategoria.value = categoriasFixas[0];
      }

      if (tituloModal) {
        tituloModal.textContent = "Novo Orçamento";
      }

      abrirModal();
    };
  }

  if (fechar) {
    fechar.onclick = fecharModal;
  }

  if (salvar) {
    salvar.onclick = () => {
      let categoria = selectCategoria.value;
      const inputLimite = document.getElementById("limite");
      const limite = parseFloat(inputLimite?.value);
      const mesSelecionado = selectMes?.value || pegarMesAtual();

      if (categoria === "Outros") {
        categoria = document.getElementById("outra-categoria")?.value.trim();

        if (!categoria) {
          alert("Digite a categoria personalizada!");
          return;
        }
      }

      if (!categoria || !limite) {
        alert("Preencha tudo!");
        return;
      }

      if (editandoIndex !== null) {
        orcamentos[editandoIndex].categoria = categoria;
        orcamentos[editandoIndex].limite = limite;

        if (!orcamentos[editandoIndex].mes) {
          orcamentos[editandoIndex].mes = mesSelecionado;
        }

        editandoIndex = null;
      } else {
        const jaExiste = orcamentos.find((orcamento) => {
          return (
            normalizarTexto(orcamento.categoria) === normalizarTexto(categoria) &&
            orcamento.mes === mesSelecionado
          );
        });

        if (jaExiste) {
          alert("Já existe orçamento para essa categoria neste mês!");
          return;
        }

        orcamentos.push({
          categoria,
          limite,
          mes: mesSelecionado
        });
      }

      salvarStorageUsuario("orcamentos", orcamentos);

      fecharModal();

      carregarFiltroCategorias();
      carregarMeses();

      if (selectMes) {
        selectMes.value = mesSelecionado;
      }

      renderizar();
      carregarUsuario();
    };
  }
});