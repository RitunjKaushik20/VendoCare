
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { prisma } = require('../../config/database');
const config = require('../../config');

const options = {
  clientID: config.oauth.google.clientId,
  clientSecret: config.oauth.google.clientSecret,
  callbackURL: `${config.apiUrl}/api/auth/google/callback`,
  scope: ['email', 'profile'],
};

module.exports = new GoogleStrategy(options, async (accessToken, refreshToken, profile, done) => {
  try {
    const { email, name, picture } = profile._json;
    
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      
      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Google User',
          avatar: picture,
          password: null, 
          role: 'ADMIN',
          isActive: true,
        },
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
});
