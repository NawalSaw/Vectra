# Image Generation Frontend Hook

A comprehensive React hook for interacting with the Image Generation API. Built with TanStack Query for efficient state management and caching.

## Features

- 🎨 **Image Generation**: Generate images using Flux, Lightning, and SDXL models
- 🔄 **SVG Conversion**: Convert images to vector SVG format
- 💾 **File Management**: Download and cleanup files from Cloudinary
- 🏥 **Health Checks**: Monitor API status
- ⚡ **Optimized**: Built with TanStack Query for caching and state management
- 📝 **Type-Safe**: Full TypeScript support
- 🎯 **Modular**: Use individual hooks or the combined API hook

## Installation

The hook is already part of your frontend project. Simply import it:

```tsx
import { useImageGeneration, useImageGenerationAPI } from '@/hooks/use-image-generation';
```

## Configuration

Add the API base URL to your `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Quick Start

### Basic Image Generation

```tsx
import { useImageGeneration } from '@/hooks/use-image-generation';
import { useState } from 'react';

function ImageGenerator() {
  const [prompt, setPrompt] = useState('A beautiful sunset');
  const generateImage = useImageGeneration();

  const handleGenerate = async () => {
    try {
      const result = await generateImage.mutateAsync({
        prompt,
        model: 'flux',
        width: 1024,
        height: 1024,
      });

      if (result.success) {
        console.log('Image URL:', result.data.cloudinary_url);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <div>
      <input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={handleGenerate} disabled={generateImage.isPending}>
        {generateImage.isPending ? 'Generating...' : 'Generate'}
      </button>
    </div>
  );
}
```

### Using the Combined API Hook

```tsx
import { useImageGenerationAPI } from '@/hooks/use-image-generation';

function ImageApp() {
  const api = useImageGenerationAPI();

  const handleGenerate = async () => {
    const result = await api.generateImage({
      prompt: 'A cyberpunk city',
      model: 'flux',
      desired_format: 'svg',
    });

    if (result.success) {
      console.log('Generated:', result.data);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={api.isGenerating}>
      Generate
    </button>
  );
}
```

## API Reference

### Individual Hooks

#### `useImageGeneration()`

Hook for generating images.

**Returns:**
```typescript
{
  mutateAsync: (request: ImageGenerationRequest) => Promise<ImageGenerationResponse>
  isPending: boolean
  error: Error | null
  reset: () => void
}
```

**Example:**
```tsx
const generateImage = useImageGeneration();

const result = await generateImage.mutateAsync({
  prompt: 'A mountain landscape',
  model: 'flux',
  width: 1024,
  height: 1024,
  num_steps: 20,
  guidance: 7.5,
  seed: 42,
  desired_format: 'jpg',
});
```

#### `useSVGConversion()`

Hook for converting images to SVG.

**Returns:**
```typescript
{
  mutateAsync: (request: SVGConversionRequest) => Promise<SVGConversionResponse>
  isPending: boolean
  error: Error | null
  reset: () => void
}
```

**Example:**
```tsx
const convertToSVG = useSVGConversion();

const result = await convertToSVG.mutateAsync({
  file: imageFile,
  colormode: 'color',
  hierarchical: 'stacked',
  mode: 'spline',
  filter_speckle: 4,
  color_precision: 6,
});
```

#### `useHealthCheck(enabled?: boolean)`

Hook for checking API health status.

**Parameters:**
- `enabled`: Whether to enable the health check (default: `true`)

**Returns:**
```typescript
{
  data: HealthCheckResponse | undefined
  isLoading: boolean
  error: Error | null
}
```

**Example:**
```tsx
const healthCheck = useHealthCheck();

if (healthCheck.data) {
  console.log('API Status:', healthCheck.data.status);
  console.log('Cloudinary configured:', healthCheck.data.cloudinary_configured);
}
```

#### `useFileDownload()`

Hook for downloading files from Cloudinary.

**Returns:**
```typescript
{
  mutateAsync: ({ file_type, public_id }) => Promise<Blob>
  isPending: boolean
  error: Error | null
}
```

**Example:**
```tsx
const downloadFile = useFileDownload();

const blob = await downloadFile.mutateAsync({
  file_type: 'image',
  public_id: 'generated/some-uuid',
});

// Create download link
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'image.jpg';
a.click();
```

#### `useFileCleanup()`

Hook for deleting files from Cloudinary.

**Returns:**
```typescript
{
  mutateAsync: (public_id: string) => Promise<CleanupResponse>
  isPending: boolean
  error: Error | null
}
```

**Example:**
```tsx
const cleanupFile = useFileCleanup();

await cleanupFile.mutateAsync('generated/some-uuid');
```

### Combined Hook

#### `useImageGenerationAPI()`

Convenience hook that provides all API methods in a single hook.

**Returns:**
```typescript
{
  // Methods
  generateImage: (request: ImageGenerationRequest) => Promise<ImageGenerationResponse>
  convertToSVG: (request: SVGConversionRequest) => Promise<SVGConversionResponse>
  downloadFile: ({ file_type, public_id }) => Promise<Blob>
  cleanupFile: (public_id: string) => Promise<CleanupResponse>
  
  // Loading states
  isGenerating: boolean
  isConverting: boolean
  isDownloading: boolean
  isCleaning: boolean
  
  // Errors
  generationError: Error | null
  conversionError: Error | null
  downloadError: Error | null
  cleanupError: Error | null
  
  // Health check
  health: HealthCheckResponse | undefined
  healthLoading: boolean
  healthError: Error | null
  
  // Reset functions
  resetGeneration: () => void
  resetConversion: () => void
  resetDownload: () => void
  resetCleanup: () => void
}
```

## Type Definitions

### ImageGenerationRequest

```typescript
interface ImageGenerationRequest {
  prompt: string;
  model: 'flux' | 'lightning' | 'sdxl';
  negative_prompt?: string;
  width?: number;        // 256-2048
  height?: number;       // 256-2048
  num_steps?: number;    // 1-20
  strength?: number;     // 0.0-1.0
  guidance?: number;     // 1.0-20.0
  image_b64?: string;    // Base64 encoded image
  mask_b64?: string;     // Base64 encoded mask
  seed?: number;
  steps?: number;        // 1-8 (for FLUX)
  desired_format?: 'jpg' | 'png' | 'svg';
}
```

### ImageGenerationResponse

```typescript
interface ImageGenerationResponse {
  success: boolean;
  message: string;
  data?: {
    image_id: string;
    cloudinary_url: string;
    cloudinary_public_id: string;
    size_bytes: number;
    model: string;
    prompt: string;
    seed: number;
    height: number;
    width: number;
  };
  error?: string;
}
```

### SVGConversionRequest

```typescript
interface SVGConversionRequest {
  file: File;
  colormode?: 'color' | 'bw';
  hierarchical?: 'stacked' | 'flat';
  mode?: 'spline' | 'pixel';
  filter_speckle?: number;
  color_precision?: number;
  layer_difference?: number;
  corner_threshold?: number;
  length_threshold?: number;
  max_iterations?: number;
  splice_threshold?: number;
  path_precision?: number;
}
```

## Model-Specific Notes

### Flux Model
- Fixed dimensions: 1024x1024
- No negative prompt support
- No img2img/inpainting support
- Uses `steps` parameter (1-8) instead of `num_steps`

### Lightning Model
- Supports negative prompts
- Supports img2img/inpainting
- Uses `num_steps` parameter (1-20)
- Customizable dimensions (256-2048)

### SDXL Model
- Supports negative prompts
- Supports img2img/inpainting
- Uses `num_steps` parameter (1-20)
- Customizable dimensions (256-2048)

## Advanced Examples

### Custom Parameters

```tsx
const api = useImageGenerationAPI();

await api.generateImage({
  prompt: 'A serene Japanese garden',
  model: 'lightning',
  width: 512,
  height: 512,
  num_steps: 15,
  guidance: 8.0,
  seed: 42,
  negative_prompt: 'blurry, low quality',
});
```

### Direct SVG Generation

```tsx
const api = useImageGenerationAPI();

const result = await api.generateImage({
  prompt: 'A simple logo of a mountain',
  model: 'flux',
  desired_format: 'svg',
});
```

### Error Handling

```tsx
const generateImage = useImageGeneration();

try {
  const result = await generateImage.mutateAsync({
    prompt: 'A beautiful landscape',
    model: 'flux',
  });

  if (result.success) {
    console.log('Success:', result.data);
  } else {
    console.error('API Error:', result.error);
  }
} catch (error) {
  console.error('Network Error:', error);
}
```

### Loading States

```tsx
const api = useImageGenerationAPI();

return (
  <div>
    <button onClick={handleGenerate} disabled={api.isGenerating}>
      {api.isGenerating ? 'Generating...' : 'Generate'}
    </button>

    {api.generationError && (
      <div className="error">
        Error: {api.generationError.message}
      </div>
    )}
  </div>
);
```

## Integration with Existing Components

### Using with Your Generate Page

You can integrate this hook with your existing generate page (`src/routes/generate.tsx`):

```tsx
import { useImageGenerationAPI } from '@/hooks/use-image-generation';

function GeneratePage() {
  const api = useImageGenerationAPI();
  const [prompt, setPrompt] = useState('');

  const handleGenerate = async () => {
    try {
      const result = await api.generateImage({
        prompt,
        model: 'flux',
      });

      if (result.success && result.data) {
        // Add to your jobs state
        setJobs(prev => [...prev, {
          id: result.data.image_id,
          prompt: result.data.prompt,
          status: 'done',
          imageUrl: result.data.cloudinary_url,
        }]);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  // Rest of your component...
}
```

## Examples

See the example components:
- `src/examples/ImageGenerationExample.tsx` - Basic and combined usage examples
- `src/examples/SVGConversionExample.tsx` - SVG conversion examples

## Requirements

- React 18+
- TanStack Query
- TypeScript
- Running FastAPI backend

## License

This hook is part of your Image Service frontend project.
