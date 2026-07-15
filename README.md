# Clothing Store Frontend

Frontend React + TypeScript + Vite cho đồ án Clothing Store.

Repo này hiện đã được bổ sung phần frontend thuộc scope của Quân:

- Manifest cho web app.
- Service worker để hỗ trợ cache cơ bản và offline fallback.
- Trang `offline.html` khi mất mạng.
- Xử lý hiển thị lỗi `429 Too Many Requests` và lỗi mất kết nối bằng toast.

## Quick Start

1. Cài dependencies:

```bash
npm install
```

2. Chạy môi trường dev:

```bash
npm run dev
```

Frontend mặc định chạy ở `http://localhost:3000` và proxy API sang backend `http://localhost:8080`.

## PWA And Offline

- Manifest nằm tại `public/manifest.webmanifest`
- Service worker nằm tại `public/sw.js`
- Offline fallback nằm tại `public/offline.html`

Lưu ý:

- Service worker chỉ được đăng ký ở production build.
- Các request `/api/*` không bị service worker cache để tránh sai dữ liệu.
- Khi mất mạng, các trang đã cache trước đó vẫn có thể mở lại; nếu không có cache phù hợp thì sẽ trả về `offline.html`.

## Error Handling

File `src/services/api.ts` đã bổ sung xử lý:

- `429`: đọc `Retry-After` hoặc `X-RateLimit-Reset` để báo người dùng chờ rồi thử lại.
- Lỗi network/offline: hiển thị toast cảnh báo kết nối.
- Vẫn giữ nguyên flow refresh token và redirect khi `401` hết phiên.

## Demo Checklist

1. Build production:

```bash
npm run build
```

2. Mở site ở production mode hoặc deploy preview.
3. Vào DevTools -> Application -> Service Workers để kiểm tra service worker đã active.
4. Bật chế độ offline trong DevTools rồi reload để kiểm tra offline fallback.
5. Spam login/search/public API để backend trả `429` và kiểm tra toast cảnh báo ở frontend.
