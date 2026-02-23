
const crypto = require('crypto');


const generateRandomString = (length = 10) => {
  return crypto.randomBytes(length).toString('hex');
};


const generateInvoiceNumber = async (prisma, companyId) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const count = await prisma.invoice.count({
    where: { companyId },
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
};


const calculateGST = (amount, gstRate = 18) => {
  const gstAmount = (amount * gstRate) / 100;
  return {
    amount,
    gstRate,
    gstAmount,
    totalAmount: amount + gstAmount,
  };
};


const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};


const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  const options = format === 'short' 
    ? { year: 'numeric', month: 'short', day: 'numeric' }
    : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return d.toLocaleDateString('en-IN', options);
};


const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip: Math.max(0, skip), take: Math.min(limit, 100) };
};


const buildFilter = (query, allowedFields) => {
  const filter = {};
  
  Object.keys(query).forEach(key => {
    if (allowedFields.includes(key) && query[key]) {
      filter[key] = query[key];
    }
  });
  
  return filter;
};


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  generateRandomString,
  generateInvoiceNumber,
  calculateGST,
  formatCurrency,
  formatDate,
  paginate,
  buildFilter,
  sleep,
};
