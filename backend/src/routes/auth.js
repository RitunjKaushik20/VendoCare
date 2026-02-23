
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../core/middlewares/auth');
const { sendResponse, badRequest, unauthorized, ok, created } = require('../core/utils/response');
const config = require('../config');
const logger = require('../core/utils/logger');

const router = express.Router();
const { prisma } = require('../config/database');


const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must include uppercase, lowercase, number, and special character'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('companyName').optional().trim(),
  body('role').optional().isIn(['ADMIN', 'FINANCE', 'VENDOR']).withMessage('Invalid role'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];


router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(res, 'Validation failed', errors.array());
    }

    const { email, password, name, companyName, role = 'ADMIN' } = req.body;

    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return badRequest(res, 'Email already registered');
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    let company;
    if (companyName) {
      company = await prisma.company.create({
        data: { name: companyName },
      });
    } else {
      company = await prisma.company.create({
        data: { name: name + "'s Company" },
      });
    }

    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyId: company.id,
        role: role || 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
      },
    });

    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info(`New user registered: ${email}`);
    return created(res, { user, token }, 'Registration successful');
  } catch (error) {
    logger.error('Registration error:', error);
    return badRequest(res, 'Registration failed');
  }
});


router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequest(res, 'Validation failed', errors.array());
    }

    const { email, password } = req.body;

    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      return unauthorized(res, 'Invalid credentials');
    }

    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return unauthorized(res, 'Invalid credentials');
    }

    if (!user.isActive) {
      return unauthorized(res, 'Account is deactivated');
    }

    
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    
    const tokenPayload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company?.id,
    };

    if (user.role === 'VENDOR') {
      const vendorData = await prisma.vendor.findFirst({
        where: { OR: [{ userId: user.id }, { createdById: user.id }] }
      });
      if (vendorData) {
        tokenPayload.vendorId = vendorData.id;
      }
    }

    
    const token = jwt.sign(
      tokenPayload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info(`User logged in: ${email}`);
    return ok(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
      },
      token,
    }, 'Login successful');
  } catch (error) {
    logger.error('Login error:', error);
    return badRequest(res, 'Login failed');
  }
});


router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: true },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        lastLogin: true,
        createdAt: true,
        company: true,
      },
    });

    return ok(res, user, 'Profile retrieved');
  } catch (error) {
    logger.error('Get profile error:', error);
    return badRequest(res, 'Failed to get profile');
  }
});


router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, avatar },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });

    return ok(res, user, 'Profile updated');
  } catch (error) {
    logger.error('Update profile error:', error);
    return badRequest(res, 'Failed to update profile');
  }
});


router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return badRequest(res, 'Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    return ok(res, null, 'Password changed successfully');
  } catch (error) {
    logger.error('Change password error:', error);
    return badRequest(res, 'Failed to change password');
  }
});


router.post('/logout', authenticate, async (req, res) => {
  logger.info(`User logged out: ${req.user.email}`);
  return ok(res, null, 'Logged out successfully');
});

module.exports = router;
