const express = require('express');
const router = express.Router();
const emailController = require("../controllers/emailController")

router.post("/", emailController.sendOtp);
router.post("/verifyOtp",emailController.verifyOtp);
module.exports = router;