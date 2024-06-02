const multer = require("multer");

const storage = multer.diskStorage({
  destination: 'public/images',
  filename: function (req, file, cb) {
    let ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext
    cb(null, file.fieldname + req?.user?.full_name + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage: storage });
exports.uploadFile = upload;