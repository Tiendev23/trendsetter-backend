const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.get('/', paymentController.getAllMethods);
router.post("/payos-method", paymentController.createPayOSPayment);

module.exports = router;