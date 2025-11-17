/**
 * Jest Test Setup
 *
 * This file runs before each test suite to set up the test environment
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(__dirname, '../.env.local') });

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock environment variables if not present (for CI/CD)
if (!process.env.STRIPE_CONNECT_CLIENT_ID) {
  process.env.STRIPE_CONNECT_CLIENT_ID = 'ca_test_mock_client_id_123';
}

if (!process.env.ENCRYPTION_KEY) {
  // Generate mock 32-byte key for testing
  process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
}

if (!process.env.STRIPE_SECRET_KEY) {
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_secret_key_123';
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_webhook_secret_123';
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3001';
}

if (!process.env.NEXT_PUBLIC_SITE_URL) {
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3001';
}

// Increase test timeout for integration tests
jest.setTimeout(10000);

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Mock fetch for Node environments
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

// Setup and teardown
beforeAll(() => {
  // Global setup before all tests
});

afterAll(() => {
  // Global cleanup after all tests
});
