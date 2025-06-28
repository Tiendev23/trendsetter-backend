const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.get('/', paymentController.getAllMethods);
router.post("/payos/create-transaction", paymentController.createPayOSPayment);
router.post("/zalopay/create-transaction", paymentController.createZaloPayPayment);

router.get('/callback', paymentController.zaloPayRedirectHandler);


/* GET home page. */
router.get('/succeeded', function (req, res, next) {
    res.render('succeeded');
});
router.get('/cancelled', function (req, res, next) {
    res.render('cancelled');
});

module.exports = router;