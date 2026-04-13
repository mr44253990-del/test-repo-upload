import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userData: Omit<User, 'uid' | 'isAdmin' | 'isBlocked' | 'totalDeposit' | 'createdAt'>) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      setUserData({ ...data, uid });
      // Store in localStorage for auto-login persistence
      localStorage.setItem('userData', JSON.stringify({ ...data, uid }));
    }
  };

  const refreshUserData = async () => {
    if (currentUser) {
      await fetchUserData(currentUser.uid);
    }
  };

  useEffect(() => {
    // Check localStorage for auto-login
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
        localStorage.removeItem('userData');
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (
    email: string, 
    password: string, 
    userInfo: Omit<User, 'uid' | 'isAdmin' | 'isBlocked' | 'totalDeposit' | 'createdAt'>
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const newUser: User = {
      uid: user.uid,
      ...userInfo,
      email,
      isAdmin: false,
      isBlocked: false,
      totalDeposit: 0,
      createdAt: new Date().toISOString(),
    };
    
    await set(ref(db, `users/${user.uid}`), newUser);
    setUserData(newUser);
    localStorage.setItem('userData', JSON.stringify(newUser));
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if user is blocked
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (data.isBlocked) {
        await signOut(auth);
        throw new Error('আপনার অ্যাকাউন্ট ব্লক করা হয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।');
      }
      setUserData({ ...data, uid: user.uid });
      localStorage.setItem('userData', JSON.stringify({ ...data, uid: user.uid }));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
    localStorage.removeItem('userData');
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    isAdmin: userData?.isAdmin || false,
    isLoading,
    login,
    signup,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
