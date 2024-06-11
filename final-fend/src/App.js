import React from 'react'
import "./App.css";
import { TrackingProvider } from './Context/TrackingContext.js';
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import {ProtectedRoute} from './ProtectedRoute.js';
import { Home, Register, Login, Notfound, FarmerDashboard,FciDashboard,MillerDashboard,Update } from './Pages/index.js';

export const App = () => {

  return (
  <Router>
    <ToastContainer
        closeButton={true}
        autoClose={5000}
        position="bottom-left"
        />
    <div className='App'>
    <TrackingProvider>
     <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/register' element={<Register/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/read/farmer' element={<ProtectedRoute> <FarmerDashboard/> </ProtectedRoute>}/>
      <Route path='/read/miller' element={<ProtectedRoute> <MillerDashboard/> </ProtectedRoute>}/>
      <Route path='/read/fci' element={<ProtectedRoute> <FciDashboard/> </ProtectedRoute>}/>
      <Route path='/forgot-password' element={<Update/>}/>
      <Route path='*' element={<Notfound/>}/>
     </Routes>
  </TrackingProvider>
    </div>
  </Router>
  )
}
