import { ethers } from 'ethers';
import React, { useEffect, useState, useContext, useCallback } from 'react';
import tracking from '../../../Test.json'; // Replace with the path to your contract ABI JSON file
import Typewriter from "typewriter-effect";
import { toast } from "react-toastify";
// import "./FarmerDashboard.css";
import axios from 'axios';
import { backend } from '../../../config.js';
import { NavLink } from 'react-router-dom';
import { TrackingContext } from '../../../Context/TrackingContext.js';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with the deployed contract address
const contractABI = tracking.abi; // Replace with the contract ABI

export const FarmerDashboard=()=> {

  const [contract, setContract] = useState(null);
  const [signer,setSigner]= useState(null);
  const [address, setAddress] = useState('');
  const [orders, setOrders] = useState([]);
  const [quantity, setQuantity] = useState('');
  const [showTransactions, setShowTransactions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDialog,setOpenDialog] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [openPopUp, setOpenPopUp] = useState(true);

  const statusStrings = {
    0: 'PENDING',
    1: 'QUALITY_ASSESSED',
    2: 'ASSIGNED',
    3: 'IN_TRANSIT',
    4: 'DELIVERED',
    5: 'PAYMENT_COMPLETED',
  };

  const { user,name,setName, setUser } = useContext(TrackingContext);
  const [loggedUser, setLoggedUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const token =sessionStorage.getItem("token");

  const [farmerName, setFarmerName] = useState(loggedUser ? loggedUser.name : '');
  const [farmerPhone, setFarmerPhone] = useState(loggedUser ? loggedUser.phone : '');
  const [farmerEmail, setFarmerEmail] = useState(loggedUser ? loggedUser.email : '');
  const [farmerAdd, setFarmerAdd] = useState(loggedUser ? loggedUser.address : '');

  useEffect(() => {
    if (user) {
      setLoggedUser(user);
      sessionStorage.setItem('user', JSON.stringify(user));
      setFarmerName(user.name);
      setFarmerPhone(user.phone);
      setFarmerEmail(user.email);
      setFarmerAdd(user.address);
    }
  }, [user,loggedUser,farmerName,farmerEmail,farmerPhone,farmerAdd]);

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    setSigner(signer);
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    setContract(contract);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const getNameAndAddress = async (userAddress) => {
    try {
      const response = await axios.get(`${backend}/getUserDetails/${userAddress}`, { userAddress });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };
  

  const createOrder = async () => {
    try {
        const fciAddress = await contract.getFCIAddress();
        if (fciAddress === '0x0000000000000000000000000000000000000000') {
          toast.error("FCI Address is not registered!");
          return; 
        }
          const q = parseInt(quantity);
          const transaction= await contract.createOrder(fciAddress, q); 
          await transaction.wait();
          alert("Order Created Successfully")
          window.location.reload();
          setOpenDialog(false);
          getOrdersByFarmer();
    } catch (error) {
      console.error('Error creating order:', error);
    } 
  };

  const startDelivery = async (orderId) => {
    try {
      const transaction=await contract.startDelivery(orderId);
      await transaction.wait();
          alert("Delivery Started Successfully")
          window.location.reload();
      getOrdersByFarmer();
    } catch (error) {
      console.error('Error starting delivery:', error);
    }
  };

  const TruncatedAddress = ({ address }) => {
    // Extract first and last four characters
    const truncatedAddress = `${address.slice(0, 4)}.....${address.slice(-4)}`;
  
    return (
      <span title={address}>
        {truncatedAddress}
      </span>
    );
  };
  
  
  const getOrdersByFarmer = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const farmerAddress = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!Array.isArray(farmerAddress) || farmerAddress.length === 0) {
        console.error('Invalid farmer address:', farmerAddress);
        return;
    }

    if(contract){
      const farmerOrders = await contract.getOrdersByFarmer(farmerAddress[0]);
      const ordersWithDetails = await Promise.all(
        farmerOrders.map(async (order) => {
          const fciDetails = await getNameAndAddress(order.fci);
          const assignedMillerDetails = await getNameAndAddress(order.assignedMiller);
          return { ...order, fciDetails, assignedMillerDetails };
        })
      );
      setOrders(ordersWithDetails);
      setShowTransactions(true);
      console.log('Transactions:', ordersWithDetails);
    }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(()=>{
    getOrdersByFarmer();
  },[contract]);

  const connectWallet = async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = await signer.getAddress();
      setAddress(address);
    } else {
      alert('Please install MetaMask');
    }
  };

  const generateUniqueNumber = (orderID, farmerAddress) => {
    const farmerDigits = farmerAddress.slice(-2);
    const orderDigits = orderID.slice(-4);
    const uniqueNumber = "FM" + farmerDigits + orderDigits;
    return uniqueNumber;
  };

  useEffect(() => {
    let timer;
  
    const checkAccount = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const connectedAddress = accounts.length > 0 ? accounts[0].toLowerCase() : '';
        const requiredAddress = loggedUser ? loggedUser.address.toLowerCase() : ''; 
        if (connectedAddress !== requiredAddress) {
          alert('Please connect your account');
          timer = setTimeout(checkAccount, 3000); 
          window.location.reload(); 
        } else {
          clearTimeout(timer); 
        }
      } else {
        alert('Please install MetaMask');
      }
    };
    checkAccount();
    return () => clearTimeout(timer); 
  }, [address]); 

  return (
    <div className="dashboard">
      

    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <h3>Farmer Details</h3>
        <p>Name: {farmerName}</p>
        <p>Phone: {farmerPhone}</p>
        <p>Email: {farmerEmail}</p>
        <p>Address: <TruncatedAddress address={farmerAdd}/></p>
        <li className="nav-item">
  {token ? (
    <NavLink
      to="/login"
      className="btn btn-primary mx-2 p-2 logout"
      onClick={() => {
        setName("Login");
        setUser('');
        setLoggedUser('');
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        localStorage.removeItem("targetQuantity");
        localStorage.removeItem("availableCapacity");
      }}
    >
      Logout
    </NavLink>
  ) : (
    <NavLink
      to="/login"
      className="btn btn-primary mx-2 p-2"
    >
      Login
    </NavLink>
  )}
</li>

    </div>


    <div className='second'>

        {/* Typewriter div */}
        <div>
        <h1>
          <Typewriter
           options={{
            strings: [' Welcome to Farmer Dashboard'],
            autoStart: true,
            loop: true,
          }}/>
        </h1>
        </div>

        <br />

        {/* {Connect Wallet} */}
        <div className='dashboard-wallet'>
           <button onClick={connectWallet}>Connect Wallet</button>
           <br />
           <label className='address' >
             Address: {address}
           </label>
        </div>
        
        <br/> 

        <div>

        <Button className='buttonCreate' variant="outlined" onClick={handleDialogOpen}>Create Order</Button>
      
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Create Order</DialogTitle>
        <DialogContent>
          <TextField
            label="Quantity"
            type="number"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={createOrder} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

        </div> 


        <div>

          <h2>Order History</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Expiry Date</th>
            <th>Delivered Date</th>
            <th>Order ID</th>
            <th>Quantity (Qtl.)</th>
            <th>Assessed Quality(%)</th>
            <th>Status</th>
            <th>FCI Name</th>
            <th>Miller Name</th>
            <th>Amount To Be Received</th>
            <th>Action</th> {/* Added column for Start Delivery button */}
          </tr>
        </thead>
        <tbody>
    {orders.length > 0 ? (
      orders.map(order => {
        // Convert dateTime to Unix timestamp
        const dateTime = order.dateTime.toString();
        const timestamp = parseInt(dateTime, 10);
        const creationDate = new Date(timestamp * 1000);
        const expiryDate = new Date(creationDate);
        expiryDate.setDate(expiryDate.getDate() + 4); // Adding 4 days to the creation date
        const uniqueNumber = generateUniqueNumber(order.orderId, loggedUser.address);
        let paymentAmount;
  if (order.assessQualityValue >= 0 && order.assessQualityValue <= 30) {
    paymentAmount = order.quantity * 0.25;
  } else if (order.assessQualityValue >= 31 && order.assessQualityValue <= 65) {
    paymentAmount = order.quantity * 1;
  } else if (order.assessQualityValue >= 66 && order.assessQualityValue <= 100) {
    paymentAmount = order.quantity * 2;
  } else {
    console.error("Invalid quality assessment value");
    return;
  }


        return (
          <tr key={order.orderId}>
            <td>{creationDate.toLocaleString()}</td>
            <td>{expiryDate.toLocaleDateString()}</td>
            <td>{order.status < 4 ? '-x-' : new Date(order.deliveryConfirmationDate * 1000).toLocaleString()}</td>
            <td>{uniqueNumber}</td>
            <td>{order.quantity.toString()}</td>
            <td>{order.status === 0 ? "Quality not assessed" : order.assessQualityValue.toString()}</td>
            <td>{statusStrings[order.status]}</td>
            {/* <td>{order.fci}</td>
            <td>{order.assignedMiller}</td> */}
            <td>{order.fciDetails ? order.fciDetails.name : 'Loading...'}</td>
            <td>
              {order.assignedMiller === '0x0000000000000000000000000000000000000000' || !order.assignedMillerDetails
                ? 'No miller assigned'
                : order.assignedMillerDetails.name || 'Loading...'}
            </td>
            <td>
              { order.status >0 ? (
                <span><b> {paymentAmount.toFixed(2)}ETH</b></span>
              ): '-x-'}
            {/*  */}
            </td>
            <td>
  {order.status === 2 && ( // Show button only when status is PAYMENT_COMPLETED
    <button className='main-button' style={{marginLeft: '0px'}} onClick={() => startDelivery(order.orderId)}>Start Delivery</button>
  )}
  {order.status < 2 && (
    // Display "No actions" when status is less than 3
    <span>No actions</span>
  )}
  {order.status > 2 && order.status < 5 && (
    // Display "Actions completed" when status is greater than 3
    <span>Actions completed</span>
  )}
  {order.status === 5 && (
    // Display "Actions completed" when status is greater than 3
    <span>Amount Received</span>
  )}
</td>

          </tr>
        );
      })
    ) : (
      <tr>
        <td colSpan="11">No orders created</td>
      </tr>
    )}
  </tbody>
      </table>

        </div>   

    </div>

      {/* <button className='sidebar-toggle' onClick={toggleSidebar}>Toggle Sidebar</button> */}
  
    </div>
  );
};

