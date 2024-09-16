# مرحله 1: ساخت برنامه
FROM node:18-alpine AS builder

# تنظیم دایرکتوری کاری
WORKDIR /app

# کپی فایل‌های package.json و package-lock.json
COPY package*.json ./

# نصب وابستگی‌ها
RUN npm install

# کپی باقی‌مانده کد اپلیکیشن
COPY . .

# دانلود اسکریپت انتظار
RUN apk update && apk add --no-cache curl \
&& curl -o /wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh \
&& chmod +x /wait-for-it.sh

# ساخت اپلیکیشن (اگر نیاز به مرحله ساخت دارید)
# RUN npm run build  # این خط را اگر نیاز دارید اضافه کنید

# مرحله 2: مرحله نهایی
FROM node:18-alpine

# تنظیم دایرکتوری کاری
WORKDIR /app

# کپی فقط فایل‌های مورد نیاز از مرحله ساخت
COPY --from=builder /app /app

# نصب 'serve' به طور جهانی
RUN npm install -g serve

# نمایش پورت اپلیکیشن
EXPOSE 4000

# استفاده از اسکریپت انتظار و سپس شروع اپلیکیشن
CMD ["/wait-for-it.sh", "mongo:27017", "--", "npm", "start"]
