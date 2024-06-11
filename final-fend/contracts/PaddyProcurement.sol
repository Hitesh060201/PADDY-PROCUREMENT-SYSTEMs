// SPDX-License-Identifier: MIT
pragma solidity >0.7.0 <0.9.0;

import "hardhat/console.sol";

contract PaddyProcurement {
    enum OrderStatus { PENDING ,QUALITY_ASSESSED ,ASSIGNED ,IN_TRANSIT ,DELIVERED ,PAYMENT_COMPLETED }

    address public fciAddress;
    address[] public farmersList;
    address[] public millersList;
    
    struct Order {
        address farmer;
        address fci;
        uint256 quantity;
        uint256 dateTime;
        OrderStatus status;
        address assignedMiller;
        bool qualityAssessed;
        bool paymentCompleted;
        bool deliveredToMiller;
        bytes32 orderId; // Unique order ID
        uint256 assessQualityValue;
        uint256 deliveryConfirmationDate;
    }

    struct MillerInventory {
        uint256 maxStorageCapacity;
        uint256 targetQuantity;
        uint256 availableCapacity;
    }

    mapping(address => bool) public isMiller;
    mapping(address => bool) public isFarmer;
    mapping(address => bool) public isFCI;
    mapping(bytes32 => bool) public orderExists;
    mapping(address => Order[]) public ordersOfFarmer;
    mapping(address => Order[]) public ordersOfMiller;
    mapping(address => MillerInventory) public millerInventories;
    mapping(address => Order[]) public transactionsOfFCI;

    event OrderCreated(address indexed farmer, address indexed fci, uint256 quantity, uint256 dateTime, OrderStatus status, bytes32 orderId);
    event MillerAssigned(address indexed farmer, address indexed miller, bytes32 orderId);
    event QualityAssessed(address indexed fci, address indexed farmer, bytes32 orderId);
    event PaymentCompleted(address indexed fci, address indexed farmer, uint256 amount, bytes32 orderId);
    
    constructor() {
        console.log("Paddy Procurement Deployed");
    }
    
    modifier onlyFCI() {
        require(msg.sender == fciAddress, "Only FCI contract can call this function");
        _;
    }

    modifier onlyFarmer() {
        require(msg.sender == fciAddress || isFarmer[msg.sender], "Only FCI or Farmer contract can call this function");
        _;
    }

    modifier onlyMiller() {
        require(msg.sender == fciAddress || isMiller[msg.sender], "Only FCI or Miller contract can call this function");
        _;
    }

    function registerFCIAddress(address _fciAddress) external {
        require(!isFarmer[_fciAddress] && !isMiller[_fciAddress] && !isFCI[_fciAddress], "Address already registered ");
        isFCI[_fciAddress] = true;
        fciAddress = _fciAddress;
    }

    function registerAsFarmer(address _farmer) external {
        require(!isFCI[_farmer] &&!isMiller[_farmer] && !isFarmer[_farmer], "Address already registered ");
        isFarmer[_farmer] = true;
        farmersList.push(_farmer);
    }
    
    function registerAsMiller(address _miller, uint256 _maxStorageCapacity) external {
        require(!isFCI[_miller] && !isFarmer[_miller] && !isMiller[_miller], "Address already registered ");
        isMiller[_miller] = true;
        millersList.push(_miller);
        millerInventories[_miller].maxStorageCapacity = _maxStorageCapacity;    
    }

    function setTargetQuantity(uint256 _targetQuantity) external onlyMiller {
        require(isMiller[msg.sender], "Only millers can set target quantity");
        millerInventories[msg.sender].targetQuantity = _targetQuantity;
        millerInventories[msg.sender].availableCapacity = _targetQuantity;
    }


    function createOrder(address _fci, uint256 _quantity) external onlyFarmer{
        require(isFarmer[msg.sender], "Only farmers can create orders");
        //require(!orderExists[keccak256(abi.encodePacked(msg.sender, _fci))], "Order already exists");
        require(_quantity > 0, "Quantity must be greater than 0");

        bytes32 orderId = keccak256(abi.encodePacked(msg.sender, _fci, _quantity));

        Order memory newOrder = Order({
            farmer: msg.sender,
            fci: _fci,
            quantity: _quantity,
            dateTime: block.timestamp,
            status: OrderStatus.PENDING,
            assignedMiller: address(0),
            qualityAssessed: false,
            paymentCompleted: false,
            deliveredToMiller : false,
            orderId: orderId, // Storing the order ID
            assessQualityValue: 0,
            deliveryConfirmationDate: 0
        });

        ordersOfFarmer[msg.sender].push(newOrder);
        transactionsOfFCI[fciAddress].push(newOrder);
        orderExists[orderId] = true;
        emit OrderCreated(msg.sender, _fci, _quantity, block.timestamp, OrderStatus.PENDING, orderId);

        // Check if quality assessment and miller assignment deadlines have passed
        require(block.timestamp <= newOrder.dateTime + 4 days, "Quality assessment deadline passed");
    }

   
    function assignMiller(address _farmer, bytes32 _orderId, address _selectedMiller) external onlyFCI {
    // Check if the selected miller is valid
    require(isMiller[_selectedMiller], "Invalid miller address");

     Order[] storage orders = ordersOfFarmer[_farmer];
    for (uint256 i = 0; i < orders.length; i++) {
        if (orders[i].orderId == _orderId && orders[i].status == OrderStatus.QUALITY_ASSESSED) {
            require(block.timestamp <= orders[i].dateTime + 4 days, "Miller assignment deadline passed");
            orders[i].assignedMiller = _selectedMiller;
            orders[i].status = OrderStatus.ASSIGNED;
            
            ordersOfMiller[_selectedMiller].push(orders[i]);

            Order[] storage fciOrders = transactionsOfFCI[fciAddress];
            for (uint256 j = 0; j < fciOrders.length; j++) {
                if (fciOrders[j].orderId == _orderId ) {
                    fciOrders[j].assignedMiller = _selectedMiller;
                    fciOrders[j].status = OrderStatus.ASSIGNED;
                    break;
                }
            }

            emit MillerAssigned(_farmer, _selectedMiller, _orderId);
            break;
        }
    }
    }

    function assessQuality(address _farmer, bytes32 _orderId, uint256 _qualityValue) external onlyFCI {
    Order[] storage orders = ordersOfFarmer[_farmer];
    for (uint256 i = 0; i < orders.length; i++) {
        if (orders[i].orderId == _orderId && orders[i].status == OrderStatus.PENDING) {
            require(block.timestamp <= orders[i].dateTime + 4 days, "Quality Assessment deadline passed");
            orders[i].qualityAssessed = true;
            orders[i].status = OrderStatus.QUALITY_ASSESSED;
            orders[i].assessQualityValue = _qualityValue;

            Order[] storage fciOrders = transactionsOfFCI[fciAddress];
            for (uint256 j = 0; j < fciOrders.length; j++) {
                if (fciOrders[j].orderId == _orderId) {
                    fciOrders[j].qualityAssessed = true;
                    fciOrders[j].status = OrderStatus.QUALITY_ASSESSED;
                    fciOrders[j].assessQualityValue = _qualityValue;
                    break;
                }
            }

            emit QualityAssessed(msg.sender, orders[i].farmer, _orderId);
            break;
        }
    }  
    }

    function completePayment(address _farmer, bytes32 _orderId, uint256 _quantity, uint256 _qualityValue) external payable onlyFCI {
        Order[] storage orders = ordersOfFarmer[_farmer];
        uint256 paymentAmount ;
        bool paymentMade = false;

        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].orderId == _orderId && orders[i].status == OrderStatus.DELIVERED) {
                require(orders[i].qualityAssessed, "Quality assessment not completed");
                require(!orders[i].paymentCompleted, "Payment already completed for this order");

             // Calculate payment amount based on quality assessment value
            if (_qualityValue >= 0 && _qualityValue <= 30) {
                paymentAmount = _quantity * 25 / 100; // quantity * 0.25
            } else if (_qualityValue >= 31 && _qualityValue <= 65) {
                paymentAmount = _quantity * 1; // quantity * 1
            } else if (_qualityValue >= 66 && _qualityValue <= 100) {
                paymentAmount = _quantity * 2; // quantity * 2
            } else {
                revert("Invalid quality assessment value");
            } 

                orders[i].paymentCompleted = true;
                orders[i].status = OrderStatus.PAYMENT_COMPLETED;
                emit PaymentCompleted(msg.sender, orders[i].farmer, paymentAmount, _orderId);

                address miller = orders[i].assignedMiller;
                Order[] storage millerOrders = ordersOfMiller[miller];
                for (uint256 j = 0; j < millerOrders.length; j++) {
                    if (millerOrders[j].orderId == _orderId) {
                        millerOrders[j].paymentCompleted = true;
                        millerOrders[j].status = OrderStatus.PAYMENT_COMPLETED;
                        break;
                    }
                }

                Order[] storage fciOrders = transactionsOfFCI[fciAddress];
                for (uint256 j = 0; j < fciOrders.length; j++) {
                    if (fciOrders[j].orderId == _orderId) {
                        fciOrders[j].paymentCompleted = true;
                        fciOrders[j].status = OrderStatus.PAYMENT_COMPLETED;
                        break;
                    }
                }
                // Transfer Ether to the farmer
                payable(orders[i].farmer).transfer(paymentAmount);
                paymentMade = true;
                break;
            }
        }
        require(paymentMade, "Payment already completed for this order or order not found");
    }

    function startDelivery(bytes32 _orderId) external onlyFarmer{
    Order[] storage orders = ordersOfFarmer[msg.sender];
    for (uint256 i = 0; i < orders.length; i++) {
        if (orders[i].orderId == _orderId && orders[i].status == OrderStatus.ASSIGNED) {
            require(block.timestamp <= orders[i].dateTime + 4 days, "Delivery start deadline passed");

            orders[i].status = OrderStatus.IN_TRANSIT;
            address miller = orders[i].assignedMiller;
            Order[] storage millerOrders = ordersOfMiller[miller];
            for (uint256 j = 0; j < millerOrders.length; j++) {
                if (millerOrders[j].orderId == _orderId) {
                    millerOrders[j].status = OrderStatus.IN_TRANSIT;
                    break;
                }
            }
            
            Order[] storage fciOrders = transactionsOfFCI[fciAddress];
            for (uint256 j = 0; j < fciOrders.length; j++) {
                if (fciOrders[j].orderId == _orderId) {
                    fciOrders[j].status = OrderStatus.IN_TRANSIT;
                    break;
                }
            }
            break;
        }
    }
    }

    function confirmDelivery(address _farmer,bytes32 _orderId) external onlyMiller{
    Order[] storage orders = ordersOfFarmer[_farmer];
    for (uint256 i = 0; i < orders.length; i++) {
        if (orders[i].orderId == _orderId && orders[i].status == OrderStatus.IN_TRANSIT && orders[i].assignedMiller == msg.sender) {
            orders[i].deliveredToMiller = true;
            orders[i].status = OrderStatus.DELIVERED;
            orders[i].deliveryConfirmationDate = block.timestamp;

            address miller = orders[i].assignedMiller;
            millerInventories[miller].availableCapacity -= orders[i].quantity;
            Order[] storage millerOrders = ordersOfMiller[miller];
            for (uint256 j = 0; j < millerOrders.length; j++) {
                if (millerOrders[j].orderId == _orderId) {
                    millerOrders[j].deliveredToMiller = true;
                    millerOrders[j].status = OrderStatus.DELIVERED;
                    millerOrders[j].deliveryConfirmationDate = block.timestamp;
                    break;
                }
            }
            
            Order[] storage fciOrders = transactionsOfFCI[fciAddress];
            for (uint256 j = 0; j < fciOrders.length; j++) {
                if (fciOrders[j].orderId == _orderId) {
                    fciOrders[j].deliveredToMiller = true;
                    fciOrders[j].status = OrderStatus.DELIVERED;
                    fciOrders[j].deliveryConfirmationDate = block.timestamp;
                    break;
                }
            }
            break;
        }
    }
    }

    function getFCIAddress() external view returns (address) {
    return fciAddress;
    }

    function getMillerCapacity(address _miller) external view returns (uint256, uint256) {
    MillerInventory memory inventory = millerInventories[_miller];
    return (inventory.targetQuantity, inventory.availableCapacity);
}
        
    function getOrdersByFarmer(address _farmer) external view onlyFarmer returns (Order[] memory) {
        return ordersOfFarmer[_farmer];
    }

    function getAllTransactionsOfFCI() external view onlyFCI returns (Order[] memory) {
    return transactionsOfFCI[fciAddress];
    }

    function getPendingOrdersByMiller(address _miller) external view onlyMiller returns (Order[] memory) {
    require(isMiller[_miller], "Address is not a Miller");
    Order[] memory allOrders = ordersOfMiller[_miller];
    uint256 pendingCount = 0;

    // Count the number of pending orders
    for (uint256 i = 0; i < allOrders.length; i++) {
        if (allOrders[i].assignedMiller == _miller && allOrders[i].status != OrderStatus.DELIVERED) {
            pendingCount++;
        }
    }

    // Create a new array to store pending orders
    Order[] memory pendingOrders = new Order[](pendingCount);
    uint256 index = 0;

    // Populate the pending orders array
    for (uint256 i = 0; i < allOrders.length; i++) {
        if (allOrders[i].assignedMiller == _miller && allOrders[i].status != OrderStatus.DELIVERED) {
            pendingOrders[index] = allOrders[i];
            index++;
        }
    }

    return pendingOrders;
    }

    function getAcceptedOrdersByMiller(address _miller) external view onlyMiller returns (Order[] memory) {
    return ordersOfMiller[_miller];
    }
}