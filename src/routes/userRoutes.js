import express from 'express';
import {
  createUser,
  getUsers,
  saveMessage,
  getConversation,
  addMood,
  getMood,
  addDiary,
  getDiary,
  createCrisis
} from '../controllers/userController.js';

import { verifyUser } from '../middleware/authMiddleware.js';
import { strictLimiter } from "../middleware/rateLimiter.js";
const router = express.Router();

// public
router.post('/users', createUser);
router.get('/users', getUsers);

// protected
router.post('/message', verifyUser, saveMessage);
router.get('/conversation', verifyUser, getConversation);

router.post('/mood', verifyUser, addMood);
router.get('/mood', verifyUser, getMood);

router.post('/diary', verifyUser, addDiary);
router.get('/diary', verifyUser, getDiary);

router.post('/crisis', verifyUser, strictLimiter, createCrisis);

export default router;