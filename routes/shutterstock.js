const express = require('express');
const { uploadCSV, saveOnlyMetadata, downloadAndSave } = require('../controllers/shutterstock.controller');
const multer = require('multer');
const router = express.Router();

const storage = require("../config/multerConfig").storage;
const upload = multer({ storage });

router.post('/upload', upload.single("file"), uploadCSV);

router.post('/saveOnlyMetadata', saveOnlyMetadata);

router.post('/saveMetadataAndDownload', downloadAndSave);

module.exports = router;