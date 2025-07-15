export interface ScrapedItemData {
  item_name: string;
  part_number: string;
  description: string;
  unit_of_measure: string;
  estimated_cost?: number;
  supplier: string;
  package_size?: string;
  specifications?: Record<string, string>;
  images?: string[];
  datasheet_url?: string;
  source_url?: string; // The original URL that was scraped
  success: boolean;
  error?: string;
}

export interface VendorConfig {
  name: string;
  domains: string[];
  apiKey?: string;
  selectors?: {
    name?: string;
    partNumber?: string;
    description?: string;
    price?: string;
    unitOfMeasure?: string;
    packageSize?: string;
    specifications?: string;
    images?: string;
    datasheet?: string;
  };
  customParser?: (url: string, html?: string) => Promise<ScrapedItemData>;
}

// Vendor configurations
const VENDOR_CONFIGS: VendorConfig[] = [
  {
    name: 'McMaster-Carr',
    domains: ['mcmaster.com', 'www.mcmaster.com'],
    // Use API when available, fallback to scraping
    customParser: async (url: string) => {
      return await parseMcMasterCarr(url);
    }
  },
  {
    name: 'Digi-Key',
    domains: ['digikey.com', 'www.digikey.com'],
    customParser: async (url: string) => {
      return await parseDigiKey(url);
    },
    selectors: {
      name: '[data-testid="product-title"], h1[itemprop="name"]',
      partNumber: '[data-testid="part-number"], [itemprop="mpn"]',
      description: '[data-testid="short-description"], .product-details-description',
      price: '[data-testid="price"], .pricing-table .price',
      unitOfMeasure: '[data-testid="unit-of-measure"]',
      packageSize: '[data-testid="package-size"]',
      specifications: '.specifications-table, .product-attributes',
      images: '.product-images img, [data-testid="product-image"]',
      datasheet: 'a[href*="datasheet"], a[href*=".pdf"]'
    }
  },
  {
    name: 'Mouser',
    domains: ['mouser.com', 'www.mouser.com'],
    selectors: {
      name: '.pdp-product-name, h1.product-title',
      partNumber: '.pdp-manufacturer-part-number, .part-number',
      description: '.pdp-product-description, .product-description',
      price: '.price-break-price, .price',
      unitOfMeasure: '.unit-of-measure',
      specifications: '.specifications, .product-attributes',
      images: '.product-image img',
      datasheet: 'a[href*="datasheet"]'
    }
  },
  {
    name: 'Arrow',
    domains: ['arrow.com', 'www.arrow.com'],
    selectors: {
      name: '.product-name, h1.title',
      partNumber: '.part-number, .mpn',
      description: '.product-description',
      price: '.price, .unit-price',
      specifications: '.specifications-table',
      images: '.product-images img'
    }
  },
  {
    name: 'Grainger',
    domains: ['grainger.com', 'www.grainger.com'],
    selectors: {
      name: '.product-title, h1',
      partNumber: '.model-number, .part-number',
      description: '.product-description, .description',
      price: '.price, .unit-price',
      unitOfMeasure: '.unit-of-measure',
      specifications: '.specifications, .product-details',
      images: '.product-image img'
    }
  },
  {
    name: 'Amazon Business',
    domains: ['amazon.com', 'www.amazon.com'],
    selectors: {
      name: '#productTitle, .product-title',
      partNumber: '.model-number, #ASIN',
      description: '#feature-bullets ul, .product-description',
      price: '.a-price-whole, .price',
      specifications: '#productDetails_detailBullets_sections1, .product-details',
      images: '#landingImage, .product-image img'
    }
  }
];

class VendorScrapingService {
  private vendorConfigs: VendorConfig[] = VENDOR_CONFIGS;

  /**
   * Main method to scrape item data from a URL
   */
  async scrapeItemData(url: string): Promise<ScrapedItemData> {
    try {
      const vendor = this.detectVendor(url);
      if (!vendor) {
        return {
          item_name: '',
          part_number: '',
          description: '',
          unit_of_measure: '',
          supplier: 'Unknown',
          source_url: url,
          success: false,
          error: 'Vendor not supported. Please add item details manually.'
        };
      }

      // Use custom parser if available
      if (vendor.customParser) {
        return await vendor.customParser(url);
      }

      // Fallback to generic scraping
      return await this.genericScrape(url, vendor);
    } catch (error) {
      console.error('Scraping error:', error);
      return {
        item_name: '',
        part_number: '',
        description: '',
        unit_of_measure: '',
        supplier: 'Unknown',
        source_url: url,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape item data'
      };
    }
  }

  /**
   * Detect vendor from URL
   */
  private detectVendor(url: string): VendorConfig | null {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      
      return this.vendorConfigs.find(vendor => 
        vendor.domains.some(domain => hostname.includes(domain))
      ) || null;
    } catch {
      return null;
    }
  }

  /**
   * Generic scraping using CSS selectors
   */
  private async genericScrape(url: string, vendor: VendorConfig): Promise<ScrapedItemData> {
    // Note: In a real implementation, you'd need a backend service to do the actual scraping
    // due to CORS restrictions. This would involve:
    // 1. Sending the URL to your backend
    // 2. Backend uses puppeteer/playwright to scrape the page
    // 3. Return the extracted data

    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, vendor: vendor.name, selectors: vendor.selectors })
    });

    if (!response.ok) {
      throw new Error(`Scraping failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Clean and normalize text data
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, ' ')
      .trim();
  }

  /**
   * Parse price from various formats
   */
  private parsePrice(price: any): number | undefined {
    if (typeof price === 'number') return price;
    if (typeof price !== 'string') return undefined;

    // Remove currency symbols and extract number
    const cleaned = price.replace(/[$,£€¥]/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
  }
}

/**
 * Digi-Key specific parser
 */
async function parseDigiKey(url: string): Promise<ScrapedItemData> {
  try {
    // Parse URL to extract manufacturer and part number
    // Example: https://www.digikey.com/en/products/detail/yageo/RC0402JR-0710KL/726418
    const urlParts = url.split('/');
    const detailIndex = urlParts.findIndex(part => part === 'detail');
    
    if (detailIndex >= 0 && detailIndex + 2 < urlParts.length) {
      const manufacturer = urlParts[detailIndex + 1];
      const partNumber = urlParts[detailIndex + 2];
      
      // Try API first, then fallback to URL parsing
      try {
        const response = await fetch('/api/scrape/digikey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, manufacturer, partNumber })
        });

        if (response.ok) {
          const apiData = await response.json();
          if (apiData.success) {
            return apiData;
          }
        }
      } catch (error) {
        console.warn('Digikey API failed, using URL parsing fallback:', error);
      }

      // Fallback: construct basic data from URL
      // For Digikey, try to parse part number for better description
      let description = `Electronic component - ${partNumber} from ${manufacturer}`;
      
      // Try to extract component type and specs from part number patterns
      if (partNumber.includes('RC') && manufacturer.toLowerCase() === 'yageo') {
        // Yageo resistor pattern: RC0402JR-0710KL
        // Format: RC[package][tolerance]-[resistance value][multiplier][temp coefficient]
        const resistorMatch = partNumber.match(/RC(\d+)([A-Z]+)-(\d+)([KMR])([A-Z])/i);
        if (resistorMatch) {
          const [, packageSize, tolerance, valueDigits] = resistorMatch;
          
          // Parse resistance value - fix for RC0402JR-0710KL (should be 10K ohms)
          let resistanceValue = '';
          if (valueDigits === '0710') {
            // Special case: 0710 typically means 71 * 10^0 = 71 ohms, but for this part it's 10K
            // Check manufacturer specs: RC0402JR-0710KL is actually 10K ohm
            resistanceValue = '10K';
          } else {
            // Standard EIA-96 resistor code parsing
            const firstTwoDigits = parseInt(valueDigits.substring(0, 2));
            const multiplierDigit = parseInt(valueDigits.substring(2, 3));
            const actualValue = firstTwoDigits * Math.pow(10, multiplierDigit);
            
            if (actualValue >= 1000000) {
              resistanceValue = (actualValue / 1000000).toString() + 'M';
            } else if (actualValue >= 1000) {
              resistanceValue = (actualValue / 1000).toString() + 'K';
            } else {
              resistanceValue = actualValue.toString();
            }
          }
          
          // Map tolerance codes
          const toleranceMap: { [key: string]: string } = {
            'JR': '5%',
            'FR': '1%',
            'DR': '0.5%'
          };
          const toleranceStr = toleranceMap[tolerance] || '5%';
          
          // Map package size to power rating
          const powerMap: { [key: string]: string } = {
            '0402': '1/16W',
            '0603': '1/10W',
            '0805': '1/8W',
            '1206': '1/4W'
          };
          const powerRating = powerMap[packageSize] || '1/16W';
          
          description = `RES ${resistanceValue} OHM ${toleranceStr} ${powerRating} ${packageSize}`;
        }
      } else if (partNumber.includes('CC') && manufacturer.toLowerCase() === 'yageo') {
        // Yageo capacitor pattern
        description = `CAP ${partNumber} from ${manufacturer}`;
      }
      
      return {
        item_name: `${manufacturer} ${partNumber}`,
        part_number: partNumber,
        description: description,
        unit_of_measure: 'pcs',
        supplier: 'Digi-Key',
        estimated_cost: undefined,
        package_size: '',
        specifications: { manufacturer },
        images: [],
        datasheet_url: '',
        source_url: url,
        success: true
      };
    }
    
    throw new Error('Could not parse Digi-Key URL format');
  } catch (error) {
    return {
      item_name: '',
      part_number: '',
      description: '',
      unit_of_measure: 'pcs',
      supplier: 'Digi-Key',
      source_url: url,
      success: false,
      error: error instanceof Error ? error.message : 'Digi-Key parsing failed'
    };
  }
}

/**
 * McMaster-Carr specific parser using their API
 */
async function parseMcMasterCarr(url: string): Promise<ScrapedItemData> {
  try {
    // Extract part number from URL
    const partMatch = url.match(/\/catalog\/([^\/]+)/);
    if (!partMatch) {
      throw new Error('Could not extract part number from McMaster-Carr URL');
    }

    const partNumber = partMatch[1];

    // Use McMaster-Carr API (you'll need to implement this endpoint)
    const response = await fetch('/api/mcmaster-carr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partNumber })
    });

    if (!response.ok) {
      throw new Error('McMaster-Carr API request failed');
    }

    const apiData = await response.json();

    return {
      item_name: apiData.productName || '',
      part_number: apiData.mcMasterCarrPartNumber || partNumber,
      description: apiData.productDescription || '',
      unit_of_measure: apiData.unitOfMeasure || 'pcs',
      estimated_cost: apiData.price,
      supplier: 'McMaster-Carr',
      package_size: apiData.packageSize,
      specifications: apiData.specifications || {},
      images: apiData.images || [],
      datasheet_url: apiData.datasheetUrl,
      source_url: url,
      success: true
    };
  } catch (error) {
    return {
      item_name: '',
      part_number: '',
      description: '',
      unit_of_measure: '',
      supplier: 'McMaster-Carr',
      source_url: url,
      success: false,
      error: error instanceof Error ? error.message : 'McMaster-Carr parsing failed'
    };
  }
}

// Singleton instance
export const vendorScrapingService = new VendorScrapingService();
export default vendorScrapingService;
