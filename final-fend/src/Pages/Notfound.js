import React from 'react';
import  NotFound from '../images/404.jpg';
import { Link } from 'react-router-dom';

export const Notfound = () => {
  return (
    <div>
      <div className='notfound-img'>
        <img src={NotFound} alt="NotFound" />
      </div>
      <div className='notfound-button'>
        <Link to='/' className='underline'>
        <button className="btn3">Go to Home</button>
      </Link>
      </div>
    </div>
  )
}
