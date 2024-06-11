import React, { useState } from 'react';
import axios from 'axios';
import {Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { backend } from '../../config.js'; 
import   './Update.css'    // Assuming you have a backend configuration file
import Typewriter from "typewriter-effect";
export const Update = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const response = await axios.put(`${backend}/forgot-password`, {
                email,
                password,
            });
            toast.success(response.data.message);
            navigate('/login'); 
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error("Error updating password. Please try again.");
        }
    };

    return (
        <div className="page">

            <div>
            <h1 className="typewriter-title">
            <Typewriter
          options={{
            strings: ["Update Password"],
            autoStart: true,
            loop: true,
          }}
            />
        </h1>
        </div>
        
            <div className='form-outer-div'>
            <form  className="regd-form1" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email:</label>
                    <input type="email" value={email} placeholder='Enter Your Email' onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>New Password:</label>
                    <input type="password" value={password} placeholder='Enter new password' onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Confirm Password:</label>
                    <input type="password" value={confirmPassword} placeholder='Confirm Password' onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <div className='submit'>
                <button  type="submit">Update Password</button>
                <Link to='/login' className="underlineu">
                    <button className='btn4'>Back</button>
                    </Link>
                </div>
            </form>
            </div>
        </div>
    );
};     