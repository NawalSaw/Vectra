/**
 * API Configuration for Image Generation Service
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  GENERATE_IMAGE: '/image/generate-image',
  CONVERT_TO_SVG: '/image/convert-to-svg',
  DOWNLOAD_FILE: '/image/download',
  CLEANUP_FILE: '/image/cleanup',
  HEALTH_CHECK: '/image/health',
  GET_GENERATED_IMAGES: '/image/generated-images',
  GET_SVG_CONVERSIONS: '/image/svg-conversions',
  GET_CURRENT_USER: '/user/me',
} as const;

export type ApiEndpoint = keyof typeof API_ENDPOINTS;
