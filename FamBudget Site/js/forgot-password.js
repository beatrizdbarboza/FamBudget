document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Digite um e-mail válido");
    return;
  }

  sessionStorage.setItem("email", email);

  try {
    const response = await fetch(
      `https://www.manage-control-dev.com.br/api/v1/user/forgot-password/email/${email}`,
      {
        method: "POST"
      }
    );

    const text = await response.text();
    
    if (!response.ok) {
      alert("Erro ao enviar código");
      return;
    }

    window.location.href = "validate-code.html";

  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com servidor");
  }
});