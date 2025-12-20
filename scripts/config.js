/**
 * Bible PWA Configuration
 * Environment-based Stripe configuration for test/live toggle
 */

const StripeConfig = {
  test: {
    url: 'https://buy.stripe.com/test_28EdRad6r8xjaPYg6HbjW00',
    key: 'pk_test_51Se0ShK2HZNqMuLgjDtBitDHmU9sgYOYhQzGpEDpHieTJFJCymkLDXQ9yH6kudMdFMv0X1zrasMMUhPLvHnR60Sj00UGCRQc9u'
  },
  live: {
    url: 'https://buy.stripe.com/28EdRad6r8xjaPYg6HbjW00',
    key: 'pk_live_51Se0ShK2HZNqMuLgXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  }
};

/**
 * Determine environment based on hostname
 * @returns {'test' | 'live'}
 */
function getEnvironment() {
  const hostname = window.location.hostname;

  // Test environments: localhost, 127.0.0.1, local IPs, .local domains
  const isTest =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local');

  return isTest ? 'test' : 'live';
}

/**
 * Get current Stripe configuration based on environment
 * @returns {{ url: string, key: string }}
 */
function getStripeConfig() {
  const env = getEnvironment();
  console.log(`[Config] Environment: ${env} (hostname: ${window.location.hostname})`);
  return StripeConfig[env];
}

// Export for use in app.js
window.BibleConfig = {
  getEnvironment,
  getStripeConfig,
  StripeConfig
};
