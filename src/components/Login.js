import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    if (code) {
      handleOAuthCallback(code);
    }
    // Check if user is already logged in
    const email = localStorage.getItem('userEmail');
    if (email) {
      setIsLoggedIn(true);
    }
  }, [location]);

  const handleLogin = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/login');
      window.location.href = response.data.authorization_url;
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  
  const handleOAuthCallback = async (code) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/oauth2callback', { code });
      if (response.data.status === 'success') {
        // Save email to local storage
        localStorage.setItem('userEmail', response.data.email);
        setIsLoggedIn(true);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
    }
  };
  
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('http://127.0.0.1:8000/logout');
      if (response.data.status === 'success') {
        // Remove email from local storage
        localStorage.removeItem('userEmail');
        setIsLoggedIn(false);
        navigate('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg">
        <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">Welcome to the Dashboard</h3>
        <div className="mt-4">
          {!isLoggedIn ? (
            <button
              onClick={handleLogin}
              className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600"
            >
              Login with Google
            </button>
          ) : (
            <div className="text-center">
              <p className="mb-4 text-gray-600">You are logged in.</p>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:bg-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;