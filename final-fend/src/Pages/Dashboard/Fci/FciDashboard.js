import { ethers } from 'ethers';
import React, { useEffect, useState, useContext } from 'react';
import tracking from '../../../Test.json'; 
import "./FciDashboard.css";
import Typewriter from "typewriter-effect"
import { backend } from '../../../config.js';
import { Link, NavLink } from 'react-router-dom';
import axios from 'axios';
import {getHeader} from '../../../validation/getHeader.js';
import { TrackingContext } from '../../../Context/TrackingContext.js';
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; 
const contractABI = tracking.abi; 

export const FciDashboard = () => {
  const [contract, setContract] = useState(null);
  const [signer,setSigner]= useState(null);
  const [address, setAddress] = useState('');
  const [farmersList, setFarmersList] = useState([]);
  const [millersList, setMillersList] = useState([]);
  const [orders, setOrders] = useState([]);
  //const [miller, setMiller] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState({});
  const [qualityValue, setQualityValue] = useState({});
  const [showTransactions, setShowTransactions] = useState(true);
  const [showFarmersList, setShowFarmersList] = useState(false);
  const [showMillersList, setShowMillersList] = useState(false);
  const [millerCapacity, setMillerCapacity] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const [fciName, setFciName] = useState(loggedUser ? loggedUser.name : '');
  const [fciPhone, setFciPhone] = useState(loggedUser ? loggedUser.phone : '');
  const [fciEmail, setFciEmail] = useState(loggedUser ? loggedUser.email : '');
  const [fciAdd, setFciAdd] = useState(loggedUser ? loggedUser.address : '');

  useEffect(() => {
    if (user) {
      setLoggedUser(user);
      sessionStorage.setItem('user', JSON.stringify(user));

      setFciName(user.name);
      setFciPhone(user.phone);
      setFciEmail(user.email);
      setFciAdd(user.address);
    }
  }, [user]);

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    setSigner(signer);
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    setContract(contract);
  }, []);

  // const handleDropdownChange = (e) =>{
  //   const selectedOption = e.target.value;
  //   setMiller(selectedOption);
  //   setSelectedValue(selectedOption);
  // }

  const handleDropdownChange = (e, orderId) => {
    const selectedOption = e.target.value;
    setSelectedValue(prevValues => ({
      ...prevValues,
      [orderId]: selectedOption
    }));
  };
  

  // Function to handle click on Farmer List button
  const handleFarmerListClick = () => {
    setShowFarmersList(true);
    setShowMillersList(false);
  };

  // Function to handle click on Miller List button
  const handleMillerListClick = () => {
    setShowMillersList(true);
    setShowFarmersList(false);
  };

  const handleShowTransactionsClick = () => {
    setShowFarmersList(false);
    setShowMillersList(false);
    setShowTransactions(true);
  };

  const loadFarmersList = async () => {
    try {
      const response = await axios.get(`${backend}/farmers`,getHeader());
      setFarmersList(response.data);
    } catch (error) {
      console.log(error)
    }
      //console.error('Error fetching farmers list:', error);
  };

  const loadMillersList = async () => {
    try {
      const response = await axios.get(`${backend}/millers`,getHeader());
      setMillersList(response.data);
      response.data.forEach(async (miller) => {
        console.log(miller.address);
        await getMillerCapacity(miller.address);
      });
    } catch (error) {
      console.error('Error fetching millers list:', error);
    }
  };

  const getNameAndAddress = async (userAddress) => {
    try {
      let response;
      if(userAddress !== '0x0000000000000000000000000000000000000000'){
        response = await axios.get(`${backend}/getUserDetails/${userAddress}`, { userAddress });
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };

  const getMillerCapacity = async (millerAddress) => {
    try {
      if (contract && millerAddress) {
        const capacity = await contract.getMillerCapacity(millerAddress);
        console.log(capacity);
        const newMillerCapacity = {
          targetQuantity: capacity[0].toString(),
          availableCapacity: capacity[1].toString()
        };
        setMillerCapacity(prevState => ({
          ...prevState,
          [millerAddress]: newMillerCapacity
        }));

        sessionStorage.setItem(millerAddress, JSON.stringify(newMillerCapacity));
      }
    } catch (error) {
      console.error('Error fetching miller capacity:', error);
    }
  };

  const assignMiller = async (farmer, orderId, miller) => {
    if (contract) {
      try {
        const transaction= await contract.assignMiller(farmer, orderId,miller);
        await transaction.wait();
          alert("Miller Assigned successfully")
          window.location.reload();
        
      } catch (error) {
        console.error('Error assigning miller:', error);
      }
    }
  }

  const assessQuality = async (farmer, orderId, qualityValue) => {
    if (contract) {
      try {
        const quality = qualityValue[orderId];
        const transaction = await contract.assessQuality(farmer, orderId, quality);
        await transaction.wait();
          alert("Quality assessed successfully")
          window.location.reload(); 
      } catch (error) {
        console.error('Error assessing quality:', error);
      }
    }
  };

  const completePayment = async (farmerAddress,orderId,quantity, qualityValue) => {
    if (contract) {
      try {
        let paymentAmount;
      if (qualityValue >= 0 && qualityValue <= 30) {
        paymentAmount = quantity * 0.25;
      } else if (qualityValue >= 31 && qualityValue <= 65) {
        paymentAmount = quantity * 1;
      } else if (qualityValue >= 66 && qualityValue <= 100) {
        paymentAmount = quantity * 2;
      } else {
        console.error("Invalid quality assessment value");
        return; // Don't proceed further if quality assessment value is invalid
      }
        const transaction= await contract.completePayment(farmerAddress, orderId, quantity, qualityValue, {
          value: ethers.utils.parseEther(paymentAmount.toString()),
        });
        await transaction.wait();
          alert("Payment completed successfully")
          window.location.reload();
        
      } catch (error) {
        console.error('Error completing payment:', error);
      }
    }
  };

  const loadTransactions = async () => {
     try{
      if (contract){
        const txns = await contract.getAllTransactionsOfFCI();
        const ordersWithDetails = await Promise.all(
          txns.map(async (order) => {
            const farmerDetails = await getNameAndAddress(order.farmer);
            const assignedMillerDetails = await getNameAndAddress(order.assignedMiller);
            return { ...order, farmerDetails, assignedMillerDetails };
          })
        );
        setOrders(ordersWithDetails);
        setShowTransactions(true);
        console.log('Transactions:', ordersWithDetails);
      }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
  };

  useEffect(() => {
    loadTransactions();
    loadFarmersList();
    loadMillersList();
  }, [contract]);

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
          //window.location.reload();
        }
      } else {
        alert('Please install MetaMask');
      }
    };
    checkAccount();
    return () => clearTimeout(timer); 
  }, [address]); 

  const TruncatedAddress = ({ address }) => {
    console.log(typeof(address));
    // let truncatedAddress
    // if(typeof(address)!== undefined){
    const truncatedAddress = `${address.slice(0, 4)}.....${address.slice(-4)}`;
    // }
  
    return (
      <span title={address}>
        {truncatedAddress}
      </span>
    );
  };

  const filterOrdersByFarmerName = (orders, query) => {
    return orders.filter(order => 
      (order.farmerDetails && order.farmerDetails.name.toLowerCase().includes(query.toLowerCase())) || 
      (order.assignedMillerDetails && order.assignedMillerDetails.name.toLowerCase().includes(query.toLowerCase())) ||
      (statusStrings[order.status].toLowerCase().includes(query.toLowerCase())));
  };

  const handleSearch =(e)=>{
    e.preventDefault();
    const txt = e.target.value;
    setSearchQuery(txt);
  }

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
      boxShadow: 'none',
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
        <h3>FCI Details</h3>
        <p>Name: {fciName}</p>
        <p>Phone: {fciPhone}</p>
        <p>Email: {fciEmail}</p>
        <p>Address: <TruncatedAddress address={fciAdd}/></p>
        <div className='link-list'>
          {/* <Link 
           to='/read/farmer_list'> */}
            <CustomButton onClick={handleFarmerListClick} fullWidth>Farmer List</CustomButton>
          
          {/* </Link> */}
         {/* <Link 
         to='/read/miller_list'> */}
          <CustomButton onClick={handleMillerListClick} fullWidth>Miller List </CustomButton>
         {/* </Link> */}
         <CustomButton  onClick={handleShowTransactionsClick} fullWidth>
            Show Transactions
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

      <div>
        <h1 >
      <Typewriter
       options={{
        strings: [' Welcome to FCI Dashboard'],
        autoStart: true,
        loop: true,
      }}/>
      </h1>

      </div>

      <div className='dashboard-wallet'>
      <button onClick={connectWallet}>Connect Wallet</button>
      <br />
      <label className='address' >
        Address: {address}
      </label>
      </div>

      <div>

{/* {farmer Table} */}
<div className="content">
      {showFarmersList && (
  <div className="">
    <h2 >Farmer List</h2>
    <table className='farmerlist-Table'>
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody>
        {farmersList.length > 0 ? (
          farmersList.map((farmer, index) => (
            <tr key={index}>
              <td>{farmer.name}</td>
              <td>{farmer.phone}</td>
              <td>{farmer.email}</td>
              <td>{farmer.address}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="4">No farmers registered</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)}
</div>

{/* {miller Table} */}
<div className="content">
{showMillersList && (
  <div className="">
    <h2 >Miller List</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Address</th>
          <th>Max Storage Capacity</th>
          <th>Target Quantity</th>
          <th>Available Capacity</th>
        </tr>
      </thead>
      <tbody>
        {millersList.length > 0 ? (
          millersList.map((miller, index) => {
            const millerCapacityData = JSON.parse(sessionStorage.getItem(miller.address));
            return (
              <tr key={index}>
                <td>{miller.name}</td>
                <td>{miller.phone}</td>
                <td>{miller.email}</td>
                <td>{miller.address}</td>
                <td>{miller.maxStorageCapacity}</td>
                <td>{millerCapacityData?.targetQuantity}</td>
                <td>{millerCapacityData?.availableCapacity}</td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="7">No Millers registered</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)}
</div>

{/* {Pending Orders Table} */}
<div className="content">
      {!showFarmersList && !showMillersList && (
      <div>
        
  <h2 >Orders History</h2>
  <input
      className='input-box'
      id='search-box'
      type="text"
      placeholder='Search                                      '
      value={searchQuery}
      onChange={ handleSearch}
   />

  {/* <div className='outer-table-div' style={{marginTop: '50px'}}>
  <div className='table_div'>
  <div className='inner-div'> */}
  <table>
    <thead>
      <tr style={{backgroundColor: 'white'}}>
        <th>Date</th>
        <th>Expiry Date</th>
        <th>Delivered Date</th>
        <th>Order ID</th>
        <th>From Farmer</th>
        <th>Assigned Miller</th>
        <th>Quantity(Qtl.)</th>
        <th>Quality(%)</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>


<tbody>
  {!searchQuery ? (orders.length > 0 ? (
    orders.map((order, index) => {
    const dateTime = order.dateTime.toString();
    const timestamp = parseInt(dateTime, 10);
    const creationDate = new Date(timestamp * 1000);
    const expiryDate = new Date(creationDate);
    expiryDate.setDate(expiryDate.getDate() + 4);
    const uniqueNumber = generateUniqueNumber(order.orderId, order.farmerDetails.address);

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
      <tr key={index}>
        <td>{creationDate.toLocaleString()}</td>
        <td>{expiryDate.toLocaleDateString()}</td>
        <td>{order.status < 4 ? '-x-' : new Date(order.deliveryConfirmationDate * 1000).toLocaleString()}</td>
        <td>{uniqueNumber}</td>
        <td>{order.farmerDetails ? order.farmerDetails.name : 'Loading...'}</td>
        <td>
      {order.assignedMiller === '0x0000000000000000000000000000000000000000' || !order.assignedMillerDetails
        ? 'No miller assigned'
        : order.assignedMillerDetails.name || 'Loading...'}
    </td>
        <td>{order.quantity.toString()}</td>
        <td>{order.status === 0 ? "Quality not assessed" : order.assessQualityValue.toString()}</td>
        <td>{statusStrings[order.status]}</td>
        <td>
          {order.status === 0 && (
            <>
      <input
        type="number"
        placeholder="Enter quality value"
        // value={qualityValue}
        value={qualityValue[order.orderId] || ''}
        onChange={(e) => setQualityValue(prevValues => ({
          ...prevValues,
          [order.orderId]: e.target.value
        }))}
        // onChange={(e) => setQualityValue(e.target.value)}
      />
      <button className='main-button' onClick={() => assessQuality(order.farmer, order.orderId, qualityValue)}>Assess Quality</button>
    </>
          )}
          {order.status === 1 && (
            <>
            <div>
            <select onChange={(e) => handleDropdownChange(e, order.orderId)}>
                  <option value="">Select an option</option>
                  {millersList
                  .filter(option => {
                    // Get the available capacity for the current miller
                    const millerCapacityData = JSON.parse(sessionStorage.getItem(option.address));
                    // Return true if available capacity is greater than or equal to order quantity
                    return millerCapacityData && parseInt(millerCapacityData.availableCapacity) >= parseInt(order.quantity);
                  })
                  .map((option) => (
                  <option key={option._id} value={option.address}>
                  {option.name}
                  </option>
                  ))}
                 </select>
                {/* <p>Selected value: <TruncatedAddress address={selectedValue[order.orderId]}/> </p> */}
            </div>

              <button className='main-button' onClick={() => assignMiller(order.farmer, order.orderId, selectedValue[order.orderId])}>Assign Miller</button>
            </>
          )}
          {order.status === 4 && (
            <div className="">
              <span>Amount to be paid:<b> {paymentAmount.toFixed(2)}ETH</b></span>
              <button className='main-button' onClick={() => completePayment(order.farmer.toString(), order.orderId.toString(), order.quantity.toString(), order.assessQualityValue.toString())}>
              Complete Payment</button>
            </div>
            
          )}
          
  {order.status > 1  && order.status < 4 && (
    // Display "Actions completed" when status is greater than 3
    <span>Amount to be paid:<b> {paymentAmount.toFixed(2)}ETH</b></span>
  )}
  {order.status > 4 && (
    // Display "Actions completed" when status is greater than 3
    <span>Actions completed</span>
  )}
        </td>
      </tr>
    );
  })
) : (
  <tr>
    <td colSpan="10">No transactions recorded</td>
  </tr>
)) :( orders.length > 0 ? (
      filterOrdersByFarmerName(orders, searchQuery).map((order, index) => {
    const dateTime = order.dateTime.toString();
    const timestamp = parseInt(dateTime, 10);
    const creationDate = new Date(timestamp * 1000);
    const expiryDate = new Date(creationDate);
    expiryDate.setDate(expiryDate.getDate() + 4);
    const uniqueNumber = generateUniqueNumber(order.orderId, order.farmerDetails.address);

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
      <tr key={index}>
        <td>{creationDate.toLocaleString()}</td>
        <td>{expiryDate.toLocaleDateString()}</td>
        <td>{order.status < 4 ? '-x-' : new Date(order.deliveryConfirmationDate * 1000).toLocaleString()}</td>
        <td>{uniqueNumber}</td>
        <td>{order.farmerDetails ? order.farmerDetails.name : 'Loading...'}</td>
        <td>
      {order.assignedMiller === '0x0000000000000000000000000000000000000000' || !order.assignedMillerDetails
        ? 'No miller assigned'
        : order.assignedMillerDetails.name || 'Loading...'}
    </td>
        <td>{order.quantity.toString()}</td>
        <td>{order.status === 0 ? "Quality not assessed" : order.assessQualityValue.toString()}</td>
        <td>{statusStrings[order.status]}</td>
        <td>
          {order.status === 0 && (
            <>
      <input
        type="number"
        placeholder="Enter quality value"
        //value={qualityValue}
        value={qualityValue[order.orderId] || ''}
        onChange={(e) => setQualityValue(prevValues => ({
          ...prevValues,
          [order.orderId]: e.target.value
        }))}
        //onChange={(e) => setQualityValue(e.target.value)}
      />
      <button className='main-button' onClick={() => assessQuality(order.farmer, order.orderId, qualityValue)}>Assess Quality</button>
    </>
          )}
          {order.status === 1 && (
            <>
            <div>
            <select onChange={(e) => handleDropdownChange(e, order.orderId)}>
                  <option value="">Select an option</option>
                  {millersList
                  .filter(option => {
                    // Get the available capacity for the current miller
                    const millerCapacityData = JSON.parse(sessionStorage.getItem(option.address));
                    // Return true if available capacity is greater than or equal to order quantity
                    return millerCapacityData && parseInt(millerCapacityData.availableCapacity) >= parseInt(order.quantity);
                  })
                  .map((option) => (
                  <option key={option._id} value={option.address}>
                  {option.name}
                  </option>
                  ))}
                 </select>
                 {/* <p>Selected value: <TruncatedAddress address={selectedValue || ''}/> </p> */}

            </div>

              <button className='main-button' onClick={() => assignMiller(order.farmer, order.orderId, selectedValue[order.orderId])}>Assign Miller</button>
            </>
          )}
          {order.status === 4 && (
            <button className='main-button' onClick={() => completePayment(order.farmer.toString(), order.orderId.toString(), order.quantity.toString(), order.assessQualityValue.toString())}>
              Complete Payment - Amount :{paymentAmount.toFixed(2)}ETH</button>
          )}
          
  {order.status > 1 && order.status <4 && (
    // Display "Actions completed" when status is greater than 3
    <span>Amount to be paid:<b> {paymentAmount.toFixed(2)}ETH</b></span>
  )}
  {order.status > 4 && (
    // Display "Actions completed" when status is greater than 3
    <span>Actions completed</span>
  )}
        </td>
      </tr>
    );
  })
) : (
  <tr>
    <td colSpan="10">No transactions recorded</td>
  </tr>
))}  
</tbody>
</table>
{/* </div>
</div>
</div> */}
</div>
      )}
</div>

      </div>

    </div>
</div> 
  );
};