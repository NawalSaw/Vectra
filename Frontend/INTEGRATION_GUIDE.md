# Integration Guide for Image Generation Hook

This guide shows how to integrate the new image generation hook with your existing `generate.tsx` page.

## Step-by-Step Integration

### 1. Update the Generate Page

Replace the mock `generate()` function in your `src/routes/generate.tsx` with the real API call:

```tsx
import { useImageGenerationAPI } from '@/hooks/use-image-generation';

function GeneratePage() {
  const api = useImageGenerationAPI();
  
  // ... existing state ...

  const generate = async () => {
    if (!prompt.trim()) return;
    
    const count = variations[0];
    const newJobs: Job[] = Array.from({ length: count }).map((_, i) => ({
      id: makeId(),
      prompt,
      style,
      model,
      aspect,
      seed: seed + i,
      status: "queued" as const, // Changed from "running" to "queued"
      progress: 0,
      hue: Math.floor(Math.random() * 360),
    }));
    
    setJobs((prev) => [...newJobs, ...prev]);

    // Generate each job
    for (const job of newJobs) {
      try {
        // Update status to running
        setJobs((prev) => 
          prev.map((x) => (x.id === job.id ? { ...x, status: "running" as const } : x))
        );

        // Map your model IDs to API model names
        const apiModel = model === 'nano-banana' ? 'flux' : 
                        model === 'nano-banana-2' ? 'lightning' : 'sdxl';

        // Calculate dimensions from aspect ratio
        const { w, h } = aspectMeta;
        const baseSize = 1024;
        const width = w === 1 ? baseSize : Math.round(baseSize * (w / h));
        const height = h === 1 ? baseSize : Math.round(baseSize * (h / w));

        const result = await api.generateImage({
          prompt: `${prompt}, ${style} style`,
          model: apiModel,
          width,
          height,
          num_steps: steps[0],
          guidance: guidance[0],
          seed: job.seed,
          negative_prompt: negative || undefined,
          desired_format: 'jpg',
        });

        if (result.success && result.data) {
          // Update job with result
          setJobs((prev) =>
            prev.map((x) =>
              x.id === job.id
                ? {
                    ...x,
                    status: "done" as const,
                    progress: 1,
                    imageUrl: result.data.cloudinary_url,
                    imageId: result.data.image_id,
                    publicId: result.data.cloudinary_public_id,
                  }
                : x
            )
          );
        } else {
          // Handle error
          setJobs((prev) =>
            prev.map((x) =>
              x.id === job.id
                ? { ...x, status: "queued" as const, progress: 0 }
                : x
            )
          );
        }
      } catch (error) {
        console.error('Generation error:', error);
        setJobs((prev) =>
          prev.map((x) =>
            x.id === job.id
              ? { ...x, status: "queued" as const, progress: 0 }
              : x
          )
        );
      }
    }
  };
```

### 2. Update Job Type

Update the `Job` type to include the new fields:

```tsx
type Job = {
  id: string;
  prompt: string;
  style: string;
  model: string;
  aspect: string;
  seed: number;
  status: "queued" | "running" | "done";
  progress: number;
  hue: number;
  imageUrl?: string;      // Add this
  imageId?: string;       // Add this
  publicId?: string;      // Add this
};
```

### 3. Update Job Display

Update the job display section to show the generated images:

```tsx
// In the jobs display section
{jobs.map((job) => (
  <div key={job.id} className="job-card">
    {/* ... existing job UI ... */}
    
    {job.status === "done" && job.imageUrl && (
      <div className="generated-image">
        <img 
          src={job.imageUrl} 
          alt={job.prompt}
          className="w-full h-48 object-cover rounded-lg"
        />
        <div className="image-actions">
          <Button
            size="sm"
            onClick={() => window.open(job.imageUrl, '_blank')}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Copy URL to clipboard
              navigator.clipboard.writeText(job.imageUrl);
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )}
    
    {job.status === "running" && (
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${job.progress * 100}%` }}
        />
      </div>
    )}
  </div>
))}
```

### 4. Add Health Check Display

Add a health check indicator to show API status:

```tsx
function GeneratePage() {
  const api = useImageGenerationAPI();
  
  // ... existing code ...

  return (
    <div className="min-h-screen">
      {/* Health indicator */}
      <div className="fixed top-4 right-4 z-50">
        <Badge 
          variant={api.health?.status === 'healthy' ? 'default' : 'destructive'}
          className="gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          API: {api.health?.status || 'Checking...'}
        </Badge>
      </div>

      {/* ... rest of your UI ... */}
    </div>
  );
}
```

### 5. Add Error Handling

Add error handling with toast notifications:

```tsx
import { toast } from 'sonner'; // Assuming you use sonner for toasts

function GeneratePage() {
  const api = useImageGenerationAPI();
  
  // ... existing code ...

  const generate = async () => {
    // ... existing code ...

    for (const job of newJobs) {
      try {
        // ... generation code ...

        if (result.success && result.data) {
          toast.success('Image generated successfully!');
        } else {
          toast.error(result.error || 'Generation failed');
        }
      } catch (error) {
        console.error('Generation error:', error);
        toast.error('Failed to generate image');
      }
    }
  };
```

## Alternative: Minimal Integration

If you want a simpler integration, just replace the mock progress simulation with real API calls:

```tsx
const generate = async () => {
  const count = variations[0];
  const newJobs: Job[] = Array.from({ length: count }).map((_, i) => ({
    id: makeId(),
    prompt,
    style,
    model,
    aspect,
    seed: seed + i,
    status: "running",
    progress: 0,
    hue: Math.floor(Math.random() * 360),
  }));
  
  setJobs((prev) => [...newJobs, ...prev]);

  // Simulate progress (you can replace this with real progress tracking)
  newJobs.forEach((j, idx) => {
    const total = 1400 + idx * 400;
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / total);
      setJobs((prev) => prev.map((x) => (x.id === j.id ? { ...x, progress: p } : x)));
      if (p < 1) requestAnimationFrame(tick);
      else {
        // Call the real API here
        handleRealGeneration(j);
      }
    };
    requestAnimationFrame(tick);
  });
};

const handleRealGeneration = async (job: Job) => {
  const api = useImageGenerationAPI();
  
  try {
    const apiModel = model === 'nano-banana' ? 'flux' : 'flux';
    const { w, h } = aspectMeta;
    const baseSize = 1024;
    const width = w === 1 ? baseSize : Math.round(baseSize * (w / h));
    const height = h === 1 ? baseSize : Math.round(baseSize * (h / w));

    const result = await api.generateImage({
      prompt: `${prompt}, ${style} style`,
      model: apiModel,
      width,
      height,
      seed: job.seed,
    });

    if (result.success && result.data) {
      setJobs((prev) =>
        prev.map((x) =>
          x.id === job.id
            ? {
                ...x,
                imageUrl: result.data.cloudinary_url,
                imageId: result.data.image_id,
              }
            : x
        )
      );
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Configuration

Make sure your `.env` file has the API URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Testing

1. Start your backend: `cd Backend && python -m src.main`
2. Start your frontend: `cd Frontend && npm run dev`
3. Navigate to the generate page
4. Enter a prompt and click generate
5. Watch the real images being generated

## Notes

- The API calls are asynchronous and may take several seconds
- The hook includes automatic caching via TanStack Query
- Errors are handled gracefully with fallback to queued status
- You can customize the model mapping to match your specific backend setup
