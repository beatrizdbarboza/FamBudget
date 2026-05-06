console.log("API.JS OK");

const API_BASE_URL = "https://www.manage-control-dev.com.br/api/v1";

/* ================= TOKENS ================= */
function getAccessTokenApi() {
  const token =
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function getRefreshTokenApi() {
  const token = sessionStorage.getItem("refreshToken");

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

function salvarTokensApi(accessToken, refreshToken) {
  if (accessToken) {
    sessionStorage.setItem("accessToken", accessToken);
  }

  if (refreshToken) {
    sessionStorage.setItem("refreshToken", refreshToken);
  }
}

function limparSessaoApi() {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("refreshToken");

  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
}

/* ================= RESPOSTA ================= */
async function lerRespostaApi(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extrairNovoAccessToken(data) {
  return (
    data?.accessToken ||
    data?.access_token ||
    data?.token ||
    data?.data?.accessToken ||
    data?.data?.access_token ||
    data?.data?.token ||
    ""
  );
}

function extrairNovoRefreshToken(data) {
  return (
    data?.refreshToken ||
    data?.refresh_token ||
    data?.data?.refreshToken ||
    data?.data?.refresh_token ||
    ""
  );
}

/* ================= RENOVAR TOKEN ================= */
async function renovarAccessTokenApi() {
  const refreshToken = getRefreshTokenApi();

  if (!refreshToken) {
    console.warn("Refresh token não encontrado.");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      })
    });

    const data = await lerRespostaApi(response);

    console.log("REFRESH STATUS:", response.status);
    console.log("REFRESH RESPONSE:", data);

    if (!response.ok) {
      return null;
    }

    const novoAccessToken = extrairNovoAccessToken(data);
    const novoRefreshToken = extrairNovoRefreshToken(data);

    if (!novoAccessToken) {
      console.error("Refresh respondeu sem accessToken:", data);
      return null;
    }

    salvarTokensApi(
      novoAccessToken,
      novoRefreshToken || refreshToken
    );

    return novoAccessToken;

  } catch (error) {
    console.error("Erro ao renovar access token:", error);
    return null;
  }
}

/* ================= FETCH COM REFRESH AUTOMÁTICO ================= */
async function apiFetch(path, options = {}) {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path}`;

  let accessToken = getAccessTokenApi();

  let response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }
  });

  if (response.status !== 401) {
    return response;
  }

  console.warn("Access token expirado. Tentando renovar...");

  const novoAccessToken = await renovarAccessTokenApi();

  if (!novoAccessToken) {
    console.warn("Não foi possível renovar token. Redirecionando para login.");

    limparSessaoApi();

    if (!window.location.pathname.includes("index.html")) {
      window.location.href = "index.html";
    }

    return response;
  }

  response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${novoAccessToken}`
    }
  });

  return response;
}

/* ================= FETCH JSON ================= */
async function apiFetchJson(path, options = {}) {
  const response = await apiFetch(path, options);
  const data = await lerRespostaApi(response);

  return {
    response,
    data
  };
}

/* ================= DISPONIBILIZAR GLOBAL ================= */
window.apiFetch = apiFetch;
window.apiFetchJson = apiFetchJson;
window.renovarAccessTokenApi = renovarAccessTokenApi;
window.getAccessTokenApi = getAccessTokenApi;