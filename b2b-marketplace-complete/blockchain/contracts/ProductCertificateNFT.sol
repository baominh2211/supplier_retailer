// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ProductCertificateNFT
 * @dev NFT for product certificates with supply chain tracking
 */
contract ProductCertificateNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    enum CertificateStatus { Active, Transferred, Revoked, Expired }
    
    struct Certificate {
        uint256 productId;
        string productName;
        address supplier;
        address currentOwner;
        uint256 quantity;
        uint256 issuedAt;
        uint256 expiresAt;
        CertificateStatus status;
        string batchNumber;
        string origin;
    }
    
    struct SupplyChainEvent {
        uint256 timestamp;
        address actor;
        string action;
        string location;
        string details;
    }
    
    mapping(uint256 => Certificate) public certificates;
    mapping(uint256 => SupplyChainEvent[]) public supplyChainHistory;
    mapping(address => bool) public authorizedIssuers;
    mapping(uint256 => uint256) public productToCertificate;
    
    event CertificateIssued(uint256 indexed tokenId, uint256 indexed productId, address indexed supplier);
    event CertificateTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event CertificateRevoked(uint256 indexed tokenId, string reason);
    event SupplyChainEventAdded(uint256 indexed tokenId, string action, string location);
    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    
    modifier onlyAuthorized() {
        require(authorizedIssuers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier certificateExists(uint256 tokenId) {
        require(_exists(tokenId), "Certificate not exist");
        _;
    }
    
    constructor() ERC721("B2B Product Certificate", "B2BCERT") {
        authorizedIssuers[msg.sender] = true;
    }
    
    /**
     * @dev Issue new certificate
     */
    function issueCertificate(
        address to,
        uint256 productId,
        string memory productName,
        uint256 quantity,
        uint256 validityDays,
        string memory batchNumber,
        string memory origin,
        string memory tokenURI_
    ) external onlyAuthorized returns (uint256) {
        require(to != address(0), "Invalid address");
        require(productToCertificate[productId] == 0, "Certificate exists for product");
        
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI_);
        
        certificates[newTokenId] = Certificate({
            productId: productId,
            productName: productName,
            supplier: msg.sender,
            currentOwner: to,
            quantity: quantity,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + (validityDays * 1 days),
            status: CertificateStatus.Active,
            batchNumber: batchNumber,
            origin: origin
        });
        
        productToCertificate[productId] = newTokenId;
        
        supplyChainHistory[newTokenId].push(SupplyChainEvent({
            timestamp: block.timestamp,
            actor: msg.sender,
            action: "Certificate Issued",
            location: origin,
            details: string(abi.encodePacked("Batch: ", batchNumber))
        }));
        
        emit CertificateIssued(newTokenId, productId, msg.sender);
        
        return newTokenId;
    }
    
    /**
     * @dev Add supply chain event
     */
    function addSupplyChainEvent(
        uint256 tokenId,
        string memory action,
        string memory location,
        string memory details
    ) external certificateExists(tokenId) {
        require(
            ownerOf(tokenId) == msg.sender || 
            authorizedIssuers[msg.sender] || 
            msg.sender == owner(),
            "Not authorized"
        );
        require(certificates[tokenId].status == CertificateStatus.Active, "Certificate not active");
        
        supplyChainHistory[tokenId].push(SupplyChainEvent({
            timestamp: block.timestamp,
            actor: msg.sender,
            action: action,
            location: location,
            details: details
        }));
        
        emit SupplyChainEventAdded(tokenId, action, location);
    }
    
    /**
     * @dev Transfer certificate with tracking
     */
    function transferCertificate(
        uint256 tokenId,
        address to,
        string memory location,
        string memory details
    ) external certificateExists(tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(to != address(0), "Invalid address");
        require(certificates[tokenId].status == CertificateStatus.Active, "Not active");
        
        address from = msg.sender;
        
        _transfer(from, to, tokenId);
        certificates[tokenId].currentOwner = to;
        
        supplyChainHistory[tokenId].push(SupplyChainEvent({
            timestamp: block.timestamp,
            actor: msg.sender,
            action: "Ownership Transferred",
            location: location,
            details: details
        }));
        
        emit CertificateTransferred(tokenId, from, to);
    }
    
    /**
     * @dev Revoke certificate
     */
    function revokeCertificate(uint256 tokenId, string memory reason) 
        external certificateExists(tokenId) onlyAuthorized 
    {
        require(certificates[tokenId].status == CertificateStatus.Active, "Not active");
        
        certificates[tokenId].status = CertificateStatus.Revoked;
        
        supplyChainHistory[tokenId].push(SupplyChainEvent({
            timestamp: block.timestamp,
            actor: msg.sender,
            action: "Certificate Revoked",
            location: "",
            details: reason
        }));
        
        emit CertificateRevoked(tokenId, reason);
    }
    
    /**
     * @dev Verify certificate
     */
    function verifyCertificate(uint256 tokenId) external view returns (
        bool isValid,
        string memory status,
        uint256 daysRemaining
    ) {
        if (!_exists(tokenId)) {
            return (false, "Not Found", 0);
        }
        
        Certificate memory cert = certificates[tokenId];
        
        if (cert.status == CertificateStatus.Revoked) {
            return (false, "Revoked", 0);
        }
        
        if (block.timestamp > cert.expiresAt) {
            return (false, "Expired", 0);
        }
        
        uint256 remaining = (cert.expiresAt - block.timestamp) / 1 days;
        return (true, "Active", remaining);
    }
    
    /**
     * @dev Get certificate details
     */
    function getCertificate(uint256 tokenId) external view returns (Certificate memory) {
        require(_exists(tokenId), "Not exist");
        return certificates[tokenId];
    }
    
    /**
     * @dev Get supply chain history
     */
    function getSupplyChainHistory(uint256 tokenId) 
        external view returns (SupplyChainEvent[] memory) 
    {
        return supplyChainHistory[tokenId];
    }
    
    /**
     * @dev Get certificate by product ID
     */
    function getCertificateByProduct(uint256 productId) external view returns (uint256) {
        return productToCertificate[productId];
    }
    
    // Admin functions
    function authorizeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }
    
    function revokeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }
    
    // Required overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) 
        public view override(ERC721, ERC721URIStorage) returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) 
        public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
    
    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
