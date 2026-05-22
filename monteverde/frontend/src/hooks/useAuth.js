import { useAuth as useAuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useAuthContext();
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  
  
  return {
    usuario: context.user, 
    user: context.user, // Agregado para mantener la compatibilidad con los componentes de diseño (layouts)
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    error: context.error,
    login: context.login,
    logout: context.logout,
    clearError: context.clearError
  };
};


export default useAuth;
