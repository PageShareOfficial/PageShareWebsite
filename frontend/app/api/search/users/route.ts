import { NextRequest, NextResponse } from 'next/server';
import { mockUsers } from '@/data/mockData';
import { User } from '@/types';

/**
 * API route to search users/accounts
 * Searches mockUsers data (server-side only, localStorage not available)
 * 
 * GET /api/search/users?q=query&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { users: [] },
        { status: 200 }
      );
    }

    const normalizedQuery = query.trim().toLowerCase();
    const results: User[] = [];

    // Search through mockUsers
    for (const [handle, userData] of Object.entries(mockUsers)) {
      if (results.length >= limit) break;

      const handleMatch = handle.toLowerCase().includes(normalizedQuery);
      const displayNameMatch = userData.displayName.toLowerCase().includes(normalizedQuery);
      const bioMatch = userData.bio.toLowerCase().includes(normalizedQuery);

      if (handleMatch || displayNameMatch || bioMatch) {
        results.push({
          id: userData.id,
          displayName: userData.displayName,
          handle: userData.handle,
          avatar: userData.avatar,
          badge: userData.badge,
        });
      }
    }

    // Sort by relevance: exact handle match > handle starts with > display name > bio
    results.sort((a, b) => {
      const aHandle = a.handle.toLowerCase();
      const bHandle = b.handle.toLowerCase();
      const aDisplayName = a.displayName.toLowerCase();
      const bDisplayName = b.displayName.toLowerCase();

      // Exact handle match
      if (aHandle === normalizedQuery && bHandle !== normalizedQuery) return -1;
      if (bHandle === normalizedQuery && aHandle !== normalizedQuery) return 1;

      // Handle starts with query
      if (aHandle.startsWith(normalizedQuery) && !bHandle.startsWith(normalizedQuery)) return -1;
      if (bHandle.startsWith(normalizedQuery) && !aHandle.startsWith(normalizedQuery)) return 1;

      // Display name match
      if (aDisplayName.includes(normalizedQuery) && !bDisplayName.includes(normalizedQuery)) return -1;
      if (bDisplayName.includes(normalizedQuery) && !aDisplayName.includes(normalizedQuery)) return 1;

      return 0;
    });

    return NextResponse.json(
      { users: results },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', // Cache for 1 min, stale for 5 min
        },
      }
    );
  } catch (error) {
    console.error('Error in user search API route:', error);
    return NextResponse.json(
      { users: [], error: 'Internal server error' },
      { status: 500 }
    );
  }
}
