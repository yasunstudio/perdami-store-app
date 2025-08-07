// Service Fee Configuration
export const SERVICE_FEE = {
  VENUE_PICKUP_PER_STORE: 25000, // Rp 25.000 per toko untuk pengambilan di venue
} as const

export const formatServiceFee = (fee: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(fee)
}

// Calculate service fee per store
export const calculateServiceFeePerStore = (storeCount: number): number => {
  return storeCount * SERVICE_FEE.VENUE_PICKUP_PER_STORE
}

export const calculateOrderTotal = (subtotal: number, storeCount: number = 1): {
  subtotal: number
  serviceFee: number
  total: number
} => {
  const serviceFee = calculateServiceFeePerStore(storeCount)
  const total = subtotal + serviceFee
  
  return {
    subtotal,
    serviceFee,
    total
  }
}
