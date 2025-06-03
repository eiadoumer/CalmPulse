// src/App.tsx - With Login functionality
import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import { HeartRateProvider } from './contexts/HeartRateContext';
import './index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
      staleTime: 30000,
    },
  },
});

interface User {
  email: string;
  type: 'patient' | 'caregiver' | 'professional';
  name: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuthSession = () => {
      const savedUser = localStorage.getItem('calmpulse_user');
      const savedAuth = localStorage.getItem('calmpulse_auth');

      if (savedUser && savedAuth === 'true') {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          localStorage.removeItem('calmpulse_user');
          localStorage.removeItem('calmpulse_auth');
        }
      }
      setIsLoading(false);
    };

    // Simulate loading time
    setTimeout(checkAuthSession, 1000);
  }, []);

  const handleLogin = (email: string, password: string) => {
    // Simulate authentication logic
    // In a real app, you would make an API call here

    let userType: 'patient' | 'caregiver' | 'professional' = 'patient';
    let userName = 'User';

    // Determine user type and name based on email
    if (email.includes('caregiver')) {
      userType = 'caregiver';
      userName = 'Samira Jawish';
    } else if (email.includes('professional')) {
      userType = 'professional';
      userName = 'Dr. Nour Falha';
    } else {
      userType = 'patient';
      userName = 'Eiad Oumer';
    }

    const userData: User = {
      email,
      type: userType,
      name: userName,
    };

    // Save to localStorage for persistence
    localStorage.setItem('calmpulse_user', JSON.stringify(userData));
    localStorage.setItem('calmpulse_auth', 'true');

    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('calmpulse_user');
    localStorage.removeItem('calmpulse_auth');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 mx-auto animate-pulse">
            <img
              src="/brainstorm.png"
              alt="CalmPulse Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">CalmPulse</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        {!isAuthenticated ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <HeartRateProvider>

            <Dashboard user={user} onLogout={handleLogout} />
          </HeartRateProvider >
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;


