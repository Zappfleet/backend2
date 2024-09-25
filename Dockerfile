# مرحله اول: استفاده از تصویر ویندوزی سنگین‌تر برای ساخت پروژه
FROM mcr.microsoft.com/windows/servercore:ltsc2019 AS build

# تنظیم پوشه کاری
WORKDIR /app

# کپی کردن فایل‌های پروژه به داخل کانتینر
COPY . .

# نصب وابستگی‌های پروژه (node_modules)
RUN npm install

# مرحله دوم: استفاده از تصویر سبک‌تر برای اجرای پروژه
FROM mcr.microsoft.com/windows/nanoserver:ltsc2019

# تنظیم پوشه کاری در تصویر نهایی
WORKDIR /app

# کپی فایل‌های نهایی از مرحله ساخت به تصویر نهایی
COPY --from=build /app .

# حذف وابستگی‌های غیرضروری (بهینه‌سازی برای حجم کمتر)
RUN npm prune --production

# فرمان برای اجرای اپلیکیشن
CMD ["node", "server.js"]
