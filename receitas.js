console.log("RECEITAS.JS OK");

document.addEventListener("DOMContentLoaded", async () => {
  carregarUsuario();
  await carregarDadosFinanceiros();
});

document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // MODAL
    // =========================
    const btnNova = document.getElementById("btnNovaDespesa"); // botão abrir
    const modal = document.getElementById("modalNovaReceita");
    const btnCancelar = document.getElementById("cancelarReceita");

    btnNova.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    btnCancelar.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    // =======================
    // FILTROS
    // =======================
    document.querySelectorAll("[data-tipo]").forEach(item => {
    item.addEventListener("click", () => {
        filtros.tipo = item.dataset.tipo;
        aplicarFiltros();
    });
    });


    // =========================
    // SELECT CATEGORIA
    // =========================
    const select = document.getElementById("selectCategoria");
    const dropdown = document.getElementById("dropdownCategoriaModal");
    const textoSelecionado = document.getElementById("categoriaSelecionada");
    const itens = document.querySelectorAll(".item-categoria");

    // abrir/fechar dropdown
    select.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.style.display =
            dropdown.style.display === "block" ? "none" : "block";
    });

    // selecionar categoria
    itens.forEach(item => {
        item.addEventListener("click", (e) => {
            e.stopPropagation();

            const nome = item.getAttribute("data-categoria");
            textoSelecionado.textContent = nome;

            // limpa classes antigas
            textoSelecionado.className = "";

            // adiciona cor da categoria
            item.classList.forEach(classe => {
                if (classe.startsWith("cat-")) {
                    textoSelecionado.classList.add(classe);
                }
            });

            // fecha dropdown
            dropdown.style.display = "none";
        });
    });

    // fechar clicando fora
    document.addEventListener("click", () => {
        dropdown.style.display = "none";
    });


    // =========================
    // SALVAR RECEITA (BASE)
    // =========================
    const btnSalvar = document.getElementById("salvarReceita");

    btnSalvar.addEventListener("click", () => {

        const descricao = document.getElementById("descReceita").value;
        const valor = document.getElementById("valorReceita").value;
        const data = document.getElementById("dataReceita")?.value;
        const categoria = textoSelecionado.textContent;

        const tipo = document.querySelector('input[name="tipoReceita"]:checked')?.value;

        if (!descricao || !valor || categoria === "Selecione uma categoria") {
            alert("Preencha todos os campos!");
            return;
        }

        const novaReceita = {
            descricao,
            valor,
            data,
            categoria,
            tipo
        };

        console.log("Receita salva:", novaReceita);

        // fechar modal
        modal.style.display = "none";

        // limpar campos
        document.getElementById("descReceita").value = "";
        document.getElementById("valorReceita").value = "";
        if (document.getElementById("dataReceita")) {
            document.getElementById("dataReceita").value = "";
        }

        textoSelecionado.textContent = "Selecione uma categoria";
        textoSelecionado.className = "";
    });

});
