
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');

let io = null;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.userId;
      socket.companyId = decoded.companyId;
      socket.role = decoded.role;

      
      if (decoded.role === 'VENDOR') {
        const { prisma } = require('../config/database');

        const vendor = await prisma.vendor.findFirst({
          where: {
            OR: [
              { userId: decoded.userId },
              { createdById: decoded.userId }
            ]
          },
          select: { id: true, companyId: true }
        });

        if (vendor) {
          socket.vendorId = vendor.id;
          socket.vendorCompanyId = vendor.companyId;
        }
      }

      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    
    socket.join(`user:${socket.userId}`);

    
    if (socket.companyId) {
      socket.join(`company:${socket.companyId}`);
    }

    
    if (socket.vendorId) {
      socket.join(`vendor:${socket.vendorId}`);
      console.log(`Vendor ${socket.vendorId} joined vendor room`);
    }

    
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });

    
    socket.on('subscribe', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} subscribed to ${room}`);
    });

    
    socket.on('unsubscribe', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} unsubscribed from ${room}`);
    });

    
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  console.log('Socket.IO server initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToCompany = (companyId, event, data) => {
  if (io) {
    io.to(`company:${companyId}`).emit(event, data);
  }
};

const emitToVendor = (vendorId, event, data) => {
  if (io) {
    io.to(`vendor:${vendorId}`).emit(event, data);
  }
};

const emitInvoiceStatusChange = ({ vendorId, invoiceId, invoiceNumber, oldStatus, newStatus, reason }) => {
  emitToVendor(vendorId, 'invoice:status-changed', {
    invoiceId,
    invoiceNumber,
    oldStatus,
    newStatus,
    reason,
    timestamp: new Date().toISOString(),
  });
};

const emitPaymentCompleted = ({ vendorId, paymentId, invoiceNumber, amount, transactionId }) => {
  emitToVendor(vendorId, 'payment:completed', {
    paymentId,
    invoiceNumber,
    amount,
    transactionId,
    timestamp: new Date().toISOString(),
  });
};

const emitContractExpiring = ({ vendorId, contractId, title, endDate, daysRemaining }) => {
  emitToVendor(vendorId, 'contract:expiring', {
    contractId,
    title,
    endDate,
    daysRemaining,
    timestamp: new Date().toISOString(),
  });
};

const emitNewInvoice = ({ companyId, vendorId, invoiceId, invoiceNumber, amount }) => {
  
  emitToCompany(companyId, 'invoice:created', {
    invoiceId,
    vendorId,
    invoiceNumber,
    amount,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToCompany,
  emitToVendor,
  emitInvoiceStatusChange,
  emitPaymentCompleted,
  emitContractExpiring,
  emitNewInvoice,
};

