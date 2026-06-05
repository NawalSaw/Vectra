/**
 * Example component demonstrating how to use the image generation hook
 */

import { useState } from 'react';
import { useImageGeneration, useImageGenerationAPI } from '@/hooks/use-image-generation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';

export function ImageGenerationExample() {
  const [prompt, setPrompt] = useState('A beautiful sunset over mountains');
  const generateImage = useImageGeneration();

  const handleGenerate = async () => {
    try {
      const result = await generateImage.mutateAsync({
        prompt,
        model: 'flux',
        width: 1024,
        height: 1024,
        desired_format: 'jpg',
      });

      if (result.success && result.data) {
        console.log('Image generated successfully:', result.data);
        // Handle success - e.g., display the image
        alert(`Image generated! URL: ${result.data.cloudinary_url}`);
      } else {
        console.error('Generation failed:', result.error);
        alert(`Generation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error generating image');
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Image Generation Example</h2>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to create..."
          className="min-h-[100px]"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generateImage.isPending}
        className="w-full"
      >
        {generateImage.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Image
          </>
        )}
      </Button>

      {generateImage.error && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{generateImage.error.message}</span>
        </div>
      )}
    </div>
  );
}

export function CombinedAPIExample() {
  const api = useImageGenerationAPI();
  const [prompt, setPrompt] = useState('A cyberpunk city at night');

  const handleGenerate = async () => {
    try {
      const result = await api.generateImage({
        prompt,
        model: 'flux',
        desired_format: 'svg',
      });

      if (result.success && result.data) {
        console.log('SVG generated:', result.data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Combined API Example</h2>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="min-h-[80px]"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={api.isGenerating}
        className="w-full"
      >
        {api.isGenerating ? 'Generating...' : 'Generate SVG'}
      </Button>

      {/* Health status */}
      {api.health && (
        <div className="text-sm">
          <span>API Status: </span>
          <span className={api.health.status === 'healthy' ? 'text-green-500' : 'text-red-500'}>
            {api.health.status}
          </span>
        </div>
      )}
    </div>
  );
}
