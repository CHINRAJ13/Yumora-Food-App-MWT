import jwt from 'jsonwebtoken';

export const signToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

export const createSendToken = (user, statusCode, res, type = 'customer') => {
  const token = signToken(user._id, type);
  
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true, 
    sameSite: 'none'
  };

  res.cookie('jwt', token, cookieOptions);

  const userData = user.toObject ? user.toObject() : { ...user };
  userData.password = undefined;
  userData.type = type;
  
  if (userData.email && userData.email.startsWith('user_') && userData.email.includes('@yumora.com')) {
    userData.email = "";
  }

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userData
    }
  });
};
