import { useState } from 'react';
import { vendorScrapingService, ScrapedItemData } from '../services/vendorScrapingService';

interface UseVendorScrapingResult {
  scrapedData: ScrapedItemData | null;
  isLoading: boolean;
  error: string | null;
  scrapeUrl: (url: string) => Promise<void>;
  clearData: () => void;
}

export const useVendorScraping = (): UseVendorScrapingResult => {
  const [scrapedData, setScrapedData] = useState<ScrapedItemData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrapeUrl = async (url: string) => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await vendorScrapingService.scrapeItemData(url);
      setScrapedData(data);
      
      if (!data.success && data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape URL');
      setScrapedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setScrapedData(null);
    setError(null);
  };

  return {
    scrapedData,
    isLoading,
    error,
    scrapeUrl,
    clearData,
  };
};
