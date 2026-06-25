export default function StaffCustomerManagement() {
  return (
    <div className="bg-surface-container-lowest border border-border-subtle rounded-lg p-xl">
      <h1 className="font-headline-lg text-headline-lg font-bold mb-sm">Quản lý thông tin khách hàng</h1>
      <p className="text-text-muted">
        Quy định báo cáo yêu cầu Staff được xem, tìm kiếm và phân hạng khách hàng. Frontend cũ đang dùng API Admin
        nên không phù hợp cho Staff. Cần bổ sung backend `/staff/customers` trước khi nối màn này vào dữ liệu thật.
      </p>
    </div>
  );
}
