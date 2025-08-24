import { useState } from "react";

interface BannerImageProps {
  src?: string;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
}

// Default banner images that can be easily replaced
const DEFAULT_BANNERS = [
  {
    src: "https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&auto=format&fit=crop&w=2048&q=80",
    alt: "Modern automotive service center"
  },
  {
    src: "https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2048&q=80", 
    alt: "Car parts and automotive technology"
  },
  {
    src: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2048&q=80",
    alt: "Hyundai vehicles in showroom"
  }
];

export default function BannerImage({ 
  src, 
  alt = "Banner Image", 
  className = "",
  fallbackSrc 
}: BannerImageProps) {
  const [imageError, setImageError] = useState(false);
  const [currentBannerIndex] = useState(0);
  
  const defaultBanner = DEFAULT_BANNERS[currentBannerIndex];
  const imageSrc = src || defaultBanner.src;
  const imageAlt = alt || defaultBanner.alt;
  
  const handleImageError = () => {
    setImageError(true);
  };

  // If primary image fails and we have a fallback, use it
  if (imageError && fallbackSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={imageAlt}
        className={className}
        onError={() => setImageError(true)}
      />
    );
  }

  // If both primary and fallback fail, show gradient background
  if (imageError) {
    return (
      <div className={`bg-gradient-to-r from-blue-600 to-blue-800 ${className}`}>
        <div className="flex items-center justify-center h-full text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">🚗</div>
            <p className="text-lg font-medium">Hyundai Spare Parts</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={imageAlt}
      className={className}
      onError={handleImageError}
    />
  );
}

// Configuration for easy banner management
export const BANNER_CONFIG = {
  // To replace the banner, simply update these URLs
  primary: "https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&auto=format&fit=crop&w=2048&q=80",
  secondary: "https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2048&q=80",
  fallback: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2048&q=80",
  
  // Custom banner (uncomment and replace with your image URL)
  // custom: "https://your-domain.com/path-to-your-banner-image.jpg"
};

// Hook for easy banner management
export function useBannerImage(type: keyof typeof BANNER_CONFIG = 'primary') {
  return BANNER_CONFIG[type];
}
