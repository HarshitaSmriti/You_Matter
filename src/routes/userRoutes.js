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
  createCrisis,
  deleteDiary,
  updateDiary,
  uploadMedicalReport
} from '../controllers/userController.js';

import { verifyUser } from '../middleware/authMiddleware.js';
import { strictLimiter } from "../middleware/rateLimiter.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ================= USERS =================
router.post('/users', verifyUser, createUser);
router.get('/users', verifyUser, getUsers);

// ================= CHAT =================
router.post('/message', verifyUser, saveMessage);
router.get('/conversation', verifyUser, getConversation);

// ================= MOOD =================
router.post('/mood', verifyUser, addMood);
router.get('/mood', verifyUser, getMood);

// ================= DIARY =================
router.post('/diary', verifyUser, addDiary);
router.get('/diary', verifyUser, getDiary);
router.delete('/diary/:id', verifyUser, deleteDiary);
router.patch('/diary/:id', verifyUser, updateDiary);

// ================= CRISIS =================
router.post('/crisis', verifyUser, strictLimiter, createCrisis);

// ================= MEDICAL REPORT =================
router.post(
  '/upload-report',
  verifyUser,
  upload.single('report'),
  uploadMedicalReport
);

export default router;