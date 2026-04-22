import supabase from "../config/supabaseClient.js";

export const verifyUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token" });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    req.user = data.user; //  THIS IS CRITICAL

    next();
  } catch (err) {
    console.log("AUTH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};