import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from '@/constants/api';
import { User } from '@/types';

export class AuthService {
  private static instance: AuthService;
  private authToken: string | null = null;
  private user: User | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initialize(): Promise<void> {
    try {
      this.authToken = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      if (userData) {
        this.user = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
    }
  }

  async login(): Promise<User> {
    try {
      // Use WebBrowser to open Replit Auth flow
      const authUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}?mobile=true`;
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        `${API_CONFIG.BASE_URL}/auth/callback`
      );

      if (result.type === 'success' && result.url) {
        // Extract token from callback URL
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        
        if (!token) {
          throw new Error('No authentication token received');
        }

        await this.setAuthToken(token);
        
        // Fetch user data
        const user = await this.fetchUserData();
        await this.setUser(user);
        
        return user;
      } else {
        throw new Error('Authentication was cancelled or failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint if we have a token
      if (this.authToken) {
        await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage regardless of API call success
      await this.clearAuthData();
    }
  }

  async fetchUserData(): Promise<User> {
    if (!this.authToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.USER}`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.clearAuthData();
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to fetch user data');
    }

    return await response.json();
  }

  async refreshToken(): Promise<string> {
    if (!this.authToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await this.clearAuthData();
      throw new Error('Token refresh failed');
    }

    const { token } = await response.json();
    await this.setAuthToken(token);
    return token;
  }

  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async setUser(user: User): Promise<void> {
    this.user = user;
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  async clearAuthData(): Promise<void> {
    this.authToken = null;
    this.user = null;
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.authToken && !!this.user;
  }

  getUserRole(): string | null {
    return this.user?.role || null;
  }

  isStudent(): boolean {
    return this.user?.role === 'student';
  }

  isTeacher(): boolean {
    return this.user?.role === 'teacher';
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin' || this.user?.role === 'super_admin';
  }
}