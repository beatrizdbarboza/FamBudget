const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

const PORT = 3000;

app.listem(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
});

const path = require("path");

// permite servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "../frontend")));