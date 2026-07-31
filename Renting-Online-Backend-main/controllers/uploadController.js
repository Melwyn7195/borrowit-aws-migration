const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure AWS S3 client
// No explicit credentials: on Fargate the SDK's default provider chain reads
// the task role from the container credentials endpoint. Locally it falls back
// to AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from .env, so dev still works.
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

// Configure multer for S3 upload
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = file.originalname.split('.').pop();
      // The `uploads/` prefix lines up with the CloudFront behaviour that
      // fronts this bucket, so the key needs no rewriting to become a URL.
      cb(null, `uploads/products/${uniqueSuffix}.${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// The bucket is private, so the raw S3 URL in file.location is not reachable
// from a browser. Serve through CloudFront when ASSET_BASE_URL is configured.
const publicUrl = (file) =>
  process.env.ASSET_BASE_URL
    ? `${process.env.ASSET_BASE_URL.replace(/\/$/, '')}/${file.key}`
    : file.location;

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private
const uploadSingleImage = (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: publicUrl(req.file),
        key: req.file.key,
      },
    });
  });
};

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private
const uploadMultipleImages = (req, res) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading files',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const urls = req.files.map((file) => ({
      url: publicUrl(file),
      key: file.key,
    }));

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: urls,
      },
    });
  });
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
};
