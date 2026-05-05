// Native Capacitor platforms aren't installed yet, so we return 'web'.
// This architecture allows adding iOS/Android support later without refactoring.

export type PaymentPlatform = 'web' | 'ios' | 'android';

export function usePaymentPlatform(): PaymentPlatform {
  // Since we haven't added Capacitor yet, we always return 'web'
  return 'web';
}
