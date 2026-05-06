console.log("RELATORIOS.JS OK");

const RELATORIOS_API_URL = "https://www.manage-control-dev.com.br/api/v1";

const MESES_RELATORIOS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
];

const CORES_CATEGORIAS = {
  "alimentação": "#2e7d32",
  "alimentacao": "#2e7d32",
  "transporte": "#3b82f6",
  "moradia": "#a855f7",
  "lazer": "#f59e0b",
  "saúde": "#06b6d4",
  "saude": "#06b6d4",
  "cartão de crédito": "#7c3aed",
  "cartao de credito": "#7c3aed",
  "cartão de débito": "#eab308",
  "cartao de debito": "#eab308",
  "contas pessoais": "#92400e",
  "outros": "#6b7280"
};

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  configurarMenu();
  configurarEventos();

  await carregarRelatorios();
});

/* =========================
   TOKEN
========================= */

function getTokenRelatorios() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function headersRelatorios() {
  const token = getTokenRelatorios();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function apiFetchRelatorios(path, options = {}) {
  const response = await fetch(`${RELATORIOS_API_URL}${path}`, {
    ...options,
    headers: {
      ...headersRelatorios(),
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    let erro = "Erro ao carregar dados dos relatórios.";

    try {
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        erro = data.message || data.detail || erro;
      } else {
        erro = await response.text();
      }
    } catch {
      erro = "Erro ao carregar dados dos relatórios.";
    }

    throw new Error(erro);
  }

  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return await response.blob();
}

/* =========================
   USUÁRIO
========================= */

function carregarUsuario() {
  const nome =
    sessionStorage.getItem("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    localStorage.getItem("nicknameUsuario") ||
    "Usuário";

  const nomeUsuario = document.getElementById("nome-usuario");
  const avatar = document.getElementById("avatar");

  if (nomeUsuario) nomeUsuario.textContent = nome;
  if (avatar && !avatar.querySelector("img")) {
    avatar.textContent = nome.charAt(0).toUpperCase();
  }
}

/* =========================
   MENU
========================= */

function configurarMenu() {
  document.querySelectorAll(".menu li[data-link]").forEach((item) => {
    item.addEventListener("click", () => {
      const link = item.getAttribute("data-link");

      if (link) {
        window.location.href = link;
      }
    });
  });

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = "index.html";
    });
  }
}

/* =========================
   EVENTOS
========================= */

function configurarEventos() {
  const filtroPeriodo = document.getElementById("filtro-periodo");

  if (filtroPeriodo) {
    preencherFiltroComMeses();

    filtroPeriodo.addEventListener("change", async () => {
      await carregarRelatorios();
    });
  }

  const btnExportarPdf = document.getElementById("btn-exportar-pdf");
  const btnExportarCsv = document.getElementById("btn-exportar-csv");

  if (btnExportarPdf) {
    btnExportarPdf.addEventListener("click", exportarPdf);
  }

  if (btnExportarCsv) {
    btnExportarCsv.addEventListener("click", exportarCsv);
  }
}

function preencherFiltroComMeses() {
  const filtro = document.getElementById("filtro-periodo");
  if (!filtro) return;

  const hoje = new Date();
  let options = "";

  for (let i = 0; i < 12; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ano = data.getFullYear();
    const mes = data.getMonth() + 1;

    const value = `${ano}-${String(mes).padStart(2, "0")}`;

    const label = data.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    });

    const labelFormatado = label.charAt(0).toUpperCase() + label.slice(1);

    options += `
      <option value="${value}">
        ${labelFormatado}
      </option>
    `;
  }

  filtro.innerHTML = options;
}

/* =========================
   CARREGAR RELATÓRIOS
========================= */

async function carregarRelatorios() {
  try {
    const [receitasApi, despesasApi] = await Promise.all([
      buscarReceitas(),
      buscarDespesas()
    ]);

    const receitas = normalizarLista(receitasApi).map((item) => {
      return normalizarTransacao(item, "receita");
    });

    const despesas = normalizarLista(despesasApi).map((item) => {
      return normalizarTransacao(item, "despesa");
    });

    const periodoSelecionado = obterPeriodoSelecionado();

    const receitasFiltradas = filtrarPorPeriodo(receitas, periodoSelecionado);
    const despesasFiltradas = filtrarPorPeriodo(despesas, periodoSelecionado);

    const totalReceitas = somarValores(receitasFiltradas);
    const totalDespesas = somarValores(despesasFiltradas);
    const saldo = totalReceitas - totalDespesas;

    atualizarCards(totalReceitas, totalDespesas, saldo);
    renderizarGraficoBarras(receitas, despesas);
    renderizarGraficoRosca(despesasFiltradas);
    renderizarResumoMes(
      receitasFiltradas,
      despesasFiltradas,
      totalReceitas,
      totalDespesas,
      saldo
    );
  } catch (error) {
    console.error("Erro nos relatórios:", error);
    carregarRelatoriosFallback();
  }
}

async function buscarReceitas() {
  return await apiFetchRelatorios("/income/user", {
    method: "GET"
  });
}

async function buscarDespesas() {
  return await apiFetchRelatorios("/expense/user", {
    method: "GET"
  });
}

/* =========================
   FALLBACK LOCALSTORAGE
========================= */

function carregarRelatoriosFallback() {
  const transacoes =
    lerStorage("transacoes", localStorage)
      .concat(lerStorage("transacoes", sessionStorage))
      .map((item) => normalizarTransacao(item));

  const periodoSelecionado = obterPeriodoSelecionado();

  const receitas = transacoes.filter((item) => item.tipo === "receita");
  const despesas = transacoes.filter((item) => item.tipo === "despesa");

  const receitasFiltradas = filtrarPorPeriodo(receitas, periodoSelecionado);
  const despesasFiltradas = filtrarPorPeriodo(despesas, periodoSelecionado);

  const totalReceitas = somarValores(receitasFiltradas);
  const totalDespesas = somarValores(despesasFiltradas);
  const saldo = totalReceitas - totalDespesas;

  atualizarCards(totalReceitas, totalDespesas, saldo);
  renderizarGraficoBarras(receitas, despesas);
  renderizarGraficoRosca(despesasFiltradas);
  renderizarResumoMes(
    receitasFiltradas,
    despesasFiltradas,
    totalReceitas,
    totalDespesas,
    saldo
  );
}

function lerStorage(chave, storage) {
  try {
    const dados = storage.getItem(chave);

    if (!dados) return [];

    const parseado = JSON.parse(dados);

    if (Array.isArray(parseado)) return parseado;
    if (parseado && Array.isArray(parseado.data)) return parseado.data;
    if (parseado && Array.isArray(parseado.items)) return parseado.items;
    if (parseado && Array.isArray(parseado.content)) return parseado.content;

    return [];
  } catch {
    return [];
  }
}

/* =========================
   NORMALIZAÇÃO
========================= */

function normalizarLista(dados) {
  if (Array.isArray(dados)) return dados;

  if (dados && Array.isArray(dados.data)) return dados.data;
  if (dados && Array.isArray(dados.items)) return dados.items;
  if (dados && Array.isArray(dados.content)) return dados.content;
  if (dados && Array.isArray(dados.incomes)) return dados.incomes;
  if (dados && Array.isArray(dados.expenses)) return dados.expenses;
  if (dados && Array.isArray(dados.revenues)) return dados.revenues;

  return [];
}

function normalizarTransacao(item, tipoForcado = null) {
  const tipoOriginal = String(
    item.type ||
    item.tipo ||
    item.transactionType ||
    item.categoryType ||
    ""
  ).toLowerCase();

  let tipo = tipoForcado;

  if (!tipo) {
    if (
      tipoOriginal.includes("receita") ||
      tipoOriginal.includes("income") ||
      tipoOriginal.includes("entrada") ||
      tipoOriginal.includes("revenue")
    ) {
      tipo = "receita";
    } else {
      tipo = "despesa";
    }
  }

  const valor = Math.abs(converterValor(
    item.value ??
    item.valor ??
    item.amount ??
    item.price ??
    item.total ??
    0
  ));

  const categoria =
    item.categoryName ||
    item.category ||
    item.categoria ||
    item.nomeCategoria ||
    item.typeExpense ||
    item.typeIncome ||
    "Outros";

  const descricao =
    item.description ||
    item.descricao ||
    item.name ||
    item.nome ||
    categoria ||
    "Transação";

  const data =
    item.date ||
    item.data ||
    item.createdAt ||
    item.created_at ||
    item.paymentDate ||
    item.dueDate ||
    item.dataTransacao ||
    new Date().toISOString();

  return {
    id: item.id || item.incomeId || item.expenseId || item._id || null,
    tipo,
    valor,
    categoria: String(categoria),
    descricao: String(descricao),
    data
  };
}

function converterValor(valor) {
  if (typeof valor === "number") return valor;

  if (!valor) return 0;

  let texto = String(valor)
    .replace("R$", "")
    .replace(/\s/g, "")
    .trim();

  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (texto.includes(",")) {
    texto = texto.replace(",", ".");
  }

  const numero = Number(texto);

  return Number.isFinite(numero) ? numero : 0;
}

function converterData(data) {
  if (!data) return new Date();

  if (typeof data === "string" && data.includes("/")) {
    const partes = data.split("/");

    if (partes.length === 3) {
      const dia = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const ano = Number(partes[2]);

      return new Date(ano, mes, dia);
    }
  }

  const convertida = new Date(data);

  if (!isNaN(convertida.getTime())) {
    return convertida;
  }

  return new Date();
}

/* =========================
   FILTRO POR PERÍODO
========================= */

function obterPeriodoSelecionado() {
  const filtro = document.getElementById("filtro-periodo");

  if (!filtro || !filtro.value) {
    const hoje = new Date();

    return {
      ano: hoje.getFullYear(),
      mes: hoje.getMonth()
    };
  }

  const [ano, mes] = filtro.value.split("-").map(Number);

  return {
    ano,
    mes: mes - 1
  };
}

function filtrarPorPeriodo(lista, periodo) {
  return lista.filter((item) => {
    const data = converterData(item.data);

    return (
      data.getFullYear() === periodo.ano &&
      data.getMonth() === periodo.mes
    );
  });
}

/* =========================
   CARDS
========================= */

function atualizarCards(receitas, despesas, saldo) {
  setText("valor-receitas", formatarMoeda(receitas));
  setText("valor-despesas", formatarMoeda(despesas));
  setText("valor-saldo", formatarMoeda(saldo));

  setText("variacao-receitas", "▲ Atualizado");
  setText("variacao-despesas", "▲ Atualizado");
  setText("variacao-saldo", saldo >= 0 ? "▲ Saldo positivo" : "▼ Saldo negativo");

  const saldoEl = document.getElementById("valor-saldo");

  if (saldoEl) {
    saldoEl.classList.toggle("vermelho", saldo < 0);
    saldoEl.classList.toggle("azul", saldo >= 0);
  }
}

/* =========================
   GRÁFICO DE BARRAS
========================= */

function renderizarGraficoBarras(receitas, despesas) {
  const container = document.getElementById("grafico-barras");

  if (!container) return;

  const periodo = obterPeriodoSelecionado();
  const meses = gerarUltimosSeisMeses(periodo.ano, periodo.mes);

  const dados = meses.map((periodoItem) => {
    const receitasMes = receitas.filter((item) => {
      const data = converterData(item.data);

      return (
        data.getFullYear() === periodoItem.ano &&
        data.getMonth() === periodoItem.mes
      );
    });

    const despesasMes = despesas.filter((item) => {
      const data = converterData(item.data);

      return (
        data.getFullYear() === periodoItem.ano &&
        data.getMonth() === periodoItem.mes
      );
    });

    return {
      label: `${MESES_RELATORIOS[periodoItem.mes]}/${String(periodoItem.ano).slice(2)}`,
      receitas: somarValores(receitasMes),
      despesas: somarValores(despesasMes)
    };
  });

  const maiorValorReal = Math.max(
    ...dados.map((item) => item.receitas),
    ...dados.map((item) => item.despesas),
    0
  );

  const maiorValor = calcularEscalaGrafico(maiorValorReal);

  renderizarEixoY(maiorValor);

  container.innerHTML = `
    <div class="grafico-barras-inner" id="grafico-barras-inner"></div>
  `;

  const graficoInner = document.getElementById("grafico-barras-inner");

  if (!graficoInner) return;

  dados.forEach((item) => {
    const alturaReceita = maiorValor > 0
      ? Math.max((item.receitas / maiorValor) * 100, item.receitas > 0 ? 5 : 0)
      : 0;

    const alturaDespesa = maiorValor > 0
      ? Math.max((item.despesas / maiorValor) * 100, item.despesas > 0 ? 5 : 0)
      : 0;

    const coluna = document.createElement("div");
    coluna.className = "coluna-mes";

    coluna.innerHTML = `
      <div class="barras-par">
        <div 
          class="barra-item receita" 
          style="height: ${alturaReceita}%"
          title="Receitas: ${formatarMoeda(item.receitas)}"
        ></div>

        <div 
          class="barra-item despesa" 
          style="height: ${alturaDespesa}%"
          title="Despesas: ${formatarMoeda(item.despesas)}"
        ></div>
      </div>

      <span class="rotulo-mes">${item.label}</span>
    `;

    graficoInner.appendChild(coluna);
  });
}

function gerarUltimosSeisMeses(ano, mes) {
  const meses = [];

  for (let i = 5; i >= 0; i--) {
    const data = new Date(ano, mes - i, 1);

    meses.push({
      ano: data.getFullYear(),
      mes: data.getMonth()
    });
  }

  return meses;
}

function calcularEscalaGrafico(maiorValor) {
  if (maiorValor <= 0) return 1000;

  if (maiorValor <= 1000) return 1000;
  if (maiorValor <= 2500) return 2500;
  if (maiorValor <= 5000) return 5000;
  if (maiorValor <= 10000) return 10000;
  if (maiorValor <= 15000) return 15000;
  if (maiorValor <= 20000) return 20000;
  if (maiorValor <= 25000) return 25000;
  if (maiorValor <= 50000) return 50000;

  return Math.ceil(maiorValor / 10000) * 10000;
}

function renderizarEixoY(maiorValor) {
  const eixoY = document.getElementById("eixo-y");
  if (!eixoY) return;

  const partes = 5;
  const valores = [];

  for (let i = partes; i >= 0; i--) {
    valores.push((maiorValor / partes) * i);
  }

  eixoY.innerHTML = valores
    .map((valor) => `<span>${formatarValorEixo(valor)}</span>`)
    .join("");
}

function formatarValorEixo(valor) {
  if (valor >= 1000) {
    const mil = valor / 1000;

    if (Number.isInteger(mil)) {
      return `R$ ${mil} mil`;
    }

    return `R$ ${mil.toFixed(1).replace(".", ",")} mil`;
  }

  return `R$ ${valor.toFixed(0)}`;
}

/* =========================
   GRÁFICO DE ROSCA
========================= */

function renderizarGraficoRosca(despesas) {
  const grafico = document.getElementById("grafico-rosca");
  const lista = document.getElementById("lista-categorias");
  const totalRosca = document.getElementById("total-despesas-rosca");

  if (!grafico || !lista || !totalRosca) return;

  const total = somarValores(despesas);

  totalRosca.textContent = formatarMoeda(total);
  lista.innerHTML = "";

  if (total <= 0) {
    grafico.style.background = "#e5e7eb";

    lista.innerHTML = `
      <div class="item-categoria">
        <span class="bolinha-categoria" style="background:#9ca3af;"></span>
        <span>Nenhuma despesa</span>
        <strong class="valor-categoria">R$ 0,00</strong>
        <span class="percentual-categoria">(0%)</span>
      </div>
    `;

    return;
  }

  const agrupadas = {};

  despesas.forEach((item) => {
    const categoria = item.categoria || "Outros";

    if (!agrupadas[categoria]) {
      agrupadas[categoria] = 0;
    }

    agrupadas[categoria] += Number(item.valor || 0);
  });

  const categorias = Object.entries(agrupadas)
    .map(([nome, valor]) => {
      return {
        nome,
        valor,
        cor: buscarCorCategoria(nome)
      };
    })
    .sort((a, b) => b.valor - a.valor);

  let anguloAtual = 0;

  const fatias = categorias.map((item) => {
    const percentual = item.valor / total;
    const graus = percentual * 360;
    const inicio = anguloAtual;
    const fim = inicio + graus;

    anguloAtual = fim;

    return `${item.cor} ${inicio}deg ${fim}deg`;
  });

  grafico.style.background = `conic-gradient(${fatias.join(", ")})`;

  categorias.forEach((item) => {
    const percentual = ((item.valor / total) * 100)
      .toFixed(1)
      .replace(".", ",");

    const div = document.createElement("div");
    div.className = "item-categoria";

    div.innerHTML = `
      <span class="bolinha-categoria" style="background:${item.cor};"></span>
      <span>${item.nome}</span>
      <strong class="valor-categoria">${formatarMoeda(item.valor)}</strong>
      <span class="percentual-categoria">(${percentual}%)</span>
    `;

    lista.appendChild(div);
  });
}

function buscarCorCategoria(categoria) {
  const chave = removerAcentos(String(categoria).toLowerCase());

  return CORES_CATEGORIAS[chave] || "#6b7280";
}

/* =========================
   RESUMO DO MÊS
========================= */

function renderizarResumoMes(receitas, despesas, totalReceitas, totalDespesas, saldo) {
  setText("resumo-receitas", formatarMoeda(totalReceitas));
  setText("resumo-despesas", formatarMoeda(totalDespesas));

  const maiorDespesa = [...despesas].sort((a, b) => b.valor - a.valor)[0];
  const menorDespesa = [...despesas].sort((a, b) => a.valor - b.valor)[0];

  setText(
    "maior-despesa",
    maiorDespesa
      ? `${maiorDespesa.categoria} - ${formatarMoeda(maiorDespesa.valor)}`
      : "-"
  );

  setText(
    "menor-despesa",
    menorDespesa
      ? `${menorDespesa.categoria} - ${formatarMoeda(menorDespesa.valor)}`
      : "-"
  );

  setText("melhor-dia", calcularMelhorDiaParaEconomizar(despesas));

  const hoje = new Date();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();

  let percentualMes = Math.round((hoje.getDate() / diasNoMes) * 100);

  const periodo = obterPeriodoSelecionado();

  if (
    periodo.ano !== hoje.getFullYear() ||
    periodo.mes !== hoje.getMonth()
  ) {
    percentualMes = 100;
  }

  setText("percentual-mes", `${percentualMes}%`);

  const progresso = document.getElementById("progresso-circular");

  if (progresso) {
    const graus = (percentualMes / 100) * 360;

    progresso.style.background = `
      conic-gradient(
        #2e7d32 0deg ${graus}deg,
        #e5e7eb ${graus}deg 360deg
      )
    `;
  }

  const textoDica = document.getElementById("texto-dica");

  if (textoDica) {
    if (saldo < 0) {
      textoDica.textContent = "Suas despesas passaram das receitas. Tente reduzir gastos não essenciais.";
    } else if (totalReceitas > 0 && totalDespesas >= totalReceitas * 0.8) {
      textoDica.textContent = "Você ainda está positivo, mas suas despesas estão próximas das receitas.";
    } else if (totalReceitas === 0 && totalDespesas === 0) {
      textoDica.textContent = "Ainda não há dados suficientes para gerar uma dica deste mês.";
    } else {
      textoDica.textContent = "Você está no caminho certo! Continue assim para alcançar suas metas.";
    }
  }
}

function calcularMelhorDiaParaEconomizar(despesas) {
  if (!despesas.length) return "-";

  const gastosPorDia = {};

  despesas.forEach((item) => {
    const data = converterData(item.data);
    const diaSemana = data.getDay();

    if (!gastosPorDia[diaSemana]) {
      gastosPorDia[diaSemana] = 0;
    }

    gastosPorDia[diaSemana] += Number(item.valor || 0);
  });

  const menorDia = Object.entries(gastosPorDia)
    .sort((a, b) => a[1] - b[1])[0];

  if (!menorDia) return "-";

  return DIAS_SEMANA[Number(menorDia[0])];
}

/* =========================
   EXPORTAÇÃO
========================= */

async function exportarPdf() {
  try {
    const blob = await apiFetchRelatorios("/report/pdf", {
      method: "GET",
      headers: {
        Accept: "application/pdf"
      }
    });

    baixarArquivo(blob, "relatorio-fambudget.pdf");
  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    alert("Não foi possível exportar o PDF.");
  }
}

function exportarCsv() {
  const linhas = [];

  linhas.push(["Campo", "Valor"]);
  linhas.push(["Receitas", document.getElementById("valor-receitas")?.textContent || "R$ 0,00"]);
  linhas.push(["Despesas", document.getElementById("valor-despesas")?.textContent || "R$ 0,00"]);
  linhas.push(["Saldo", document.getElementById("valor-saldo")?.textContent || "R$ 0,00"]);

  const csv = linhas
    .map((linha) => linha.map((campo) => `"${campo}"`).join(";"))
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8"
  });

  baixarArquivo(blob, "relatorio-fambudget.csv");
}

function baixarArquivo(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/* =========================
   HELPERS
========================= */

function somarValores(lista) {
  return lista.reduce((total, item) => {
    return total + Number(item.valor || 0);
  }, 0);
}

function formatarMoeda(valor) {
  const moeda =
    localStorage.getItem("moedaUsuario") ||
    sessionStorage.getItem("moedaUsuario") ||
    "BRL";

  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: moeda
  });
}

function removerAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function setText(id, texto) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = texto;
  }
}

function atualizarInfoGrafico(dados) {
  const info = document.getElementById("info-grafico");
  if (!info) return;

  const maiorReceita = [...dados].sort((a, b) => b.receitas - a.receitas)[0];

  const totalReceitas = dados.reduce((total, item) => total + item.receitas, 0);
  const totalDespesas = dados.reduce((total, item) => total + item.despesas, 0);
  const saldoPeriodo = totalReceitas - totalDespesas;

  if (!maiorReceita || maiorReceita.receitas <= 0) {
    info.innerHTML = `
      <span>Resumo do período</span>
      <strong>Sem receitas</strong>
      <small>Aguardando lançamentos</small>
    `;
    return;
  }

  info.innerHTML = `
    <span>Maior receita</span>
    <strong>${formatarMoeda(maiorReceita.receitas)}</strong>
    <small>${maiorReceita.label} · Saldo ${formatarMoeda(saldoPeriodo)}</small>
  `;
}
