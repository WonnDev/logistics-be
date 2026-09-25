# Logistics Backend

NestJS backend cho hệ thống logistics, dùng MongoDB + Mongoose, JWT, Swagger và Excel import/export.

## Yêu cầu

- Node.js 20+ hoặc 22+
- MongoDB đang chạy local hoặc remote

## Cài đặt

```bash
npm install
```

Tạo file môi trường từ [.env.example](.env.example):

```bash
cp .env.example .env
```

## Chạy source

Development:

```bash
npm run start:dev
```

Production:

```bash
npm run build
npm run start:prod
```

Swagger:

```text
http://localhost:3000/swagger
```

## Seed dữ liệu mẫu

Script seed sẽ xóa dữ liệu demo cũ trong các collection liên quan rồi chèn lại bộ dữ liệu mẫu.

```bash
npm run seed:example
```

Có thể override MongoDB và mật khẩu admin bằng biến môi trường:

```bash
MONGODB_URI=mongodb://localhost:27017/logistic-be DEFAULT_ADMIN_PASSWORD=123123 npm run seed:example
```

## Login mặc định

- Username: `admin`
- Password: `123123`

## Lưu ý

- File upload dùng `POST /files/upload`
- Import trips dùng `POST /trips/import`
- Swagger đã có example payload cho các field chính để nhập liệu nhanh hơn.