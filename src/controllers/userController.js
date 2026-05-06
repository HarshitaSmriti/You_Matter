import supabase from '../config/supabaseClient.js';
import { sendCrisisEmail } from '../utils/emailService.js';
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

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



// ================= CREATE USER =================
export const createUser = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { name } = req.body;

    const supabaseUser = getUserClient(req);

    const { data, error } = await supabaseUser
      .from('users')
      .insert([{ user_id, name }])
      .select();

    if (error) throw error;

    res.json({ message: "Profile created", data });

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
export const saveMessage = async (req, res, next) => {
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

    const { data, error } = await supabaseUser
      .from("crisis_alerts")
      .insert([
        {
          user_id,
          message_that_triggered,
          alert_sent_to,
        },
      ])
      .select();

    if (error) throw error;

    const { data: userData } = await supabaseUser
      .from("users")
      .select("name")
      .eq("user_id", user_id)
      .single();

    try {
      await sendCrisisEmail(
        "yoursecondemail@gmail.com",
        userData?.name || "A user",
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