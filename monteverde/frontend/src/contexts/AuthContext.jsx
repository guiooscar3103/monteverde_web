/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { verificarToken, API_BASE_URL } from '../services/api';

const AuthContext = createContext();


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const validatedUser = await verificarToken();
        setUser(validatedUser);
      } catch (err) {
        console.error('Error al verificar la sesión inicial:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    verificarSesion();
  }, []);

  const login = async ({ email, password }) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });


      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return data.user;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    usuario: user,
    isAuthenticated: !!user,
    isLoading,
    loading: isLoading,
    error,
    login,
    logout,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
