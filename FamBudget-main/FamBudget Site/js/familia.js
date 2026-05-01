(() => {
  const FAMILY_API_URL = "https://www.manage-control-dev.com.br/api/v1";
  let syncTimer = null;
  const userCache = {};

  function getToken() {
    return sessionStorage.getItem("accessToken");
  }

  function headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    };
  }

  async function readResponse(res) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async function apiFetch(path, options = {}) {
    const res = await fetch(`${FAMILY_API_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        ...headers(),
        ...(options.headers || {})
      }
    });

    const data = await readResponse(res);
    return { res, data };
  }

  function showPopup(message, type = "success") {
    const popup = document.getElementById("popup");
    const text = document.getElementById("popup-text");

    if (!popup || !text) {
      alert(message);
      return;
    }

    text.textContent = message;
    popup.classList.remove("hidden", "error");

    if (type === "error") popup.classList.add("error");

    setTimeout(() => {
      popup.classList.add("hidden");
      popup.classList.remove("error");
    }, 2500);
  }

  function decodeToken() {
    const token = getToken();
    if (!token) return {};

    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return {};
    }
  }

  function getCurrentUserId() {
    const user = decodeToken();
    return user.user_id || user.id || null;
  }

  function carregarUsuarioHeader() {
    const user = decodeToken();

    const nomeSalvo =
      sessionStorage.getItem("nomeUsuario") ||
      localStorage.getItem("nomeUsuario") ||
      sessionStorage.getItem("userName") ||
      localStorage.getItem("userName");

    const nome = nomeSalvo || user.name || user.email || "Usuário";

    const nomeUsuario = document.getElementById("nome-usuario");
    const avatar = document.getElementById("avatar");
    const saudacao = document.getElementById("saudacao");

    if (nomeUsuario) nomeUsuario.textContent = nome;
    if (avatar) avatar.textContent = nome.charAt(0).toUpperCase();
    if (saudacao) saudacao.textContent = `Olá, ${nome}!`;
  }

  function initModal() {
    const btn = document.getElementById("btn-abrir-familia");
    const modal = document.getElementById("modal-familia");
    const fechar = document.getElementById("fechar-modal");

    if (!btn || !modal || !fechar) {
      console.error("Modal não encontrado. Verifique os IDs.");
      return;
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.style.display = "flex";
    });

    fechar.addEventListener("click", () => {
      modal.style.display = "none";
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }

  function atualizarBadge(qtd) {
    const badge = document.getElementById("badge-notificacao");
    if (!badge) return;

    badge.textContent = qtd;
    badge.style.display = qtd > 0 ? "inline-block" : "none";
  }

  function getMembersFromResponse(data) {
    return data?.members || data?.data?.members || [];
  }

  async function ensureFamily() {
    const { res } = await apiFetch("/family");

    if (res.status === 404) {
      const create = await apiFetch("/family", {
        method: "POST",
        body: JSON.stringify({
          name: "Minha Família"
        })
      });

      if (!create.res.ok) {
        showPopup(String(create.data), "error");
        return false;
      }
    }

    return true;
  }

  async function loadMembers() {
    const el = document.getElementById("lista-familia");
    if (!el) return [];

    try {
      const { res, data } = await apiFetch("/family");

      if (!res.ok) {
        el.innerHTML = "<p>Você ainda não pertence a uma família</p>";
        return [];
      }

      let members = getMembersFromResponse(data);

      members = Array.from(
        new Map(members.map(m => [m.id, m])).values()
      );

      el.innerHTML = "";

      if (!members.length) {
        el.innerHTML = "<p>Sem membros</p>";
        return [];
      }

      const currentUserId = getCurrentUserId();

      members.forEach(m => {
        const nome = m.name || m.email || `Usuário #${m.id}`;
        const isMe = Number(m.id) === Number(currentUserId);

        const div = document.createElement("div");
        div.className = "membro";

        div.innerHTML = `
          <div class="membro-info">
            <div class="avatar-mini">${nome.charAt(0).toUpperCase()}</div>
            <span>${nome}</span>
          </div>

          ${
            isMe
              ? `<button class="btn-remove" data-action="leave-family">Sair</button>`
              : ""
          }
        `;

        el.appendChild(div);
      });

      return members;

    } catch (err) {
      console.error("Erro ao carregar membros:", err);
      el.innerHTML = "<p>Erro ao carregar família</p>";
      return [];
    }
  }

  async function getMembersOnly() {
    try {
      const { res, data } = await apiFetch("/family");
      if (!res.ok) return [];

      let members = getMembersFromResponse(data);

      return Array.from(
        new Map(members.map(m => [m.id, m])).values()
      );
    } catch {
      return [];
    }
  }

  async function getUserById(userId) {
    if (!userId) return null;

    if (userCache[userId]) return userCache[userId];

    try {
      const { res, data } = await apiFetch(`/user/${userId}`);

      if (!res.ok) return null;

      const user = data?.data || data;
      userCache[userId] = user;

      return user;
    } catch {
      return null;
    }
  }

  async function getInviteName(invite, members) {
    if (invite.fromUser?.name) return invite.fromUser.name;
    if (invite.fromUser?.email) return invite.fromUser.email;

    const member = members.find(m => Number(m.id) === Number(invite.fromUserId));

    if (member) {
      return member.name || member.email || `Usuário #${invite.fromUserId}`;
    }

    const user = await getUserById(invite.fromUserId);

    if (user) {
      return user.name || user.email || `Usuário #${invite.fromUserId}`;
    }

    return `Usuário #${invite.fromUserId || "?"}`;
  }

  async function loadInvites(membersParam = null) {
    const el = document.getElementById("lista-convites");
    if (!el) return;

    try {
      const members = membersParam || await getMembersOnly();

      const { res, data } = await apiFetch("/family/solicitation/pending");

      if (!res.ok) {
        el.innerHTML = "<p>Sem convites</p>";
        atualizarBadge(0);
        return;
      }

      const invites = Array.isArray(data) ? data : data?.data || [];

      el.innerHTML = "";

      if (!invites.length) {
        el.innerHTML = "<p>Sem convites</p>";
        atualizarBadge(0);
        return;
      }

      for (const invite of invites) {
        const nome = await getInviteName(invite, members);

        const div = document.createElement("div");
        div.className = "convite-item";

        div.innerHTML = `
          <div class="convite-info">
            <div class="avatar-convite">${nome.charAt(0).toUpperCase()}</div>

            <div class="dados">
              <strong>${nome}</strong>
              <span>enviou um convite</span>
            </div>
          </div>

          <div class="acoes">
            <button class="btn-aceitar" data-action="accept" data-id="${invite.id}">
              Aceitar
            </button>

            <button class="btn-recusar" data-action="decline" data-id="${invite.id}">
              Negar
            </button>
          </div>
        `;

        el.appendChild(div);
      }

      atualizarBadge(invites.length);

    } catch (err) {
      console.error("Erro ao carregar convites:", err);
      el.innerHTML = "<p>Erro ao carregar convites</p>";
      atualizarBadge(0);
    }
  }

  async function sendInvite(email) {
    const familyOk = await ensureFamily();
    if (!familyOk) return;

    const { res: userRes, data: user } = await apiFetch(
      `/user/search/${encodeURIComponent(email)}`
    );

    if (!userRes.ok) {
      showPopup("Usuário não encontrado", "error");
      return;
    }

    const toUserId =
      user?.data?.id ||
      user?.id ||
      user?.[0]?.id ||
      user?.data?.userId ||
      user?.userId;

    if (!toUserId) {
      showPopup("Não foi possível identificar o usuário", "error");
      return;
    }

    const { res, data } = await apiFetch("/family/solicitation", {
      method: "POST",
      body: JSON.stringify({ toUserId })
    });

    if (!res.ok) {
      showPopup(String(data), "error");
      return;
    }

    showPopup("Convite enviado");

    await syncFamily();

    const modal = document.getElementById("modal-familia");
    if (modal) modal.style.display = "none";
  }

  async function acceptInvite(id) {
    const { res, data } = await apiFetch(`/family/solicitation/${id}/accept`, {
      method: "PUT"
    });

    if (!res.ok) {
      showPopup(String(data), "error");
      return;
    }

    showPopup("Convite aceito");

    await syncFamily();
    setTimeout(syncFamily, 800);
  }

  async function declineInvite(id) {
    const { res, data } = await apiFetch(`/family/solicitation/${id}/decline`, {
      method: "PUT"
    });

    if (!res.ok) {
      showPopup(String(data), "error");
      return;
    }

    showPopup("Convite negado");

    await syncFamily();
  }

  async function leaveFamily() {
    const { res, data } = await apiFetch("/family/leave", {
      method: "DELETE"
    });

    if (!res.ok) {
      showPopup(String(data), "error");
      return;
    }

    showPopup("Você saiu da família");

    await syncFamily();
  }

  async function syncFamily() {
    const members = await loadMembers();
    await loadInvites(members);
  }

  function initForm() {
    const form = document.getElementById("form-familia");

    if (!form) {
      console.error("Formulário form-familia não encontrado.");
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const input = document.getElementById("email-familia");

      if (!input) {
        showPopup("Campo de e-mail não encontrado", "error");
        return;
      }

      const email = input.value.trim();

      if (!email) {
        showPopup("Digite um e-mail", "error");
        return;
      }

      const button = document.getElementById("salvar-membro");

      if (button) {
        button.disabled = true;
        button.textContent = "Enviando...";
      }

      await sendInvite(email);

      if (button) {
        button.disabled = false;
        button.textContent = "Adicionar";
      }

      form.reset();
    });
  }

  function initActions() {
    const convites = document.getElementById("lista-convites");
    const familia = document.getElementById("lista-familia");

    if (convites) {
      convites.addEventListener("click", async (e) => {
        const button = e.target.closest("button");
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        button.disabled = true;

        if (action === "accept") await acceptInvite(id);
        if (action === "decline") await declineInvite(id);

        button.disabled = false;
      });
    }

    if (familia) {
      familia.addEventListener("click", async (e) => {
        const button = e.target.closest("button");
        if (!button) return;

        const action = button.dataset.action;

        button.disabled = true;

        if (action === "leave-family") await leaveFamily();

        button.disabled = false;
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    carregarUsuarioHeader();
    initModal();
    initForm();
    initActions();

    syncFamily();

    document.addEventListener("DOMContentLoaded", () => {
      carregarUsuarioHeader();
      initModal();
      initForm();
      initActions();

      syncFamily();

      window.addEventListener("focus", syncFamily);
    });

    window.addEventListener("focus", syncFamily);
  });
})();