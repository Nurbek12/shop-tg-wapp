"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
exports.default = (0, express_1.Router)()
    .post('/login', auth_controller_1.login);
