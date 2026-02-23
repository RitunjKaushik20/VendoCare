
const bcrypt = require('bcryptjs');
const logger = require('../../core/utils/logger');

const { prisma } = require('../../config/database');

class UserService {
  
  async getAll({ page = 1, limit = 10, search, role, companyId }) {
    const where = {
      ...(companyId && { companyId }),
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * limit;
    const take = limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, pagination: { page, limit, total, pages: Math.ceil(total / take) } };
  }

  
  async getById(id, companyId) {
    const user = await prisma.user.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  
  async create({ email, password, name, phone, role, companyId }) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role,
        companyId,
      },
    });

    logger.info(`User created: ${email} by admin`);
    return user;
  }

  
  async update(id, { name, phone, role, isActive }, companyId) {
    const user = await prisma.user.findFirst({ where: { id, companyId } });
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, phone, role, isActive },
    });

    logger.info(`User updated: ${id}`);
    return updatedUser;
  }

  
  async delete(id, companyId) {
    const user = await prisma.user.findFirst({ where: { id, companyId } });
    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.delete({ where: { id } });
    logger.info(`User deleted: ${id}`);
    return true;
  }
}

module.exports = new UserService();
