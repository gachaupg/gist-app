"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface AvatarUploaderProps {
  currentAvatar?: string;
  onAvatarChange: (base64Image: string) => void;
}

export default function AvatarUploader({
  currentAvatar,
  onAvatarChange,
}: AvatarUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentAvatar || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setError("Image size must be less than 1MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreviewUrl(base64);
      onAvatarChange(base64);
      setIsUploading(false);
    };

    reader.onerror = () => {
      setError("Failed to read the file");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-24 h-24 rounded-full border-2 border-indigo-200 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity duration-200"
        onClick={triggerFileInput}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-10 h-10 text-indigo-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <button
        type="button"
        onClick={triggerFileInput}
        className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
      >
        Change avatar
      </button>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      <p className="mt-2 text-xs text-gray-500">
        Click on the avatar to upload a new image (max 1MB)
      </p>
    </div>
  );
}
