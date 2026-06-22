import jwt from 'jsonwebtoken';

export const signToken = (id, roles) => {
  return jwt.sign({ id, roles }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

export const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.roles);
  
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true, // Always true for cross-site cookies on HTTPS
    sameSite: 'none'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
