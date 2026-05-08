import supabase from "../config/supabaseClient.js";

export const verifyUser = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    console.log("AUTH HEADER:", authHeader);

    if (!authHeader) {
      return res.status(401).json({
        error: "No token",
      });
    }

    const token =
      authHeader.split(" ")[1];

    console.log(
      "TOKEN EXISTS:",
      !!token
    );

    const { data, error } =
      await supabase.auth.getUser(token);

    console.log("SUPABASE USER:", data);
    console.log("SUPABASE ERROR:", error);

    if (error || !data.user) {
      return res.status(401).json({
        error:
          error?.message || "Unauthorized",
      });
    }

    req.user = data.user;

    next();
  } catch (err) {
    console.log(
      "AUTH ERROR:",
      err.message
    );

    res.status(500).json({
      error: err.message,
    });
  }
};

export const optionalVerifyUser = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      req.isDemoUser = true;
      req.user = {
        id: "demo-user",
        email: null,
        user_metadata: {},
      };
      return next();
    }

    const token =
      authHeader.split(" ")[1];

    const { data, error } =
      await supabase.auth.getUser(token);

    if (error || !data.user) {
      req.isDemoUser = true;
      req.user = {
        id: "demo-user",
        email: null,
        user_metadata: {},
      };
      return next();
    }

    req.user = data.user;
    req.isDemoUser = false;

    next();
  } catch (err) {
    req.isDemoUser = true;
    req.user = {
      id: "demo-user",
      email: null,
      user_metadata: {},
    };
    next();
  }
};
