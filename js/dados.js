console.log("DADOS.JS OK - RELATÓRIO FINANCEIRO DA FAMÍLIA");

const API_DADOS_URL = "https://www.manage-control-dev.com.br/api/v1";

document.addEventListener("DOMContentLoaded", () => {
  configurarCardDados();
});

/* =========================
   CONFIGURAR BOTÕES
========================= */

function configurarCardDados() {
  configurarBotaoExportarDados();
  configurarBotaoLimparDados();
}

function configurarBotaoExportarDados() {
  const btnExportarOriginal = document.getElementById("btn-exportar-dados");

  if (!btnExportarOriginal) return;

  /*
    Isso remove qualquer evento antigo que outro JS tenha colocado no botão,
    evitando baixar o PDF de configurações por engano.
  */
  const btnExportar = btnExportarOriginal.cloneNode(true);
  btnExportarOriginal.parentNode.replaceChild(btnExportar, btnExportarOriginal);

  btnExportar.setAttribute("type", "button");

  btnExportar.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    baixarRelatorioFamiliaPDF();
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

/* =========================
   TOKEN
========================= */

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

/* =========================
   BAIXAR RELATÓRIO FINANCEIRO DA FAMÍLIA
   GET /api/v1/report/family/pdf?month=X&year=YYYY
========================= */

async function baixarRelatorioFamiliaPDF() {
  const token = getTokenDados();
  const btnExportar = document.getElementById("btn-exportar-dados");

  console.log("BAIXANDO RELATÓRIO FINANCEIRO DA FAMÍLIA");

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

    mostrarToastDados("Gerando relatório financeiro da família...");

    const hoje = new Date();

    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    const urlRelatorio = `${API_DADOS_URL}/report/family/pdf?month=${mesAtual}&year=${anoAtual}`;

    console.log("URL RELATÓRIO FINANCEIRO:", urlRelatorio);

    const response = await fetch(urlRelatorio, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf"
      }
    });

    console.log("STATUS PDF FINANCEIRO:", response.status);
    console.log("CONTENT-TYPE PDF:", response.headers.get("content-type"));

    if (response.status === 401 || response.status === 403) {
      mostrarToastDados("Sessão expirada. Faça login novamente.", "erro");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);

      return;
    }

    if (!response.ok) {
      const mensagemErro = await lerErroResposta(response);

      console.log("ERRO PDF FINANCEIRO:", mensagemErro);

      const mensagemTratada = String(mensagemErro || "").toLowerCase();

      if (
        mensagemTratada.includes("família") ||
        mensagemTratada.includes("familia") ||
        mensagemTratada.includes("family")
      ) {
        mostrarToastDados(
          "Você precisa estar em uma família para exportar o relatório.",
          "erro"
        );
        return;
      }

      if (
        mensagemTratada.includes("month") ||
        mensagemTratada.includes("year") ||
        mensagemTratada.includes("field required")
      ) {
        mostrarToastDados(
          "A API está pedindo mês e ano para gerar o relatório.",
          "erro"
        );
        return;
      }

      mostrarToastDados(
        mensagemErro || "Erro ao gerar relatório financeiro da família.",
        "erro"
      );

      return;
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/pdf")) {
      const texto = await response.text();

      console.warn("A resposta não veio como PDF:", texto);

      mostrarToastDados(
        "A API não retornou um PDF. Verifique o endpoint no Swagger.",
        "erro"
      );

      return;
    }

    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      mostrarToastDados("O relatório veio vazio.", "erro");
      return;
    }

    baixarBlobComoArquivo(
      blob,
      `relatorio-financeiro-familia-${gerarDataArquivoDados()}.pdf`
    );

    mostrarToastDados("Relatório financeiro da família baixado com sucesso!");
  } catch (erro) {
    console.error("Erro ao baixar relatório financeiro da família:", erro);

    mostrarToastDados(
      "Não foi possível gerar o relatório. Verifique a conexão ou CORS.",
      "erro"
    );
  } finally {
    if (btnExportar) {
      btnExportar.disabled = false;
      btnExportar.textContent = "Exportar";
    }
  }
}

/* =========================
   BAIXAR ARQUIVO
========================= */

function baixarBlobComoArquivo(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = nomeArquivo;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* =========================
   LER ERRO DA API
========================= */

async function lerErroResposta(response) {
  try {
    const texto = await response.text();

    if (!texto) {
      return "";
    }

    try {
      const json = JSON.parse(texto);

      if (json.message) {
        return json.message;
      }

      if (json.detail) {
        if (typeof json.detail === "string") {
          return json.detail;
        }

        if (Array.isArray(json.detail)) {
          return json.detail
            .map((erro) => {
              return erro.msg || erro.message || JSON.stringify(erro);
            })
            .join(", ");
        }

        return JSON.stringify(json.detail);
      }

      if (json.error) {
        return json.error;
      }

      return texto;
    } catch {
      return texto;
    }
  } catch {
    return "";
  }
}

/* =========================
   LIMPAR DADOS LOCAIS
========================= */

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

  /*
    Não remove:
    - accessToken
    - token
    - refreshToken
    - nomeUsuario
    - nicknameUsuario
    - emailUsuario
    - moedaUsuario
    - temaUsuario
    - avatarUsuario
    - avatarUsuarioTemp
    - pagamentoCartao
    - notificacaoEmail
    - lembreteOrcamento
  */
}

/* =========================
   DATA PARA NOME DO ARQUIVO
========================= */

function gerarDataArquivoDados() {
  const hoje = new Date();

  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();

  return `${dia}-${mes}-${ano}`;
}

/* =========================
   TOAST
========================= */

function mostrarToastDados(mensagem, tipo = "sucesso") {
  let toast = document.getElementById("toast-dados");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-dados";
    toast.className = "toast-dados";

    document.body.appendChild(toast);
  }

  toast.textContent = mensagem;

  toast.className = "toast-dados";

  if (tipo === "erro") {
    toast.classList.add("erro");
  }

  toast.classList.add("ativo");

  setTimeout(() => {
    toast.classList.remove("ativo");
  }, 3000);
}