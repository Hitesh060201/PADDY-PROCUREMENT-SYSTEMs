import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Typewriter from "typewriter-effect";
import { backend } from "../../config.js";
import { TrackingContext } from "../../Context/TrackingContext.js";
import "./Login.css";
export const Login = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const { setName, setUser } = useContext(TrackingContext);
  const token = sessionStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailOrPhone || !password || !role) {
      toast.success("All Fields Are Required!");
    } else {
      try {
        // Send login credentials to backend
        const response = await axios.post(`${backend}/login`, {
          role,
          emailOrPhone,
          password,
        });
        sessionStorage.setItem("token", response.data.accessToken);
        setName("LogOut");
        setUser(response.data.user); // Set user details in context
        navigate(`/read/${role}`); // Redirect to role-specific route
      } catch (error) {
        toast.success(error.message);
        //console.error('Error logging in:', error);
      }
    }
  };

  useEffect(() => {
    const userFromStorage = JSON.parse(sessionStorage.getItem("user"));
    if (token && userFromStorage && userFromStorage.role) {
      navigate(`/read/${userFromStorage.role}`);
    }
    // eslint-disable-next-line
  }, [token, navigate]);

  return (
    <div className="page">
      <h1 className="typewriter-title">
        <Typewriter
          options={{
            strings: [" Login to the System"],
            autoStart: true,
            loop: true,
          }}
        />
      </h1>

      {/* <div className='form-outer-div'></div> */}
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-in-div">
        <div className="select-role">
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select Role</option>
            <option value="fci">FCI</option>
            <option value="farmer">Farmer</option>
            <option value="miller">Miller</option>
          </select>
        </div>
        <div className="input-field">
          <label>Email/Phone:</label>
          <input
            type="text"
            name="Email/Phone"
            placeholder="Enter Email/Phone"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
          />
        </div>
        <div className="input-field">
          <label>Password:</label>
          <input
            type="password"
            name="Password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        </div>

        <div>
          <div className="buttons">
          <button className="butnlogin" type="submit">
            Login
          </button>
          <Link to="/" className="underline">
            <button className="butnlogin"> Back </button>
          </Link>
          </div>
          <div className="forgot-password">
            <Link to="/forgot-password" className="underline">
              <button className="forgot">Forgot password?</button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};