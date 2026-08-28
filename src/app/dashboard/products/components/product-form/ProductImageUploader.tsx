'use client';

import Image from 'next/image';
import { UploadCloud, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';

interface ProductImageUploaderProps {
  files: File[];
  existingImages: string[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onRemoveExistingImage: (index: number) => void;
}

export function ProductImageUploader({
  files,
  existingImages,
  onFileChange,
  onRemoveFile,
  onRemoveExistingImage,
}: ProductImageUploaderProps) {
  const totalCount = files.length + existingImages.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Images</CardTitle>
        <CardDescription>Upload up to 5 images. The first image will be used as the cover.</CardDescription>
      </CardHeader>
      <CardBody>
        {totalCount === 0 ? (
          <div className="border-2 border-dashed border-separator rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-surface-elevated transition-colors cursor-pointer relative overflow-hidden group">
            <input
              type="file"
              multiple
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={onFileChange}
            />
            <div className="w-16 h-16 bg-surface border border-separator rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <UploadCloud className="w-8 h-8 text-brand-primary" />
            </div>
            <p className="text-sm font-semibold">Click or drag images to upload</p>
            <p className="text-xs text-muted mt-2">SVG, PNG, JPG or GIF (max. 5MB)</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Existing Images */}
            {existingImages.map((url, index) => (
              <div
                key={`existing-${index}`}
                className={`relative group rounded-xl overflow-hidden border border-separator bg-surface-elevated ${index === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto' : 'col-span-1 aspect-square'}`}
              >
                <Image
                  src={url}
                  alt="existing preview"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onRemoveExistingImage(index)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition-all cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {index === 0 && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 text-white text-caption font-bold rounded shadow-md uppercase tracking-wider backdrop-blur-sm bg-brand-primary/90">
                    Cover
                  </div>
                )}
              </div>
            ))}

            {/* Newly Uploaded Files */}
            {files.map((file, index) => {
              const globalIndex = existingImages.length + index;
              return (
                <div
                  key={`new-${index}`}
                  className={`relative group rounded-xl overflow-hidden border border-separator bg-surface-elevated ${globalIndex === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto' : 'col-span-1 aspect-square'}`}
                >
                  <Image
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onRemoveFile(index)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition-all cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {globalIndex === 0 && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 text-white text-caption font-bold rounded shadow-md uppercase tracking-wider backdrop-blur-sm bg-brand-primary/90">
                      Cover
                    </div>
                  )}
                </div>
              );
            })}

            {totalCount < 5 && (
              <div className="col-span-1 aspect-square border-2 border-dashed border-separator rounded-xl flex flex-col items-center justify-center text-center hover:bg-surface-elevated transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={onFileChange}
                />
                <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-separator mb-2">
                  <Plus className="w-5 h-5 text-muted group-hover:text-brand-primary transition-colors" />
                </div>
                <span className="text-xs font-medium text-muted group-hover:text-brand-primary transition-colors">
                  Add Image
                </span>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
