import { User } from '../model/userModel.js';
import jwt from "jsonwebtoken"

export const registerUser = async (req, res) => {
  const { name, phone, email, password, address, role, maxStorageCapacity } = req.body;
  try {
    // Check if there's already an FCI user in the database
    if (role === "fci") {
      const fciUser = await User.findOne({ role: "fci" });
      if (fciUser) {
        return res.status(400).json({ message: "FCI user already exists" });
      }
    }

    const result = await User.findOne({
      $and: [
        { email: email }, 
        { phone: phone }, 
        { address: address }
      ]
    });    

    if(result)
    res.status(200).json({message:"User Already Exists, Try Login"});
    else{
      const newUser={
        name,
        phone,
        email,
        password,
        address,
        role,
    };

    if (role === "miller") {
      if (!maxStorageCapacity) {
        return res.status(400).json({ message: "Max storage capacity is required for Miller" });
      }
      newUser.maxStorageCapacity = maxStorageCapacity;
    }

    const createUser = await User.create(newUser);
    await createUser.save();
    res.status(201).json({ message: 'User registered successfully' , user: createUser});
  }  
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const loginUser = async (req, res) => {
  const { role, emailOrPhone, password } = req.body;
  if(!role || !emailOrPhone || !password)
  res.status(404).json({message:"Role, Email/Phone Number and Password are Compulsory"})
  else
  {
    try {
      let user;
      const isPhoneNumber=/^\d{10}$/.test(emailOrPhone);
    if (isPhoneNumber) {
      user = await User.findOne({ phone: emailOrPhone,role: role });
    } else {
      user = await User.findOne({ email: emailOrPhone ,role: role});
    }
  if(user && password===user.password)
  {
      const accessToken=jwt.sign(
          //payload
          {
          user:{
              id:user._id,
              name:user.name,
              phone: user.phone,
              email:user.email,
              password:user.password,
              address:user.address,
              role:user.role,
              maxStorageCapacity: user.maxStorageCapacity,
          }
      },
      //secretKey
      process.env.ACCESS_TOKEN_SECRET,
      //options
      {
          expiresIn: "1h"
      }
      );
      res.status(200).json({
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
          role: user.role,
          maxStorageCapacity: user.maxStorageCapacity
        }
      })
  }
  else
      res.status(404).json({message:"Invalid credentials!"})
    } catch (error) {
      console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getFarmers = async (req, res) => {
  try {
    const farmers = await User.find({role: 'farmer'});
    if(farmers.length!=0)
    res.status(200).json(farmers);
    else
    res.status(404).json({message:"No record found"});
  } catch (error) {
    console.error('Error fetching farmers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMillers = async (req, res) => {
  try {
    const millers = await User.find({role: 'miller'});
    if(millers.length!=0)
    res.status(200).json(millers);
    else
    res.status(404).json({message:"No record found"});
  } catch (error) {
    console.error('Error fetching millers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserDetails = async (req, res) => {
  const {userAddress} = req.params;

  try {
    const user = await User.findOne({ address: userAddress });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userDetails = {
      name: user.name,
      address: user.address
    };

    res.status(200).json(userDetails);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const updatePassword = async (req, res) => {
  const { email, password } = req.body;
    
  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }
      //const hashedPassword = await bcrypt.hash(password, 10);
      user.password = password;
      await user.save();
      res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ message: "Internal server error" });
  }
}
