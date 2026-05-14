function aplicarTemaGlobal() {
  const temaSalvo = localStorage.getItem("temaUsuario") || "claro";

  if (temaSalvo === "escuro") {
    document.body.classList.add("tema-escuro");
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("tema-escuro");
    document.body.classList.remove("dark");
  }
}

function definirTemaGlobal(tema) {
  localStorage.setItem("temaUsuario", tema);

  if (tema === "escuro") {
    document.body.classList.add("tema-escuro");
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("tema-escuro");
    document.body.classList.remove("dark");
  }

  window.dispatchEvent(new Event("temaAlterado"));
}

document.addEventListener("DOMContentLoaded", aplicarTemaGlobal);

window.aplicarTemaGlobal = aplicarTemaGlobal;
window.definirTemaGlobal = definirTemaGlobal;