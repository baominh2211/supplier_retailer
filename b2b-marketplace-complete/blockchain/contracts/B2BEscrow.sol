// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title B2BEscrow
 * @dev Escrow contract for B2B marketplace with milestone-based payments
 */
contract B2BEscrow is ReentrancyGuard, Ownable, Pausable {
    
    enum EscrowStatus { Created, Funded, InProgress, Completed, Disputed, Refunded, Cancelled }
    enum MilestoneStatus { Pending, Completed, Approved, Rejected }
    
    struct Milestone {
        string description;
        uint256 amount;
        uint256 deadline;
        MilestoneStatus status;
        bool fundsReleased;
    }
    
    struct Escrow {
        uint256 id;
        address buyer;
        address seller;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 createdAt;
        uint256 contractId;
        EscrowStatus status;
        string productName;
        uint256 quantity;
    }
    
    uint256 private _escrowIdCounter;
    uint256 public platformFeePercent = 1;
    address public feeRecipient;
    
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => Milestone[]) public escrowMilestones;
    mapping(address => uint256[]) public buyerEscrows;
    mapping(address => uint256[]) public sellerEscrows;
    
    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount);
    event EscrowFunded(uint256 indexed escrowId, uint256 amount);
    event MilestoneAdded(uint256 indexed escrowId, uint256 milestoneIndex, string description, uint256 amount);
    event MilestoneCompleted(uint256 indexed escrowId, uint256 milestoneIndex);
    event MilestoneApproved(uint256 indexed escrowId, uint256 milestoneIndex, uint256 amount);
    event FundsReleased(uint256 indexed escrowId, address indexed seller, uint256 amount);
    event EscrowCompleted(uint256 indexed escrowId);
    event EscrowDisputed(uint256 indexed escrowId, address indexed disputedBy, string reason);
    event DisputeResolved(uint256 indexed escrowId, address indexed winner, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event EscrowCancelled(uint256 indexed escrowId);
    
    modifier onlyBuyer(uint256 escrowId) {
        require(escrows[escrowId].buyer == msg.sender, "Only buyer");
        _;
    }
    
    modifier onlySeller(uint256 escrowId) {
        require(escrows[escrowId].seller == msg.sender, "Only seller");
        _;
    }
    
    modifier escrowExists(uint256 escrowId) {
        require(escrows[escrowId].id == escrowId && escrowId > 0, "Not exist");
        _;
    }
    
    constructor() {
        feeRecipient = msg.sender;
    }
    
    function createEscrow(
        address _seller,
        uint256 _contractId,
        string memory _productName,
        uint256 _quantity
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(_seller != address(0) && _seller != msg.sender, "Invalid seller");
        require(msg.value > 0, "Amount required");
        
        _escrowIdCounter++;
        uint256 newEscrowId = _escrowIdCounter;
        
        escrows[newEscrowId] = Escrow({
            id: newEscrowId,
            buyer: msg.sender,
            seller: _seller,
            totalAmount: msg.value,
            releasedAmount: 0,
            createdAt: block.timestamp,
            contractId: _contractId,
            status: EscrowStatus.Funded,
            productName: _productName,
            quantity: _quantity
        });
        
        buyerEscrows[msg.sender].push(newEscrowId);
        sellerEscrows[_seller].push(newEscrowId);
        
        emit EscrowCreated(newEscrowId, msg.sender, _seller, msg.value);
        emit EscrowFunded(newEscrowId, msg.value);
        
        return newEscrowId;
    }
    
    function addMilestone(
        uint256 escrowId,
        string memory _description,
        uint256 _amount,
        uint256 _deadline
    ) external escrowExists(escrowId) onlyBuyer(escrowId) {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Funded || escrow.status == EscrowStatus.InProgress, "Invalid status");
        
        escrowMilestones[escrowId].push(Milestone({
            description: _description,
            amount: _amount,
            deadline: _deadline,
            status: MilestoneStatus.Pending,
            fundsReleased: false
        }));
        
        if (escrow.status == EscrowStatus.Funded) {
            escrow.status = EscrowStatus.InProgress;
        }
        
        emit MilestoneAdded(escrowId, escrowMilestones[escrowId].length - 1, _description, _amount);
    }
    
    function completeMilestone(uint256 escrowId, uint256 milestoneIndex) 
        external escrowExists(escrowId) onlySeller(escrowId) 
    {
        require(escrows[escrowId].status == EscrowStatus.InProgress, "Not in progress");
        Milestone storage milestone = escrowMilestones[escrowId][milestoneIndex];
        require(milestone.status == MilestoneStatus.Pending, "Not pending");
        
        milestone.status = MilestoneStatus.Completed;
        emit MilestoneCompleted(escrowId, milestoneIndex);
    }
    
    function approveMilestone(uint256 escrowId, uint256 milestoneIndex) 
        external escrowExists(escrowId) onlyBuyer(escrowId) nonReentrant 
    {
        require(escrows[escrowId].status == EscrowStatus.InProgress, "Not in progress");
        Milestone storage milestone = escrowMilestones[escrowId][milestoneIndex];
        require(milestone.status == MilestoneStatus.Completed, "Not completed");
        require(!milestone.fundsReleased, "Already released");
        
        milestone.status = MilestoneStatus.Approved;
        milestone.fundsReleased = true;
        
        uint256 amount = milestone.amount;
        uint256 fee = (amount * platformFeePercent) / 100;
        uint256 sellerAmount = amount - fee;
        
        escrows[escrowId].releasedAmount += amount;
        
        payable(escrows[escrowId].seller).transfer(sellerAmount);
        if (fee > 0) payable(feeRecipient).transfer(fee);
        
        emit MilestoneApproved(escrowId, milestoneIndex, amount);
        emit FundsReleased(escrowId, escrows[escrowId].seller, sellerAmount);
        
        if (escrows[escrowId].releasedAmount >= escrows[escrowId].totalAmount) {
            escrows[escrowId].status = EscrowStatus.Completed;
            emit EscrowCompleted(escrowId);
        }
    }
    
    function releaseAllFunds(uint256 escrowId) 
        external escrowExists(escrowId) onlyBuyer(escrowId) nonReentrant 
    {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Funded || escrow.status == EscrowStatus.InProgress, "Invalid status");
        
        uint256 remainingAmount = escrow.totalAmount - escrow.releasedAmount;
        require(remainingAmount > 0, "No funds");
        
        uint256 fee = (remainingAmount * platformFeePercent) / 100;
        uint256 sellerAmount = remainingAmount - fee;
        
        escrow.releasedAmount = escrow.totalAmount;
        escrow.status = EscrowStatus.Completed;
        
        payable(escrow.seller).transfer(sellerAmount);
        if (fee > 0) payable(feeRecipient).transfer(fee);
        
        emit FundsReleased(escrowId, escrow.seller, sellerAmount);
        emit EscrowCompleted(escrowId);
    }
    
    function openDispute(uint256 escrowId, string memory reason) external escrowExists(escrowId) {
        Escrow storage escrow = escrows[escrowId];
        require(msg.sender == escrow.buyer || msg.sender == escrow.seller, "Not participant");
        require(escrow.status == EscrowStatus.Funded || escrow.status == EscrowStatus.InProgress, "Invalid status");
        
        escrow.status = EscrowStatus.Disputed;
        emit EscrowDisputed(escrowId, msg.sender, reason);
    }
    
    function resolveDispute(uint256 escrowId, address winner, uint256 winnerPercent) 
        external onlyOwner escrowExists(escrowId) nonReentrant 
    {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Disputed, "Not disputed");
        require(winnerPercent <= 100, "Invalid percent");
        
        uint256 remainingAmount = escrow.totalAmount - escrow.releasedAmount;
        uint256 winnerAmount = (remainingAmount * winnerPercent) / 100;
        uint256 loserAmount = remainingAmount - winnerAmount;
        address loser = winner == escrow.buyer ? escrow.seller : escrow.buyer;
        
        escrow.releasedAmount = escrow.totalAmount;
        escrow.status = EscrowStatus.Completed;
        
        if (winnerAmount > 0) payable(winner).transfer(winnerAmount);
        if (loserAmount > 0) payable(loser).transfer(loserAmount);
        
        emit DisputeResolved(escrowId, winner, winnerAmount);
        emit EscrowCompleted(escrowId);
    }
    
    function cancelEscrow(uint256 escrowId) external escrowExists(escrowId) nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Funded, "Cannot cancel");
        require(msg.sender == escrow.buyer || msg.sender == owner(), "Not authorized");
        require(escrow.releasedAmount == 0, "Funds released");
        
        escrow.status = EscrowStatus.Cancelled;
        payable(escrow.buyer).transfer(escrow.totalAmount);
        
        emit EscrowCancelled(escrowId);
        emit EscrowRefunded(escrowId, escrow.buyer, escrow.totalAmount);
    }
    
    // View functions
    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }
    
    function getMilestones(uint256 escrowId) external view returns (Milestone[] memory) {
        return escrowMilestones[escrowId];
    }
    
    function getBuyerEscrows(address buyer) external view returns (uint256[] memory) {
        return buyerEscrows[buyer];
    }
    
    function getSellerEscrows(address seller) external view returns (uint256[] memory) {
        return sellerEscrows[seller];
    }
    
    // Admin functions
    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 10, "Max 10%");
        platformFeePercent = _feePercent;
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid");
        feeRecipient = _feeRecipient;
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
