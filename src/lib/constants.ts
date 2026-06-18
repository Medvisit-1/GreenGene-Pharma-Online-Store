// Shared commerce constants (amounts in cents, ZAR).
// These are fallback defaults; live values come from admin settings.
export const FREE_SHIPPING_THRESHOLD = 75000; // R750
export const FLAT_SHIPPING = 6500; // R65

/**
 * Compute shipping for a subtotal (cents).
 * @param flat flat shipping fee in cents
 * @param threshold free-shipping threshold in cents (0 = never free)
 */
export function shippingFor(
  subtotalCents: number,
  flat: number = FLAT_SHIPPING,
  threshold: number = FREE_SHIPPING_THRESHOLD
): number {
  if (subtotalCents <= 0) return 0;
  if (threshold > 0 && subtotalCents >= threshold) return 0;
  return flat;
}

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];
