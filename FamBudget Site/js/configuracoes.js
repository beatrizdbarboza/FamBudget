console.log("CONFIGURACOES.JS OK");

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  await carregarDadosFinanceiros();
});

function carregarUsuario() {
  const nome = localStorage.getItem("nomeUsuario");

  console.log("NOME:", nome);

  if (!nome) return;

  document.getElementById("nome-usuario").textContent = nome;
  document.getElementById("avatar").textContent = nome.charAt(0).toUpperCase();
}