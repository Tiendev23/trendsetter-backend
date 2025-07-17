const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const controller = require('../controllers/campaignController');

router.get('/', controller.getAllCampaigns);
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }]), controller.createCampaign);
router.put('/:campaignId', upload.fields([{ name: 'image', maxCount: 1 }]), controller.updateCampaign);

module.exports = router;
