const cron = require('node-cron');
const moment = require('moment');
const RefreshToken = require('../models/refreshTokenModel'); 


cron.schedule('0 0 * * *', async () => {  
  console.log('Running cron job to check expired refresh tokens...');

  try {
    const currentDate = moment();  


    const expiredTokens = await RefreshToken.find({
      isRevoked: false,
      expiresAt: { $lt: currentDate.toDate() }, 
    });

  
    for (let token of expiredTokens) {
      token.isRevoked = true;  
      await token.save();  
      console.log(`Token for user ${token.userId} has been revoked.`);
    }

  } catch (err) {
    console.error('Error checking expired tokens:', err);
  }
});
