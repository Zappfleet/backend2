const multer = require('multer');
const path = require('path');
const fs = require('fs');



const uploadDir = path.join(__dirname, 'uploads');
// بررسی و ایجاد دایرکتوری اگر وجود ندارد
const createDirIfNotExist = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}



let storage
let newFileName
// تنظیمات مربوط به ذخیره‌سازی فایل‌های آپلود شده
const uploadSetting = () => {
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir); // مسیر پوشه برای ذخیره فایل‌ها
    },
    filename: function (req, file, cb) {
      const { id, name } = req.body;
      newFileName = `${file.originalname}`;
      cb(null, newFileName);
    }
  });
}



// تابعی برای حذف فایل‌های قدیمی
const deleteOldFiles = (id, name, callback) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return callback(err);

    const pattern = new RegExp(`^${id}_${name}_`);

    const filesToDelete = files.filter(file => pattern.test(file));
    let deleteCount = 0;

    if (filesToDelete.length === 0) return callback(null);

    filesToDelete.forEach(file => {
      fs.unlink(path.join(uploadDir, file), err => {
        if (err) return callback(err);

        deleteCount++;
        if (deleteCount === filesToDelete.length) {
          callback(null);
        }
      });
    });
  });
};

// آپلود فایل با استفاده از multer
const upload = (req, res, next) => {

  // بررسی و ایجاد دایرکتوری اگر وجود ندارد
  createDirIfNotExist()


  // تنظیمات مربوط به ذخیره‌سازی فایل‌های آپلود شده
  uploadSetting()


  const { id, name } = req.body;
  // حذف فایل‌های قدیمی
  deleteOldFiles(id, name, (err) => {
    if (err) {
      console.error('Error deleting old files:', err);
      return res.status(500).json({ message: 'Error deleting old files' });
    }

    // آپلود فایل جدید
    const multerUpload = multer({
      storage: storage
    }).single('uploadedFile');

    multerUpload(req, res, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error uploading file', error: err });
      }

      res.status(200).send({ status: 200, data: newFileName })
    });
  });
};

module.exports = upload;
