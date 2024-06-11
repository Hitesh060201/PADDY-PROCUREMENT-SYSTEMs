import React, { useState } from 'react';
import { Link } from "react-router-dom"
import { ethers } from 'ethers';
import tracking from '../../Test.json';
import axios from 'axios';
import { toast } from "react-toastify";
import './Register.css'
import Typewriter from "typewriter-effect"
import { backend } from '../../config.js';
export const Register = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [address, setAddress] = useState('');
    const [role, setRole] = useState('');
    const [max,setMax] = useState(0);
    const [message,setMessage]=useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
      const signer = provider.getSigner();
      setSigner(signer);
      const address = await signer.getAddress();
      setAddress(address);
    } else {
      alert('Please install MetaMask');
    }
  };

  const time=(ms)=>{
    setInterval(()=>{
      setMessage("");
    },ms)
  }

   const handleSubmit = async (e) => {
    e.preventDefault();

    if (!signer) {
        alert('Please connect your wallet');
        return;
    }
    try {
      if (!name || !phone || !email || !password || !address || !role) {
        toast.error('All fields are required!');
        setMessage("All Fields Are Required!")
        time(3000)
    } else {
        if (role === "") {
            setMessage("Please select a role");
            time(3000);
            return;
        }

        let postData = {
            name,
            phone,
            email,
            password,
            address,
            role
        };

        // Include maxStorageCapacity field if role is "miller"
        if (role === "miller") {
            postData.maxStorageCapacity = max;
        }

        const response = await axios.post(`${backend}/register`, postData);
        console.log(response.data);
        setMessage(response.data.message);
        setName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setRole('');
        setAddress('');
        setMax('');
    }
        // Only proceed to save in the database if registration on blockchain is successful
        try {
          // Registering on Blockchain
        const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with the deployed contract address
        const contractABI = tracking.abi; // Replace with the contract ABI
        const contract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer);

        setContract(contract);
        console.log(contract);

        if (role === 'fci') {
            await contract.registerFCIAddress(address, {
                gasLimit: 3000000,
            });
            console.log("registered fci");

        } else if (role === 'farmer') {
            await contract.registerAsFarmer(address, {
                gasLimit: 3000000,
            });
            console.log("registered farmer");

        } else if (role === 'miller') {
            const maxInteger = parseInt(max);
            await contract.registerAsMiller(address, maxInteger, {
                gasLimit: 3000000,
            });
            console.log("registered miller");
        }
        toast.success("User Registered Successfully.")

        } catch (error) {
            setMessage('Error registering user:',error.response.data.message)
            toast.error(error.response.data.message)
            time(3000)
        }
        
    } catch (error) {
        // console.error('Error registering user:', error);
        toast.error('Could not register user!')
    }
};


  return (
    <div className='page'>
      <div>
      <h1 className='typewriter-title'>
      <Typewriter
       options={{
        strings: [' Blockchain User Registration'],
        autoStart: true,
        loop: true,
      }}/>
      </h1>
      </div>
      
      <div className='connect-wallet'>
      <button onClick={connectWallet}>Connect Wallet</button>
      <br />
      <label>
        Address: {address}
      </label>
      </div>
      <br />
     
      <form className="form" onSubmit={handleSubmit}>
      <div className='select-role'>
      <label>Role:</label>
      <select onChange={(e) => setRole(e.target.value)}>
        <option value="">Select Role</option>
        <option value="fci">FCI</option>
        <option value="farmer">FARMER</option>
        <option value="miller">MILLER</option>
      </select>
      </div>
      <div className='input-field'>
        <label>Name:</label>
        <input className='inputfield' type="text" name="Name" placeholder=' Enter Your Name' value={name} onChange={(e) => setName(e.target.value)} />
    </div>
    <div className='input-field'>
        <label>Phone:</label>
        <input    type="text" name='Phone' placeholder=' Enter Your PhoneNO.' value={phone} onChange={(e) => setPhone(e.target.value)} />
    </div>
    <div className='input-field'>
        <label>Email:</label>
        <input    type="email" name='Email' placeholder=' Enter Your Email' value={email} onChange={(e) => setEmail(e.target.value)} />
    </div>
    <div className='input-field'>
        <label>Password:</label>
        <input type="password" name='Password' placeholder=' Enter your Password' value={password} onChange={(e) => setPassword(e.target.value)} />
    </div>
    <div className='input-field'>
        <label>Address:</label>
        <input    type="text" name='Address' placeholder='Enter Your Address ' value={address} onChange={(e) => setAddress(e.target.value)} />
    </div>

      {role === 'miller' && (
    <div className='input-field'>
        <label>Max Storage Capacity (Qtl):</label>
        <input    type="number" value={max} onChange={(e) => setMax(e.target.value)}/>
    </div>
)}

      <div className='submit'>
      <button type='submit'>Register</button>
      <Link to='/login' className='underline' >
        <button>Login</button>
      </Link>
      <Link to='/' className='underline'>
        <button>Back</button>
      </Link>
      </div>
      </form>
      
    </div>
  );
};