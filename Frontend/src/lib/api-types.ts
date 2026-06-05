/**
 * Types for Image Generation API
 */

// Model types
export type ImageModel = 'flux' | 'lightning' | 'sdxl';

// Image format types
export type ImageFormat = 'jpg' | 'png' | 'svg';

// SVG conversion parameters
export type ColorMode = 'color' | 'bw';
export type HierarchicalMode = 'stacked' | 'flat';
export type VectorizationMode = 'spline' | 'pixel';

// Image generation request
export interface ImageGenerationRequest {
  prompt: string;
  model: ImageModel;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_steps?: number;
  strength?: number;
  guidance?: number;
  image_b64?: string;
  seed?: number;
  steps?: number;
  desired_format?: ImageFormat;
  clerk_user_id?: string;
}

// Image generation response
export interface ImageGenerationResponse {
  success: boolean;
  message: string;
  data?: ImageGenerationData;
  error?: string;
}

export interface ImageGenerationData {
  image_id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  size_bytes: number;
  model: ImageModel;
  prompt: string;
  seed: number;
  height: number;
  width: number;
  clerk_user_id: string;
}

// SVG conversion request
export interface SVGConversionRequest {
  file: File;
  colormode?: ColorMode;
  hierarchical?: HierarchicalMode;
  mode?: VectorizationMode;
  filter_speckle?: number;
  color_precision?: number;
  layer_difference?: number;
  corner_threshold?: number;
  length_threshold?: number;
  max_iterations?: number;
  splice_threshold?: number;
  path_precision?: number;
}

// SVG conversion response
export interface SVGConversionResponse {
  success: boolean;
  message: string;
  data?: SVGConversionData;
  error?: string;
}

export interface SVGConversionData {
  conversion_id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  original_filename: string;
  original_size_bytes: number;
  svg_size_bytes: number;
  parameters: SVGConversionParameters;
}

export interface SVGConversionParameters {
  colormode: ColorMode;
  hierarchical: HierarchicalMode;
  mode: VectorizationMode;
  filter_speckle: number;
  color_precision: number;
  layer_difference: number;
  corner_threshold: number;
  length_threshold: number;
  max_iterations: number;
  splice_threshold: number;
  path_precision: number;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  cloudinary_configured: boolean;
}

// User response
export interface CurrentUser {
  clerk_user_id: string;
  email: string | null;
  name: string | null;
  image_url: string | null;
  current_credit: number;
  created_at: string;
}

// File download response
export interface DownloadResponse {
  file_type: string;
  public_id: string;
}

// Cleanup response
export interface CleanupResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
