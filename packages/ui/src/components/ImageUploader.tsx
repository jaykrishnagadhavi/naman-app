import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@abrainoconscious/shared';
import { Upload, X, ZoomIn, ZoomOut, CheckCircle2, AlertCircle, Eye, RefreshCw } from 'lucide-react';

export type AspectRatioType = '16:9' | '2:3' | 'wide-hero';

export interface ImageUploaderProps {
  initialRatio?: AspectRatioType;
  initialAlt?: string;
  onSave?: (data: { file: File | null; alt: string; ratio: AspectRatioType; zoom: number; position: { x: number; y: number } }) => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  initialRatio = '16:9',
  initialAlt = '',
  onSave,
  className
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState(initialAlt);
  const [ratio, setRatio] = useState<AspectRatioType>(initialRatio);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'rail' | 'trending' | 'landing' | 'mobile'>('rail');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file format. Please upload JPG, PNG, or WebP.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Simulate upload progress
    setUploadProgress(0);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 25;
      if (prog >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 800);
      } else {
        setUploadProgress(prog);
      }
    }, 150);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setAltText('');
    setZoom(1);
    setPosition({ x: 50, y: 50 });
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getAspectClass = (r: AspectRatioType) => {
    switch (r) {
      case '16:9': return 'aspect-[16/9]';
      case '2:3': return 'aspect-[2/3]';
      case 'wide-hero': return 'aspect-[21/9]';
    }
  };

  return (
    <div className={cn('rounded-xl border border-[#1A373E] bg-[#081619] p-6 text-white shadow-xl', className)}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A373E] pb-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-white">Course & Challenge Image Uploader</h3>
          <p className="text-xs text-[#8D9FA4]">Upload high-resolution JPG, PNG or WebP images up to 10 MB.</p>
        </div>
        {/* Ratio Selector */}
        <div className="flex items-center rounded-lg bg-[#0E2024] p-1 border border-[#1A373E]">
          {(['16:9', '2:3', 'wide-hero'] as AspectRatioType[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRatio(r)}
              className={cn(
                'rounded px-3 py-1 text-xs font-medium transition-colors',
                ratio === r ? 'bg-amber-500 text-black font-semibold shadow' : 'text-[#8D9FA4] hover:text-white'
              )}
            >
              {r === '16:9' ? '16:9 Thumbnail' : r === '2:3' ? '2:3 Poster' : 'Wide Banner'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Dropzone & Crop Tool */}
        <div className="space-y-4 lg:col-span-7">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
          />

          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all',
                isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-[#1A373E] bg-[#040C0E] hover:border-amber-500/50 hover:bg-[#0E2024]'
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0E2024] text-amber-500 shadow-inner group-hover:scale-105 transition-transform">
                <Upload className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-white">
                Drag and drop your image here, or <span className="text-amber-500 underline underline-offset-2">browse</span>
              </p>
              <p className="mt-1 text-xs text-[#8D9FA4]">
                Target: {ratio === '16:9' ? '1920x1080 (16:9)' : ratio === '2:3' ? '1200x1800 (2:3)' : '2400x1000 (Wide)'} • Max 10 MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Interactive Crop Frame */}
              <div className="relative overflow-hidden rounded-xl border border-[#1A373E] bg-black">
                <div className={cn('relative w-full overflow-hidden', getAspectClass(ratio))}>
                  <img
                    src={previewUrl}
                    alt="Preview crop"
                    className="h-full w-full object-cover transition-transform"
                    style={{
                      transform: `scale(${zoom})`,
                      objectPosition: `${position.x}% ${position.y}%`
                    }}
                  />
                  <div className="absolute inset-0 pointer-events-none border border-amber-500/30 grid grid-cols-3 grid-rows-3 opacity-40">
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-r border-b border-white/20" />
                    <div className="border-b border-white/20" />
                    <div className="border-r border-white/20" />
                    <div className="border-r border-white/20" />
                    <div />
                  </div>
                </div>
              </div>

              {/* Zoom & Position Controls */}
              <div className="rounded-lg bg-[#0E2024] p-3 border border-[#1A373E] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ZoomOut className="h-4 w-4 text-[#8D9FA4]" />
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="h-1.5 w-28 accent-amber-500 bg-[#1A373E] rounded-lg cursor-pointer"
                  />
                  <ZoomIn className="h-4 w-4 text-[#8D9FA4]" />
                  <span className="text-xs text-[#8D9FA4] w-8">{zoom.toFixed(1)}x</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-[#8D9FA4] hover:text-white transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress Simulation */}
          {uploadProgress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#8D9FA4]">
                <span>Validating & processing image...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#1A373E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error notice */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Alt Text Field */}
          <div>
            <label className="block text-xs font-medium text-white mb-1.5">
              Accessibility Alt Text <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="e.g. Naman teaching on glassboard with live challenge details"
              className="w-full rounded-lg border border-[#1A373E] bg-[#040C0E] px-3 py-2 text-sm text-white placeholder-[#8D9FA4]/60 focus:border-amber-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-[#8D9FA4]">
              Required for screen readers and SEO. Accurately describe what is shown.
            </p>
          </div>
        </div>

        {/* Right Column: Multi-Surface Context Live Previews */}
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[#1A373E] pb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Eye className="h-3.5 w-3.5 text-amber-500" /> Surface Preview
            </span>
            <div className="flex gap-1">
              {(['rail', 'trending', 'landing', 'mobile'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActivePreviewTab(tab)}
                  className={cn(
                    'rounded px-2 py-0.5 text-[11px] capitalize transition-colors',
                    activePreviewTab === tab ? 'bg-[#1A373E] text-white font-medium' : 'text-[#8D9FA4] hover:text-white'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#1A373E] bg-[#040C0E] p-4 flex items-center justify-center min-h-[300px]">
            {activePreviewTab === 'rail' && (
              <div className="w-56 space-y-2 rounded-lg border border-[#1A373E] bg-[#0E2024] p-2.5 shadow-lg">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded bg-black">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Rail preview"
                      className="h-full w-full object-cover"
                      style={{ transform: `scale(${zoom})`, objectPosition: `${position.x}% ${position.y}%` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#152B30] text-[10px] text-[#8D9FA4]">
                      No Image
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white font-medium">
                    12 Lessons
                  </span>
                </div>
                <h4 className="font-serif text-xs font-medium text-white line-clamp-1">Overthinking & Clarity</h4>
                <div className="flex items-center justify-between text-[11px] text-amber-500 font-semibold">
                  <span>₹999</span>
                  <span className="text-[10px] text-[#8D9FA4]">Preview</span>
                </div>
              </div>
            )}

            {activePreviewTab === 'trending' && (
              <div className="relative w-44 space-y-2 rounded-lg border border-[#1A373E] bg-[#0E2024] p-2 shadow-lg">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded bg-black">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Trending poster"
                      className="h-full w-full object-cover"
                      style={{ transform: `scale(${zoom})`, objectPosition: `${position.x}% ${position.y}%` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#152B30] text-[10px] text-[#8D9FA4]">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 font-serif text-sm font-bold text-black shadow">
                    1
                  </div>
                </div>
                <p className="font-serif text-xs font-medium text-white line-clamp-1">21-Day Mindset Reset</p>
                <p className="text-[10px] text-amber-400">Starts in 3 days</p>
              </div>
            )}

            {activePreviewTab === 'landing' && (
              <div className="w-full space-y-2 rounded-lg border border-[#1A373E] bg-[#040C0E] p-3 shadow-lg">
                <div className="relative aspect-[21/9] w-full overflow-hidden rounded bg-black">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Landing hero banner"
                      className="h-full w-full object-cover"
                      style={{ transform: `scale(${zoom})`, objectPosition: `${position.x}% ${position.y}%` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#152B30] text-[10px] text-[#8D9FA4]">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#040C0E] via-[#040C0E]/60 to-transparent p-3 flex flex-col justify-center">
                    <p className="font-serif text-xs font-bold text-white max-w-[60%]">Master your mind and emotions.</p>
                    <span className="mt-1 text-[9px] text-amber-400 font-medium">Live Challenges by Naman</span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'mobile' && (
              <div className="w-48 rounded-2xl border-2 border-[#1A373E] bg-[#040C0E] p-2 shadow-2xl">
                <div className="mx-auto h-1.5 w-10 rounded-full bg-[#1A373E] mb-2" />
                <div className="space-y-1.5">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-black">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Mobile app card"
                        className="h-full w-full object-cover"
                        style={{ transform: `scale(${zoom})`, objectPosition: `${position.x}% ${position.y}%` }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#152B30] text-[9px] text-[#8D9FA4]">
                        No Image
                      </div>
                    )}
                  </div>
                  <p className="font-serif text-[10px] font-medium text-white line-clamp-1">Habit Architecture 101</p>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-amber-500 font-bold">Enrolled</span>
                    <span className="text-[#8D9FA4]">45% complete</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#8D9FA4]">Changes previewed in real-time</span>
            <button
              type="button"
              onClick={() => onSave?.({ file, alt: altText, ratio, zoom, position })}
              disabled={!file}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Save Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;

