import supabase from '../config/supabaseClient.js';
import { sendCrisisEmail } from '../utils/emailService.js';
import { createClient } from "@supabase/supabase-js";

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


// CREATE USER
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


// GET USERS
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


// SAVE MESSAGE
export const saveMessage = async (req, res, next) => {
    try {
        const { message, sender } = messageSchema.parse(req.body);
        const user_id = req.user.id;

        const supabaseUser = getUserClient(req);

        const { data, error } = await supabaseUser
            .from('conversations')
            .insert([{ user_id, message, sender }])
            .select();

        if (error) throw error;

        res.json({ message: "Message saved", data });

    } catch (err) {
        next(err);
    }
};


// GET CONVERSATION
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


// ADD MOOD
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


// GET MOOD
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


// ADD DIARY
export const addDiary = async (req, res, next) => {
    try {
        const { content } = diarySchema.parse(req.body);
        const user_id = req.user.id;

        const supabaseUser = getUserClient(req);

        const { data, error } = await supabaseUser
            .from('diary_entries')
            .insert([{ user_id, content }])
            .select();

        if (error) throw error;

        res.json({ message: "Diary saved", data });

    } catch (err) {
        next(err);
    }
};


// GET DIARY
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


// CRISIS ALERT
export const createCrisis = async (req, res, next) => {
    try {
        const { message_that_triggered, alert_sent_to } = crisisSchema.parse(req.body);
        const user_id = req.user.id;

        const supabaseUser = getUserClient(req);

        const { data, error } = await supabaseUser
            .from('crisis_alerts')
            .insert([{
                user_id,
                message_that_triggered,
                alert_sent_to
            }])
            .select();

        if (error) throw error;

        try {
            await sendCrisisEmail(alert_sent_to, message_that_triggered);
        } catch (emailErr) {
            console.log("Email failed:", emailErr.message);
        }

        res.json({
            message: "Crisis alert saved + email attempted",
            data
        });

    } catch (err) {
        next(err);
    }
};