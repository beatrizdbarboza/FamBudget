const axios = require("axios");

const API_URL = "https://www.manage-control-dev.com.br/api/v1";

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    return res.status(200).json(response.data);

  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.detail || error.response.data.message,
      });
    }

    return res.status(500).json({
      message: "Erro ao conectar com a API",
    });
  }
}

async function register(req, res) {
  try {
    const { email, password } = req.body;

    const response = await axios.post(`${API_URL}/user/register`, {
      name,
      email,
      mobileNumber,
      password
    });

    return res.status(201).json(response.data);

  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.detail || error.response.data.message,
      });
    }

    return res.status(500).json({
      message: "Erro ao conectar com a API",
    });
  }
}

async function refreshToken(req, res) {
  try {
    const { refresh_token } = req.body;

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token,
    });

    return res.status(200).json(response.data);

  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.detail || error.response.data.message,
      });
    }

    return res.status(500).json({
      message: "Erro ao renovar token",
    });
  }
}

module.exports = { login, register, refreshToken };