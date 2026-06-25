const STANDARD_SHIPPING_FEE = 30000
const FREE_SHIPPING_THRESHOLD = 500000

export const calculateShippingFee = (subtotal: number | string) => {
  return Number(subtotal || 0) > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE
}
