import { Order, StoreSettings } from '../types';

/**
 * Calculates the estimated distance in Kilometers for an order.
 * Uses order.distanceKm if defined, or generates a deterministic distance
 * based on order ID/number.
 */
export const getOrderDistanceKm = (order: Order): number => {
  if (order.distanceKm && order.distanceKm > 0) {
    return order.distanceKm;
  }
  // Deterministic distance calculation (between 2.0 km and 6.5 km)
  const num = (order.id || order.orderNumber || "101").split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const est = 2.0 + (num % 45) / 10;
  return Math.round(est * 10) / 10;
};

/**
 * Calculates rider earnings for a given order based on StoreSettings.
 * Formula: Earning = Max(MinPay, Math.round(DistanceKm * PerKmRate + BasePay))
 */
export const calculateRiderEarningForOrder = (
  order: Order,
  settings: StoreSettings | null
) => {
  const distanceKm = getOrderDistanceKm(order);
  const perKmRate = settings?.riderPerKmRate ?? 15;
  const basePay = settings?.riderBasePay ?? 25;
  const minPay = settings?.riderMinPayPerOrder ?? 35;

  const distancePay = Math.round(distanceKm * perKmRate);
  const totalEarning = Math.max(minPay, Math.round(distancePay + basePay));

  return {
    distanceKm,
    perKmRate,
    basePay,
    minPay,
    distancePay,
    totalEarning
  };
};
