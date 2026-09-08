import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reject anything that isn't a short-lived access token — in
    // particular, guards against a refresh token (or any other JWT
    // signed with the same secret) being replayed as an access token.
    if (decoded.type !== "access") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export default auth;