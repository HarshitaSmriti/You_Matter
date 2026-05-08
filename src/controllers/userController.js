import supabase from '../config/supabaseClient.js';
import { sendCrisisEmail } from '../utils/emailService.js';
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { crisisFallbackReply, detectCrisis } from "../utils/crisisDetector.js";

import { moodSchema } from "../validators/moodValidator.js";
import { diarySchema } from "../validators/diaryValidator.js";
import { messageSchema } from "../validators/messageValidator.js";
import { crisisSchema } from "../validators/crisisValidator.js";

// helper → create per-request supabase client with user token
const getUserClient = (req) => {
  const token = req.headers.authorization?.split(" ")[1];

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
};

//  NEW: normalize mood (CRITICAL FIX)
const normalizeMood = (mood) => {
  if (!mood) return undefined;
  const valid = ["happy", "sad", "angry", "anxious", "neutral"];
  const m = mood.toLowerCase().trim();
  return valid.includes(m) ? m : undefined;
};

const demoGuardianEmails = [
  "aishwaryashree15@gmail.com",
  "harshitasmriti@gmail.com",
];

const crisisEmailEnabled = process.env.ENABLE_CRISIS_EMAIL === "true";

const getGuardianEmail = (userData, fallbackEmail) =>
  userData?.guardian_email ||
  userData?.guardian_contact ||
  fallbackEmail ||
  demoGuardianEmails;

const getUserProfile = async (supabaseUser, user_id) => {
  const { data, error } = await supabaseUser
    .from("users")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (error) {
    console.log("User profile lookup failed:", error.message);
    return null;
  }

  return data;
};

const saveCrisisAlert = async (
  supabaseUser,
  user_id,
  message_that_triggered,
  alert_sent_to
) => {
  if (!alert_sent_to) return null;

  const alertSentToValue = Array.isArray(alert_sent_to)
    ? alert_sent_to.join(", ")
    : alert_sent_to;

  const { data, error } = await supabaseUser
    .from("crisis_alerts")
    .insert([
      {
        user_id,
        message_that_triggered,
        alert_sent_to: alertSentToValue,
      },
    ])
    .select();

  if (error) throw error;

  return data;
};

const notifyGuardian = async (guardianEmail, userName, message) => {
  if (!guardianEmail) return false;

  await sendCrisisEmail(
    guardianEmail,
    userName || "A user",
    message
  );

  return true;
};

const getDisplayName = (userData, authUser) =>
  userData?.name ||
  authUser?.user_metadata?.full_name ||
  authUser?.user_metadata?.name ||
  authUser?.email ||
  "User";

const getAiReply = async (user_id, message, userData, authUser) => {
  try {
    const aiUrl = process.env.AI_CHAT_URL || "http://107.21.23.105:8000/chat";
    const userName = getDisplayName(userData, authUser);
    const primaryGuardianEmail = demoGuardianEmails[0];
    const aiPayload = {
      user_id,
      message,
      consent: {
        user_name: userName,
        guardian_name: userName,
        guardian_email: primaryGuardianEmail,
        guardian_emails: demoGuardianEmails,
      },
    };

    console.log("AI request:", {
      url: aiUrl,
      payload: {
        ...aiPayload,
        consent: {
          ...aiPayload.consent,
          guardian_email: aiPayload.consent.guardian_email,
        },
      },
    });

    let aiResponse;

    try {
      aiResponse = await axios.post(
        aiUrl,
        aiPayload,
        { timeout: 15000 }
      );
    } catch (firstError) {
      console.log("AI consent request failed:", {
        message: firstError.message,
        status: firstError.response?.status,
        data: firstError.response?.data,
      });

      aiResponse = await axios.post(
        aiUrl,
        { user_id, message },
        { timeout: 15000 }
      );
    }

    console.log("AI response:", {
      status: aiResponse.status,
      keys: Object.keys(aiResponse.data || {}),
    });

    return {
      ok: true,
      reply:
        aiResponse.data?.reply ||
        aiResponse.data?.response ||
        aiResponse.data?.output ||
        aiResponse.data?.text ||
        "I'm here with you.",
    };
  } catch (error) {
    console.log("AI chat failed:", error.message);

    return {
      ok: false,
      reply:
        "I'm here with you. I could not reach the AI service right now, but your message was saved.",
    };
  }
};



// ================= CREATE USER =================
export const createUser = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const {
      userName,
      userEmail,
      guardianEmail,
    } = req.body;

    const supabaseUser = getUserClient(req);

    const { data, error } = await supabaseUser
      .from("users")
      .insert([
        {
          user_id,
          name: userName,
          email: userEmail,
          guardian_contact: guardianEmail,
        },
      ])
      .select();

    if (error) throw error;

    res.json({
      message: "Profile created",
      data,
    });

  } catch (err) {
    next(err);
  }
};



// ================= GET USERS =================
export const getUsers = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const supabaseUser = getUserClient(req);

    const { data, error } = await supabaseUser
      .from('users')
      .select('*')
      .eq('user_id', user_id);

    if (error) throw error;

    res.json({ message: "Users fetched", data });

  } catch (err) {
    next(err);
  }
};




// ================= SAVE MESSAGE =================
const legacySaveMessage = async (req, res, next) => {
  try {
    const { message } = messageSchema.parse(req.body);
    const user_id = req.user.id;

    const supabaseUser = getUserClient(req);

    const aiResponse = await axios.post(
      "http://107.21.23.105:8000/chat",
      { user_id, message },
      { timeout: 10000 }
    );

    const reply =
      aiResponse.data?.reply ||
      aiResponse.data?.response ||
      aiResponse.data?.output ||
      aiResponse.data?.text ||
      "I'm here with you 💜";

    const { error: insertError } = await supabaseUser
      .from("conversations")
      .insert([
        { user_id, message, sender: "user" },
        { user_id, message: reply, sender: "ai" },
      ]);

    if (insertError) throw insertError;

    res.json({ reply });

  } catch (err) {
    console.error("SAVE MESSAGE ERROR:", err.message);
    next(err);
  }
};

export const saveMessage = async (req, res, next) => {
  try {
    const { message } = messageSchema.parse(req.body);
    const user_id = req.user.id;

    const supabaseUser = getUserClient(req);
    const crisisDetection = detectCrisis(message);
    const alertSentTo = crisisDetection.isCrisis && crisisEmailEnabled
      ? demoGuardianEmails
      : null;
    const userData = req.isDemoUser
      ? null
      : await getUserProfile(supabaseUser, user_id);

    const aiResult = await getAiReply(user_id, message, userData, req.user);

    if (crisisDetection.isCrisis && !aiResult.ok) {
      aiResult.reply = crisisFallbackReply;
    }

    if (!req.isDemoUser) {
      const { error: insertError } = await supabaseUser
        .from("conversations")
        .insert([
          { user_id, message, sender: "user" },
          { user_id, message: aiResult.reply, sender: "ai" },
        ]);

      if (insertError) throw insertError;
    }

    res.json({
      reply: aiResult.reply,
      ai_available: aiResult.ok,
      crisis: {
        detected: crisisDetection.isCrisis,
        language: crisisDetection.language,
        matched_text: crisisDetection.matchedText,
        alert_queued: crisisDetection.isCrisis && crisisEmailEnabled,
        alert_sent_to: alertSentTo,
      },
    });

    if (crisisDetection.isCrisis && crisisEmailEnabled) {
      Promise.resolve().then(async () => {
        try {
          const guardianEmail = demoGuardianEmails;

          console.log("Sending demo crisis email to:", guardianEmail);
          await notifyGuardian(
            guardianEmail,
            userData?.name,
            message
          );

          console.log("Saving demo crisis alert");
          await saveCrisisAlert(
            supabaseUser,
            user_id,
            message,
            guardianEmail
          );
        } catch (crisisErr) {
          console.log("Automatic crisis alert failed:", crisisErr.message);
        }
      });
    }

  } catch (err) {
    console.error("SAVE MESSAGE ERROR:", err.message);
    next(err);
  }
};



// ================= GET CONVERSATION =================
export const getConversation = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const supabaseUser = getUserClient(req);

    const { data, error } = await supabaseUser
      .from('conversations')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ message: "Conversation fetched", data });

  } catch (err) {
    next(err);
  }
};



// ================= ADD MOOD =================
export const addMood = async (req, res, next) => {
  try {
    const { mood_score, mood_label, note } = moodSchema.parse(req.body);
    const user_id = req.user.id;

    const supabaseUser = getUserClient(req);

    const { data, error } = await supabaseUser
      .from('mood_logs')
      .insert([{ user_id, mood_score, mood_label, note }])
      .select();

    if (error) throw error;

    res.json({ message: "Mood logged", data });

  } catch (err) {
    next(err);
  }
};



// ================= GET MOOD =================
export const getMood = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const supabaseUser = getUserClient(req);

    const { data, error } = await supabaseUser
      .from('mood_logs')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ message: "Mood history", data });

  } catch (err) {
    next(err);
  }
};



// ================= ADD DIARY =================
export const addDiary = async (req, res, next) => {
  try {
    const { title, content, mood } = diarySchema.parse(req.body);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user_id = req.user.id;
    const supabaseUser = getUserClient(req);

    const { data, error } = await supabaseUser
      .from("diary_entries")
      .insert([
        {
          user_id,
          title,
          content,
          mood: normalizeMood(mood), // FIX
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({
        message: "Supabase insert failed",
        error: error.message,
      });
    }

    res.status(200).json({
      message: "Diary saved",
      data,
    });

  } catch (err) {
    console.error("ADD DIARY ERROR:", err.message);
    next(err);
  }
};



// ================= GET DIARY =================
export const getDiary = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const supabaseUser = getUserClient(req);

    const { data, error } = await supabaseUser
      .from('diary_entries')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ message: "Diary entries", data });

  } catch (err) {
    next(err);
  }
};



// ================= DELETE DIARY =================
export const deleteDiary = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const supabaseUser = getUserClient(req);

    const { error } = await supabaseUser
      .from('diary_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) throw error;

    res.json({ message: "Diary deleted" });

  } catch (err) {
    next(err);
  }
};



// ================= UPDATE DIARY =================
export const updateDiary = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    const { title, content, mood } = req.body;

    const supabaseUser = getUserClient(req);

    const { data, error } = await supabaseUser
      .from('diary_entries')
      .update({
        title,
        content,
        mood: normalizeMood(mood), // FIX
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select();

    if (error) throw error;

    res.json({ message: "Diary updated", data });

  } catch (err) {
    next(err);
  }
};



// ================= CRISIS ALERT =================
export const createCrisis = async (req, res, next) => {
  try {
    const { message_that_triggered, alert_sent_to } =
      crisisSchema.parse(req.body);

    const user_id = req.user.id;

    const supabaseUser = getUserClient(req);

    const data = await saveCrisisAlert(
      supabaseUser,
      user_id,
      message_that_triggered,
      alert_sent_to
    );

    try {
      const userData = await getUserProfile(supabaseUser, user_id);
      await notifyGuardian(
        getGuardianEmail(userData, alert_sent_to),
        userData?.name,
        message_that_triggered
      );

      console.log("Crisis email sent successfully");

    } catch (emailErr) {
      console.log("Email failed:", emailErr.message);
    }

    res.json({
      message: "Crisis alert saved + email attempted",
      data,
    });

  } catch (err) {
    next(err);
  }
};

//------------------FORGET PASSWORD =================
export const forgotPassword = async (
  req,
  res,
  next
) => {
  try {
    const { email } = req.body;

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            "http://localhost:5173/reset-password",
        }
      );

    if (error) throw error;

    res.json({
      message:
        "Password reset email sent successfully",
    });

  } catch (err) {
    next(err);
  }
};

//------------------ UPLOAD MEDICAL REPORT =================
export const uploadMedicalReport = async (req, res, next) => {
  try {
    const file = req.file;
    const user_id = req.user.id;

    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const fileName = `${user_id}-${Date.now()}-${file.originalname}`;

    const { data, error } = await supabase.storage
      .from("medical-reports")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from("medical-reports")
      .getPublicUrl(fileName);

    res.json({
      message: "Medical report uploaded successfully",
      url: publicUrl.publicUrl,
    });

  } catch (err) {
    console.log("UPLOAD ERROR:", err.message);
    next(err);
  }
};
