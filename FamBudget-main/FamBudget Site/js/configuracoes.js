const API_URL = "https://www.manage-control-dev.com.br/api/v1";

const UPDATE_NICKNAME_ENDPOINT = "/user/update-nickname";

/*
  Se sua API tiver outro endpoint para alterar senha,
  troque somente esta linha.
*/
const CHANGE_PASSWORD_ENDPOINT = "/user/password";

document.addEventListener("DOMContentLoaded", () => {
  inicializarMenu();
  carregarUsuario();
  carregarPreferencias();
  configurarEventosPerfil();
  configurarEventosPreferencias();
  configurarAlterarSenha();
  configurarExportarPdf();
  verificarLimiteOrcamento();
});

/* =========================
   TOKEN / API
========================= */

function getToken() {
  return (
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")
  );
}

function headers() {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function readResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      ...headers(),
      ...(options.headers || {})
    }
  });

  const data = await readResponse(response);

  return { response, data };
}

/* =========================
   MENU / LOGOUT
========================= */

function inicializarMenu() {
  document.querySelectorAll(".menu li[data-link]").forEach((item) => {
    item.addEventListener("click", () => {
      window.location.href = item.dataset.link;
    });
  });

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.clear();

      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      window.location.href = "index.html";
    });
  }
}

/* =========================
   USUÁRIO
========================= */

function carregarUsuario() {
  const dadosToken = decodificarToken();

  const nickname =
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    sessionStorage.getItem("nicknameUsuario") ||
    sessionStorage.getItem("nomeUsuario") ||
    dadosToken?.nickname ||
    dadosToken?.name ||
    dadosToken?.nome ||
    dadosToken?.username ||
    "Usuário";

  const email =
    localStorage.getItem("emailUsuario") ||
    sessionStorage.getItem("emailUsuario") ||
    dadosToken?.email ||
    "email@email.com";

  const avatarSalvo = localStorage.getItem("avatarUsuario");

  atualizarDadosUsuario(nickname, email, avatarSalvo);
}

function decodificarToken() {
  const token = getToken();

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

function atualizarDadosUsuario(nickname, email, avatarImagem = null) {
  const primeiraLetra = nickname ? nickname.charAt(0).toUpperCase() : "U";

  const nomeTopo = document.getElementById("nome-usuario");
  const avatarTopo = document.getElementById("avatar");
  const nomeCard = document.getElementById("nomeUsuario");
  const emailCard = document.getElementById("emailUsuario");
  const avatarCard = document.getElementById("avatarCard");
  const avatarPreview = document.getElementById("avatarPreview");

  if (nomeTopo) nomeTopo.textContent = nickname;
  if (nomeCard) nomeCard.textContent = nickname;
  if (emailCard) emailCard.textContent = email;

  preencherAvatar(avatarTopo, primeiraLetra, avatarImagem);
  preencherAvatar(avatarCard, primeiraLetra, avatarImagem);
  preencherAvatar(avatarPreview, primeiraLetra, avatarImagem);
}

function preencherAvatar(elemento, letra, imagem) {
  if (!elemento) return;

  if (imagem) {
    elemento.innerHTML = `<img src="${imagem}" alt="Avatar">`;
  } else {
    elemento.textContent = letra;
  }
}

/* =========================
   PERFIL / NICKNAME
========================= */

function configurarEventosPerfil() {
  const modal = document.getElementById("modalPerfil");
  const abrir = document.getElementById("editarPerfil");
  const cancelar = document.getElementById("cancelarModal");
  const salvar = document.getElementById("salvarPerfil");
  const inputNome = document.getElementById("inputNome");
  const inputAvatar = document.getElementById("inputAvatar");
  const fileName = document.getElementById("fileName");
  const cameraAvatar = document.getElementById("cameraAvatar");

  if (abrir) {
    abrir.addEventListener("click", () => {
      inputNome.value =
        localStorage.getItem("nicknameUsuario") ||
        localStorage.getItem("nomeUsuario") ||
        document.getElementById("nomeUsuario").textContent ||
        "";

      abrirModal(modal);
    });
  }

  if (cancelar) {
    cancelar.addEventListener("click", () => {
      localStorage.removeItem("avatarUsuarioTemp");
      carregarUsuario();
      fecharModal(modal);
    });
  }

  if (cameraAvatar && inputAvatar) {
    cameraAvatar.addEventListener("click", () => {
      inputAvatar.click();
    });
  }

  if (inputAvatar) {
    inputAvatar.addEventListener("change", () => {
      const arquivo = inputAvatar.files[0];

      if (!arquivo) return;

      if (!arquivo.type.startsWith("image/")) {
        mostrarToast("Escolha uma imagem válida.", "erro");
        inputAvatar.value = "";
        return;
      }

      if (arquivo.size > 5 * 1024 * 1024) {
        mostrarToast("A imagem deve ter no máximo 5MB.", "erro");
        inputAvatar.value = "";
        return;
      }

      if (fileName) {
        fileName.textContent = arquivo.name;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const imagemBase64 = reader.result;
        localStorage.setItem("avatarUsuarioTemp", imagemBase64);

        const nicknameAtual = inputNome.value.trim() || "Usuário";

        const emailAtual =
          localStorage.getItem("emailUsuario") ||
          sessionStorage.getItem("emailUsuario") ||
          document.getElementById("emailUsuario").textContent;

        atualizarDadosUsuario(nicknameAtual, emailAtual, imagemBase64);
      };

      reader.readAsDataURL(arquivo);
    });
  }

  if (salvar) {
    salvar.addEventListener("click", async () => {
      const nickname = inputNome.value.trim();
      const avatarTemp = localStorage.getItem("avatarUsuarioTemp");
      const avatarAtual = localStorage.getItem("avatarUsuario");

      if (!nickname) {
        mostrarToast("Digite o nickname.", "erro");
        return;
      }

      const token = getToken();

      if (!token) {
        mostrarToast("Você precisa estar logado para alterar o nickname.", "erro");
        return;
      }

      try {
        const { response, data } = await apiFetch(UPDATE_NICKNAME_ENDPOINT, {
          method: "PUT",
          body: JSON.stringify({
            nickname: nickname
          })
        });

        console.log("UPDATE NICKNAME STATUS:", response.status);
        console.log("UPDATE NICKNAME RESPOSTA:", data);

        if (!response.ok) {
          const mensagem =
            typeof data === "string"
              ? data
              : data?.message ||
                data?.detail ||
                "Não foi possível atualizar o nickname.";

          mostrarToast(mensagem, "erro");
          return;
        }

        localStorage.setItem("nicknameUsuario", nickname);
        localStorage.setItem("nomeUsuario", nickname);

        if (avatarTemp) {
          localStorage.setItem("avatarUsuario", avatarTemp);
          localStorage.removeItem("avatarUsuarioTemp");
        }

        const emailAtual =
          localStorage.getItem("emailUsuario") ||
          sessionStorage.getItem("emailUsuario") ||
          document.getElementById("emailUsuario").textContent;

        atualizarDadosUsuario(nickname, emailAtual, avatarTemp || avatarAtual);

        fecharModal(modal);
        mostrarToast("Nickname atualizado com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar nickname:", error);
        mostrarToast("Erro ao conectar com a API para atualizar nickname.", "erro");
      }
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      localStorage.removeItem("avatarUsuarioTemp");
      carregarUsuario();
      fecharModal(modal);
    }
  });
}

/* =========================
   PREFERÊNCIAS
========================= */

function carregarPreferencias() {
  const moeda = localStorage.getItem("moedaUsuario") || "BRL";
  const pagamentoCartao = localStorage.getItem("pagamentoCartao") || "";
  const notificacaoEmail = localStorage.getItem("notificacaoEmail") !== "false";
  const lembreteOrcamento = localStorage.getItem("lembreteOrcamento") !== "false";
  const tema = localStorage.getItem("temaUsuario") || "claro";

  const selectMoeda = document.getElementById("selectMoeda");
  const inputPagamentoCartao = document.getElementById("inputPagamentoCartao");
  const checkEmail = document.getElementById("checkEmail");
  const checkOrcamento = document.getElementById("checkOrcamento");

  if (selectMoeda) selectMoeda.value = moeda;
  if (inputPagamentoCartao) inputPagamentoCartao.value = pagamentoCartao;
  if (checkEmail) checkEmail.checked = notificacaoEmail;
  if (checkOrcamento) checkOrcamento.checked = lembreteOrcamento;

  aplicarTema(tema);
}

function configurarEventosPreferencias() {
  const selectMoeda = document.getElementById("selectMoeda");
  const inputPagamentoCartao = document.getElementById("inputPagamentoCartao");
  const checkEmail = document.getElementById("checkEmail");
  const checkOrcamento = document.getElementById("checkOrcamento");
  const temaClaro = document.getElementById("temaClaro");
  const temaEscuro = document.getElementById("temaEscuro");

  if (selectMoeda) {
    selectMoeda.addEventListener("change", () => {
      localStorage.setItem("moedaUsuario", selectMoeda.value);
      mostrarToast("Moeda atualizada com sucesso!");
    });
  }

  if (inputPagamentoCartao) {
    inputPagamentoCartao.addEventListener("change", () => {
      const dia = Number(inputPagamentoCartao.value);

      if (dia < 1 || dia > 31) {
        mostrarToast("Digite um dia entre 1 e 31.", "erro");
        inputPagamentoCartao.value = "";
        localStorage.removeItem("pagamentoCartao");
        return;
      }

      localStorage.setItem("pagamentoCartao", String(dia));
      mostrarToast("Data de pagamento salva!");
    });
  }

  if (checkEmail) {
    checkEmail.addEventListener("change", () => {
      localStorage.setItem("notificacaoEmail", checkEmail.checked);

      mostrarToast(
        checkEmail.checked
          ? "Notificações por e-mail ativadas."
          : "Notificações por e-mail desativadas."
      );
    });
  }

  if (checkOrcamento) {
    checkOrcamento.addEventListener("change", () => {
      localStorage.setItem("lembreteOrcamento", checkOrcamento.checked);

      if (checkOrcamento.checked) {
        verificarLimiteOrcamento();
        mostrarToast("Lembrete de orçamento ativado.");
      } else {
        esconderAvisoOrcamento();
        mostrarToast("Lembrete de orçamento desativado.");
      }
    });
  }

  if (temaClaro) {
    temaClaro.addEventListener("click", () => {
      localStorage.setItem("temaUsuario", "claro");
      aplicarTema("claro");
      mostrarToast("Tema claro ativado.");
    });
  }

  if (temaEscuro) {
    temaEscuro.addEventListener("click", () => {
      localStorage.setItem("temaUsuario", "escuro");
      aplicarTema("escuro");
      mostrarToast("Tema escuro ativado.");
    });
  }
}

function aplicarTema(tema) {
  const btnClaro = document.getElementById("temaClaro");
  const btnEscuro = document.getElementById("temaEscuro");

  if (tema === "escuro") {
    document.body.classList.add("dark");

    if (btnEscuro) btnEscuro.classList.add("ativo");
    if (btnClaro) btnClaro.classList.remove("ativo");
  } else {
    document.body.classList.remove("dark");

    if (btnClaro) btnClaro.classList.add("ativo");
    if (btnEscuro) btnEscuro.classList.remove("ativo");
  }
}

/* =========================
   LEMBRETE DE ORÇAMENTO
========================= */

function verificarLimiteOrcamento() {
  const lembreteAtivo = localStorage.getItem("lembreteOrcamento") !== "false";

  if (!lembreteAtivo) {
    esconderAvisoOrcamento();
    return;
  }

  const orcamentos = buscarArrayLocalStorage([
    "orcamentos",
    "budgets",
    "listaOrcamentos"
  ]);

  const transacoes = buscarArrayLocalStorage([
    "transacoes",
    "transactions",
    "listaTransacoes"
  ]);

  let chegouNoLimite = false;

  if (orcamentos.length > 0) {
    chegouNoLimite = orcamentos.some((orcamento) => {
      const limite = Number(
        orcamento.limite ||
        orcamento.valor ||
        orcamento.valorLimite ||
        orcamento.amount ||
        0
      );

      const gastoSalvo = Number(
        orcamento.gasto ||
        orcamento.usado ||
        orcamento.valorUsado ||
        orcamento.spent ||
        0
      );

      let gastoCalculado = gastoSalvo;

      if (transacoes.length > 0 && orcamento.categoria) {
        gastoCalculado = transacoes
          .filter((transacao) => {
            const mesmaCategoria =
              String(transacao.categoria || "").toLowerCase() ===
              String(orcamento.categoria || "").toLowerCase();

            const tipo = String(transacao.tipo || transacao.type || "").toLowerCase();

            const tipoDespesa =
              tipo.includes("despesa") ||
              tipo.includes("expense") ||
              tipo === "saida" ||
              tipo === "saída";

            return mesmaCategoria && tipoDespesa;
          })
          .reduce((total, transacao) => {
            return total + Number(transacao.valor || transacao.amount || 0);
          }, 0);
      }

      if (!limite) return false;

      return gastoCalculado >= limite * 0.8;
    });
  }

  if (chegouNoLimite) {
    mostrarAvisoOrcamento();
  } else {
    esconderAvisoOrcamento();
  }
}

function buscarArrayLocalStorage(chaves) {
  for (const chave of chaves) {
    const valor = localStorage.getItem(chave);

    if (!valor) continue;

    try {
      const convertido = JSON.parse(valor);

      if (Array.isArray(convertido)) {
        return convertido;
      }
    } catch (error) {
      console.warn(`Não foi possível ler ${chave}`, error);
    }
  }

  return [];
}

function mostrarAvisoOrcamento() {
  const aviso = document.getElementById("avisoOrcamento");

  if (aviso) {
    aviso.style.display = "block";
  }

  mostrarToast("Atenção: seu orçamento está chegando ao limite.", "aviso");
}

function esconderAvisoOrcamento() {
  const aviso = document.getElementById("avisoOrcamento");

  if (aviso) {
    aviso.style.display = "none";
  }
}

/* =========================
   ALTERAR SENHA
========================= */

function configurarAlterarSenha() {
  const modal = document.getElementById("modalSenha");
  const abrir = document.getElementById("abrirAlterarSenha");
  const cancelar = document.getElementById("cancelarSenha");
  const salvar = document.getElementById("salvarSenha");

  if (abrir) {
    abrir.addEventListener("click", () => {
      abrirModal(modal);
    });
  }

  if (cancelar) {
    cancelar.addEventListener("click", () => {
      limparCamposSenha();
      fecharModal(modal);
    });
  }

  if (salvar) {
    salvar.addEventListener("click", alterarSenha);
  }

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      limparCamposSenha();
      fecharModal(modal);
    }
  });
}

async function alterarSenha() {
  const senhaAtual = document.getElementById("senhaAtual").value.trim();
  const novaSenha = document.getElementById("novaSenha").value.trim();
  const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

  if (!senhaAtual || !novaSenha || !confirmarSenha) {
    mostrarToast("Preencha todos os campos.", "erro");
    return;
  }

  if (novaSenha.length < 6) {
    mostrarToast("A nova senha deve ter pelo menos 6 caracteres.", "erro");
    return;
  }

  if (novaSenha !== confirmarSenha) {
    mostrarToast("As novas senhas não são iguais.", "erro");
    return;
  }

  try {
    const { response, data } = await apiFetch(CHANGE_PASSWORD_ENDPOINT, {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: senhaAtual,
        oldPassword: senhaAtual,
        password: novaSenha,
        newPassword: novaSenha
      })
    });

    console.log("ALTERAR SENHA STATUS:", response.status);
    console.log("ALTERAR SENHA RESPOSTA:", data);

    if (!response.ok) {
      const mensagem =
        typeof data === "string"
          ? data
          : data?.message || data?.detail || "Não foi possível alterar a senha.";

      mostrarToast(mensagem, "erro");
      return;
    }

    limparCamposSenha();
    fecharModal(document.getElementById("modalSenha"));
    mostrarToast("Senha alterada com sucesso!");
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    mostrarToast("Erro de conexão ao alterar senha.", "erro");
  }
}

function limparCamposSenha() {
  const senhaAtual = document.getElementById("senhaAtual");
  const novaSenha = document.getElementById("novaSenha");
  const confirmarSenha = document.getElementById("confirmarSenha");

  if (senhaAtual) senhaAtual.value = "";
  if (novaSenha) novaSenha.value = "";
  if (confirmarSenha) confirmarSenha.value = "";
}

/* =========================
   EXPORTAR PDF
========================= */

function configurarExportarPdf() {
  const botao = document.getElementById("exportarPdf");

  if (botao) {
    botao.addEventListener("click", exportarPdf);
  }
}

function exportarPdf() {
  if (!window.jspdf) {
    mostrarToast("Biblioteca de PDF não carregada.", "erro");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const nickname =
    localStorage.getItem("nicknameUsuario") ||
    localStorage.getItem("nomeUsuario") ||
    document.getElementById("nomeUsuario").textContent ||
    "Usuário";

  const email =
    localStorage.getItem("emailUsuario") ||
    sessionStorage.getItem("emailUsuario") ||
    document.getElementById("emailUsuario").textContent ||
    "email@email.com";

  const moeda = localStorage.getItem("moedaUsuario") || "BRL";
  const pagamento = localStorage.getItem("pagamentoCartao") || "Não informado";

  const notificacaoEmail =
    localStorage.getItem("notificacaoEmail") !== "false"
      ? "Ativada"
      : "Desativada";

  const lembreteOrcamento =
    localStorage.getItem("lembreteOrcamento") !== "false"
      ? "Ativado"
      : "Desativado";

  const tema = localStorage.getItem("temaUsuario") || "claro";

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("FamBudget - Configurações da Conta", 20, 20);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);

  let y = 40;

  pdf.text(`Nickname: ${nickname}`, 20, y);
  y += 10;

  pdf.text(`E-mail: ${email}`, 20, y);
  y += 10;

  pdf.text(`Moeda: ${moeda}`, 20, y);
  y += 10;

  pdf.text(`Dia de pagamento do cartão: ${pagamento}`, 20, y);
  y += 10;

  pdf.text(`Notificações por e-mail: ${notificacaoEmail}`, 20, y);
  y += 10;

  pdf.text(`Lembrete de orçamento: ${lembreteOrcamento}`, 20, y);
  y += 10;

  pdf.text(`Tema: ${tema}`, 20, y);
  y += 15;

  pdf.setFont("helvetica", "bold");
  pdf.text("Exportado em:", 20, y);

  pdf.setFont("helvetica", "normal");
  pdf.text(new Date().toLocaleString("pt-BR"), 55, y);

  pdf.save("configuracoes-fambudget.pdf");

  mostrarToast("PDF exportado com sucesso!");
}

/* =========================
   MODAL / TOAST
========================= */

function abrirModal(modal) {
  if (modal) {
    modal.style.display = "flex";
  }
}

function fecharModal(modal) {
  if (modal) {
    modal.style.display = "none";
  }
}

function mostrarToast(mensagem, tipo = "sucesso") {
  let toast = document.getElementById("toast");
  let texto = document.getElementById("toastText");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";

    texto = document.createElement("span");
    texto.id = "toastText";

    toast.appendChild(texto);
    document.body.appendChild(toast);
  }

  texto.textContent = mensagem;

  toast.className = "toast";

  if (tipo === "erro") {
    toast.classList.add("erro");
  }

  if (tipo === "aviso") {
    toast.classList.add("aviso");
  }

  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3200);
}