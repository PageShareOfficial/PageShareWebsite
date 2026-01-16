import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to proxy ticker logos
 * This helps avoid SSL certificate issues and CORS problems
 * 
 * GET /api/ticker/logo?ticker=AAPL
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get('ticker');
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }

    const upperTicker = ticker.toUpperCase();
    
    // Use Finnhub - it's the only one working reliably
    const logoUrl = `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${upperTicker}.png`;
    
    try {
      const response = await fetch(logoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      });
      
      if (response.ok && response.status === 200) {
        const contentType = response.headers.get('content-type');
        // Check if it's actually an image (not HTML error page)
        if (contentType && contentType.startsWith('image/')) {
          const imageBuffer = await response.arrayBuffer();
          
          // Additional validation: Check if buffer is not empty and has minimum size
          // Also check first few bytes to ensure it's actually an image (PNG, JPEG, etc.)
          if (imageBuffer.byteLength > 100) {
            const bytes = new Uint8Array(imageBuffer);
            // Check for image magic numbers: PNG (89 50 4E 47), JPEG (FF D8 FF), GIF (47 49 46 38)
            const isImage = 
              (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) || // PNG
              (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) || // JPEG
              (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38); // GIF
            
            if (isImage) {
              // Return the image with proper headers
              return new NextResponse(imageBuffer, {
                headers: {
                  'Content-Type': contentType,
                  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
                  'Access-Control-Allow-Origin': '*',
                },
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch logo from Finnhub for ${ticker}:`, error);
    }
    
    // If all sources fail, return 404 (client will show fallback)
    console.warn(`Failed to fetch logo for ${ticker} from all sources`);
    return NextResponse.json(
      { error: 'Logo not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in logo proxy API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
