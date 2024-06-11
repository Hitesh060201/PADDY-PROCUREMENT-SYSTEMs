import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import tracking from '../../../Test.json'; 
import "./MillerDashboard.css"
import Typewriter from "typewriter-effect";
import {toast} from "react-toastify";
import axios from 'axios';
import { backend } from '../../../config.js';
import { Link, NavLink } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { TrackingContext } from '../../../Context/TrackingContext.js';
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; 
const contractABI = tracking.abi;

export const MillerDashboard = () => {
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [millerAddress, setMillerAddress] = useState('');
  const [porders, setPorders] = useState([]);
  const [aorders,setAorders]=useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetQuantity,setTargetQuantity]=useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccepted, setShowAccepted] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [millerCapacity, setMillerCapacity] = useState({
    maxStorageCapacity: 0,
    targetQuantity: 0,
    availableCapacity: 0
  });
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
  //console.log(token)

  const [millerName, setMillerName] = useState(loggedUser ? loggedUser.name : '');
  const [millerPhone, setMillerPhone] = useState(loggedUser ? loggedUser.phone : '');
  const [millerEmail, setMillerEmail] = useState(loggedUser ? loggedUser.email : '');
  const [millerMax, setMillerMax] = useState(loggedUser ? loggedUser.maxStorageCapacity : '');
  const [millerAdd, setMillerAdd] = useState(loggedUser ? loggedUser.address : '');

  useEffect(() => {
    if (user) {
      setLoggedUser(user);
      sessionStorage.setItem('user', JSON.stringify(user));

      setMillerName(user.name);
      setMillerPhone(user.phone);
      setMillerEmail(user.email);
      setMillerMax(user.maxStorageCapacity);
      setMillerAdd(user.address);
    }
  }, [user]);

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    setSigner(signer);
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    setContract(contract);
    
  }, []);


  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  // Function to handle click on Farmer List button
  const handleShowAccepted = () => {
    setShowAccepted(true);
  };

  const handleShowPending = () => {
    setShowAccepted(false);
    setShowPending(true);
  }

  const getNameAndAddress = async (userAddress) => {
    try {
      const response = await axios.get(`${backend}/getUserDetails/${userAddress}`, { userAddress });
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const fciAddress = await contract.getFCIAddress();
        if (fciAddress === '0x0000000000000000000000000000000000000000' && millerMax < localStorage.getItem('targetQuantity')) {
          toast.error("FCI Address is not registered!");
          return; 
        }

        if (targetQuantity > millerMax) {
          toast.error("Target quantity cannot exceed max storage capacity!");
          return;
        }

      const transaction= await contract.setTargetQuantity(targetQuantity);
      await transaction.wait();
          alert("Target quantity set successfully")
          window.location.reload();
      setOpenDialog(false);
      getMillerCapacity();
    } catch (error) {
      console.error('Error setting target quantity:', error);
      alert('Failed to set target quantity');
    }
    setLoading(false);
  };

  const getMillerCapacity = async () => {
    try {
      if (contract && millerAddress) {
        const capacity = await contract.getMillerCapacity(millerAddress);
        setMillerCapacity({
          targetQuantity: capacity[0].toString(),
          availableCapacity: capacity[1].toString()
        });

        localStorage.setItem('targetQuantity', millerCapacity.targetQuantity);
        localStorage.setItem('availableCapacity', millerCapacity.availableCapacity);
    }
    } catch (error) {
      console.error('Error fetching miller capacity:', error);
    }
  };

  const confirmDelivery = async (farmer, orderId) => {
    try {
      const transaction= await contract.confirmDelivery(farmer, orderId);
      await transaction.wait();
          alert("Delivery confirmed successfully")
          window.location.reload();
      getAceptedOrdersByMiller();
      getPendingOrdersByMiller();
    } catch (error) {
      console.error('Error confirming delivery:', error);
    }
  };

  const getPendingOrdersByMiller = async () => {
      const contractWithSigner = contract.connect(signer);
      const millerAddress = await signer.getAddress();
      setMillerAddress(millerAddress);
      console.log('Miller Address:', millerAddress);
      
      try {
        if (contract) {
        const millerOrders = await contractWithSigner.getPendingOrdersByMiller(millerAddress);
        console.log('Miller Orders:', millerOrders);
        const ordersWithDetails = await Promise.all(
          millerOrders.map(async (order) => {
            const farmerDetails = await getNameAndAddress(order.farmer);
            return { ...order, farmerDetails };
          })
        );
        setPorders(ordersWithDetails);
        console.log('Transactions:', ordersWithDetails);
        console.log(porders);
      }
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
  };

  const getAceptedOrdersByMiller = async () => {
      const contractWithSigner = contract.connect(signer);
      const millerAddress = await signer.getAddress();
      console.log('Miller Address:', millerAddress);

      console.log('Max:',millerMax);
      console.log('Target:', targetQuantity);
      
      try {
        if (contract) {
        const millerOrders = await contractWithSigner.getAcceptedOrdersByMiller(millerAddress);
        console.log('Miller Orders:', millerOrders);
        const ordersWithDetails = await Promise.all(
          millerOrders.map(async (order) => {
            const farmerDetails = await getNameAndAddress(order.farmer);
            return { ...order, farmerDetails };
          })
        );
        setAorders(ordersWithDetails);
        console.log('Transactions:', ordersWithDetails);
        console.log(aorders);
        }
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    };

  useEffect(() => {
    if (contract && millerAddress) {
      const getMillerCapacity = async () => {
        try {
          const capacity = await contract.getMillerCapacity(millerAddress);
          setMillerCapacity({
            targetQuantity: capacity[0].toString(),
            availableCapacity: capacity[1].toString()
          });
  
          localStorage.setItem('targetQuantity', capacity[0].toString());
          localStorage.setItem('availableCapacity', capacity[1].toString());
        } catch (error) {
          console.error('Error fetching miller capacity:', error);
        }
      };
  
      getMillerCapacity();
    }
  }, [contract, millerAddress]);

  useEffect(() => {
    if (contract) {
      getPendingOrdersByMiller();
      getAceptedOrdersByMiller();
    }
  }, [contract]);
  
  const connectWallet = async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = await signer.getAddress();
      // window.ethereum.on("accountsChanged",()=>{
      //   window.location.reload()
      // })
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

  const TruncatedAddress = ({ address }) => {
    // Extract first and last four characters
    const truncatedAddress = `${address.slice(0, 4)}.....${address.slice(-4)}`;
  
    return (
      <span title={address}>
        {truncatedAddress}
      </span>
    );
  };

  // const CustomButton = ({ className, onClick, children }) => {
  //   return (
  //     <button className={`button ${className}`} onClick={onClick}>
  //       {children}
  //     </button>
  //   );
  // };

  const CustomButton = ({ onClick, children, variant, fullWidth=false}) => {
    const btn1Styles = {
      backgroundColor: 'transparent',
      border: '1px solid #007bff',
      color: 'white',
      padding: '5px 15px',
      fontSize: '1.2rem',
      fontWeight: 400,
      lineHeight: 1.5,
      borderRadius: '0.25rem',
      textTransform: 'capitalize',
      outline: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      touchAction: 'manipulation',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s ease',
      cursor: 'pointer',
      margin: '0',
      marginBottom:'0px',
      padding:'20px',
      width: fullWidth ? '100%' : 'auto',
      marginLeft: '0',
      boxShadow:'none',
    };
  
    const btn2Styles = {
      ...btn1Styles,
      marginLeft: '10px',
      borderColor: '#6c757d',
      color: 'white',
    };
  
    const buttonStyles = variant === 'secondary' ? btn2Styles : btn1Styles;
  
    return (
      <button
        style={buttonStyles}
        onClick={onClick}
        className="button"
      >
        {children}
      </button>
    );
  };

  return (
    <div className="dashboard">

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <h3>Miller Details</h3>
        <p>Name: {millerName}</p>
        <p>Phone: {millerPhone}</p>
        <p>Email: {millerEmail}</p>
        <p>Address: <TruncatedAddress address={millerAdd}/></p>
        
        <div className='link-list'>
          
         <CustomButton onClick={handleShowAccepted} fullWidth>
            All Transactions
          </CustomButton>

          <CustomButton  style={{padding:'5px'}} onClick={handleShowPending} fullWidth>
           Pending Transactions
          </CustomButton>
          </div>

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

      {/* {TypeWriter} */}
        <div>
        <h1 >
      <Typewriter
       options={{
        strings: [' Welcome to Miller Dashboard'],
        autoStart: true,
        loop: true,
      }}/>
      </h1>

        </div>

      {/* {Connect wallet} */}
      <div className='dashboard-wallet' >
      <button onClick={connectWallet}>Connect Wallet</button>
      <br />
      <label className='address' >
        Address: {address}
      </label>
      </div>

      {/* {Set target Quantity} */}
      <div>
      <h2 style={{marginBottom:'-10px'}} >Set Target Quantity</h2>

<Button variant="outlined" onClick={handleDialogOpen}>Set Target Quantity</Button>

<Dialog open={openDialog} onClose={handleDialogClose}>
  <DialogTitle>Set Target Quantity (Qtl)</DialogTitle>
  <DialogContent>
    <TextField
      label="Target Quantity"
      type="number"
      fullWidth
      margin="normal"
      InputLabelProps={{ shrink: true }}
      value={targetQuantity}
      onChange={(e) => setTargetQuantity(e.target.value)}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleDialogClose} color="primary">
      Cancel
    </Button>
    <Button onClick={handleSubmit} color="primary">
      Set
    </Button>
  </DialogActions>
</Dialog>

      </div>

      {/* {Miller Details} */}
      <div className='miller-details'>
      <p className='storage'>Max Storage Capacity: {millerMax} Qtl</p>
      <p className='storage'>Target Capacity: {localStorage.getItem('targetQuantity')} Qtl</p>
      <p className='storage'>Available Capacity: {localStorage.getItem('availableCapacity')} Qtl</p>

      </div>

      {/* {Tables} */}
      <div>

      {/* {Pending Orders} */}
      <div className="content">
{ !showAccepted && (
  <div>
      <h2 >Pending Order List</h2>
      <table >
        <thead >
          <tr>
            <th>Date</th>
            <th>Expiry Date</th>
            <th>Order id</th>
            <th>Quantity(Qtl.)</th>
            <th>Assessed Quality(%)</th>
            <th>Order Status</th>
            <th>Farmer Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody >
        {porders.length > 0 ? (
          porders.map((order) => {
            // Convert dateTime to Unix timestamp
            const dateTime = order.dateTime.toString(); // Convert BigNumber to string
            const timestamp = parseInt(dateTime, 10); // Convert string to integer timestamp
            const creationDate = new Date(timestamp * 1000); // Multiply by 1000 to convert seconds to milliseconds
            const expiryDate = new Date(creationDate);
            expiryDate.setDate(expiryDate.getDate() + 4); // Adding 4 days to the creation date
            const uniqueNumber = generateUniqueNumber(order.orderId, order.farmerDetails.address);

            return (
              <tr  key={order.orderId}>
                <td>{creationDate.toLocaleString()}</td>
                <td>{expiryDate.toLocaleDateString()}</td>
                <td>{uniqueNumber}</td>
                <td>{order.quantity.toString()}</td>
                <td>{order.status === 0 ? "Quality not assessed" : order.assessQualityValue.toString()}</td>
                <td>{statusStrings[order.status]}</td>
                <td>{order.farmerDetails ? order.farmerDetails.name : 'Loading...'}</td>
                <td>
                  {order.status === 3 && (
                    // Show button only when status is IN_TRANSIT
                    <button className='main-button' style={{marginLeft: '0px'}} onClick={() => confirmDelivery(order.farmer, order.orderId)}>Confirm Delivery</button>
                  )}
                  {order.status < 3 && (
    // Display "No actions" when status is less than 4
    <span>No actions</span>
  )}
  {order.status > 3 && (
    // Display "No actions" when status is less than 4
    <span>Actions Completed</span>
  )}
  
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="10">No pending orders</td>
          </tr>
        )}
      </tbody>
      </table>
  </div>
)}
      </div>

      {/* {All Orders} */}
      <div className="content">
      { showAccepted && (
        <div className="">
      <h2>Order History</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Received Date</th>
            <th>Quantity</th>
            <th>Assessed Quality</th>
            <th>Order Id</th>
            <th>Order Status</th>
            <th>Farmer Name</th>
          </tr>
        </thead>
        <tbody>
        {aorders.length > 0 ? (
          aorders.map((order) => {
            const uniqueNumber = generateUniqueNumber(order.orderId, order.farmerDetails.address);
            return (
              <tr key={order.orderId}>
                <td>{new Date(order.dateTime * 1000).toLocaleString()}</td>
                <td>{order.status < 4 ? '-x-' : new Date(order.deliveryConfirmationDate * 1000).toLocaleString()}</td>
                <td>{order.quantity.toString()}</td>
                <td>{order.status === 0 ? "Quality not assessed" : order.assessQualityValue.toString()}</td>
                <td>{uniqueNumber}</td>
                <td>{statusStrings[order.status]}</td>
                <td>{order.farmerDetails ? order.farmerDetails.name : 'Loading...'}</td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="10">No accepted orders</td>
          </tr>
        )}
      </tbody>
      </table>
      </div>
      )}
      </div>

      </div>

      </div>

    </div>
  );
};
