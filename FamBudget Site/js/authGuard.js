console.log("AUTH GUARD OK");

const AUTH_API_URL = "https://www.manage-control-dev.com.br/api/v1";

/* ================= PÁGINAS PÚBLICAS ================= */
function paginaPublica() {
  const paginaAtual = window.location.pathname;

  const paginasPublicas = [
    "index.html",
    "cadastro.html",
    "forgot-password.html",
    "validate-code.html",
    "reset-password.html"
  ];

  return paginasPublicas.some((pagina) => paginaAtual.includes(pagina));
}

/* ================= PEGAR TOKENS ================= */
function getAccessToken() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (!token || token === "undefined" || token === "null" || token === "[object Object]") {
    return null;
  }

  return token;
}

function getRefreshToken() {
  const token = sessionStorage.getItem("refreshToken");

  if (!token || token === "undefined" || token === "null" || token === "[object Object]") {
    return null;
  }

  return token;
}

/* ================= SALVAR TOKENS ================= */
function salvarTokens(accessToken, refreshToken) {
  /*
    Tokens ficam SOMENTE no sessionStorage.
    Isso evita misturar contas diferentes em abas diferentes.
  */
  if (accessToken) {
    sessionStorage.setItem("accessToken", accessToken);
  }

  if (refreshToken) {
    sessionStorage.setItem("refreshToken", refreshToken);
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
}

/* ================= LIMPAR LOGIN ================= */
function limparLogin() {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("refreshToken");

  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
}

/* ================= VALIDAR TOKEN ================= */
function tokenValidoFormato(token) {
  return (
    token &&
    typeof token === "string" &&
    token !== "undefined" &&
    token !== "null" &&
    token !== "[object Object]" &&
    token.startsWith("eyJ")
  );
}

/* ================= VERIFICAR EXPIRAÇÃO ================= */
function tokenExpirado(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const agora = Math.floor(Date.now() / 1000);

    if (!payload.exp) return false;

    /*
      Margem de 30 segundos:
      se o token estiver perto de expirar, já renova antes.
    */
    return payload.exp <= agora + 30;

  } catch (erro) {
    return true;
  }
}

/* ================= LER RESPOSTA ================= */
async function lerResposta(res) {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ================= EXTRAIR TOKEN DA RESPOSTA ================= */
function extrairAccessToken(data) {
  if (typeof data === "string" && data.startsWith("eyJ")) {
    return data;
  }

  return (
    data?.accessToken ||
    data?.access_token ||
    data?.token ||
    data?.data?.accessToken ||
    data?.data?.access_token ||
    data?.data?.token ||
    null
  );
}

function extrairRefreshToken(data, refreshAntigo) {
  return (
    data?.refreshToken ||
    data?.refresh_token ||
    data?.data?.refreshToken ||
    data?.data?.refresh_token ||
    refreshAntigo ||
    ""
  );
}

/* ================= RENOVAR TOKEN ================= */
async function renovarToken() {
  const refreshToken = getRefreshToken();

  console.log("REFRESH TOKEN:", refreshToken);

  if (!refreshToken) {
    return false;
  }

  try {
    const res = await fetch(`${AUTH_API_URL}/auth/refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      })
    });

    const data = await lerResposta(res);

    console.log("REFRESH STATUS:", res.status);
    console.log("REFRESH RESPONSE:", data);

    if (!res.ok) {
      return false;
    }

    const novoAccessToken = extrairAccessToken(data);
    const novoRefreshToken = extrairRefreshToken(data, refreshToken);

    console.log("NOVO ACCESS TOKEN:", novoAccessToken);

    if (!tokenValidoFormato(novoAccessToken)) {
      return false;
    }

    salvarTokens(novoAccessToken, novoRefreshToken);

    return true;

  } catch (erro) {
    console.error("Erro ao renovar token:", erro);
    return false;
  }
}

/* ================= REDIRECIONAR LOGIN ================= */
function redirecionarLogin() {
  limparLogin();

  if (!window.location.pathname.includes("index.html")) {
    window.location.href = "index.html";
  }
}

/* ================= INIT ================= */
(async () => {
  if (paginaPublica()) {
    return;
  }

  let token = getAccessToken();

  console.log("AUTH GUARD TOKEN:", token);

  if (!tokenValidoFormato(token)) {
    const renovou = await renovarToken();

    if (!renovou) {
      redirecionarLogin();
    }

    return;
  }

  if (tokenExpirado(token)) {
    console.log("TOKEN EXPIRADO OU PERTO DE EXPIRAR. TENTANDO RENOVAR...");

    const renovou = await renovarToken();

    if (!renovou) {
      redirecionarLogin();
    }
  }
})();

/* ================= DISPONIBILIZAR GLOBAL ================= */
window.renovarToken = renovarToken;
window.getAccessToken = getAccessToken;