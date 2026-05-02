(() => {
  const FAMILY_API_URL = "https://www.manage-control-dev.com.br/api/v1";
  const userCache = {};

  /* ================= TOKEN ================= */
  function getToken() {
    const token =
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken");

    if (!token || token === "undefined" || token === "null") {
      return null;
    }

    return token;
  }

  function headers() {
    const token = getToken();

    const baseHeaders = {
      "Content-Type": "application/json"
    };

    if (token) {
      baseHeaders.Authorization = `Bearer ${token}`;
    }

    return baseHeaders;
  }

  /* ================= DADOS POR CONTA ================= */
  function getEmailUsuarioLogado() {
    return (
      sessionStorage.getItem("emailUsuario") ||
      ""
    ).toLowerCase().trim();
  }

  function getUserKeyFamilia() {
    const email = getEmailUsuarioLogado();
    return `fambudget_${email || "usuario"}`;
  }

  function buscarDadoUsuarioFamilia(chave) {
    const userKey = getUserKeyFamilia();
    return localStorage.getItem(`${userKey}_${chave}`);
  }

  function gerarChavePorEmail(email) {
    return `fambudget_${String(email || "usuario").toLowerCase().trim()}`;
  }

  function buscarDadoPorEmail(email, chave) {
    if (!email) return "";

    const userKey = gerarChavePorEmail(email);
    return localStorage.getItem(`${userKey}_${chave}`) || "";
  }

  function getNicknameLogado() {
    return (
      buscarDadoUsuarioFamilia("nicknameUsuario") ||
      buscarDadoUsuarioFamilia("nomeUsuario") ||
      sessionStorage.getItem("nicknameUsuario") ||
      sessionStorage.getItem("nomeUsuario") ||
      "Usuário"
    );
  }

  function getFotoUsuarioLogado() {
    return (
      buscarDadoUsuarioFamilia("avatarUsuario") ||
      buscarDadoUsuarioFamilia("fotoUsuario") ||
      buscarDadoUsuarioFamilia("imagemPerfil") ||
      buscarDadoUsuarioFamilia("fotoPerfil") ||
      buscarDadoUsuarioFamilia("imagemUsuario") ||
      sessionStorage.getItem("avatarUsuario") ||
      sessionStorage.getItem("fotoUsuario") ||
      ""
    );
  }

  function aplicarImagemNoAvatar(elemento, nome, foto) {
    if (!elemento) return;

    elemento.textContent = foto ? "" : String(nome || "U").charAt(0).toUpperCase();

    elemento.style.backgroundImage = "";
    elemento.style.backgroundSize = "";
    elemento.style.backgroundPosition = "";
    elemento.style.backgroundRepeat = "";

    if (foto) {
      elemento.style.setProperty("background-image", `url("${foto}")`, "important");
      elemento.style.setProperty("background-size", "cover", "important");
      elemento.style.setProperty("background-position", "center", "important");
      elemento.style.setProperty("background-repeat", "no-repeat", "important");
    }
  }

  function aplicarUsuarioHeader() {
    const nome = getNicknameLogado();
    const foto = getFotoUsuarioLogado();

    const nomeUsuario = document.getElementById("nome-usuario");
    const avatar = document.getElementById("avatar");
    const saudacao = document.getElementById("saudacao");

    if (nomeUsuario) nomeUsuario.textContent = nome;
    if (saudacao) saudacao.textContent = `Olá, ${nome}!`;

    aplicarImagemNoAvatar(avatar, nome, foto);
  }

  /* ================= API ================= */
  async function readResponse(res) {
    const text = await res.text();

    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async function apiFetch(path, options = {}) {
    const url = path.startsWith("http")
      ? path
      : `${FAMILY_API_URL}${path}`;

    const res = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        ...headers(),
        ...(options.headers || {})
      }
    });

    const data = await readResponse(res);

    if (res.status === 401) {
      console.error("ERRO 401 NO FAMILIA.JS");
      console.error("URL:", url);
      console.error("RESPOSTA:", data);
    }

    return { res, data };
  }

  /* ================= POPUP ESTILIZADO ================= */
  function criarPopupBase() {
    let popup = document.getElementById("popup-familia");

    if (!popup) {
      popup = document.createElement("div");
      popup.id = "popup-familia";
      popup.className = "popup-familia hidden";

      popup.innerHTML = `
        <div class="popup-familia-card">
          <div class="popup-familia-icon" id="popup-familia-icon">✓</div>

          <h3 id="popup-familia-titulo">Tudo certo!</h3>

          <p id="popup-familia-texto">
            Mensagem
          </p>

          <div class="popup-familia-actions" id="popup-familia-actions">
            <button id="popup-familia-ok" class="popup-btn popup-btn-ok">
              OK
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(popup);
    }

    return popup;
  }

  function inserirCssPopup() {
    if (document.getElementById("popup-familia-style")) return;

    const style = document.createElement("style");
    style.id = "popup-familia-style";

    style.textContent = `
      .popup-familia {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        padding: 20px;
      }

      .popup-familia.hidden {
        display: none;
      }

      .popup-familia-card {
        width: 100%;
        max-width: 390px;
        background: #ffffff;
        border-radius: 22px;
        padding: 28px 24px;
        text-align: center;
        box-shadow: 0 20px 55px rgba(0, 0, 0, 0.2);
        animation: popupFamiliaShow 0.22s ease;
      }

      @keyframes popupFamiliaShow {
        from {
          opacity: 0;
          transform: translateY(15px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .popup-familia-icon {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        margin: 0 auto 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        font-weight: 800;
        color: #ffffff;
        background: linear-gradient(135deg, #1f8f3a, #43c76f);
      }

      .popup-familia.error .popup-familia-icon {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }

      .popup-familia.warning .popup-familia-icon {
        background: linear-gradient(135deg, #f97316, #ef4444);
      }

      .popup-familia-card h3 {
        margin: 0;
        font-size: 22px;
        color: #111827;
      }

      .popup-familia-card p {
        margin: 10px 0 24px;
        color: #4b5563;
        font-size: 15px;
        line-height: 1.4;
      }

      .popup-familia-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .popup-btn {
        border: none;
        border-radius: 12px;
        padding: 11px 20px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.15s ease, filter 0.15s ease;
      }

      .popup-btn:hover {
        transform: translateY(-1px);
        filter: brightness(0.96);
      }

      .popup-btn-ok {
        background: #238636;
        color: #ffffff;
        min-width: 110px;
      }

      .popup-btn-cancelar {
        background: #e5e7eb;
        color: #374151;
      }

      .popup-btn-confirmar {
        background: #ef4444;
        color: #ffffff;
      }

      .avatar-convite {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2e7d32, #43a047);
        color: #ffffff;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
      }

      .avatar-convite.com-foto {
        color: transparent;
        border: 2px solid #2e7d32;
        background-color: #e8f5e9;
      }
    `;

    document.head.appendChild(style);
  }

  function showPopup(message, type = "success") {
    const popup = criarPopupBase();

    const icon = document.getElementById("popup-familia-icon");
    const titulo = document.getElementById("popup-familia-titulo");
    const texto = document.getElementById("popup-familia-texto");
    const actions = document.getElementById("popup-familia-actions");

    popup.className = `popup-familia ${type}`;

    if (type === "error") {
      icon.textContent = "!";
      titulo.textContent = "Atenção";
    } else if (type === "warning") {
      icon.textContent = "!";
      titulo.textContent = "Confirmação";
    } else {
      icon.textContent = "✓";
      titulo.textContent = "Tudo certo!";
    }

    texto.textContent = message || "Ocorreu um erro. Tente novamente.";

    actions.innerHTML = `
      <button id="popup-familia-ok" class="popup-btn popup-btn-ok">
        OK
      </button>
    `;

    popup.classList.remove("hidden");

    document.getElementById("popup-familia-ok").onclick = () => {
      popup.classList.add("hidden");
    };

    if (type !== "warning") {
      setTimeout(() => {
        popup.classList.add("hidden");
      }, 2500);
    }
  }

  function showConfirmPopup(message, onConfirm) {
    const popup = criarPopupBase();

    const icon = document.getElementById("popup-familia-icon");
    const titulo = document.getElementById("popup-familia-titulo");
    const texto = document.getElementById("popup-familia-texto");
    const actions = document.getElementById("popup-familia-actions");

    popup.className = "popup-familia warning";

    icon.textContent = "!";
    titulo.textContent = "Tem certeza?";
    texto.textContent = message;

    actions.innerHTML = `
      <button id="popup-familia-cancelar" class="popup-btn popup-btn-cancelar">
        Cancelar
      </button>

      <button id="popup-familia-confirmar" class="popup-btn popup-btn-confirmar">
        Sair
      </button>
    `;

    popup.classList.remove("hidden");

    document.getElementById("popup-familia-cancelar").onclick = () => {
      popup.classList.add("hidden");
    };

    document.getElementById("popup-familia-confirmar").onclick = async () => {
      popup.classList.add("hidden");

      if (typeof onConfirm === "function") {
        await onConfirm();
      }
    };
  }

  /* ================= TOKEN DATA ================= */
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

    return (
      user.user_id ||
      user.userId ||
      user.id ||
      user.sub ||
      null
    );
  }

  function isUsuarioLogado(userId) {
    const currentUserId = getCurrentUserId();
    return Number(userId) === Number(currentUserId);
  }

  /* ================= MODAL ================= */
  function initModal() {
    const btn = document.getElementById("btn-abrir-familia");
    const modal = document.getElementById("modal-familia");
    const fechar = document.getElementById("fechar-modal");

    if (!btn || !modal || !fechar) {
      return;
    }

    btn.onclick = (e) => {
      e.preventDefault();
      modal.style.display = "flex";
    };

    fechar.onclick = () => {
      modal.style.display = "none";
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    };
  }

  function configurarModalFamilia() {
    initModal();
  }

  window.configurarModalFamilia = configurarModalFamilia;

  /* ================= BADGE ================= */
  function atualizarBadge(qtd) {
    const badge = document.getElementById("badge-notificacao");

    if (!badge) return;

    const email =
      sessionStorage.getItem("emailUsuario") ||
      localStorage.getItem("emailUsuario") ||
      "usuario";

    const userKey = `fambudget_${String(email).toLowerCase().trim()}`;
    const notificacoesAtivas = localStorage.getItem(`${userKey}_notificacoesSistema`);

    if (notificacoesAtivas === "false") {
      badge.textContent = "0";
      badge.style.display = "none";
      return;
    }

    badge.textContent = qtd;
    badge.style.display = qtd > 0 ? "inline-flex" : "none";
  }

  /* ================= MEMBERS ================= */
  function getMembersFromResponse(data) {
    return (
      data?.members ||
      data?.data?.members ||
      data?.family?.members ||
      []
    );
  }

  function pegarIdMembro(membro) {
    return (
      membro?.userId ||
      membro?.user_id ||
      membro?.memberUserId ||
      membro?.member_user_id ||
      membro?.familyUserId ||
      membro?.userCreatedFamilyId ||
      membro?.user?.id ||
      membro?.usuario?.id ||
      membro?.member?.id ||
      membro?.familyUser?.id ||
      membro?.id ||
      null
    );
  }

  function pegarEmailMembro(membro) {
    return (
      membro?.email ||
      membro?.userEmail ||
      membro?.emailUser ||

      membro?.user?.email ||
      membro?.usuario?.email ||
      membro?.member?.email ||
      membro?.familyUser?.email ||

      ""
    ).toLowerCase().trim();
  }

  function pegarNomeMembro(membro) {
    const id = pegarIdMembro(membro);

    if (isUsuarioLogado(id)) {
      return getNicknameLogado();
    }

    const emailMembro = pegarEmailMembro(membro);

    const nicknameSalvo =
      buscarDadoPorEmail(emailMembro, "nicknameUsuario") ||
      buscarDadoPorEmail(emailMembro, "nomeUsuario");

    if (nicknameSalvo) {
      return nicknameSalvo;
    }

    return (
      membro?.nickname ||
      membro?.nickName ||
      membro?.name ||
      membro?.nome ||
      membro?.email ||

      membro?.user?.nickname ||
      membro?.user?.nickName ||
      membro?.user?.name ||
      membro?.user?.nome ||
      membro?.user?.email ||

      membro?.usuario?.nickname ||
      membro?.usuario?.nickName ||
      membro?.usuario?.name ||
      membro?.usuario?.nome ||
      membro?.usuario?.email ||

      membro?.member?.nickname ||
      membro?.member?.nickName ||
      membro?.member?.name ||
      membro?.member?.nome ||
      membro?.member?.email ||

      membro?.familyUser?.nickname ||
      membro?.familyUser?.nickName ||
      membro?.familyUser?.name ||
      membro?.familyUser?.nome ||
      membro?.familyUser?.email ||

      `Usuário #${id || "?"}`
    );
  }

  function pegarFotoMembro(membro) {
    const id = pegarIdMembro(membro);

    if (isUsuarioLogado(id)) {
      return getFotoUsuarioLogado();
    }

    const emailMembro = pegarEmailMembro(membro);

    const fotoSalva =
      buscarDadoPorEmail(emailMembro, "avatarUsuario") ||
      buscarDadoPorEmail(emailMembro, "fotoUsuario") ||
      buscarDadoPorEmail(emailMembro, "imagemPerfil") ||
      buscarDadoPorEmail(emailMembro, "fotoPerfil") ||
      buscarDadoPorEmail(emailMembro, "imagemUsuario");

    if (fotoSalva) {
      return fotoSalva;
    }

    return (
      membro?.photo ||
      membro?.foto ||
      membro?.avatar ||
      membro?.image ||
      membro?.imagem ||
      membro?.profileImage ||
      membro?.profilePhoto ||
      membro?.photoURL ||
      membro?.photoUrl ||
      membro?.avatarUrl ||
      membro?.avatarURL ||
      membro?.picture ||
      membro?.pictureUrl ||

      membro?.user?.photo ||
      membro?.user?.foto ||
      membro?.user?.avatar ||
      membro?.user?.image ||
      membro?.user?.imagem ||
      membro?.user?.profileImage ||
      membro?.user?.profilePhoto ||
      membro?.user?.photoURL ||
      membro?.user?.photoUrl ||
      membro?.user?.avatarUrl ||
      membro?.user?.avatarURL ||
      membro?.user?.picture ||
      membro?.user?.pictureUrl ||

      membro?.usuario?.photo ||
      membro?.usuario?.foto ||
      membro?.usuario?.avatar ||
      membro?.usuario?.image ||
      membro?.usuario?.imagem ||
      membro?.usuario?.profileImage ||
      membro?.usuario?.profilePhoto ||
      membro?.usuario?.photoURL ||
      membro?.usuario?.photoUrl ||
      membro?.usuario?.avatarUrl ||
      membro?.usuario?.avatarURL ||
      membro?.usuario?.picture ||
      membro?.usuario?.pictureUrl ||

      ""
    );
  }

  async function ensureFamily() {
    const { res, data } = await apiFetch("/family");

    if (res.status === 401) {
      showPopup("Sua sessão expirou. Faça login novamente.", "error");
      return false;
    }

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

      return true;
    }

    if (!res.ok) {
      console.error("Erro ao verificar família:", data);
      showPopup("Erro ao verificar família.", "error");
      return false;
    }

    return true;
  }

  async function loadMembers() {
    const el = document.getElementById("lista-familia");

    if (!el) return [];

    try {
      const { res, data } = await apiFetch("/family");

      if (res.status === 401) {
        el.innerHTML = "<p>Sessão expirada. Faça login novamente.</p>";
        return [];
      }

      if (res.status === 404) {
        el.innerHTML = "<p>Você ainda não pertence a uma família</p>";
        return [];
      }

      if (!res.ok) {
        console.error("Erro ao carregar família:", data);
        el.innerHTML = "<p>Erro ao carregar família</p>";
        return [];
      }

      let members = getMembersFromResponse(data);

      members = Array.from(
        new Map(members.map((m) => [pegarIdMembro(m) || m.id, m])).values()
      );

      el.innerHTML = "";

      if (!members.length) {
        el.innerHTML = "<p>Sem membros</p>";
        return [];
      }

      members.forEach((m) => {
        const id = pegarIdMembro(m);
        const nome = pegarNomeMembro(m);
        const foto = pegarFotoMembro(m);
        const isMe = isUsuarioLogado(id);

        const div = document.createElement("div");
        div.className = "membro";

        div.innerHTML = `
          <div class="membro-info">
            <div class="avatar-mini"></div>
            <span>${nome}</span>
          </div>

          ${
            isMe
              ? `<button class="btn-remove" data-action="leave-family">Sair</button>`
              : ""
          }
        `;

        const avatarMini = div.querySelector(".avatar-mini");
        aplicarImagemNoAvatar(avatarMini, nome, foto);

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
        new Map(members.map((m) => [pegarIdMembro(m) || m.id, m])).values()
      );
    } catch {
      return [];
    }
  }

  /* ================= USER BY ID ================= */
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

  /* ================= HELPERS DO CONVITE ================= */
  function pegarUsuarioDoConvite(invite) {
    return (
      invite?.fromUser ||
      invite?.sender ||
      invite?.inviter ||
      invite?.createdBy ||
      invite?.user ||
      invite?.usuario ||
      invite?.solicitor ||
      invite?.solicitante ||
      invite?.owner ||
      null
    );
  }

  function pegarIdConvite(invite) {
    return (
      invite?.id ||
      invite?.solicitationId ||
      invite?.solicitation_id ||
      invite?.familySolicitationId ||
      invite?.family_solicitation_id ||
      null
    );
  }

  function pegarIdUsuarioConvite(invite) {
    const usuario = pegarUsuarioDoConvite(invite);

    return (
      invite?.fromUserId ||
      invite?.from_user_id ||
      invite?.senderId ||
      invite?.sender_id ||
      invite?.inviterId ||
      invite?.inviter_id ||
      invite?.createdById ||
      invite?.created_by_id ||
      invite?.userCreatedFamilyId ||
      invite?.user_created_family_id ||
      invite?.userId ||
      usuario?.id ||
      usuario?.userId ||
      usuario?.user_id ||
      null
    );
  }

  function pegarEmailConvite(invite, usuario = null) {
    const user = usuario || pegarUsuarioDoConvite(invite);

    return (
      invite?.fromUserEmail ||
      invite?.from_user_email ||
      invite?.senderEmail ||
      invite?.sender_email ||
      invite?.inviterEmail ||
      invite?.inviter_email ||
      invite?.email ||
      user?.email ||
      user?.userEmail ||
      user?.emailUser ||
      ""
    ).toLowerCase().trim();
  }

  function pegarNomeUsuarioObj(usuario) {
    if (!usuario) return "";

    return (
      usuario?.nickname ||
      usuario?.nickName ||
      usuario?.name ||
      usuario?.nome ||
      usuario?.username ||
      usuario?.email ||
      ""
    );
  }

  function pegarFotoUsuarioObj(usuario) {
    if (!usuario) return "";

    return (
      usuario?.photo ||
      usuario?.foto ||
      usuario?.avatar ||
      usuario?.image ||
      usuario?.imagem ||
      usuario?.profileImage ||
      usuario?.profilePhoto ||
      usuario?.photoURL ||
      usuario?.photoUrl ||
      usuario?.avatarUrl ||
      usuario?.avatarURL ||
      usuario?.picture ||
      usuario?.pictureUrl ||
      usuario?.urlPhoto ||
      usuario?.urlFoto ||
      ""
    );
  }

  async function getInviteName(invite, members) {
    const usuario = pegarUsuarioDoConvite(invite);

    const nomeDireto = pegarNomeUsuarioObj(usuario);
    if (nomeDireto) return nomeDireto;

    const fromUserId = pegarIdUsuarioConvite(invite);

    const member = members.find(
      (m) => Number(pegarIdMembro(m)) === Number(fromUserId)
    );

    if (member) {
      return pegarNomeMembro(member);
    }

    const user = await getUserById(fromUserId);

    if (user) {
      const nome = pegarNomeUsuarioObj(user);

      if (nome) return nome;
    }

    return `Usuário #${fromUserId || "?"}`;
  }

  async function getInvitePhoto(invite, members) {
    const usuario = pegarUsuarioDoConvite(invite);
    const email = pegarEmailConvite(invite, usuario);
    const fromUserId = pegarIdUsuarioConvite(invite);

    const fotoDireta =
      pegarFotoUsuarioObj(usuario) ||
      invite?.photo ||
      invite?.foto ||
      invite?.avatar ||
      invite?.image ||
      invite?.imagem ||
      invite?.profileImage ||
      invite?.profilePhoto ||
      invite?.photoURL ||
      invite?.photoUrl ||
      invite?.avatarUrl ||
      invite?.avatarURL ||
      invite?.picture ||
      invite?.pictureUrl ||
      "";

    if (fotoDireta) return fotoDireta;

    const fotoSalva =
      buscarDadoPorEmail(email, "avatarUsuario") ||
      buscarDadoPorEmail(email, "fotoUsuario") ||
      buscarDadoPorEmail(email, "imagemPerfil") ||
      buscarDadoPorEmail(email, "fotoPerfil") ||
      buscarDadoPorEmail(email, "imagemUsuario");

    if (fotoSalva) return fotoSalva;

    const member = members.find(
      (m) => Number(pegarIdMembro(m)) === Number(fromUserId)
    );

    if (member) {
      const fotoMembro = pegarFotoMembro(member);
      if (fotoMembro) return fotoMembro;
    }

    const user = await getUserById(fromUserId);

    if (user) {
      const fotoUser = pegarFotoUsuarioObj(user);
      if (fotoUser) return fotoUser;
    }

    return "";
  }

  function aplicarAvatarConvite(elemento, nome, foto) {
    if (!elemento) return;

    const inicial = String(nome || "U").charAt(0).toUpperCase();

    elemento.textContent = inicial;
    elemento.classList.remove("com-foto");

    elemento.style.backgroundImage = "";
    elemento.style.backgroundSize = "";
    elemento.style.backgroundPosition = "";
    elemento.style.backgroundRepeat = "";

    if (foto) {
      elemento.textContent = "";
      elemento.classList.add("com-foto");
      elemento.style.setProperty("background-image", `url("${foto}")`, "important");
      elemento.style.setProperty("background-size", "cover", "important");
      elemento.style.setProperty("background-position", "center", "important");
      elemento.style.setProperty("background-repeat", "no-repeat", "important");
    }
  }

  /* ================= INVITES ================= */
  async function loadInvites(membersParam = null) {
    const el = document.getElementById("lista-convites");

    if (!el) return;

    try {
      const members = membersParam || await getMembersOnly();

      const { res, data } = await apiFetch("/family/solicitation/pending");

      if (res.status === 401) {
        el.innerHTML = "<p>Sessão expirada. Faça login novamente.</p>";
        atualizarBadge(0);
        return;
      }

      if (!res.ok) {
        el.innerHTML = "<p>Sem convites</p>";
        atualizarBadge(0);
        return;
      }

      const invites = Array.isArray(data) ? data : data?.data || [];

      console.log("CONVITES RECEBIDOS DA API:", invites);

      el.innerHTML = "";

      if (!invites.length) {
        el.innerHTML = "<p>Sem convites</p>";
        atualizarBadge(0);
        return;
      }

      for (const invite of invites) {
        const nome = await getInviteName(invite, members);
        const foto = await getInvitePhoto(invite, members);
        const conviteId = pegarIdConvite(invite);

        const div = document.createElement("div");
        div.className = "convite-item";

        div.innerHTML = `
          <div class="convite-info">
            <div class="avatar-convite"></div>

            <div class="dados">
              <strong>${nome}</strong>
              <span>Enviou um convite</span>
            </div>
          </div>

          <div class="acoes">
            <button class="btn-aceitar" data-action="accept" data-id="${conviteId}">
              Aceitar
            </button>

            <button class="btn-recusar" data-action="decline" data-id="${conviteId}">
              Negar
            </button>
          </div>
        `;

        const avatarConvite = div.querySelector(".avatar-convite");
        aplicarAvatarConvite(avatarConvite, nome, foto);

        el.appendChild(div);
      }

      atualizarBadge(invites.length);

    } catch (err) {
      console.error("Erro ao carregar convites:", err);
      el.innerHTML = "<p>Erro ao carregar convites</p>";
      atualizarBadge(0);
    }
  }

  /* ================= SEND INVITE ================= */
  async function sendInvite(email) {
    const familyOk = await ensureFamily();

    if (!familyOk) return;

    const { res: userRes, data: user } = await apiFetch(
      `/user/search/${encodeURIComponent(email)}`
    );

    if (!userRes.ok) {
      showPopup("Usuário não encontrado.", "error");
      return;
    }

    const toUserId =
      user?.data?.id ||
      user?.id ||
      user?.[0]?.id ||
      user?.data?.userId ||
      user?.userId;

    if (!toUserId) {
      showPopup("Não foi possível identificar o usuário.", "error");
      return;
    }

    const { res, data } = await apiFetch("/family/solicitation", {
      method: "POST",
      body: JSON.stringify({ toUserId })
    });

    if (!res.ok) {
      showPopup(typeof data === "string" ? data : "Erro ao enviar convite.", "error");
      return;
    }

    showPopup("Convite enviado com sucesso!");

    await syncFamily();

    const modal = document.getElementById("modal-familia");

    if (modal) {
      modal.style.display = "none";
    }
  }

  /* ================= ACCEPT / DECLINE ================= */
  async function acceptInvite(id) {
    if (!id || id === "null" || id === "undefined") {
      showPopup("Não foi possível identificar este convite.", "error");
      return;
    }

    const { res, data } = await apiFetch(`/family/solicitation/${id}/accept`, {
      method: "PUT"
    });

    if (!res.ok) {
      showPopup(typeof data === "string" ? data : "Erro ao aceitar convite.", "error");
      return;
    }

    showPopup("Convite aceito com sucesso!");

    await syncFamily();
    setTimeout(syncFamily, 800);
  }

  async function declineInvite(id) {
    if (!id || id === "null" || id === "undefined") {
      showPopup("Não foi possível identificar este convite.", "error");
      return;
    }

    const { res, data } = await apiFetch(`/family/solicitation/${id}/decline`, {
      method: "PUT"
    });

    if (!res.ok) {
      showPopup(typeof data === "string" ? data : "Erro ao negar convite.", "error");
      return;
    }

    showPopup("Convite negado.");

    await syncFamily();
  }

  async function leaveFamily() {
    showConfirmPopup("Você realmente deseja sair desta família?", async () => {
      const { res, data } = await apiFetch("/family/leave", {
        method: "DELETE"
      });

      if (!res.ok) {
        showPopup(typeof data === "string" ? data : "Erro ao sair da família.", "error");
        return;
      }

      showPopup("Você saiu da família.");

      await syncFamily();
    });
  }

  /* ================= SYNC ================= */
  async function syncFamily() {
    const members = await loadMembers();
    await loadInvites(members);
  }

  /* ================= FORM ================= */
  function initForm() {
    const form = document.getElementById("form-familia");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const input = document.getElementById("email-familia");

      if (!input) {
        showPopup("Campo de e-mail não encontrado.", "error");
        return;
      }

      const email = input.value.trim();

      if (!email) {
        showPopup("Digite um e-mail.", "error");
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

  /* ================= ACTIONS ================= */
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

        if (action === "accept") {
          await acceptInvite(id);
        }

        if (action === "decline") {
          await declineInvite(id);
        }

        button.disabled = false;
      });
    }

    if (familia) {
      familia.addEventListener("click", async (e) => {
        const button = e.target.closest("button");

        if (!button) return;

        const action = button.dataset.action;

        button.disabled = true;

        if (action === "leave-family") {
          await leaveFamily();
        }

        button.disabled = false;
      });
    }
  }

  /* ================= INIT ================= */
  document.addEventListener("DOMContentLoaded", () => {
    inserirCssPopup();
    aplicarUsuarioHeader();
    initModal();
    initForm();
    initActions();
    syncFamily();

    window.addEventListener("focus", syncFamily);
  });

  window.syncFamily = syncFamily;
})();