const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.get('/', paymentController.getAllMethods);
router.post("/payos-method", paymentController.createPayOSPayment);


/* GET home page. */
router.get('/succeeded', function (req, res, next) {
    res.render('succeeded');
});
router.get('/cancelled', function (req, res, next) {
    res.render('cancelled');
});

module.exports = router;