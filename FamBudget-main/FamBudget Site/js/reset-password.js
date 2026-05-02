function abrirPopup(mensagem) {
  document.getElementById("popup-text").innerText = mensagem;
  document.getElementById("popup").classList.add("show");
}

function fecharPopup() {
  document.getElementById("popup").classList.remove("show");
}

document.addEventListener("DOMContentLoaded", () => {

  // 👁️ mostrar/ocultar senha
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

  // 🔐 SUBMIT ÚNICO
  document.getElementById("resetForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const email = sessionStorage.getItem("email");

    if (password !== confirmPassword) {
      abrirPopup("As senhas não coincidem");
      return; 
    }

    if (!email) {
      abrirPopup("Dados de recuperação inválidos. Reinicie o processo.");
      return;
    }

    const payload = {
      email: email,
      newPassword: password
    };

    try {
      const response = await fetch(
        "https://www.manage-control-dev.com.br/api/v1/user/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const text = await response.text();

      if (!response.ok) {
        abrirPopup("Erro ao redefinir senha");
        return;
      }

      sessionStorage.removeItem("email");
      sessionStorage.removeItem("code");

      abrirPopup("Senha redefinida com sucesso!");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);

    } catch (error) {
      abrirPopup("Erro ao conectar com servidor");
    }
  });

});