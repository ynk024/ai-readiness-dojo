import { resolve } from 'node:path';

import { config } from 'dotenv';

// Load test environment variables
const result = config({ path: resolve(__dirname, '.env.test') });

if (result.error) {
  console.error('Error loading .env.test:', result.error);
}
