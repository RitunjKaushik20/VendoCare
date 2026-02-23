
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../config');
const logger = require('../../core/utils/logger');

const { prisma } = require('../../config/database');

class AuthService {

  async register({ email, password, name, companyName, role = 'ADMIN' }) {

    const existingUser = await prisma.user.findUnique({ where: { email } });

    // We allow user re-registration IF they are trying to register as a Vendor, 
    // to cleanly handle cases where an Admin already made their Vendor user record
    // or they want to adopt a role.
    if (existingUser && role !== 'VENDOR') {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let existingVendor = null;
    let targetCompanyId = null;

    if (role === 'VENDOR') {
      existingVendor = await prisma.vendor.findFirst({ where: { email } });
      if (existingVendor) {
        targetCompanyId = existingVendor.companyId;
      }
    }

    let company;
    if (!targetCompanyId) {
      if (companyName) {
        company = await prisma.company.create({ data: { name: companyName } });
      } else {
        company = await prisma.company.create({ data: { name: name + "'s Company" } });
      }
      targetCompanyId = company.id;
    } else {
      company = await prisma.company.findUnique({ where: { id: targetCompanyId } });
    }

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword, // Overwrite their password since they explicitly hit register
          name: name,
          companyId: targetCompanyId,
          role: role || 'ADMIN',
        },
        include: { company: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          companyId: targetCompanyId,
          role: role || 'ADMIN',
        },
        include: { company: true },
      });
    }

    if (existingVendor) {
      await prisma.vendor.update({
        where: { id: existingVendor.id },
        data: { userId: user.id }
      });
      user.vendorId = existingVendor.id;
      user.companyId = targetCompanyId;
    } else if (role === 'VENDOR') {

      const newVendor = await prisma.vendor.create({
        data: {
          name,
          email,
          status: 'ACTIVE',
          category: 'Uncategorized',
          companyId: targetCompanyId,
          createdById: user.id,
          userId: user.id
        }
      });
      user.vendorId = newVendor.id;
      user.companyId = targetCompanyId;
    }

    const tokens = this.generateTokens(user);

    logger.info(`User registered or linked vendor: ${email}`);
    return { user, ...tokens };
  }


  async login({ email, password }) {

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.role === 'VENDOR') {
      const vendorData = await prisma.vendor.findFirst({
        where: { OR: [{ userId: user.id }, { createdById: user.id }] }
      });
      if (vendorData) {
        user.vendorId = vendorData.id;
        user.companyId = vendorData.companyId;
      }
    }


    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }


    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });


    const tokens = this.generateTokens(user);

    logger.info(`User logged in: ${email}`);
    return { user, ...tokens };
  }


  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { company: true },
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }


  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }


  async updateProfile(userId, data) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: { company: true },
    });

    return user;
  }


  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info(`Password changed for user: ${userId}`);
    return true;
  }


  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };


    if (user.role === 'VENDOR' && user.vendorId) {
      payload.vendorId = user.vendorId;
    }

    const accessToken = jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }


  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService();
