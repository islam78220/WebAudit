import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Configuration d'axios avec le token
const apiClient = axios.create({
  baseURL: API_URL,
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs globalement
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gérer les erreurs d'authentification
    if (error.response && error.response.status === 401) {
      // Si le token est expiré ou invalide, supprimer le token
      localStorage.removeItem('token');
      
      // Rediriger vers la page de connexion pour les routes protégées
      if (error.config.url === '/audit/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const submitUrlForAudit = async (url) => {
  try {
    // S'assurer que l'URL a un schéma (http/https)
    const formattedUrl = url.match(/^(http|https):\/\//) ? url : `https://${url}`;
    
    console.log("Soumission de l'URL:", formattedUrl);
    const response = await apiClient.post('/audit/', { url: formattedUrl });
    
    // D'après le contrôleur, la réponse contient success, gtmetrixDataType, et data
    if (response.data && response.data.success && response.data.data) {
      console.log("Audit créé avec succès:", response.data.data._id);
      
      return {
        auditId: response.data.data._id,
        ...response.data.data
      };
    } else {
      throw new Error(response.data.message || "Erreur lors de la création de l'audit");
    }
  } catch (error) {
    console.error("Erreur lors de la soumission:", error);
    
    // Gérer les différents types d'erreurs
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'erreur
      if (error.response.status === 402) {
        throw new Error("Crédits GTmetrix insuffisants. Veuillez recharger votre compte.");
      } else {
        throw new Error(error.response.data?.message || error.response.data?.error || "Erreur lors de la soumission de l'URL");
      }
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      throw new Error("Aucune réponse du serveur. Veuillez vérifier votre connexion internet.");
    } else {
      // Une erreur s'est produite lors de la préparation de la requête
      throw new Error(error.message || "Erreur lors de la soumission de l'URL");
    }
  }
};

export const getAuditResults = async (auditId) => {
  try {
    if (!auditId) {
      throw new Error("ID d'audit non spécifié");
    }
    
    const response = await apiClient.get(`/audit/${auditId}`);
    
    // D'après le contrôleur, la réponse contient success et data
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Erreur lors de la récupération des résultats");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des résultats:", error);
    
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error("Audit non trouvé");
      } else if (error.response.status === 403) {
        throw new Error("Vous n'êtes pas autorisé à accéder à cet audit");
      } else {
        throw new Error(error.response.data?.message || error.response.data?.error || "Erreur lors de la récupération des résultats d'audit");
      }
    } else {
      throw new Error(error.message || "Erreur lors de la récupération des résultats d'audit");
    }
  }
};

export const getAuditHistory = async () => {
  try {
    const response = await apiClient.get('/audit/');
    
    // D'après le contrôleur, la réponse contient success, count et data
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Erreur lors de la récupération de l'historique");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    
    if (error.response && error.response.status === 401) {
      throw new Error("Veuillez vous connecter pour accéder à l'historique des audits");
    } else {
      throw new Error(error.response?.data?.message || error.response?.data?.error || "Erreur lors de la récupération de l'historique d'audit");
    }
  }
};

export const downloadAuditReport = async (auditId) => {
  try {
    if (!auditId) {
      throw new Error("ID d'audit non spécifié");
    }
    
    // D'après les routes, l'endpoint est /audit/:id/pdf
    const response = await apiClient.get(`/audit/${auditId}/pdf`, {
      responseType: 'blob'
    });
    
    return response.data;
  } catch (error) {
    console.error("Erreur lors du téléchargement du rapport:", error);
    
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error("Rapport non trouvé");
      } else if (error.response.status === 403) {
        throw new Error("Vous n'êtes pas autorisé à accéder à ce rapport");
      } else {
        throw new Error("Erreur lors du téléchargement du rapport");
      }
    } else {
      throw new Error(error.message || "Erreur lors du téléchargement du rapport");
    }
  }
};
