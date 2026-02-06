import { useState, useEffect } from 'react';
import { User } from '@/types';
import { getCurrentUser } from '@/utils/user/profileUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UseCurrentUserResult {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  isClient: boolean;
  /** When using Supabase auth, call this after profile updates to refresh from backend */
  refreshUser?: () => Promise<void>;
}

function backendUserToUser(backendUser: {
  id: string;
  username: string;
  display_name: string;
  profile_picture_url?: string | null;
  badge?: string | null;
}): User {
  return {
    id: backendUser.id,
    handle: backendUser.username,
    displayName: backendUser.display_name,
    avatar: backendUser.profile_picture_url ?? '',
    badge: backendUser.badge === 'Verified' ? 'Verified' : backendUser.badge === 'Public' ? 'Public' : undefined,
  };
}

/**
 * Hook to manage current user state.
 * When authenticated via Supabase, uses backend user. Otherwise falls back to localStorage/mock.
 */
export function useCurrentUser(): UseCurrentUserResult {
  const { backendUser, loading, refreshBackendUser } = useAuth();
  const [localUser, setLocalUser] = useState<User>(getCurrentUser());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // When backend user exists, use it. Otherwise use localStorage fallback
  const currentUser = backendUser
    ? backendUserToUser(backendUser)
    : isClient
      ? localUser
      : getCurrentUser();

  // Update local user when profile changes (only when not using auth)
  useEffect(() => {
    if (!isClient || backendUser) return;
    setLocalUser(getCurrentUser());
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('pageshare_profile_')) {
        setLocalUser(getCurrentUser());
      }
    };
    const handleProfileUpdate = () => setLocalUser(getCurrentUser());
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [isClient, backendUser]);

  const setCurrentUser: React.Dispatch<React.SetStateAction<User>> = (arg) => {
    if (backendUser) {
      // When using auth, local updates are ignored; call refreshBackendUser after API updates
      return;
    }
    setLocalUser(typeof arg === 'function' ? arg(localUser) : arg);
  };

  return {
    currentUser,
    setCurrentUser,
    isClient: isClient && !loading,
    refreshUser: backendUser ? refreshBackendUser : undefined,
  };
}

