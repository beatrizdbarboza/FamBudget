function abrirPopup(mensagem) {
  document.getElementById("popup-text").innerText = mensagem;
  document.getElementById("popup").classList.add("show");
}

function fecharPopup() {
  document.getElementById("popup").classList.remove("show");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("codeForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const input = document.getElementById("code");
    const code = input.value.trim().replace(/\s/g, "").toUpperCase();
    const email = sessionStorage.getItem("email");

    if (!email) {
      abrirPopup("Email não encontrado. Refaça o processo.");
      return;
    }

    console.log("EMAIL:", email);
    console.log("CODE:", code);
 try {
      const response = await fetch(
        `https://www.manage-control-dev.com.br/api/v1/user/validate-code?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
        {
          method: "GET"
        }
      );

      const text = await response.text();

      console.log("STATUS:", response.status);
      console.log("RESPOSTA:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (!response.ok) {
        abrirPopup(data.message || "Código inválido");
        return;
      }

      if (data.token) {
        sessionStorage.setItem("resetToken", data.token);
      }
      window.location.href = "reset-password.html";

    } catch (error) {
      console.error(error);
      abrirPopup("Erro ao validar código");
    }
  });
});