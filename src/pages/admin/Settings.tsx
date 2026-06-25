import { useState, useEffect } from 'react';

interface GeneralSettings {
  storeName: string;
  hotline: string;
  email: string;
  address: string;
  vatRate: number;
}

interface PaymentSettings {
  vnpayEnabled: boolean;
  vnpayTmnCode: string;
  vnpayHashSecret: string;
  vnpayUrl: string;
  momoEnabled: boolean;
  momoPartnerCode: string;
  momoAccessKey: string;
  momoSecretKey: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'system'>('general');
  
  // Settings states
  const [general, setGeneral] = useState<GeneralSettings>({
    storeName: 'Clothy Store - Thời trang cao cấp',
    hotline: '1900 8198',
    email: 'support@clothy.com',
    address: '1 Võ Văn Ngân, Linh Chiểu, Thủ Đức, TP. Hồ Chí Minh',
    vatRate: 8
  });

  const [payments, setPayments] = useState<PaymentSettings>({
    vnpayEnabled: true,
    vnpayTmnCode: 'CLOTHY_TMN',
    vnpayHashSecret: '••••••••••••••••••••••••••••••••',
    vnpayUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    momoEnabled: false,
    momoPartnerCode: 'MOMO_CLOTHY',
    momoAccessKey: 'MOMO_ACCESS_KEY_01',
    momoSecretKey: '••••••••••••••••••••••••••••••••'
  });

  // Backup log states
  const [backupLogs, setBackupLogs] = useState<string[]>([]);
  const [backingUp, setBackingUp] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedGeneral = localStorage.getItem('clothy_settings_general');
      const savedPayments = localStorage.getItem('clothy_settings_payments');
      if (savedGeneral) setGeneral(JSON.parse(savedGeneral));
      if (savedPayments) setPayments(JSON.parse(savedPayments));
    } catch (e) {
      console.error('Error loading settings from localStorage:', e);
    }
  }, []);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('clothy_settings_general', JSON.stringify(general));
    alert('Đã lưu cấu hình chung cửa hàng thành công.');
  };

  const handleSavePayments = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('clothy_settings_payments', JSON.stringify(payments));
    alert('Đã lưu cấu hình cổng thanh toán thành công.');
  };

  const triggerBackup = () => {
    setBackingUp(true);
    setBackupLogs([]);
    const logs = [
      'Initializing system database backup process...',
      'Checking database connection credentials... [OK]',
      'Locking write-queries on active tables to prevent dirty reads...',
      'Exporting database schema... (28 tables processed)',
      'Dumping table rows (users, products, product_variants, orders, order_items)...',
      'Compressing dumped SQL file... (gzip, compression ratio: 78.4%)',
      'Uploading archive to AWS S3 bucket "clothing-store-banners" via S3Config...',
      'S3 Upload complete. Location: s3://clothing-store-banners/backups/CLOTHY_DB_BACKUP_' + new Date().toISOString().replace(/[:.]/g, '-') + '.tar.gz',
      'Unlocking write-queries. Database backup finished successfully! [100%]'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setBackupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logs[i]}`]);
        i++;
      } else {
        clearInterval(interval);
        setBackingUp(false);
      }
    }, 600);
  };

  const mockLogs = [
    { time: '2026-06-25 10:15:30', user: 'Admin Nhóm 10', action: 'Khóa tài khoản khách hàng ID: 12' },
    { time: '2026-06-25 09:44:12', user: 'Nhân viên Nguyễn Văn A', action: 'Xác nhận đơn hàng ORD-2849' },
    { time: '2026-06-25 09:40:05', user: 'Nhân viên Nguyễn Văn A', action: 'Bàn giao đơn hàng ORD-1102 cho đơn vị vận chuyển' },
    { time: '2026-06-25 08:30:19', user: 'Admin Nhóm 10', action: 'Tạo mã giảm giá mới: SUMMER50' },
    { time: '2026-06-25 08:12:00', user: 'Admin Nhóm 10', action: 'Cập nhật hình ảnh banner trang chủ' }
  ];

  return (
    <div className="bg-[#FAFAF8] min-h-full font-body-sm text-body-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-md">
        <h2 className="font-headline-lg text-headline-lg font-bold">Cài đặt hệ thống</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle mb-md gap-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`py-sm px-md font-label-caps text-label-caps border-b-2 font-semibold transition-colors ${
            activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Cấu hình chung
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-sm px-md font-label-caps text-label-caps border-b-2 font-semibold transition-colors ${
            activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Cổng thanh toán
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`py-sm px-md font-label-caps text-label-caps border-b-2 font-semibold transition-colors ${
            activeTab === 'system' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Hệ thống & Sao lưu
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="bg-white rounded-lg border border-border-subtle p-lg shadow-xs max-w-2xl space-y-md">
          <h3 className="font-headline-md text-headline-md font-semibold text-primary border-b pb-sm mb-sm">Thông tin cửa hàng</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Tên cửa hàng</label>
              <input
                type="text"
                className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
                value={general.storeName}
                onChange={(e) => setGeneral({ ...general, storeName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Hotline hỗ trợ</label>
              <input
                type="text"
                className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono"
                value={general.hotline}
                onChange={(e) => setGeneral({ ...general, hotline: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Email liên hệ</label>
              <input
                type="email"
                className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
                value={general.email}
                onChange={(e) => setGeneral({ ...general, email: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Địa chỉ trụ sở chính</label>
              <input
                type="text"
                className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs"
                value={general.address}
                onChange={(e) => setGeneral({ ...general, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Thuế giá trị gia tăng (VAT %)</label>
              <input
                type="number"
                min={0}
                max={50}
                className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono"
                value={general.vatRate}
                onChange={(e) => setGeneral({ ...general, vatRate: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="pt-sm border-t border-border-subtle flex justify-end">
            <button
              type="submit"
              className="px-xl py-sm bg-[#1A1A2E] text-white hover:bg-black transition-colors font-semibold text-xs rounded-DEFAULT"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      )}

      {/* Payment Settings Tab */}
      {activeTab === 'payments' && (
        <form onSubmit={handleSavePayments} className="space-y-md max-w-2xl">
          {/* VNPay */}
          <div className="bg-white rounded-lg border border-border-subtle p-lg shadow-xs space-y-md">
            <div className="flex justify-between items-center border-b border-border-subtle pb-sm">
              <h3 className="font-headline-md text-headline-md font-semibold text-primary">Cổng thanh toán VNPay</h3>
              <div className="flex items-center gap-xs">
                <input
                  type="checkbox"
                  id="chkVNPay"
                  className="rounded-sm border-border-subtle text-primary w-4 h-4 cursor-pointer focus:ring-0 focus:ring-offset-0"
                  checked={payments.vnpayEnabled}
                  onChange={(e) => setPayments({ ...payments, vnpayEnabled: e.target.checked })}
                />
                <label htmlFor="chkVNPay" className="text-xs font-semibold cursor-pointer select-none">Kích hoạt</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Mã kết nối (TMN Code)</label>
                <input
                  type="text"
                  disabled={!payments.vnpayEnabled}
                  className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono disabled:opacity-55"
                  value={payments.vnpayTmnCode}
                  onChange={(e) => setPayments({ ...payments, vnpayTmnCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Mã bảo mật (Hash Secret)</label>
                <input
                  type="password"
                  disabled={!payments.vnpayEnabled}
                  className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono disabled:opacity-55"
                  value={payments.vnpayHashSecret}
                  onChange={(e) => setPayments({ ...payments, vnpayHashSecret: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Đường dẫn thanh toán (Sandbox URL)</label>
                <input
                  type="text"
                  disabled={!payments.vnpayEnabled}
                  className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono disabled:opacity-55"
                  value={payments.vnpayUrl}
                  onChange={(e) => setPayments({ ...payments, vnpayUrl: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* MoMo */}
          <div className="bg-white rounded-lg border border-border-subtle p-lg shadow-xs space-y-md">
            <div className="flex justify-between items-center border-b border-border-subtle pb-sm">
              <h3 className="font-headline-md text-headline-md font-semibold text-primary">Cổng thanh toán MoMo</h3>
              <div className="flex items-center gap-xs">
                <input
                  type="checkbox"
                  id="chkMoMo"
                  className="rounded-sm border-border-subtle text-primary w-4 h-4 cursor-pointer focus:ring-0 focus:ring-offset-0"
                  checked={payments.momoEnabled}
                  onChange={(e) => setPayments({ ...payments, momoEnabled: e.target.checked })}
                />
                <label htmlFor="chkMoMo" className="text-xs font-semibold cursor-pointer select-none">Kích hoạt</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Mã đối tác (Partner Code)</label>
                <input
                  type="text"
                  disabled={!payments.momoEnabled}
                  className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono disabled:opacity-55"
                  value={payments.momoPartnerCode}
                  onChange={(e) => setPayments({ ...payments, momoPartnerCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Khóa truy cập (Access Key)</label>
                <input
                  type="text"
                  disabled={!payments.momoEnabled}
                  className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono disabled:opacity-55"
                  value={payments.momoAccessKey}
                  onChange={(e) => setPayments({ ...payments, momoAccessKey: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-text-muted mb-1 font-label-caps">Khóa mật (Secret Key)</label>
                <input
                  type="password"
                  disabled={!payments.momoEnabled}
                  className="w-full px-md py-sm border border-border-subtle rounded-DEFAULT focus:outline-none focus:border-primary transition-colors text-xs font-mono disabled:opacity-55"
                  value={payments.momoSecretKey}
                  onChange={(e) => setPayments({ ...payments, momoSecretKey: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-sm border-t border-border-subtle flex justify-end">
            <button
              type="submit"
              className="px-xl py-sm bg-[#1A1A2E] text-white hover:bg-black transition-colors font-semibold text-xs rounded-DEFAULT"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      )}

      {/* System & Backups Tab */}
      {activeTab === 'system' && (
        <div className="space-y-md max-w-2xl">
          {/* Status Indicator */}
          <div className="bg-white rounded-lg border border-border-subtle p-lg shadow-xs space-y-md">
            <h3 className="font-headline-md text-headline-md font-semibold text-primary border-b pb-sm">Trạng thái hệ thống</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
              <div className="border border-border-subtle p-sm rounded-lg text-center bg-[#FAFAF8]">
                <p className="text-[10px] text-text-muted font-semibold uppercase font-label-caps">API Server</p>
                <div className="flex justify-center items-center gap-xs mt-xs text-success font-semibold">
                  <span className="w-2.5 h-2.5 bg-success rounded-full animate-ping"></span>
                  Kết nối
                </div>
              </div>
              <div className="border border-border-subtle p-sm rounded-lg text-center bg-[#FAFAF8]">
                <p className="text-[10px] text-text-muted font-semibold uppercase font-label-caps">Database (PostgreSQL)</p>
                <div className="flex justify-center items-center gap-xs mt-xs text-success font-semibold">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  Hoạt động
                </div>
              </div>
              <div className="border border-border-subtle p-sm rounded-lg text-center bg-[#FAFAF8]">
                <p className="text-[10px] text-text-muted font-semibold uppercase font-label-caps">Redis Cache</p>
                <div className="flex justify-center items-center gap-xs mt-xs text-success font-semibold">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  Bật
                </div>
              </div>
              <div className="border border-border-subtle p-sm rounded-lg text-center bg-[#FAFAF8]">
                <p className="text-[10px] text-text-muted font-semibold uppercase font-label-caps">Độ trễ phản hồi</p>
                <p className="mt-xs text-primary font-mono font-bold text-base">42 ms</p>
              </div>
            </div>
          </div>

          {/* Database Backup Section */}
          <div className="bg-white rounded-lg border border-border-subtle p-lg shadow-xs space-y-md">
            <h3 className="font-headline-md text-headline-md font-semibold text-[#1A1A2E] border-b pb-sm">Sao lưu cơ sở dữ liệu</h3>
            <p className="text-text-muted text-xs">
              Thao tác này sẽ khóa tạm thời luồng ghi (write requests) của cơ sở dữ liệu để xuất toàn bộ các bảng trong hệ thống sang tệp SQL nén (.tar.gz), sau đó tự động tải tệp lưu trữ này lên đám mây AWS S3 bảo mật.
            </p>
            
            <div className="flex items-center gap-md">
              <button
                type="button"
                disabled={backingUp}
                onClick={triggerBackup}
                className="flex items-center gap-xs px-md py-sm bg-[#1A1A2E] text-white hover:bg-black transition-colors font-semibold text-xs rounded-DEFAULT disabled:opacity-60"
              >
                {backingUp ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Đang sao lưu...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">backup</span>
                    Bắt đầu sao lưu
                  </>
                )}
              </button>
            </div>

            {backupLogs.length > 0 && (
              <div className="bg-black text-[#00ff00] p-md rounded-lg font-mono text-[11px] h-48 overflow-y-auto space-y-1 mt-md border-2 border-primary shadow-inner select-text">
                {backupLogs.map((log, idx) => (
                  <p key={idx}>{log}</p>
                ))}
              </div>
            )}
          </div>

          {/* System Audit Logs */}
          <div className="bg-white rounded-lg border border-border-subtle p-lg shadow-xs space-y-md">
            <h3 className="font-headline-md text-headline-md font-semibold text-primary border-b pb-sm">Nhật ký hoạt động admin</h3>
            <div className="border border-border-subtle rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#FAFAF8] border-b border-border-subtle">
                  <tr>
                    <th className="py-sm px-md text-[10px] font-semibold text-text-muted uppercase font-label-caps">Thời gian</th>
                    <th className="py-sm px-md text-[10px] font-semibold text-text-muted uppercase font-label-caps">Người thực hiện</th>
                    <th className="py-sm px-md text-[10px] font-semibold text-text-muted uppercase font-label-caps">Thao tác chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container font-mono text-[11px]">
                  {mockLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-sm px-md text-text-muted whitespace-nowrap">{log.time}</td>
                      <td className="py-sm px-md text-text-primary font-semibold">{log.user}</td>
                      <td className="py-sm px-md text-text-primary">{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
