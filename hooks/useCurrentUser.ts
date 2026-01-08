import { useState, useEffect } from 'react';
import { User } from '@/types';
import { getCurrentUser } from '@/utils/profileUtils';

interface UseCurrentUserResult {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  isClient: boolean;
}

/**
 * Hook to manage current user state and listen for profile updates
 * Handles both localStorage changes and custom events
 */
export function useCurrentUser(): UseCurrentUserResult {
  const [currentUser, setCurrentUser] = useState<User>(getCurrentUser());
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update current user when profile changes
  useEffect(() => {
    if (!isClient) return;

    // Initial load
    setCurrentUser(getCurrentUser());

    // Listen for profile updates from localStorage (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('pageshare_profile_')) {
        setCurrentUser(getCurrentUser());
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for custom event (same-tab updates)
    const handleProfileUpdate = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [isClient]);

  return {
    currentUser,
    setCurrentUser,
    isClient,
  };
}

