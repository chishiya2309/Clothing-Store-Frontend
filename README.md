# CLOTHY — Clothing Store Frontend

> Giao diện người dùng cho nền tảng thương mại điện tử thời trang **CLOTHY**, xây dựng bằng React 19 + TypeScript + Vite.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Tech Stack](#tech-stack)
- [Kiến trúc dự án](#kiến-trúc-dự-án)
- [Tính năng](#tính-năng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt & Chạy](#cài-đặt--chạy)
- [Biến môi trường](#biến-môi-trường)
- [Scripts](#scripts)
- [PWA & Offline](#pwa--offline)
- [Xử lý lỗi](#xử-lý-lỗi)
- [Triển khai](#triển-khai)
- [Đóng góp](#đóng-góp)

---

## Tổng quan

**CLOTHY** là website bán quần áo trực tuyến với đầy đủ tính năng cho cả khách hàng lẫn quản trị viên. Repo này chứa phần **Frontend** — giao tiếp với Backend API (Spring Boot) qua REST.

**Backend repo:** [Clothing-Store](https://github.com/chishiya2309/Clothing-Store-Backend)

---

## Tech Stack

| Lớp | Công nghệ |
|-----|-----------|
| **Framework** | React 19 + TypeScript 6 |
| **Build tool** | Vite 8 |
| **Styling** | Tailwind CSS 3.4, Material Symbols |
| **State management** | Zustand 5 |
| **Routing** | React Router 7 |
| **Form & Validation** | React Hook Form 7 + Zod 4 |
| **HTTP Client** | Axios (JWT auto-refresh) |
| **Charts** | Chart.js + react-chartjs-2 |
| **Drag & Drop** | @dnd-kit |
| **Auth** | JWT + Google OAuth 2.0 |
| **Icons** | Lucide React, Material Symbols |
| **Typography** | Outfit, Inter, Space Mono (Google Fonts) |

---

## Kiến trúc dự án

```
src/
├── assets/              # Hình ảnh, icon, font
├── components/
│   ├── cart/             # MiniCart
│   ├── layout/           # Header, Footer, MainLayout, AdminLayout, AccountLayout
│   ├── product/          # ProductCard
│   ├── review/           # ReviewList
│   └── ui/               # Button, Toast, ConfirmProvider
├── pages/
│   ├── admin/            # Dashboard, quản lý sản phẩm/đơn hàng/voucher/flash sale/...
│   ├── Home.tsx           # Trang chủ
│   ├── ProductDetail.tsx  # Chi tiết sản phẩm
│   ├── Cart.tsx           # Giỏ hàng
│   ├── Checkout.tsx       # Thanh toán
│   ├── Login.tsx          # Đăng nhập
│   ├── Register.tsx       # Đăng ký
│   └── ...                # Profile, Addresses, OrderHistory, Wishlist, Membership
├── router/               # Định tuyến (public, protected, admin, staff)
├── services/             # API service layer (18 service files)
├── store/                # Zustand stores (auth, cart, category, wishlist)
├── styles/               # CSS (animations, typography)
├── types/                # TypeScript interfaces
└── utils/                # Helpers (formatPrice, auth schemas, toast bus, shipping)
```

---

## Tính năng

### 🛍️ Khách hàng

- **Trang chủ:** Banner, flash sale countdown, sản phẩm nổi bật, bộ sưu tập
- **Danh mục & Tìm kiếm:** Bộ lọc sidebar, phân loại theo category/collection, tìm kiếm modal
- **Chi tiết sản phẩm:** Gallery ảnh, chọn size/màu, đánh giá & bình luận
- **Giỏ hàng:** Mini-cart hover, giỏ hàng đầy đủ, cập nhật số lượng
- **Thanh toán:** Quản lý địa chỉ, áp dụng voucher, kết quả thanh toán
- **Tài khoản:** Hồ sơ cá nhân, sổ địa chỉ, lịch sử đơn hàng, chi tiết đơn hàng
- **Wishlist:** Danh sách sản phẩm yêu thích
- **Membership:** Chương trình thành viên / tích điểm

### 🔐 Xác thực

- Đăng ký / Đăng nhập (email + mật khẩu)
- Đăng nhập Google OAuth 2.0
- Xác thực email, quên mật khẩu, đặt lại mật khẩu
- JWT access token + refresh token tự động

### 🛠️ Quản trị (Admin)

- **Dashboard:** Thống kê tổng quan với biểu đồ Chart.js
- **Sản phẩm:** CRUD sản phẩm, quản lý biến thể (size, màu, tồn kho)
- **Đơn hàng:** Xem, cập nhật trạng thái đơn hàng
- **Bộ sưu tập:** Quản lý collection, gán sản phẩm vào collection
- **Banner:** Quản lý banner quảng cáo
- **Voucher:** Tạo và quản lý mã giảm giá
- **Flash Sale:** Quản lý chương trình flash sale
- **Đánh giá:** Duyệt và quản lý review
- **Người dùng:** Quản lý tài khoản khách hàng
- **Báo cáo:** Tồn kho, sản phẩm bán chạy
- **Cài đặt:** Cấu hình hệ thống

### 👷 Staff

- Bộ tính năng quản lý tương tự Admin (trừ quản lý user), phân quyền riêng

### ⚡ PWA & Hiệu năng

- Service Worker + offline fallback
- Cache chiến lược cho tài nguyên tĩnh
- Responsive design (mobile-first)

---

## Yêu cầu hệ thống

- **Node.js** ≥ 20
- **npm** ≥ 10
- Backend API đang chạy tại `http://localhost:8080` (hoặc URL cấu hình qua biến môi trường)

---

## Cài đặt & Chạy

### 1. Clone repo

```bash
git clone https://github.com/chishiya2309/Clothing-Store-Frontend.git
cd Clothing-Store-Frontend
```

### 2. Cài dependencies

```bash
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc:

```env
VITE_API_URL=http://localhost:8080/api
```

### 4. Chạy dev server

```bash
npm run dev
```

Frontend mặc định chạy ở **`http://localhost:3000`** và proxy các request `/api/*` sang backend `http://localhost:8080`.

---

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|--------|----------|
| `VITE_API_URL` | Base URL của Backend API | `http://localhost:8080/api` |

> **Lưu ý:** File `.env` đã được thêm vào `.gitignore`. Mỗi môi trường cần tạo file `.env` riêng.

---

## Scripts

| Lệnh | Mô tả |
|-------|--------|
| `npm run dev` | Chạy dev server (port 3000) |
| `npm run build` | TypeScript check + build production |
| `npm run preview` | Preview bản build production |
| `npm run lint` | Chạy ESLint |

---

## PWA & Offline

| File | Mô tả |
|------|--------|
| `public/manifest.webmanifest` | Web App Manifest |
| `public/sw.js` | Service Worker |
| `public/offline.html` | Trang fallback khi offline |

**Lưu ý quan trọng:**

- Service Worker chỉ được đăng ký ở **production build** (`import.meta.env.PROD`).
- Các request `/api/*` **không** bị Service Worker cache để tránh sai dữ liệu.
- Khi mất mạng, các trang đã cache vẫn truy cập được; nếu không có cache → hiển thị `offline.html`.

---

## Xử lý lỗi

Axios interceptor trong `src/services/api.ts` xử lý tập trung:

| Mã lỗi | Xử lý |
|---------|--------|
| **401** | Tự động refresh token. Nếu refresh thất bại → logout + redirect login |
| **429** | Đọc header `Retry-After` / `X-RateLimit-Reset`, hiển thị toast cảnh báo |
| **Network Error** | Hiển thị toast "offline / kết nối không ổn định" |

Tất cả toast thông báo sử dụng hệ thống **Toast Provider** với cơ chế cooldown để tránh spam.

---

## Triển khai

### Vercel (Khuyên dùng)

Repo đã có sẵn `vercel.json` — chỉ cần kết nối repo GitHub với Vercel:

```jsonc
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Docker

```bash
# Build & chạy
docker compose up -d --build

# Truy cập
http://localhost:3000
```

Dockerfile sử dụng **multi-stage build** (Node 20 → Nginx Alpine), serve tĩnh qua Nginx với cấu hình SPA fallback.

> **Yêu cầu:** Docker network `clothing-store-service` phải tồn tại (external network dùng chung với backend).
>
> ```bash
> docker network create clothing-store-service
> ```

---

## Đóng góp

1. Fork repo
2. Tạo branch mới: `git checkout -b feature/ten-tinh-nang`
3. Commit theo convention: `git commit -m "feat: mô tả ngắn"`
4. Push và tạo Pull Request

---

<p align="center">
  <b>CLOTHY</b> — Thời trang dễ dàng, mua sắm thoải mái 🛒
</p>
