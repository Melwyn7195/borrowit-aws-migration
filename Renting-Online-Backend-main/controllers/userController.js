const userModel = require('../models/User');
const jwt = require('jsonwebtoken');
const emailService = require('../services/EmailService');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (userId, userRole) => {
  return jwt.sign({ id: userId , role: userRole}, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Generate Refresh Token (for extended sessions)
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Helper function to set session cookie
const setSessionCookie = (res, token, refreshToken) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' // CSRF protection
  };
  
  // Set main auth token
  res.cookie('authToken', token, cookieOptions);
  
  // Set refresh token with longer expiry
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
  }
};

// Helper function to clear session cookies
const clearSessionCookies = (res) => {
  const clearOptions = {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  res.cookie('authToken', '', clearOptions);
  res.cookie('refreshToken', '', clearOptions);
};

// Helper function to remove password from user object
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await userModel.getUserByEmail(email);

    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Check username
    const usernameExists = await userModel.getUserByUsername(username);

    if (usernameExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Username is already taken' 
      });
    }

    // A verification gate is only a gate if the mail can actually arrive.
    // With no credentials configured the account would sit at `pending`
    // forever and login rejects `pending` - that is a lockout, not a security
    // control, and the only way out is an admin editing the row by hand. So
    // hold the account back only when the service can send the message.
    const emailEnabled = emailService.isConfigured();

    // Generate verification token
    const verificationToken = emailService.generateVerificationToken();
    const tokenExpires = emailService.generateTokenExpiry();

    // Create user with verification token
    const user = await userModel.createUser({
      username,
      email,
      password,
      role: role || 'customer',
      status: emailEnabled ? 'pending' : 'active',
      // No point storing a token nobody will ever be sent.
      verificationToken: emailEnabled ? verificationToken : null,
      tokenExpires: emailEnabled ? tokenExpires : null
    });

    // Send verification email
    if (emailEnabled) {
      try {
        await emailService.sendVerificationEmail(email, verificationToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue with registration even if email fails
      }
    }

    // Only hand out a session if the account is actually usable. Issuing
    // cookies for a `pending` account is what made the gate incoherent: the
    // browser held a working 7-day session that every endpoint accepted, so
    // "unverified" blocked nothing until the cookie lapsed - at which point
    // login refused to replace it and the account was locked out for good.
    let token = null;
    if (!emailEnabled) {
      token = generateToken(user.user_id, user.role);
      const refreshToken = generateRefreshToken(user.user_id);
      setSessionCookie(res, token, refreshToken);
    }

    res.status(201).json({
      success: true,
      message: emailEnabled
        ? 'User registered successfully! Please check your email to verify your account.'
        : 'User registered successfully! You can log in now.',
      data: {
        user: sanitizeUser(user),
        token,
        sessionCreated: !emailEnabled,
        requiresEmailVerification: emailEnabled
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error registering user',
      error: error.message 
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, identifier } = req.body;

    // Support both old format (email) and new format (identifier)
    const loginIdentifier = identifier || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email/username and password are required' 
      });
    }

    // Find user by email or username
    let user;
    
    // Check if identifier contains @ symbol (likely email)
    if (loginIdentifier.includes('@')) {
      user = await userModel.getUserByEmail(loginIdentifier);
    } else {
      // Try username first
      user = await userModel.getUserByUsername(loginIdentifier);
      
      // If not found by username, try email (in case user enters email without @)
      if (!user) {
        user = await userModel.getUserByEmail(loginIdentifier);
      }
    }
     
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email/username or password' 
      });
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ 
        success: false,
        message: 'Your account has been suspended' 
      });
    }

    // Check if user account is pending verification
    if (user.status === 'pending') {
      return res.status(403).json({ 
        success: false,
        message: 'Your account is pending verification. Please verify your email before logging in.' 
      });
    }

    // Check password
    const isPasswordValid = await userModel.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email/username or password' 
      });
    }

    // Update last login
    await userModel.updateLastLogin(user.user_id);

    // Use fallback role if DB doesn't return one
    const roleForToken = user.role || 'customer';

    // Generate tokens
    const token = generateToken(user.user_id, roleForToken);
    const refreshToken = generateRefreshToken(user.user_id);
    
    // Set session cookies
    setSessionCookie(res, token, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        token, 
        sessionCreated: true
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error logging in',
      error: error.message 
    });
  }
};

// @desc    Logout user and destroy session
// @route   POST /api/users/logout
// @access  Private
const logoutUser = (req, res) => {
  try {
    // Clear session cookies
    clearSessionCookies(res);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      sessionDestroyed: true
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

// @desc    Get current user from session
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.authToken;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No session found. Please login.',
        sessionValid: false
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.getUserById(decoded.id);
      
      if (!user) {
        clearSessionCookies(res);
        return res.status(401).json({
          success: false,
          message: 'User not found',
          sessionValid: false
        });
      }
      
      if (user.status === 'suspended') {
        clearSessionCookies(res);
        return res.status(403).json({
          success: false,
          message: 'Account has been suspended',
          sessionValid: false
        });
      }

      // Same gate as verifySession. Every protected screen in the SPA decides
      // what to render from this one call, so letting `pending` through here
      // would hand an unverified account the whole app.
      if (user.status === 'pending') {
        clearSessionCookies(res);
        return res.status(403).json({
          success: false,
          message: 'Please verify your email address before using your account.',
          sessionValid: false
        });
      }

      res.status(200).json({
        success: true,
        data: sanitizeUser(user),
        sessionValid: true
      });
    } catch (jwtError) {
      // Try to refresh token if main token is expired
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        try {
          const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
          const user = await userModel.getUserById(refreshDecoded.id);
          
          // A refresh must not upgrade an unverified account into a working
          // session either.
          if (user && user.status !== 'suspended' && user.status !== 'pending') {
            // Generate new tokens
            const newToken = generateToken(user.user_id, user.role);
            const newRefreshToken = generateRefreshToken(user.user_id);
            
            // Set new session cookies
            setSessionCookie(res, newToken, newRefreshToken);
            
            return res.status(200).json({
              success: true,
              data: sanitizeUser(user),
              sessionValid: true,
              sessionRefreshed: true
            });
          }
        } catch (refreshError) {
          console.error('Refresh token error:', refreshError);
        }
      }
      
      // If all fails, clear cookies and return unauthorized
      clearSessionCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
        sessionValid: false
      });
    }
  } catch (error) {
    console.error('Get current user error:', error);
    clearSessionCookies(res);
    res.status(500).json({
      success: false,
      message: 'Error retrieving session',
      sessionValid: false
    });
  }
};

// @desc    Refresh session
// @route   POST /api/users/refresh-session
// @access  Private
const refreshSession = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token found'
      });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await userModel.getUserById(decoded.id);
    
    // `pending` is refused here too - otherwise this endpoint would be a way
    // to mint a fresh session for an unverified account.
    if (!user || user.status === 'suspended' || user.status === 'pending') {
      clearSessionCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user.user_id, user.role);
    const newRefreshToken = generateRefreshToken(user.user_id);
    
    // Set new session cookies
    setSessionCookie(res, newToken, newRefreshToken);
    
    res.status(200).json({
      success: true,
      message: 'Session refreshed successfully',
      data: {
        user: sanitizeUser(user),
        token: newToken
      }
    });
  } catch (error) {
    console.error('Refresh session error:', error);
    clearSessionCookies(res);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Public
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const offset = (page - 1) * limit;

    const filters = { role, status, search, limit: parseInt(limit), offset: parseInt(offset) };

    const users = await userModel.searchUsers(filters);
    const total = await userModel.countUsers(filters);

    // Remove password from all users
    const sanitizedUsers = users.map(sanitizeUser);

    res.status(200).json({
      success: true,
      data: {
        users: sanitizedUsers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching users',
      error: error.message 
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.getUserById(id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user',
      error: error.message 
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating certain fields via this endpoint
    delete updates.user_id;
    delete updates.password;
    delete updates.created_at;
    delete updates.updated_at;

    // The route guard admits every authenticated role, so without an ownership
    // check any customer could edit any other account by id - including
    // setting their own role to `admin` or lifting a suspension. Non-admins
    // get their own row only, and never the two fields that grant privilege.
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      if (String(req.user.user_id) !== String(id)) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own account.'
        });
      }
      // Dropped rather than rejected: the profile screens post the whole form
      // back, and failing the request would break a legitimate edit.
      delete updates.role;
      delete updates.status;
      delete updates.verification_token;
      delete updates.token_expires;
    }

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ['active', 'suspended', 'pending'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
    }

    // Validate role if provided
    if (updates.role) {
      const validRoles = ['customer', 'seller', 'admin'];
      if (!validRoles.includes(updates.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role value'
        });
      }
    }

    const user = await userModel.getUserById(id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const updatedUser = await userModel.updateUser(id, updates);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating user',
      error: error.message 
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.getUserById(id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    await userModel.deleteUser(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting user',
      error: error.message 
    });
  }
};

// @desc    Verify email
// @route   POST /api/users/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Get user by verification token
    const user = await userModel.getUserByVerificationToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Verify user email
    const verifiedUser = await userModel.verifyUserEmail(token);

    if (!verifiedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login.',
      data: {
        user: sanitizeUser(verifiedUser)
      }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/users/resend-verification
// @access  Public
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Get user by email
    const user = await userModel.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Nothing to resend if the service cannot send. Say so plainly rather
    // than issuing a fresh token and failing with a generic 500.
    if (!emailService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Email delivery is not configured on this deployment. Contact an administrator to activate the account.'
      });
    }

    // Generate new verification token
    const verificationToken = emailService.generateVerificationToken();
    const tokenExpires = emailService.generateTokenExpiry();

    // Update user with new token
    await userModel.updateVerificationToken(user.user_id, verificationToken, tokenExpires);

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken);
      
      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully! Please check your email.'
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending verification email',
      error: error.message
    });
  }
};

// @desc    Forgot password - generate reset token and send email
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Lookup user - we won't reveal if user exists to the client
    const user = await userModel.getUserByEmail(email);

    // Generate token and expiry (1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    if (user) {
      // Persist token
      await userModel.setResetToken(user.user_id, resetToken, tokenExpires);

      // Send reset email (don't fail the request if email sending fails)
      try {
        await emailService.sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    // Always respond with success message to avoid account enumeration
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Error processing password reset request', error: error.message });
  }
};

// @desc    Reset password using token
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    // Find user by reset token and ensure not expired
    const user = await userModel.getUserByResetToken(token);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Update password and clear reset token
    await userModel.updateUserPassword(user.user_id, newPassword);
    await userModel.clearResetToken(user.user_id);

    res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Error resetting password', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshSession,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
};

