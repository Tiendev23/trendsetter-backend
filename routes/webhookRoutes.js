const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

router.post('/transactions/:provider', transactionController.handleWebhook);

module.exports = router;