import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from '@react-native-firebase/auth';
import { create } from 'zustand';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initAuthListener: () => () => void;
}

function mapAuthError(error: any): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred. Please try again.';
  }
  const code = error.code as string | undefined;
  if (!code) {
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled for this project.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.';
    default:
      return error.message ? error.message.replace(/\[.*?\]\s*/, '') : 'An error occurred during authentication.';
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  initialized: false,

  signUp: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      set({ error: mapAuthError(err), isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      set({ error: mapAuthError(err), isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const auth = getAuth();
      await firebaseSignOut(auth);
    } catch (err: any) {
      set({ error: mapAuthError(err), isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  initAuthListener: () => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      set({
        user,
        initialized: true,
        isLoading: false,
      });
    });
    return unsubscribe;
  },
}));
