console.log("DADOS.JS OK");

const API_DADOS_URL = "https://www.manage-control-dev.com.br/api/v1";

document.addEventListener("DOMContentLoaded", () => {
  configurarCardDados();
});

/* =========================
   CONFIGURAR BOTÕES
========================= */

function configurarCardDados() {
  const btnExportar = document.getElementById("btn-exportar-dados");
  const btnLimpar = document.getElementById("btn-limpar-dados");

  const popup = document.getElementById("popup-dados");
  const btnCancelar = document.getElementById("btn-cancelar-dados");
  const btnConfirmar = document.getElementById("btn-confirmar-dados");

  if (btnExportar) {
    btnExportar.addEventListener("click", baixarRelatorioFamiliaPDF);
  }

  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
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
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

/* =========================
   BAIXAR RELATÓRIO DA FAMÍLIA
   Endpoint:
   GET /api/v1/report/family/pdf
========================= */

async function baixarRelatorioFamiliaPDF() {
  const token = getTokenDados();

  if (!token) {
    mostrarToastDados("Sessão expirada. Faça login novamente.");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);

    return;
  }

  try {
    mostrarToastDados("Gerando relatório da família...");

    const response = await fetch(`${API_DADOS_URL}/report/family/pdf`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      mostrarToastDados("Sessão expirada. Faça login novamente.");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);

      return;
    }

    if (!response.ok) {
      const mensagemErro = await lerErroResposta(response);

      if (
        mensagemErro.toLowerCase().includes("família") ||
        mensagemErro.toLowerCase().includes("familia") ||
        mensagemErro.toLowerCase().includes("family")
      ) {
        mostrarToastDados("Você precisa estar em uma família para exportar o relatório.");
        return;
      }

      mostrarToastDados(mensagemErro || "Erro ao gerar relatório da família.");
      return;
    }

    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      mostrarToastDados("O relatório veio vazio.");
      return;
    }

    baixarBlobComoArquivo(
      blob,
      `relatorio-familia-fambudget-${gerarDataArquivoDados()}.pdf`
    );

    mostrarToastDados("Relatório da família baixado com sucesso!");
  } catch (erro) {
    console.error("Erro ao baixar relatório da família:", erro);
    mostrarToastDados("Não foi possível gerar o relatório. Verifique a conexão ou CORS.");
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
            .map((erro) => erro.msg || erro.message || JSON.stringify(erro))
            .join(", ");
        }
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
  const chavesParaRemover = [
    "transacoes",
    "transactions",
    "despesas",
    "expenses",
    "receitas",
    "incomes",
    "revenues",
    "orcamentos"
  ];

  chavesParaRemover.forEach((chave) => {
    localStorage.removeItem(chave);
    sessionStorage.removeItem(chave);
  });

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

function mostrarToastDados(mensagem) {
  let toast = document.getElementById("toast-dados");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-dados";
    toast.className = "toast-dados";
    document.body.appendChild(toast);
  }

  toast.textContent = mensagem;
  toast.classList.add("ativo");

  setTimeout(() => {
    toast.classList.remove("ativo");
  }, 3000);
}