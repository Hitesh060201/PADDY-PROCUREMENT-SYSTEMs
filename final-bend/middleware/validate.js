import jwt from "jsonwebtoken";

export const validateToken=async(req,res,next)=>{
    let token;
    let authHeader=req.headers.Authorization || req.headers.authorization;
    if(authHeader && authHeader.startsWith("Bearer"))
    {
        token=authHeader.split(" ")[1];
        jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decode)=>{
            if(err)
            res.status(401).json({message:"Unauthorized Access Token"})
        else
            {
                req.user=decode.user;
                next();
            }
        })
    }
        else
          res.status(401).json({message:"No Authorization Token Found"})
}