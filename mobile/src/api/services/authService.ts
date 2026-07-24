import { apiClient } from '../client';
import { 
  LoginPayload, 
  RegisterPayload, 
  TokenResponseSchema, 
  TokenResponse,
  UserSchema,
  User
} from '../schemas/auth';
import qs from 'qs';

export const authService = {
  /**
   * Logs in a user using OAuth2 password flow (which expects application/x-www-form-urlencoded)
   */
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    // FastAPI OAuth2PasswordRequestForm expects form data, not JSON.
    const formData = qs.stringify({
      username: payload.username,
      password: payload.password,
    });
    
    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Parse and validate the response against our Zod schema
    return TokenResponseSchema.parse(response.data);
  },

  /**
   * Registers a new user
   */
  register: async (payload: RegisterPayload): Promise<TokenResponse> => {
    const response = await apiClient.post('/auth/register', payload);
    return TokenResponseSchema.parse(response.data);
  },

  /**
   * Fetches the current authenticated user's profile
   */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return UserSchema.parse(response.data);
  }
};
