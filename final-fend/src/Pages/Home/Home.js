import React from "react";
import { Link } from "react-router-dom";
import "./Home.css"
import Homeimg from "../../images/dashboard.png"
import Typewriter from 'typewriter-effect';
export const Home = () => {
  return (

    <div className='home'>
    <div className='left'>
      <img src={Homeimg} alt="PaddyProcurement" />
    </div>
    <div className='right'>
    <div className="buttn">
      <Link to='/register'>
        <button className="btn1">Register</button>
      </Link>
      <Link to='/login'>
        <button className="btn2">Login</button>
      </Link>
      </div>
      <h1>
      <Typewriter
       options={{
        strings: ['Welcome To Paddy Procurement System'],
        autoStart: true,
        loop: true,
      }}/>
      </h1>
     
    </div>
    
    </div>
  
  );
};
