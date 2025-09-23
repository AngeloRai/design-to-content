import React from 'react';
import { toAbsoluteCtfUrl } from "@/lib/contentful/utils/image";
import { VideoAssetProps } from '@/lib/contentful/types/fields';

interface VideoProps extends VideoAssetProps {
  className?: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  return null;
}

export function Video({ youTubeUrl, videoAsset, className = "" }: VideoProps) {
  // Prioritize uploaded video over YouTube URL  
  if (videoAsset?.fields?.file) {
    const file = videoAsset.fields.file;
    
    // Handle the AssetFile type properly
    const fileUrl = typeof file === 'object' && 'url' in file ? file.url as string : null;
    const fileContentType = typeof file === 'object' && 'contentType' in file ? file.contentType as string : undefined;
    
    if (!fileUrl) return null;
    
    const videoUrl = toAbsoluteCtfUrl(fileUrl);
    const isVideo = fileContentType?.startsWith('video/');
    
    if (videoUrl && isVideo) {
      return (
        <div className={`video-container relative w-full aspect-video ${className}`}>
          <video 
            className="w-full h-full rounded-lg"
            controls
            preload="metadata"
          >
            <source src={videoUrl} type={fileContentType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
  }

  // Fall back to YouTube URL if no uploaded video
  if (youTubeUrl) {
    const embedUrl = getYouTubeEmbedUrl(youTubeUrl);
    
    if (embedUrl) {
      return (
        <div className={`video-container relative w-full aspect-video ${className}`}>
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title="YouTube video"
          />
        </div>
      );
    }
  }

  return null;
}