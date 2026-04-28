console.log("FAMILIA.JS OK");

// 🔥 API (continua externa — precisa liberar CORS no backend)
const API_URL = "https://www.manage-control-dev.com.br/api/v1";

// ==========================
// TOKEN
// ==========================
function getToken() {
  return sessionStorage.getItem("accessToken");
}

// ==========================
// MODAL
// ==========================
function configurarModalFamilia() {
  const btnAbrir = document.getElementById("btn-abrir-familia");
  const modal = document.getElementById("modal-familia");
  const fechar = document.getElementById("fechar-modal");

  if (!btnAbrir || !modal || !fechar) return () => {};

  btnAbrir.onclick = () => modal.style.display = "flex";

  const fecharModal = () => modal.style.display = "none";

  fechar.onclick = fecharModal;

  window.onclick = (e) => {
    if (e.target === modal) fecharModal();
  };

  return fecharModal;
}

// ==========================
// BUSCAR USUÁRIO
// ==========================
async function buscarUsuarioPorEmail(email) {
  const res = await fetch(`${API_URL}/user/search/${encodeURIComponent(email)}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (!res.ok) throw new Error("Usuário não encontrado");

  const data = await res.json();
  return data.data || data;
}

// ==========================
// ENVIAR CONVITE
// ==========================
async function enviarConvite(email) {
  const usuario = await buscarUsuarioPorEmail(email);

  const userId = usuario.id || usuario.userId;

  const res = await fetch(`${API_URL}/family/solicitation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      toUserId: userId
    })
  });

  if (!res.ok) {
    const erro = await res.text();
    console.error("Erro API:", erro);
    throw new Error("Erro ao enviar convite");
  }

  return true;
}

// ==========================
// LISTAR CONVITES
// ==========================
async function carregarConvites() {
  const container = document.getElementById("lista-convites");

  if (!container) return;

  try {
    const res = await fetch(`${API_URL}/family/solicitation/pending`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    if (!res.ok) {
      container.innerHTML = "<p>Erro ao carregar convites</p>";
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = [];
    }

    const convites = data.data || data || [];

    console.log("CONVITES:", convites); // 🔥 DEBUG

    container.innerHTML = "";

    if (convites.length === 0) {
      container.innerHTML = "<p>Sem convites</p>";
      return;
    }

    convites.forEach(convite => {
      const nome =
        convite.fromUser?.name ||
        convite.fromUser?.email ||
        "Usuário";

      const div = document.createElement("div");
      div.classList.add("convite-item");

      div.innerHTML = `
        <div class="convite-info">
          <div class="avatar-convite">
            ${nome.charAt(0).toUpperCase()}
          </div>

          <div class="dados">
            <strong>${nome}</strong>
            <span>enviou um convite</span>
          </div>
        </div>

        <div class="acoes">
          <button class="btn-aceitar" onclick="aceitar(${convite.id})">✔</button>
          <button class="btn-recusar" onclick="recusar(${convite.id})">✖</button>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Erro ao carregar convites:", err);
    container.innerHTML = "<p>Erro ao carregar convites</p>";
  }
}

// ==========================
// ACEITAR CONVITE
// ==========================
async function aceitar(id) {
  console.log("ACEITAR ID:", id);

  try {
    const res = await fetch(`${API_URL}/family/solicitation/${id}/accept`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const text = await res.text();
    console.log("RESPOSTA ACEITAR:", text);

    if (!res.ok) {
      alert(text);
      return;
    }

    alert("Convite aceito! 🎉");

    carregarConvites();

  } catch (err) {
    console.error("Erro ao aceitar:", err);
    alert("Erro ao aceitar convite");
  }
}

// ==========================
// RECUSAR CONVITE
// ==========================
async function recusar(id) {
  console.log("RECUSAR ID:", id);

  try {
    const res = await fetch(`${API_URL}/family/solicitation/${id}/decline`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const text = await res.text();
    console.log("RESPOSTA RECUSAR:", text);

    if (!res.ok) {
      alert(text);
      return;
    }

    alert("Convite recusado ❌");

    carregarConvites();

  } catch (err) {
    console.error("Erro ao recusar:", err);
    alert("Erro ao recusar convite");
  }
}

// ==========================
// FORMULÁRIO
// ==========================
function configurarFamilia() {
  const form = document.getElementById("form-familia");

  if (!form) return;

  const fecharModal = configurarModalFamilia();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email-familia").value.trim();

    if (!email) return;

    try {
      await enviarConvite(email);

      alert("Convite enviado 📧");

      fecharModal();
      carregarConvites();

    } catch (err) {
      console.error(err);
      alert(err.message || "Erro ao enviar convite");
    }

    form.reset();
  });
}

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  configurarFamilia();
  carregarConvites();
});