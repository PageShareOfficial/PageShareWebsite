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

/** Guest user when not authenticated. Backend is the only source of truth for the real user. */
const GUEST_USER: User = getCurrentUser();

/**
 * Hook to manage current user state.
 * Backend is the source of truth: when authenticated, user comes from the API.
 * When not authenticated, returns a fixed guest user (no localStorage fallback).
 */
export function useCurrentUser(): UseCurrentUserResult {
  const { backendUser, loading, refreshBackendUser } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentUser = backendUser ? backendUserToUser(backendUser) : GUEST_USER;

  // No-op: profile updates go through the API, then refreshUser() to refetch from backend
  const setCurrentUser: React.Dispatch<React.SetStateAction<User>> = () => {};

  return {
    currentUser,
    setCurrentUser,
    isClient: isClient && !loading,
    refreshUser: backendUser ? refreshBackendUser : undefined,
  };
}

