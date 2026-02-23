
const authService = require('./authService');
const { sendResponse, badRequest, ok, created } = require('../../core/utils/response');

class AuthController {
  
  async register(req, res) {
    try {
      const { email, password, name, companyName, role } = req.body;
      
      
      if (!email || !password || !name) {
        return badRequest(res, 'Email, password, and name are required');
      }
      
      const result = await authService.register({ email, password, name, companyName, role });
      return created(res, result, 'Registration successful');
    } catch (error) {
      console.error('Registration error:', error.message);
      return badRequest(res, error.message);
    }
  }

  
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      
      if (!email || !password) {
        return badRequest(res, 'Email and password are required');
      }
      
      const result = await authService.login({ email, password });
      return ok(res, result, 'Login successful');
    } catch (error) {
      console.error('Login error:', error.message);
      return badRequest(res, error.message);
    }
  }

  
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return badRequest(res, 'Refresh token is required');
      }
      
      const tokens = await authService.refreshToken(refreshToken);
      return ok(res, tokens, 'Token refreshed');
    } catch (error) {
      console.error('Token refresh error:', error.message);
      return badRequest(res, error.message);
    }
  }

  
  async getProfile(req, res) {
    try {
      const user = await authService.getProfile(req.user.id);
      return ok(res, user, 'Profile retrieved');
    } catch (error) {
      console.error('Get profile error:', error.message);
      return badRequest(res, error.message);
    }
  }

  
  async updateProfile(req, res) {
    try {
      const { name, phone, avatar } = req.body;
      const user = await authService.updateProfile(req.user.id, { name, phone, avatar });
      return ok(res, user, 'Profile updated');
    } catch (error) {
      console.error('Update profile error:', error.message);
      return badRequest(res, error.message);
    }
  }

  
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, { currentPassword, newPassword });
      return ok(res, null, 'Password changed successfully');
    } catch (error) {
      console.error('Change password error:', error.message);
      return badRequest(res, error.message);
    }
  }

  
  async logout(req, res) {
    
    return ok(res, null, 'Logged out successfully');
  }
}

module.exports = new AuthController();
