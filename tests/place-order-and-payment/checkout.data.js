export const product = {
  name: "Quần Dài Nam Kaki Excool dáng Straight",
  color: "Xám",
  size: "L",
  quantity: 1,
  unitPrice: 400_000,
};

export const noAddressCases = [
  {
    id: "CHK_001",
    name: "Đặt hàng khi chưa có địa chỉ giao hàng",
    paymentLabel: "Thanh toán khi nhận hàng (COD)",
    submitLabel: "ĐẶT HÀNG",
    expectedError: "Vui lòng nhập đầy đủ thông tin giao hàng.",
  },
];

export const addressShippingCases = [
  {
    id: "CHK_002",
    name: "Thêm địa chỉ giao hàng dưới 10 km",
    distanceKm: 5,
    shippingFee: 25_000,
    address: {
      recipientName: "tester1",
      phone: "0899999991",
      province: "Thành phố Hồ Chí Minh",
      district: "Quận 5",
      ward: "Phường 1",
      streetAddress: "273 An Dương Vương",
    },
  },
  {
    id: "CHK_003",
    name: "Thêm địa chỉ giao hàng từ 10–25 km",
    distanceKm: 15,
    shippingFee: 34_000,
    address: {
      recipientName: "tester2",
      phone: "0899999992",
      province: "Thành phố Hồ Chí Minh",
      district: "Thành phố Thủ Đức",
      ward: "Phường Thảo Điền",
      streetAddress: "Vincom Mega Mall Thảo Điền",
    },
  },
  {
    id: "CHK_004",
    name: "Thêm địa chỉ giao hàng trên 25 km",
    distanceKm: 35,
    shippingFee: 50_000,
    address: {
      recipientName: "tester3",
      phone: "0899999993",
      province: "Tỉnh Bình Dương",
      district: "Thành phố Thủ Dầu Một",
      ward: "Phường Hiệp An",
      streetAddress: "Khu du lịch Đại Nam",
    },
  },
];

export const paymentCheckout = {
  address: addressShippingCases[0].address,
  shippingFee: 25_000,
  totalAmount: 425_000,
};

export const paymentCases = [
  {
    id: "CHK_005",
    name: "Đặt hàng bằng COD với tổng tiền dương",
    method: "cod",
    paymentLabel: "Thanh toán khi nhận hàng (COD)",
    submitLabel: "ĐẶT HÀNG",
    gatewayOrigin: null,
    gatewayReadyText: null,
  },
  {
    id: "CHK_006",
    name: "Chuyển đến VNPay với tổng tiền dương",
    method: "vnpay",
    paymentLabel: "VNPay",
    submitLabel: "THANH TOÁN",
    gatewayOrigin: "https://sandbox.vnpayment.vn",
    gatewayReadyText: "Chọn phương thức thanh toán (Test)",
  },
  {
    id: "CHK_007",
    name: "Chuyển đến MoMo với tổng tiền dương",
    method: "momo",
    paymentLabel: "Ví MoMo",
    submitLabel: "THANH TOÁN",
    gatewayOrigin: "https://test-payment.momo.vn",
    gatewayReadyText: "Cổng thanh toán MoMo",
  },
];

export const zeroPaymentCheckout = {
  address: paymentCheckout.address,
  shippingFee: 25_000,
  productVoucherCode: "FIX500OK",
  productDiscountAmount: 400_000,
  shippingVoucherCode: "SHIP40OK",
  shippingDiscountAmount: 25_000,
  totalAmount: 0,
};

export const zeroPaymentCases = [
  {
    id: "CHK_008",
    name: "Đặt đơn 0đ bằng VNPay",
    method: "vnpay",
    paymentLabel: "VNPay",
    resultPaymentLabel: "VNPay",
    submitLabel: "THANH TOÁN",
  },
  {
    id: "CHK_009",
    name: "Đặt đơn 0đ bằng MoMo",
    method: "momo",
    paymentLabel: "Ví MoMo",
    resultPaymentLabel: "MoMo",
    submitLabel: "THANH TOÁN",
  },
  {
    id: "CHK_010",
    name: "Đặt đơn 0đ bằng COD",
    method: "cod",
    paymentLabel: "Thanh toán khi nhận hàng (COD)",
    resultPaymentLabel: "Thanh toán khi nhận hàng",
    submitLabel: "ĐẶT HÀNG",
  },
];
