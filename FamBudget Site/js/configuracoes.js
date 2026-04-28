console.log("CONFIGURACOES.JS OK");

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
});

function carregarUsuario() {
  const nome = localStorage.getItem("nomeUsuario");

  console.log("NOME:", nome);

  if (!nome) return;

  document.getElementById("nome-usuario").textContent = nome;
  document.getElementById("avatar").textContent = nome.charAt(0).toUpperCase();
}

const btnEditar = document.getElementById("editarPerfil");
const modal = document.getElementById("modalPerfil");
const cancelar = document.getElementById("cancelarModal");
const salvar = document.getElementById("salvarPerfil");

const inputNome = document.getElementById("inputNome");
const nomeUsuario = document.getElementById("nomeUsuario");

const avatarPreview = document.getElementById("avatarPreview");
const avatarTopo = document.getElementById("avatar");

const inputAvatar = document.getElementById("inputAvatar");

/* ABRIR MODAL */
btnEditar.addEventListener("click", () => {
  modal.style.display = "flex";
  inputNome.value = nomeUsuario.textContent;
});

/* FECHAR */
cancelar.addEventListener("click", () => {
  modal.style.display = "none";
});

/* SALVAR */
salvar.addEventListener("click", () => {
  const novoNome = inputNome.value;

  if (novoNome.trim() !== "") {
    nomeUsuario.textContent = novoNome;
  }

  modal.style.display = "none";
});

/* PREVIEW AVATAR */
inputAvatar.addEventListener("change", () => {
  const file = inputAvatar.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function(e) {
      avatarPreview.innerHTML = `<img src="${e.target.result}">`;
      avatarTopo.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; border-radius:50%;">`;
    };

    reader.readAsDataURL(file);
  }
});

// ===== INPUT FILE =====
const inputFile = document.getElementById("inputAvatar");
const fileName = document.getElementById("fileName");


if (inputFile && fileName) {
  inputFile.addEventListener("change", () => {
    if (inputFile.files.length > 0) {
      let nome = inputFile.files[0].name;

      if (nome.length > 20) {
        nome = nome.substring(0, 20) + "...";
      }

      fileName.textContent = nome;
    } else {
      fileName.textContent = "Nenhum arquivo escolhido";
    }
  });
}

const avatarCard = document.getElementById("avatarCard");

reader.onload = function(e) {
  const img = `<img src="${e.target.result}" style="width:100%; height:100%; border-radius:50%;">`;

  avatarPreview.innerHTML = img;
  avatarTopo.innerHTML = img;
  avatarCard.innerHTML = img;
};
