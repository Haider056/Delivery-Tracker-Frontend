import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    if (code) {
      handleOAuthCallback(code);
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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Login</h2>
      <button onClick={handleLogin}>Login with Google</button>
      <div>
        <h2>Logout</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Login;
