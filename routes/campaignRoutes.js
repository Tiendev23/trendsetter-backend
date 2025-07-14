const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const controller = require('../controllers/campaignController');

router.get('/', controller.getAllCampaigns);
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }]), controller.createCampaign);
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }]), controller.updateCampaign);

module.exports = router;
