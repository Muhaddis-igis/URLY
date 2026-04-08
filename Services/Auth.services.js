import { db } from "../Config/db.js";
import { users, sessions } from "../Drizzle/schema.js";
import { eq } from "drizzle-orm";
import jwt from 'jsonwebtoken'
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../Config/constants.js";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

export const saveUser = async (name, email, password) => {
  try {
    const result = await db.insert(users).values({ name, email, password }).$returningId();
    return result;
  } catch (error) {
    // console.error("Error saving user:", error);
    throw error;
  }
};

export const markEmailAsVerified = async (userId) => {
  try {
    await db.update(users).set({ isEmailValid: 1 }).where(eq(users.id, userId));
  } catch (error) {
    throw error;
  }
};
export const existsUser = async (email) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  } catch (error) {
    // console.error("Error checking user existence:", error);
    throw error;
  }
};

// export const generateToken = ({userId, email}) => {
//   return jwt.sign({userId, email}, process.env.JWT_SECRET, {expiresIn: '11m'})
// }
export const createSession = async (user, {userAgent, ipAddress}) => {
  try {
    const result = await db.insert(sessions).values({ userId: user, userAgent, ipAddress }).$returningId();
    return result;
  } catch (error) {
    // console.error("Error creating session:", error);
    throw error;
  }
}

export const generateAccessToken = ({userId, email, sessionId,isValidEmail}) => {
  return jwt.sign(
    {userId, email, sessionId, isValidEmail}, 
    ACCESS_TOKEN_SECRET, 
    {expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY / 1000)}
  )
}

export const generateRefreshToken = (sessionId) => {
  return jwt.sign(
    {sessionId}, 
    REFRESH_TOKEN_SECRET, 
    {expiresIn: Math.floor(REFRESH_TOKEN_EXPIRY / 1000)}
  )
}

export const issueAuthTokensForUser = async (user, { userAgent, ipAddress }) => {
  const session = await createSession(user.id, {
    userAgent: userAgent || "",
    ipAddress: ipAddress || "",
  });
  const sessionId = session[0].id;

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    sessionId,
    isValidEmail: user.isEmailValid
  });
  const refreshToken = generateRefreshToken(sessionId);

  return { sessionId, accessToken, refreshToken };
};

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('Access_token', accessToken, {
    maxAge: ACCESS_TOKEN_EXPIRY,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });

  res.cookie('Refresh_token', refreshToken, {
    maxAge: REFRESH_TOKEN_EXPIRY,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
};
export const getSessionById = async (sessionId) => {
  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    return session; // âœ… correct
  } catch (error) {
    // console.error("Error fetching session:", error);
    throw error;
  }
};

export const getUserWithSessionBySessionId = async (sessionId) => {
  try {
    const [row] = await db
      .select({
        sessionId: sessions.id,
        userId: users.id,
        email: users.email,
        isEmailValid: users.isEmailValid,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      ...row,
      isEmailValid: Boolean(row.isEmailValid),
    };
  } catch (error) {
    throw error;
  }
};

export const findByUserId = async (userId) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    // console.log("User fetched by ID:", user);
    user.isEmailValid = user.isEmailValid===0?false:true
    // console.log("User with isEmailValid as boolean:", user);
    return user; // âœ… correct
  } catch (error) {
    // console.error("Error fetching user by ID:", error);
    throw error;
  }
};
export const deleteSession = async (sessionId) => {
  try {
    await db.delete(sessions).where(eq(sessions.id, sessionId));  
  } catch (error) {
    // console.error("Error deleting session:", error);
    throw error;
  }
};


export const invalidateSession = async (sessionId) => {
  try {
    await db.update(sessions).set({ valid: false }).where(eq(sessions.id, sessionId));
  } catch (error) {
    // console.error("Error invalidating session:", error);
    throw error;
  }
};
export const AcessDashboard = async (req, res) => {
  
}

export const verifytoken = (token, tokenType = 'access') => {
  const secret = tokenType === 'refresh' ? REFRESH_TOKEN_SECRET : ACCESS_TOKEN_SECRET;
  return jwt.verify(token, secret)
}
