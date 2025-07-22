const express = require('express');
const router = express.Router();
const { createPolicy } = require('../controllers/policyController');

router.post('/create', createPolicy);

module.exports = router;
