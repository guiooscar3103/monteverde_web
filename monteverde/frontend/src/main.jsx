import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.jsx';
import './styles/global.css'; 

// Importar familia tipográfica principal autoalojada localmente: Inter (400, 500, 600, 700, 800)
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';

// =========================================
// Configuración de React Query v5
// =========================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos: evita refetch innecesario
      gcTime: 10 * 60 * 1000,   // 10 minutos: limpia caché
      refetchOnWindowFocus: false,
    },
  },
});

// =========================================
// Render principal
// =========================================
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider> {/* ✅ Envuelve toda la app */}
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
