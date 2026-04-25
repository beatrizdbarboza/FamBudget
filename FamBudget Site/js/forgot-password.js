document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;

  try {
    const response = await fetch(
      `https://www.manage-control-dev.com.br/api/v1/user/forgot-password/email/${email}`,
      {
        method: "POST"
      }
    );

    if (!response.ok) {
      alert("Erro ao enviar código");
      return;
    }

    localStorage.setItem("resetEmail", email);

    alert("Código enviado para seu e-mail");

    window.location.href = "validate-code.html";

  } catch {
    alert("Erro ao conectar com servidor");
  }
});