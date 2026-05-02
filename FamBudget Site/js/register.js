function abrirPopup(mensagem) {
  document.getElementById("popup-text").innerText = mensagem;
  document.getElementById("popup").classList.remove("hidden");
}

function fecharPopup() {
  document.getElementById("popup").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {

  const toggles = document.querySelectorAll(".togglePassword");

  toggles.forEach(icon => {
    icon.addEventListener("click", () => {
      const inputId = icon.getAttribute("data-target");
      const input = document.getElementById(inputId);

      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      icon.classList.toggle("fa-eye");
      icon.classList.toggle("fa-eye-slash");
    });
  });

  const form = document.getElementById("registerForm");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const mobileNumber = document.getElementById("mobileNumber").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      abrirPopup("As senhas não coincidem");
      return;
    }

    try {
      const response = await fetch("https://www.manage-control-dev.com.br/api/v1/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          mobileNumber,
          password
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        abrirPopup("Usuário já existe!");
        return;
      }

      abrirPopup("Cadastro realizado com sucesso!");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);

    } catch (error) {
      console.error("ERRO:", error);
      abrirPopup("Erro ao conectar com o servidor");
    }
  });

});