const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

router.post('/transactions/:provider', transactionController.handleWebhook);

/* GET home page. */
router.get('/succeeded', function (req, res, next) {
    res.render('succeeded');
});
router.get('/cancelled', function (req, res, next) {
    res.render('cancelled');
});

module.exports = router;