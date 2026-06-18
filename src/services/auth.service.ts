import axios from 'axios';
import type { LoginFormData, RegisterFormData } from '../utils/auth-schemas';

const API_URL = 'http://localhost:8080/api/auth';

export const authService = {
  login: async (data: LoginFormData) => {
    const response = await axios.post(`${API_URL}/login`, data);
    return response.data;
  },

  register: async (data: RegisterFormData) => {
    const payload = {
      fullName: data.fullname,
      email: data.email,
      password: data.password
    };
    const response = await axios.post(`${API_URL}/register`, payload);
    return response.data;
  },

  googleLogin: async (credential: string) => {
    const response = await axios.post(`${API_URL}/google`, { idToken: credential });
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await axios.get(`${API_URL}/verify-email?token=${token}`);
    return response.data;
  }
};
