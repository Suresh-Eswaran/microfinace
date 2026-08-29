import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // { userId, email, role, token }
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mf_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const userData = {
      token:  res.token,
      userId: res.userId,
      email:  res.email,
      role:   res.role,
    };
    localStorage.setItem('mf_token', res.token);
    localStorage.setItem('mf_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    return authApi.register(data);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('mf_token');
    localStorage.removeItem('mf_user');
    setUser(null);
  }, []);

  const isAdmin          = user?.role === 'ADMIN';
  const isBranchManager  = user?.role === 'BRANCH_MANAGER';
  const isCreditOfficer  = user?.role === 'CREDIT_OFFICER';
  const isLoanOfficer    = user?.role === 'LOAN_OFFICER';
  const isCollectionAgent= user?.role === 'COLLECTIONS_AGENT';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      register,
      isAdmin,
      isBranchManager,
      isCreditOfficer,
      isLoanOfficer,
      isCollectionAgent,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
