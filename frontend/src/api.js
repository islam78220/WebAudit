import axios from "axios";

// L'URL du backend (à adapter selon ce que ta copine utilise)
const API_BASE_URL = "http://localhost:5000";

// Appel API pour récupérer les données de performance
export const getPerformanceData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/performance`);
    return response.data;
  } catch (error) {
    console.error("Erreur API Performance :", error);
    return null;
  }
};
