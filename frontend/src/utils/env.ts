/**
 * Environment configuration for the frontend application.
 * Variables prefixed with VITE_ are exposed to the client bundle at compile time by Vite.
 */

/** Base URL for all API requests. Set via VITE_API_BASE_URL in the appropriate .env file. */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;
