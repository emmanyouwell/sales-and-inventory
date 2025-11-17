export const BASE_API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://sales-and-inventory-1.onrender.com'
    : 'http://localhost:3000'; // Your deployed Render URL
