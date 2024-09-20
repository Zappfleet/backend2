# مرحله 1: ساخت برنامه
FROM mcr.microsoft.com/windows/nanoserver:ltsc2019 AS builder

# کپی فایل نصبی Node.js به کانتینر
COPY node-v20.16.0-x64.msi .

# نصب Node.js و حذف فایل نصبی
RUN msiexec.exe /i node-v20.16.0-x64.msi /quiet /norestart && \
    del node-v20.16.0-x64.msi

# تنظیم دایرکتوری کاری
WORKDIR C:/app

# کپی فایل‌های پروژه به یک دایرکتوری
COPY package*.json ./ 

# نصب وابستگی‌ها
RUN npm install

# کپی بقیه فایل‌های پروژه
COPY . ./

# مرحله 2: مرحله نهایی
FROM mcr.microsoft.com/windows/nanoserver:ltsc2019 

# ایجاد دایرکتوری برای Node.js
RUN mkdir "C:/Program Files/nodejs/"

# کپی Node.js از مرحله ساخت
COPY --from=builder "C:/Program Files/nodejs/" "C:/Program Files/nodejs/"
COPY --from=builder "C:/app/" "C:/app/"

# تنظیم دایرکتوری کاری
WORKDIR C:/app

# نمایش پورت اپلیکیشن
EXPOSE 4000

# شروع اپلیکیشن
CMD ["cmd", "/c", "npm start"]
