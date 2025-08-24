import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.initializeObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Initialize performance observers
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.recordMetric('page_load', entry.duration);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.startTime);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('largest_contentful_paint', entry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Observe cumulative layout shift
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as any; // Type assertion for layout-shift entries
          if (!layoutShiftEntry.hadRecentInput) {
            this.recordMetric('cumulative_layout_shift', layoutShiftEntry.value);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  // Record a performance metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Keep only last 100 measurements
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      this.metrics.set(name, values.slice(-100));
    }
  }

  // Get metric statistics
  getMetricStats(name: string): {
    count: number;
    average: number;
    median: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      average: sum / count,
      median: sorted[Math.floor(count / 2)],
      min: sorted[0],
      max: sorted[count - 1],
      p95: sorted[Math.floor(count * 0.95)]
    };
  }

  // Get all metrics
  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name] of this.metrics) {
      result[name] = this.getMetricStats(name);
    }
    return result;
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
  }

  // Cleanup observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook for measuring component render time
export const useRenderTime = (componentName: string) => {
  const startTime = useRef<number>();

  useEffect(() => {
    startTime.current = performance.now();
  });

  useEffect(() => {
    if (startTime.current) {
      const renderTime = performance.now() - startTime.current;
      performanceMonitor.recordMetric(`render_${componentName}`, renderTime);
    }
  });
};

// Hook for debouncing values
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttling function calls
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const lastRan = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        func(...args);
        lastRan.current = Date.now();
      }
    }) as T,
    [func, delay]
  );
};

// Hook for memoizing expensive calculations
export const useMemoizedCalculation = <T>(
  calculation: () => T,
  dependencies: any[]
): T => {
  const startTime = performance.now();
  const result = useMemo(calculation, dependencies);
  const endTime = performance.now();
  
  performanceMonitor.recordMetric('memoized_calculation', endTime - startTime);
  
  return result;
};

// Image optimization utilities
export const imageOptimization = {
  // Generate responsive image srcSet
  generateSrcSet: (baseUrl: string, sizes: number[]): string => {
    return sizes
      .map(size => `${baseUrl}?w=${size}&q=80 ${size}w`)
      .join(', ');
  },

  // Get optimal image format
  getOptimalFormat: (): 'webp' | 'avif' | 'jpeg' => {
    if (typeof window === 'undefined') return 'jpeg';
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    // Check for AVIF support
    if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
      return 'avif';
    }
    
    // Check for WebP support
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      return 'webp';
    }
    
    return 'jpeg';
  },

  // Lazy load image
  lazyLoadImage: (src: string, placeholder: string = ''): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
      
      if (placeholder) {
        resolve(placeholder);
      }
    });
  }
};

// Bundle size optimization utilities
export const bundleOptimization = {
  // Dynamic import with error handling
  dynamicImport: async <T>(importFunc: () => Promise<T>): Promise<T | null> => {
    const startTime = performance.now();
    try {
      const module = await importFunc();
      const loadTime = performance.now() - startTime;
      performanceMonitor.recordMetric('dynamic_import', loadTime);
      return module;
    } catch (error) {
      console.error('Dynamic import failed:', error);
      return null;
    }
  },

  // Preload critical resources
  preloadResource: (href: string, as: string): void => {
    if (typeof window === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },

  // Prefetch non-critical resources
  prefetchResource: (href: string): void => {
    if (typeof window === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
};

// Cache utilities
export class CacheManager {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private maxSize: number = 100;

  // Set cache item with TTL
  set(key: string, data: any, ttlMs: number = 300000): void { // 5 minutes default
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { data, expiry });

    // Remove oldest items if cache is full
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  // Get cache item
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // Check if item exists and is valid
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
export const globalCache = new CacheManager();

// Hook for cached API calls
export const useCachedApi = <T>(
  key: string,
  apiCall: () => Promise<T>,
  ttlMs: number = 300000
): { data: T | null; loading: boolean; error: any; refetch: () => void } => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cachedData = globalCache.get(key);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startTime = performance.now();
      const result = await apiCall();
      const endTime = performance.now();
      
      performanceMonitor.recordMetric('api_call', endTime - startTime);
      
      globalCache.set(key, result, ttlMs);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key, apiCall, ttlMs]);

  const refetch = useCallback(() => {
    globalCache.set(key, null, 0); // Invalidate cache
    fetchData();
  }, [key, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Virtual scrolling utilities
export const useVirtualScroll = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const visibleItems = items.slice(visibleStart, visibleEnd + 1);
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
};

// Memory leak detection
export const useMemoryLeakDetection = (componentName: string) => {
  const startMemory = useRef<number>();

  useEffect(() => {
    if ('memory' in performance) {
      startMemory.current = (performance as any).memory.usedJSHeapSize;
    }

    return () => {
      if ('memory' in performance && startMemory.current) {
        const endMemory = (performance as any).memory.usedJSHeapSize;
        const memoryDiff = endMemory - startMemory.current;
        
        if (memoryDiff > 1024 * 1024) { // 1MB threshold
          console.warn(`Potential memory leak in ${componentName}: ${memoryDiff} bytes`);
        }
      }
    };
  }, [componentName]);
};

// Export performance utilities
export const performanceUtils = {
  monitor: performanceMonitor,
  cache: globalCache,
  imageOptimization,
  bundleOptimization
};

export default performanceUtils;
