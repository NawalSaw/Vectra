/**
 * Example component demonstrating SVG conversion
 */

import { useState } from 'react';
import { useSVGConversion, useImageGenerationAPI } from '@/hooks/use-image-generation';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function SVGConversionExample() {
  const [file, setFile] = useState<File | null>(null);
  const convertToSVG = useSVGConversion();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      const result = await convertToSVG.mutateAsync({
        file,
        colormode: 'color',
        hierarchical: 'stacked',
        mode: 'spline',
      });

      if (result.success && result.data) {
        console.log('SVG converted successfully:', result.data);
        alert(`SVG converted! URL: ${result.data.cloudinary_url}`);
      } else {
        console.error('Conversion failed:', result.error);
        alert(`Conversion failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error converting to SVG:', error);
      alert('Error converting to SVG');
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">SVG Conversion Example</h2>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Upload Image</label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
          >
            <Upload className="h-4 w-4" />
            <span className="text-sm">{file ? file.name : 'Choose file...'}</span>
          </label>
        </div>
      </div>

      <Button
        onClick={handleConvert}
        disabled={!file || convertToSVG.isPending}
        className="w-full"
      >
        {convertToSVG.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Converting...
          </>
        ) : (
          'Convert to SVG'
        )}
      </Button>

      {convertToSVG.error && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{convertToSVG.error.message}</span>
        </div>
      )}

      {convertToSVG.data && (
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Conversion successful!</span>
        </div>
      )}
    </div>
  );
}

export function AdvancedSVGConversionExample() {
  const api = useImageGenerationAPI();
  const [file, setFile] = useState<File | null>(null);
  const [colormode, setColormode] = useState<'color' | 'bw'>('color');
  const [mode, setMode] = useState<'spline' | 'pixel'>('spline');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      const result = await api.convertToSVG({
        file,
        colormode,
        hierarchical: 'stacked',
        mode,
        filter_speckle: 4,
        color_precision: 6,
        corner_threshold: 60,
        length_threshold: 4.0,
      });

      if (result.success && result.data) {
        console.log('SVG converted with parameters:', result.data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Advanced SVG Conversion</h2>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Upload Image</label>
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Color Mode</label>
          <select
            value={colormode}
            onChange={(e) => setColormode(e.target.value as 'color' | 'bw')}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="color">Color</option>
            <option value="bw">Black & White</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Vectorization Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'spline' | 'pixel')}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="spline">Spline</option>
            <option value="pixel">Pixel</option>
          </select>
        </div>
      </div>

      <Button
        onClick={handleConvert}
        disabled={!file || api.isConverting}
        className="w-full"
      >
        {api.isConverting ? 'Converting...' : 'Convert to SVG'}
      </Button>
    </div>
  );
}
