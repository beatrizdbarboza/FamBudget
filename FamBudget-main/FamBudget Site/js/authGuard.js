console.log("AUTH GUARD OK");

const AUTH_API_URL = "https://www.manage-control-dev.com.br/api/v1";

/* ================= PEGAR TOKENS ================= */
function getAccessToken() {
  return sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
}

function getRefreshToken() {
  return sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken");
}

/* ================= SALVAR TOKENS ================= */
function salvarTokens(accessToken, refreshToken) {
  if (accessToken) {
    sessionStorage.setItem("accessToken", accessToken);
    localStorage.setItem("accessToken", accessToken);
  }

  if (refreshToken) {
    sessionStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("refreshToken", refreshToken);
  }
}

/* ================= LIMPAR LOGIN ================= */
function limparLogin() {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

/* ================= VALIDAR TOKEN ================= */
function tokenValidoFormato(token) {
  return (
    token &&
    token !== "undefined" &&
    token !== "null" &&
    token !== "[object Object]" &&
    typeof token === "string" &&
    token.startsWith("eyJ")
  );
}

/* ================= VERIFICAR EXPIRAÇÃO ================= */
function tokenExpirado(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const agora = Math.floor(Date.now() / 1000);

    if (!payload.exp) return false;

    return payload.exp <= agora;
  } catch (erro) {
    return true;
  }
}

/* ================= LER RESPOSTA ================= */
async function lerResposta(res) {
  const text = await res.text();

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

  if (
    !refreshToken ||
    refreshToken === "undefined" ||
    refreshToken === "null" ||
    refreshToken === "[object Object]"
  ) {
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

    if (!res.ok) return false;

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
    console.log("TOKEN EXPIRADO. TENTANDO RENOVAR...");

    const renovou = await renovarToken();

    if (!renovou) {
      redirecionarLogin();
    }
  }
})();