const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

router.post('/:provider', transactionController.createTransaction);
router.put('/:provider/:orderId', transactionController.cancelTransaction);

/* GET home page. */
router.get('/succeeded', function (req, res, next) {
    res.render('succeeded');
});
router.get('/cancelled', function (req, res, next) {
    res.render('cancelled');
});

module.exports = router;