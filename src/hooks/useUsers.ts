import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, remove, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { User } from '@/types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userList = Object.entries(data).map(([uid, value]: [string, any]) => ({
          uid,
          ...value,
        }));
        // Sort: Admins first, then by name
        userList.sort((a, b) => {
          if (a.isAdmin && !b.isAdmin) return -1;
          if (!a.isAdmin && b.isAdmin) return 1;
          return a.name.localeCompare(b.name);
        });
        setUsers(userList);
      } else {
        setUsers([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const blockUser = useCallback(async (userId: string) => {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, { isBlocked: true });
  }, []);

  const unblockUser = useCallback(async (userId: string) => {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, { isBlocked: false });
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    const userRef = ref(db, `users/${userId}`);
    await remove(userRef);
  }, []);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, updates);
  }, []);

  const getUserById = useCallback(async (userId: string): Promise<User | null> => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return { uid: userId, ...snapshot.val() };
    }
    return null;
  }, []);

  const getTotalUsers = useCallback(() => users.length, [users]);
  
  const getBlockedUsers = useCallback(() => users.filter(u => u.isBlocked), [users]);
  
  const getTotalBlockedCount = useCallback(() => users.filter(u => u.isBlocked).length, [users]);

  return {
    users,
    loading,
    blockUser,
    unblockUser,
    deleteUser,
    updateUser,
    getUserById,
    getTotalUsers,
    getBlockedUsers,
    getTotalBlockedCount,
  };
}
