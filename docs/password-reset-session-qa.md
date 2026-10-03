# Kiểm thử thu hồi phiên sau reset mật khẩu

## Kiểm thử tự động

Chạy từ thư mục frontend:

```sh
npm test
npm run build
```

Test guard xác minh trang account, admin và checkout chỉ mở sau khi server xác nhận
phiên. Test Axios kiểm tra refresh đồng thời, thu hồi phiên, lỗi mạng, refresh token
bị thiếu và phản hồi đến muộn sau đăng xuất/đăng nhập tài khoản khác.

## Nghiệm thu trên môi trường kiểm thử

1. Chạy SQL patch và cập nhật tất cả backend instance trước khi dùng frontend mới.
2. Mở ba browser context có bộ nhớ riêng: A, B, C (profile trình duyệt riêng hoặc context tự động).
   Ba tab trong cùng profile thường chia sẻ localStorage và không đại diện cho ba phiên độc lập.
3. Đăng nhập cùng tài khoản kiểm thử trên A và B. Mở trang account và chuẩn bị checkout.
4. Trên C, yêu cầu email reset, mở liên kết và đổi mật khẩu thành công.
5. Trên A, tải lại trang account: phải chuyển về `/login?session=expired` và xóa token cũ.
6. Trên B, tiếp tục checkout hoặc chuyển sang trang account: phải yêu cầu đăng nhập lại.
   Backend phải trả 401 cho request bằng JWT cũ, không tạo đơn hoặc yêu cầu thanh toán mới.
7. Kiểm tra refresh token cũ cũng nhận 401. Tài khoản khác đang đăng nhập vẫn hoạt động.
8. Đăng nhập bằng mật khẩu mới: account và checkout hoạt động bình thường.
9. Giữ một giao dịch VNPay/MoMo đã tạo hợp lệ trước reset: giao dịch không bị hủy bởi bản sửa;
   trang kết quả và callback/IPN vẫn hoạt động.
10. Mô phỏng mất mạng khi kiểm tra phiên: nội dung bảo vệ không mở; nút thử lại hoạt động
    và lỗi mạng không tự xóa phiên hợp lệ.

Không có polling: browser đứng yên phát hiện thu hồi ở lần tải trang hoặc gọi API kế tiếp.
