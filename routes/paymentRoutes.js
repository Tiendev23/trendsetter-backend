const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/payos-method", paymentController.createPayOSPayment);

module.exports = router;