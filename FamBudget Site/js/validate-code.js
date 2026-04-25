document.getElementById("codeForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const code = document.getElementById("code").value;

  try {
    const response = await fetch(
      `https://www.manage-control-dev.com.br/api/v1/user/validate-code?code=${code}`
    );

    if (!response.ok) {
      alert("Código inválido");
      return;
    }

    localStorage.setItem("resetCode", code);

    window.location.href = "reset-password.html";

  } catch (error) {
    console.error(error);
    alert("Erro ao validar código");
  }
});