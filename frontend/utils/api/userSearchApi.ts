import { User } from '@/types';
import { mockUsers } from '@/data/mockData';

/**
 * Search users by handle, display name, or bio
 * Searches both mockUsers and localStorage profiles
 * 
 * @param query - Search query (will be normalized, @ prefix removed)
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of matching users
 */
export async function searchUsers(query: string, limit: number = 20): Promise<User[]> {
  if (typeof window === 'undefined') {
    // Server-side: only search mockUsers
    return searchMockUsers(query, limit);
  }

  // Client-side: search both mockUsers and localStorage
  const normalizedQuery = query.trim().toLowerCase();
  
  if (!normalizedQuery || normalizedQuery.length < 1) {
    return [];
  }

  const results: User[] = [];
  const seenHandles = new Set<string>();

  // Search mockUsers first
  const mockResults = searchMockUsers(normalizedQuery, limit);
  mockResults.forEach(user => {
    results.push(user);
    seenHandles.add(user.handle.toLowerCase());
  });

  // Search localStorage profiles if we haven't reached the limit
  if (results.length < limit) {
    const localStorageResults = searchLocalStorageProfiles(normalizedQuery, limit - results.length, seenHandles);
    results.push(...localStorageResults);
  }

  return results.slice(0, limit);
}

/**
 * Search users in mockUsers data
 */
function searchMockUsers(query: string, limit: number): User[] {
  const normalizedQuery = query.toLowerCase();
  const results: User[] = [];

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

  return results;
}

/**
 * Search users in localStorage profiles
 */
function searchLocalStorageProfiles(
  query: string,
  limit: number,
  seenHandles: Set<string>
): User[] {
  const results: User[] = [];

  try {
    // Iterate through localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      if (results.length >= limit) break;

      const key = localStorage.key(i);
      if (!key || !key.startsWith('pageshare_profile_')) continue;

      const profileData = localStorage.getItem(key);
      if (!profileData) continue;

      try {
        const profile = JSON.parse(profileData);
        const handle = profile.handle?.toLowerCase() || '';
        const displayName = (profile.displayName || '').toLowerCase();
        const bio = (profile.bio || '').toLowerCase();

        // Skip if already in results
        if (seenHandles.has(handle)) continue;

        // Check if matches query
        const handleMatch = handle.includes(query);
        const displayNameMatch = displayName.includes(query);
        const bioMatch = bio.includes(query);

        if (handleMatch || displayNameMatch || bioMatch) {
          results.push({
            id: profile.id || `user-${handle}`,
            displayName: profile.displayName || handle,
            handle: profile.handle || handle,
            avatar: profile.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${handle}`,
            badge: profile.badge || 'Public',
          });
          seenHandles.add(handle);
        }
      } catch {
        // Skip invalid JSON
        continue;
      }
    }
  } catch (error) {
    console.error('Error searching localStorage profiles:', error);
  }

  return results;
}
