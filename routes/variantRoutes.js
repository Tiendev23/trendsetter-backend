const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variantController');


// router.get('/', variantController.getProductVariants);
router.get('/', variantController.getAllVariants);

module.exports = router;
