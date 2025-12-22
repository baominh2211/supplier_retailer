import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Contract ABIs matching the deployed contracts
const ESCROW_ABI = [
  "function createEscrow(address _seller, uint256 _contractId, string memory _productName, uint256 _quantity) external payable returns (uint256)",
  "function addMilestone(uint256 escrowId, string memory _description, uint256 _amount, uint256 _deadline) external",
  "function completeMilestone(uint256 escrowId, uint256 milestoneIndex) external",
  "function approveMilestone(uint256 escrowId, uint256 milestoneIndex) external",
  "function releaseAllFunds(uint256 escrowId) external",
  "function openDispute(uint256 escrowId, string memory reason) external",
  "function cancelEscrow(uint256 escrowId) external",
  "function getEscrow(uint256 escrowId) external view returns (tuple(uint256 id, address buyer, address seller, uint256 totalAmount, uint256 releasedAmount, uint256 createdAt, uint256 contractId, uint8 status, string productName, uint256 quantity))",
  "function getMilestones(uint256 escrowId) external view returns (tuple(string description, uint256 amount, uint256 deadline, uint8 status, bool fundsReleased)[])",
  "function getBuyerEscrows(address buyer) external view returns (uint256[])",
  "function getSellerEscrows(address seller) external view returns (uint256[])",
  "function platformFeePercent() external view returns (uint256)",
  "event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount)",
  "event EscrowFunded(uint256 indexed escrowId, uint256 amount)",
  "event MilestoneApproved(uint256 indexed escrowId, uint256 milestoneIndex, uint256 amount)",
  "event FundsReleased(uint256 indexed escrowId, address indexed seller, uint256 amount)",
  "event EscrowCompleted(uint256 indexed escrowId)",
  "event EscrowDisputed(uint256 indexed escrowId, address indexed disputedBy, string reason)",
];

const NFT_ABI = [
  "function issueCertificate(address to, uint256 productId, string memory productName, uint256 quantity, uint256 validityDays, string memory batchNumber, string memory origin, string memory tokenURI_) external returns (uint256)",
  "function addSupplyChainEvent(uint256 tokenId, string memory action, string memory location, string memory details) external",
  "function transferCertificate(uint256 tokenId, address to, string memory location, string memory details) external",
  "function revokeCertificate(uint256 tokenId, string memory reason) external",
  "function verifyCertificate(uint256 tokenId) external view returns (bool isValid, string memory status, uint256 daysRemaining)",
  "function getCertificate(uint256 tokenId) external view returns (tuple(uint256 productId, string productName, address supplier, address currentOwner, uint256 quantity, uint256 issuedAt, uint256 expiresAt, uint8 status, string batchNumber, string origin))",
  "function getSupplyChainHistory(uint256 tokenId) external view returns (tuple(uint256 timestamp, address actor, string action, string location, string details)[])",
  "function getCertificateByProduct(uint256 productId) external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function totalSupply() external view returns (uint256)",
  "event CertificateIssued(uint256 indexed tokenId, uint256 indexed productId, address indexed supplier)",
  "event SupplyChainEventAdded(uint256 indexed tokenId, string action, string location)",
  "event CertificateTransferred(uint256 indexed tokenId, address indexed from, address indexed to)",
];

const REPUTATION_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function getReputationScore(address account) external view returns (uint256)",
  "function getReputationLevel(address account) external view returns (string memory)",
  "function getAccountStats(address account) external view returns (uint256 balance, uint256 positive, uint256 negative, uint256 transactions, uint256 historyCount)",
  "function getReputationHistory(address account, uint256 limit) external view returns (tuple(uint256 timestamp, int256 change, string reason, address relatedParty)[])",
  "function positiveScore(address) external view returns (uint256)",
  "function negativeScore(address) external view returns (uint256)",
  "function totalTransactions(address) external view returns (uint256)",
  "event ReputationMinted(address indexed account, uint256 amount, string reason)",
  "event ReputationBurned(address indexed account, uint256 amount, string reason)",
  "event TransactionRecorded(address indexed party1, address indexed party2, bool successful)",
];

// Contract addresses - UPDATE THESE after deployment
const CONTRACT_ADDRESSES = {
  // Sepolia Testnet (YOUR DEPLOYED ADDRESSES)
  11155111: {
    escrow: '0x7b985Ded6Fd66E5aa39a212643a1315b6bf22482',
    nft: '0xa197A070ad8613B3F384A2A4C149aB9597CAb373',
    reputation: '0x933C3372EC9b8D6489Fff16B1Fa1E7464727c901',
  },
  // Polygon Mainnet (placeholder)
  137: {
    escrow: '0x89a4866a0aDe723485f127515926566CC2AA4f59',
    nft: '0x43948a12E5eb0c61Cd75D1499637341ac6dF7Fd2',
    reputation: '0x7b05Dc77eAD8c974905e9D602F4C843CB2bce432',
  },
  // Local Hardhat
  31337: {
    escrow: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    nft: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    reputation: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  },
};

// Network configurations
const NETWORKS = {
  11155111: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  137: {
    chainId: '0x89',
    chainName: 'Polygon Mainnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
};

// Types
interface Escrow {
  id: number;
  buyer: string;
  seller: string;
  totalAmount: string;
  releasedAmount: string;
  createdAt: Date;
  contractId: number;
  status: number;
  statusName: string;
  productName: string;
  quantity: number;
}

interface Milestone {
  description: string;
  amount: string;
  deadline: Date;
  status: number;
  statusName: string;
  fundsReleased: boolean;
}

interface Certificate {
  tokenId: number;
  productId: number;
  productName: string;
  supplier: string;
  currentOwner: string;
  quantity: number;
  issuedAt: Date;
  expiresAt: Date;
  status: number;
  statusName: string;
  batchNumber: string;
  origin: string;
}

interface SupplyChainEvent {
  timestamp: Date;
  actor: string;
  action: string;
  location: string;
  details: string;
}

interface UserReputation {
  balance: string;
  score: number;
  level: string;
  positiveScore: string;
  negativeScore: string;
  totalTransactions: number;
}

interface Web3ContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | null;
  balance: string;
  networkName: string;
  
  // Contracts
  escrowContract: ethers.Contract | null;
  reputationContract: ethers.Contract | null;
  nftContract: ethers.Contract | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  
  // Escrow functions
  createEscrow: (seller: string, contractId: number, productName: string, quantity: number, amountInEth: string) => Promise<number>;
  addMilestone: (escrowId: number, description: string, amountInEth: string, deadline: number) => Promise<void>;
  completeMilestone: (escrowId: number, milestoneIndex: number) => Promise<void>;
  approveMilestone: (escrowId: number, milestoneIndex: number) => Promise<void>;
  releaseAllFunds: (escrowId: number) => Promise<void>;
  openDispute: (escrowId: number, reason: string) => Promise<void>;
  cancelEscrow: (escrowId: number) => Promise<void>;
  getEscrow: (escrowId: number) => Promise<Escrow>;
  getMilestones: (escrowId: number) => Promise<Milestone[]>;
  getMyEscrows: (asBuyer: boolean) => Promise<number[]>;
  
  // NFT functions
  issueCertificate: (to: string, productId: number, productName: string, quantity: number, validityDays: number, batchNumber: string, origin: string, tokenURI: string) => Promise<number>;
  addSupplyChainEvent: (tokenId: number, action: string, location: string, details: string) => Promise<void>;
  verifyCertificate: (tokenId: number) => Promise<{ isValid: boolean; status: string; daysRemaining: number }>;
  getCertificate: (tokenId: number) => Promise<Certificate>;
  getSupplyChainHistory: (tokenId: number) => Promise<SupplyChainEvent[]>;
  
  // Reputation functions
  getReputation: (address?: string) => Promise<UserReputation>;
  
  // Legacy methods for backward compatibility
  getUserReputation: (address: string) => Promise<UserReputation>;
  getUserOrders: (address: string) => Promise<number[]>;
  getOrder: (orderId: string) => Promise<Escrow>;
}

const ESCROW_STATUS = ['Created', 'Funded', 'InProgress', 'Completed', 'Disputed', 'Refunded', 'Cancelled'];
const MILESTONE_STATUS = ['Pending', 'Completed', 'Approved', 'Rejected'];
const CERT_STATUS = ['Active', 'Transferred', 'Revoked', 'Expired'];

const Web3Context = createContext<Web3ContextType | null>(null);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState('0');
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [escrowContract, setEscrowContract] = useState<ethers.Contract | null>(null);
  const [reputationContract, setReputationContract] = useState<ethers.Contract | null>(null);
  const [nftContract, setNftContract] = useState<ethers.Contract | null>(null);
  const networkName = chainId ? (NETWORKS[chainId as keyof typeof NETWORKS]?.chainName || `Chain ${chainId}`) : 'Not Connected';

  // Initialize contracts
  const initContracts = useCallback(async (signer: ethers.Signer, chainId: number) => {
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    if (!addresses) {
      console.warn(`No contract addresses for chain ${chainId}`);
      return;
    }

    if (addresses.escrow !== '0x0000000000000000000000000000000000000000') {
      setEscrowContract(new ethers.Contract(addresses.escrow, ESCROW_ABI, signer));
    }
    if (addresses.nft !== '0x0000000000000000000000000000000000000000') {
      setNftContract(new ethers.Contract(addresses.nft, NFT_ABI, signer));
    }
    if (addresses.reputation !== '0x0000000000000000000000000000000000000000') {
      setReputationContract(new ethers.Contract(addresses.reputation, REPUTATION_ABI, signer));
    }
  }, []);

  // Connect wallet
  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      await web3Provider.send('eth_requestAccounts', []);
      const signer = web3Provider.getSigner();
      const address = await signer.getAddress();
      const network = await web3Provider.getNetwork();
      const balance = await web3Provider.getBalance(address);

      setProvider(web3Provider);
      setSigner(signer);
      setAccount(address);
      setChainId(network.chainId);
      setBalance(ethers.utils.formatEther(balance));
      setIsConnected(true);

      await initContracts(signer, network.chainId);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect
  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setChainId(null);
    setBalance('0');
    setProvider(null);
    setSigner(null);
    setEscrowContract(null);
    setNftContract(null);
    setReputationContract(null);
  };

  // Switch network
  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return;

    const network = NETWORKS[targetChainId as keyof typeof NETWORKS];
    if (!network) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [network],
        });
      }
    }
  };

  // ==================== ESCROW FUNCTIONS ====================

  const createEscrow = async (seller: string, contractId: number, productName: string, quantity: number, amountInEth: string): Promise<number> => {
    if (!escrowContract) throw new Error('Not connected');
    
    const tx = await escrowContract.createEscrow(seller, contractId, productName, quantity, {
      value: ethers.utils.parseEther(amountInEth)
    });
    const receipt = await tx.wait();
    
    // Parse event to get escrow ID
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = escrowContract.interface.parseLog(log);
        return parsed?.name === 'EscrowCreated';
      } catch { return false; }
    });
    
    if (event) {
      const parsed = escrowContract.interface.parseLog(event);
      return parsed?.args[0].toNumber();
    }
    return 0;
  };

  const addMilestone = async (escrowId: number, description: string, amountInEth: string, deadline: number) => {
    if (!escrowContract) throw new Error('Not connected');
    const tx = await escrowContract.addMilestone(escrowId, description, ethers.utils.parseEther(amountInEth), deadline);
    await tx.wait();
  };

  const completeMilestone = async (escrowId: number, milestoneIndex: number) => {
    if (!escrowContract) throw new Error('Not connected');
    const tx = await escrowContract.completeMilestone(escrowId, milestoneIndex);
    await tx.wait();
  };

  const approveMilestone = async (escrowId: number, milestoneIndex: number) => {
    if (!escrowContract) throw new Error('Not connected');
    const tx = await escrowContract.approveMilestone(escrowId, milestoneIndex);
    await tx.wait();
  };

  const releaseAllFunds = async (escrowId: number) => {
    if (!escrowContract) throw new Error('Not connected');
    const tx = await escrowContract.releaseAllFunds(escrowId);
    await tx.wait();
  };

  const openDispute = async (escrowId: number, reason: string) => {
    if (!escrowContract) throw new Error('Not connected');
    const tx = await escrowContract.openDispute(escrowId, reason);
    await tx.wait();
  };

  const cancelEscrow = async (escrowId: number) => {
    if (!escrowContract) throw new Error('Not connected');
    const tx = await escrowContract.cancelEscrow(escrowId);
    await tx.wait();
  };

  const getEscrow = async (escrowId: number): Promise<Escrow> => {
    if (!escrowContract) throw new Error('Not connected');
    const data = await escrowContract.getEscrow(escrowId);
    
    return {
      id: data.id.toNumber(),
      buyer: data.buyer,
      seller: data.seller,
      totalAmount: ethers.utils.formatEther(data.totalAmount),
      releasedAmount: ethers.utils.formatEther(data.releasedAmount),
      createdAt: new Date(data.createdAt.toNumber() * 1000),
      contractId: data.contractId.toNumber(),
      status: data.status,
      statusName: ESCROW_STATUS[data.status],
      productName: data.productName,
      quantity: data.quantity.toNumber(),
    };
  };

  const getMilestones = async (escrowId: number): Promise<Milestone[]> => {
    if (!escrowContract) throw new Error('Not connected');
    const data = await escrowContract.getMilestones(escrowId);
    
    return data.map((m: any) => ({
      description: m.description,
      amount: ethers.utils.formatEther(m.amount),
      deadline: new Date(m.deadline.toNumber() * 1000),
      status: m.status,
      statusName: MILESTONE_STATUS[m.status],
      fundsReleased: m.fundsReleased,
    }));
  };

  const getMyEscrows = async (asBuyer: boolean): Promise<number[]> => {
    if (!escrowContract || !account) throw new Error('Not connected');
    const ids = asBuyer 
      ? await escrowContract.getBuyerEscrows(account)
      : await escrowContract.getSellerEscrows(account);
    return ids.map((id: ethers.BigNumber) => id.toNumber());
  };

  // ==================== NFT FUNCTIONS ====================

  const issueCertificate = async (
    to: string,
    productId: number,
    productName: string,
    quantity: number,
    validityDays: number,
    batchNumber: string,
    origin: string,
    tokenURI: string
  ): Promise<number> => {
    if (!nftContract) throw new Error('Not connected');
    
    const tx = await nftContract.issueCertificate(
      to, productId, productName, quantity, validityDays, batchNumber, origin, tokenURI
    );
    const receipt = await tx.wait();
    
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = nftContract.interface.parseLog(log);
        return parsed?.name === 'CertificateIssued';
      } catch { return false; }
    });
    
    if (event) {
      const parsed = nftContract.interface.parseLog(event);
      return parsed?.args[0].toNumber();
    }
    return 0;
  };

  const addSupplyChainEvent = async (tokenId: number, action: string, location: string, details: string) => {
    if (!nftContract) throw new Error('Not connected');
    const tx = await nftContract.addSupplyChainEvent(tokenId, action, location, details);
    await tx.wait();
  };

  const verifyCertificate = async (tokenId: number) => {
    if (!nftContract) throw new Error('Not connected');
    const [isValid, status, daysRemaining] = await nftContract.verifyCertificate(tokenId);
    return { isValid, status, daysRemaining: daysRemaining.toNumber() };
  };

  const getCertificate = async (tokenId: number): Promise<Certificate> => {
    if (!nftContract) throw new Error('Not connected');
    const data = await nftContract.getCertificate(tokenId);
    
    return {
      tokenId,
      productId: data.productId.toNumber(),
      productName: data.productName,
      supplier: data.supplier,
      currentOwner: data.currentOwner,
      quantity: data.quantity.toNumber(),
      issuedAt: new Date(data.issuedAt.toNumber() * 1000),
      expiresAt: new Date(data.expiresAt.toNumber() * 1000),
      status: data.status,
      statusName: CERT_STATUS[data.status],
      batchNumber: data.batchNumber,
      origin: data.origin,
    };
  };

  const getSupplyChainHistory = async (tokenId: number): Promise<SupplyChainEvent[]> => {
    if (!nftContract) throw new Error('Not connected');
    const data = await nftContract.getSupplyChainHistory(tokenId);
    
    return data.map((e: any) => ({
      timestamp: new Date(e.timestamp.toNumber() * 1000),
      actor: e.actor,
      action: e.action,
      location: e.location,
      details: e.details,
    }));
  };

  // ==================== REPUTATION FUNCTIONS ====================

  const getReputation = async (address?: string): Promise<UserReputation> => {
    if (!reputationContract) throw new Error('Not connected');
    const userAddress = address || account;
    if (!userAddress) throw new Error('No address');

    const [balance, positive, negative, transactions] = await reputationContract.getAccountStats(userAddress);
    const score = await reputationContract.getReputationScore(userAddress);
    const level = await reputationContract.getReputationLevel(userAddress);

    return {
      balance: ethers.utils.formatEther(balance),
      score: score.toNumber(),
      level,
      positiveScore: ethers.utils.formatEther(positive),
      negativeScore: ethers.utils.formatEther(negative),
      totalTransactions: transactions.toNumber(),
    };
  };

  // ==================== LEGACY COMPATIBILITY METHODS ====================
  
  const getUserReputation = async (address: string): Promise<UserReputation> => {
    return getReputation(address);
  };

  const getUserOrders = async (address: string): Promise<number[]> => {
    if (!escrowContract) throw new Error('Not connected');
    const buyerOrders = await escrowContract.getBuyerEscrows(address);
    const sellerOrders = await escrowContract.getSellerEscrows(address);
    return [...buyerOrders.map((id: ethers.BigNumber) => id.toNumber()), ...sellerOrders.map((id: ethers.BigNumber) => id.toNumber())];
  };

  const getOrder = async (orderId: string): Promise<Escrow> => {
    return getEscrow(Number(orderId));
  };

  // Listen for account/chain changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          connect();
        }
      }
    };
    autoConnect();
  }, []);

  return (
    <Web3Context.Provider
      value={{
        isConnected,
        isConnecting,
        account,
        chainId,
        balance,
        networkName,
        escrowContract,
        nftContract,
        reputationContract,
        connect,
        disconnect,
        switchNetwork,
        createEscrow,
        addMilestone,
        completeMilestone,
        approveMilestone,
        releaseAllFunds,
        openDispute,
        cancelEscrow,
        getEscrow,
        getMilestones,
        getMyEscrows,
        issueCertificate,
        addSupplyChainEvent,
        verifyCertificate,
        getCertificate,
        getSupplyChainHistory,
        getReputation,
        getUserReputation,
        getUserOrders,
        getOrder,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

// Helper to get explorer URL
export const getExplorerUrl = (chainId: number, type: 'tx' | 'address' | 'token', hash: string) => {
  const explorer = NETWORKS[chainId as keyof typeof NETWORKS]?.blockExplorerUrls[0];
  if (!explorer) return '';
  return `${explorer}/${type}/${hash}`;
};

// Contract addresses export for reference
export { CONTRACT_ADDRESSES };

export default Web3Context;