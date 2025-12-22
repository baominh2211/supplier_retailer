// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title B2BReputationToken
 * @dev Non-transferable reputation token for B2B marketplace
 */
contract B2BReputationToken is ERC20, Ownable, Pausable {
    
    struct ReputationRecord {
        uint256 timestamp;
        int256 change;
        string reason;
        address relatedParty;
    }
    
    mapping(address => ReputationRecord[]) public reputationHistory;
    mapping(address => bool) public authorizedMinters;
    mapping(address => uint256) public positiveScore;
    mapping(address => uint256) public negativeScore;
    mapping(address => uint256) public totalTransactions;
    
    uint256 public constant MAX_REPUTATION = 1000000 * 10**18;
    
    event ReputationMinted(address indexed account, uint256 amount, string reason);
    event ReputationBurned(address indexed account, uint256 amount, string reason);
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event TransactionRecorded(address indexed party1, address indexed party2, bool successful);
    
    modifier onlyAuthorized() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor() ERC20("B2B Reputation Token", "B2BREP") {
        authorizedMinters[msg.sender] = true;
    }
    
    /**
     * @dev Mint reputation tokens (reward)
     */
    function mintReputation(
        address account,
        uint256 amount,
        string memory reason,
        address relatedParty
    ) external onlyAuthorized whenNotPaused {
        require(account != address(0), "Invalid address");
        require(balanceOf(account) + amount <= MAX_REPUTATION, "Max reputation exceeded");
        
        _mint(account, amount);
        positiveScore[account] += amount;
        
        reputationHistory[account].push(ReputationRecord({
            timestamp: block.timestamp,
            change: int256(amount),
            reason: reason,
            relatedParty: relatedParty
        }));
        
        emit ReputationMinted(account, amount, reason);
    }
    
    /**
     * @dev Burn reputation tokens (penalty)
     */
    function burnReputation(
        address account,
        uint256 amount,
        string memory reason,
        address relatedParty
    ) external onlyAuthorized whenNotPaused {
        require(account != address(0), "Invalid address");
        
        uint256 burnAmount = amount > balanceOf(account) ? balanceOf(account) : amount;
        if (burnAmount > 0) {
            _burn(account, burnAmount);
        }
        
        negativeScore[account] += amount;
        
        reputationHistory[account].push(ReputationRecord({
            timestamp: block.timestamp,
            change: -int256(amount),
            reason: reason,
            relatedParty: relatedParty
        }));
        
        emit ReputationBurned(account, amount, reason);
    }
    
    /**
     * @dev Record successful transaction
     */
    function recordTransaction(
        address party1,
        address party2,
        uint256 rewardAmount,
        bool successful
    ) external onlyAuthorized whenNotPaused {
        totalTransactions[party1]++;
        totalTransactions[party2]++;
        
        if (successful && rewardAmount > 0) {
            if (balanceOf(party1) + rewardAmount <= MAX_REPUTATION) {
                _mint(party1, rewardAmount);
                positiveScore[party1] += rewardAmount;
            }
            if (balanceOf(party2) + rewardAmount <= MAX_REPUTATION) {
                _mint(party2, rewardAmount);
                positiveScore[party2] += rewardAmount;
            }
        }
        
        emit TransactionRecorded(party1, party2, successful);
    }
    
    /**
     * @dev Get reputation score (0-100)
     */
    function getReputationScore(address account) external view returns (uint256) {
        uint256 balance = balanceOf(account);
        if (balance == 0) return 50; // Default score
        
        uint256 total = positiveScore[account] + negativeScore[account];
        if (total == 0) return 50;
        
        return (positiveScore[account] * 100) / total;
    }
    
    /**
     * @dev Get reputation level
     */
    function getReputationLevel(address account) external view returns (string memory) {
        uint256 balance = balanceOf(account);
        
        if (balance >= 100000 * 10**18) return "Diamond";
        if (balance >= 50000 * 10**18) return "Platinum";
        if (balance >= 20000 * 10**18) return "Gold";
        if (balance >= 5000 * 10**18) return "Silver";
        if (balance >= 1000 * 10**18) return "Bronze";
        return "New";
    }
    
    /**
     * @dev Get account stats
     */
    function getAccountStats(address account) external view returns (
        uint256 balance,
        uint256 positive,
        uint256 negative,
        uint256 transactions,
        uint256 historyCount
    ) {
        return (
            balanceOf(account),
            positiveScore[account],
            negativeScore[account],
            totalTransactions[account],
            reputationHistory[account].length
        );
    }
    
    /**
     * @dev Get reputation history
     */
    function getReputationHistory(address account, uint256 limit) 
        external view returns (ReputationRecord[] memory) 
    {
        ReputationRecord[] storage history = reputationHistory[account];
        uint256 count = history.length < limit ? history.length : limit;
        
        ReputationRecord[] memory result = new ReputationRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = history[history.length - 1 - i];
        }
        return result;
    }
    
    // Admin functions
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }
    
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    
    // Override transfer to make non-transferable
    function transfer(address, uint256) public pure override returns (bool) {
        revert("Non-transferable");
    }
    
    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("Non-transferable");
    }
    
    function approve(address, uint256) public pure override returns (bool) {
        revert("Non-transferable");
    }
}
