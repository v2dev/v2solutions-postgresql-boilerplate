import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { StatusCode } from '../utils/constant';
import db from '../utils/db/connection';
import  sendEmail  from '../utils/email/sendEmail';

const User = db.users;

const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      where: { email },
    });
    
    console.log('User found:', user);
    if (!user) {
      return res
        .status(StatusCode.unauthorized)
        .json({ error: 'Invalid credentials' });
    }

    if (!user.password) {
      return res
        .status(StatusCode.internal_server)
        .json({ error: 'User password is undefined' });
    }

    const matchPassword = await bcrypt.compare(password, user.password);

    if (matchPassword) {
      res.json({
        message: 'Login successful',
        qrCodeUrl: user.qrCodeUrl,
      });
    } else {
      res.status(StatusCode.unauthorized).json({
        error: 'Invalid credentials',
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(StatusCode.internal_server).json({ error: 'Login failed' });
  }
};

const registerUser = async (req: Request, res: Response) => {
  try {
    console.log(User);
    const { name, email, password, country } = req.body;
    if (!email || !name || !password || !country) {
      return res.status(422).json({
        error: 'Please provide all the details to register a user',
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findOne({
      where: {
        email,
      },
    });
    console.log(user);
    if (user) {
      return res.status(422).json({ error: 'Email is already in use.' });
    }
    const mfaSecret = speakeasy.generateSecret({
      length: 20,
      name: 'employee-manager',
    });
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      country,
      mfaSecret: mfaSecret.base32,
      isVerified: false,
    });

    const qrCode = await QRCode.toDataURL(mfaSecret.otpauth_url || '');
    res.status(200).json({ newUser, qrCodeUrl: qrCode });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to create a new user' });
  }
};

const validateEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(StatusCode.unprocess)
        .json({ error: 'Verification is expired' });
    }
    const mfaSecret = speakeasy.generateSecret({
      length: 20,
      name: 'employee-manager',
    });
    user.isVerified = true;
    user.mfaSecret = mfaSecret.base32;
    const newUser = await user.save();
    console.log(newUser);
    const qrCode = await QRCode.toDataURL(mfaSecret.otpauth_url || '');

    res.status(StatusCode.success).json({ newUser, qrCodeUrl: qrCode });
  } catch (error) {
    res.status(StatusCode.internal_server).json({
      error: 'Failed to create a new user',
    });
  }
};

const mfaVerifyUser = async (req: Request, res: Response) => {
  try {
    const { email, mfaToken } = req.body;
    const user = await User.findOne({
      where: {
        email,
      },
    });

    console.log('User object from the database:', user);

    if (!user) {
      return res
        .status(StatusCode.unauthorized)
        .json({ error: 'Invalid credentials' });
    }

    const userMfaSecret = user.getDataValue('mfaSecret');
    console.log('User mfaSecret:', userMfaSecret);

    const token = speakeasy.totp({
      secret: userMfaSecret,
      encoding: 'base32',
    });

    console.log('Token generated:', token);
    console.log('Received mfaToken:', mfaToken);

    const verified = speakeasy.totp.verify({
      secret: userMfaSecret,
      encoding: 'base32',
      token: mfaToken,
    });

    console.log('Verification result:', verified);

    if (verified) {
      const jwtFToken = jwt.sign(
        { email: user.email },
        process.env.JWT_TOKEN!,
        {
          expiresIn: '2h',
        },
      );

      console.log('JWT Token generated:', jwtFToken);

      res.json({
        message: 'Verification successful',
        jwtToken: jwtFToken,
      });
    } else {
      res.status(StatusCode.unauthorized).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error during MFA verification:', error);
    res.status(StatusCode.internal_server).json({
      error: 'Verification failed',
    });
  }
};

const forgetUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      return res
        .status(StatusCode.unprocess)
        .json({ error: 'User not found' });
    }
    console.log('user', user);
    const resetToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    console.log('reset token', resetToken);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 5 * 60 * 1000);
    const token = uuidv4();
    console.log('resetPasswordToken', user.resetPasswordToken);
    console.log('resetPasswordExpires', user.resetPasswordExpires);
    
    const [updatedCount, updatedList] = await User.update({'resetPasswordToken':resetToken, 'resetPasswordExpires':user.resetPasswordExpires,'token':token }, {
      where: { email },
      returning: true,
    });
    console.log(updatedCount,updatedList);
    
    console.log('--- user after saved', user);
    const text = `You can use OTP to reset password :  <b>${resetToken}</b> or used link to reset password: <b>${process.env.BASE_URL}/reset-password/${token}</b>`;
    const params = {
      subject: 'Reset Password',
      text,
      email,
    };
    await sendEmail(params, res);
  } catch (error) {
    console.error('Error during forgot password:', error);
    res.status(StatusCode.internal_server).json({
      error: 'Forgot password failed',
    });
  }
};

const resetUser = async (req: Request, res: Response) => {
  try {
    let user:any | null;
    const { otp, password, confirmPassword, token } = req.body;
    console.log('Token', token);

    if (password !== confirmPassword) {
      return res
        .status(StatusCode.unprocess)
        .json({ error: 'Passwords do not match' });
    }
    if (token) {
      if (!password || !confirmPassword) {
        return res
          .status(StatusCode.unprocess)
          .json({ error: 'Please provide password' });
      }
      user = await User.findOne({
        where: {
          token,
        },
      });
      if (!user) {
        return res
          .status(StatusCode.unprocess)
          .json({ error: 'Invalid token' });
      }
      user = await User.findOne({
        where: {
          token,
        },
      });
      if (!user) {

        res.status(StatusCode.unprocess).json({ error: 'Invalid token' });
      }
    } else if (otp) {
      if (!otp || !password || !confirmPassword) {
        return res
          .status(StatusCode.bad_request)
          .json({ error: 'Please provide password' });
      }
      user = await User.findOne({
        where: {
          resetPasswordToken: otp,
        },
      });

      if (!user || user.resetPasswordExpires! < new Date()) {

        return res
          .status(StatusCode.unprocess)
          .json({ error: 'Invalid or expired OTP' });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    if (user) {
      user.password = hashedPassword;
    }
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.token = null;
    await user.save();

    res.status(StatusCode.success).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(StatusCode.internal_server).json({
      error: 'Failed to reset password',
    });
  }
};

const verifyGoogleToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  console.log(token);

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID!);

    if (!token) {
      return res.status(StatusCode.bad_request).json({
        error: 'Please provide token',
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    console.log(ticket);

    const userEmail = ticket.getPayload()?.email;

    if (!userEmail) {
      return res.status(StatusCode.unauthorized).json({
        success: false,
        error: 'Invalid or missing email in Google token payload',
      });
    }

    let user = await User.findOne({ where: { email: userEmail } });

    if (!user) {
      user = new User({
        name: '',
        email: userEmail,
        password: '', 
        country: '', 
        mfaSecret: '',
        isVerified: true,
      });
    
      await user.save();
    }

    const jwtFToken = jwt.sign({ email: userEmail }, process.env.JWT_TOKEN!, {
      expiresIn: '2h',
    });

    res.status(StatusCode.success).json({
      message: 'Verification successful',
      jwtToken: jwtFToken,
      success: true,
    });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(StatusCode.unauthorized).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

export {
  loginUser,
  registerUser,
  mfaVerifyUser,
  forgetUser,
  resetUser,
  validateEmail,
  verifyGoogleToken,
};

