import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'teacher' | 'student';
  profileImageUrl?: string;
  accountId: string;
  isActive: boolean;
}

const USER_SWITCH_KEY = 'switched_user';

export function useUserSwitching() {
  const queryClient = useQueryClient();
  const [switchedUser, setSwitchedUser] = useState<User | null>(null);

  // Load switched user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(USER_SWITCH_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setSwitchedUser(user);
      } catch (error) {
        console.error('Failed to parse switched user:', error);
        localStorage.removeItem(USER_SWITCH_KEY);
      }
    }
  }, []);

  const switchUser = (user: User) => {
    setSwitchedUser(user);
    localStorage.setItem(USER_SWITCH_KEY, JSON.stringify(user));
    
    // Invalidate all queries to refetch data with new user context
    queryClient.invalidateQueries();
  };

  const clearUserSwitch = () => {
    setSwitchedUser(null);
    localStorage.removeItem(USER_SWITCH_KEY);
    
    // Invalidate all queries to refetch data with original user context
    queryClient.invalidateQueries();
  };

  return {
    switchedUser,
    switchUser,
    clearUserSwitch,
    isSwitched: !!switchedUser,
  };
}