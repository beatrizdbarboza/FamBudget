const express = require("express");

const router = express.Router();

const { login, register, refreshToken } = require("./auth");

router.post("/auth/login", login);
router.post("/auth/register", register);
router.post("/auth/refresh", refreshToken);

module.exports = router;