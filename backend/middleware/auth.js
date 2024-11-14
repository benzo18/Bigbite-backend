import jwt from "jsonwebtoken"

const authMiddleware = (req, res, next) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);   


      // Instead of nesting, set userId directly:
      req.userData = { userId: decodedToken.userId }; 

      next();
    } else {
      throw new Error("Authorization header missing or invalid");
    }
  } catch (error) {
    // Your existing error handling 
  }
};

export default authMiddleware;