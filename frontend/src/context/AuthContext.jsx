import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier si l'utilisateur est déjà authentifié
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log("Vérification du token avec:", `${API_URL}/user/me`);
        const response = await axios.get(`${API_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.success) {
          setUser(response.data.data);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      
      console.log("Tentative de connexion avec:", `${API_URL}/user/login`);
      const response = await axios.post(`${API_URL}/user/login`, {
        email,
        password
      });
      
      if (response.data && response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        return true;
      } else {
        throw new Error(response.data.message || "Échec de la connexion");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setError(error.response?.data?.message || "Email ou mot de passe incorrect");
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      setError(null);
      
      console.log("Tentative d'inscription avec:", `${API_URL}/user/register`);
      const response = await axios.post(`${API_URL}/user/register`, {
        name,
        email,
        password
      });
      
      if (response.data && response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        return true;
      } else {
        throw new Error(response.data.message || "Échec de l'inscription");
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      setError(error.response?.data?.message || "Erreur lors de l'inscription");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loading, 
      error, 
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);