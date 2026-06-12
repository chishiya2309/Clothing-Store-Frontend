import axios from 'axios';
import type { LoginFormData, RegisterFormData } from '../utils/auth-schemas';

const API_URL = 'http://localhost:8080/api/auth';

export const authService = {
  login: async (data: LoginFormData) => {
    const response = await axios.post(`${API_URL}/login`, data);
    return response.data;
  },

  register: async (data: RegisterFormData) => {
    const response = await axios.post(`${API_URL}/register`, data);
    return response.data;
  },

  googleLogin: async (credential: string) => {
    const response = await axios.post(`${API_URL}/google`, { idToken: credential });
    return response.data;
  }
};
