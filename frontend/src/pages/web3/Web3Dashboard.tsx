import React, { useEffect, useState } from 'react';
import { useWeb3, getExplorerUrl } from '../../web3/Web3Context';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { contractsApi } from '../../api';
import { Loader2, Wallet, TrendingUp, ShoppingCart, Award, Plus, FileText, Shield, CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, RefreshCw, Eye, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface Contract { id: number; product: { name: string }; supplier: { company_name: string }; shop: { shop_name: string }; agreed_price: number; quantity: number; status: string; }

const Web3Dashboard: React.FC = () => {
  const { isConnected, isConnecting, account, chainId, balance, networkName, connect, disconnect, getReputation, getMyEscrows, getEscrow, getMilestones, createEscrow, releaseAllFunds, openDispute, cancelEscrow, completeMilestone, approveMilestone, issueCertificate, verifyCertificate, getCertificate } = useWeb3();

  const [loading, setLoading] = useState(false);
  const [reputation, setReputation] = useState<any>(null);
  const [buyerEscrows, setBuyerEscrows] = useState<number[]>([]);
  const [sellerEscrows, setSellerEscrows] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'create-escrow' | 'my-escrows' | 'certificates'>('overview');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [buyerEscrowDetails, setBuyerEscrowDetails] = useState<any[]>([]);
  const [sellerEscrowDetails, setSellerEscrowDetails] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ contractId: '', sellerAddress: '', productName: '', quantity: 1, amountEth: '0.01' });
  const [creating, setCreating] = useState(false);
  const [certForm, setCertForm] = useState({ productId: '', productName: '', quantity: 1, validityDays: 365, batchNumber: '', origin: 'Vietnam' });
  const [verifyTokenId, setVerifyTokenId] = useState('');
  const [certResult, setCertResult] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!isConnected || !account) return;
      setLoading(true); setError(null);
      try {
        const rep = await getReputation(); setReputation(rep);
        const buyerIds = await getMyEscrows(true);
        const sellerIds = await getMyEscrows(false);
        setBuyerEscrows(buyerIds); setSellerEscrows(sellerIds);
        await loadEscrowDetails(buyerIds, sellerIds);
      } catch (err: any) { console.error('Error loading user data:', err); setError(err.message || 'Failed to load user data'); }
      finally { setLoading(false); }
    };
    loadUserData();
  }, [isConnected, account]);

  const loadEscrowDetails = async (buyerIds: number[], sellerIds: number[]) => {
    try {
      const buyerDetails = await Promise.all(buyerIds.slice(0, 10).map(async (id) => { const escrow = await getEscrow(id); const milestones = await getMilestones(id); return { ...escrow, milestones }; }));
      const sellerDetails = await Promise.all(sellerIds.slice(0, 10).map(async (id) => { const escrow = await getEscrow(id); const milestones = await getMilestones(id); return { ...escrow, milestones }; }));
      setBuyerEscrowDetails(buyerDetails); setSellerEscrowDetails(sellerDetails);
    } catch (err) { console.error('Error loading escrow details:', err); }
  };

  const loadContracts = async () => {
    setLoadingContracts(true);
    try { const response = await contractsApi.list(); setContracts(response.data.filter((c: Contract) => c.status === 'active')); }
    catch (err) { console.error('Error loading contracts:', err); }
    finally { setLoadingContracts(false); }
  };

  useEffect(() => { if (activeTab === 'create-escrow' && isConnected) { loadContracts(); } }, [activeTab, isConnected]);

  const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  const copyAddress = () => { if (account) { navigator.clipboard.writeText(account); toast.success('Đã copy địa chỉ ví!'); } };

  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.sellerAddress || !createForm.amountEth) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    setCreating(true);
    try {
      const escrowId = await createEscrow(createForm.sellerAddress, parseInt(createForm.contractId) || 0, createForm.productName, createForm.quantity, createForm.amountEth);
      toast.success(`Đã tạo Escrow #${escrowId} thành công!`);
      setCreateForm({ contractId: '', sellerAddress: '', productName: '', quantity: 1, amountEth: '0.01' });
      setActiveTab('my-escrows');
      const buyerIds = await getMyEscrows(true); const sellerIds = await getMyEscrows(false);
      setBuyerEscrows(buyerIds); setSellerEscrows(sellerIds); await loadEscrowDetails(buyerIds, sellerIds);
    } catch (err: any) { console.error('Error creating escrow:', err); toast.error(err.message || 'Lỗi tạo escrow'); }
    finally { setCreating(false); }
  };

  const handleSelectContract = (contract: Contract) => {
    setCreateForm({ contractId: contract.id.toString(), sellerAddress: '', productName: contract.product.name, quantity: contract.quantity, amountEth: (contract.agreed_price * contract.quantity / 50000000).toFixed(4) });
    toast.success(`Đã chọn hợp đồng: ${contract.product.name}`);
  };

  const handleReleaseAll = async (escrowId: number) => {
    if (!confirm('Xác nhận giải phóng toàn bộ tiền cho người bán?')) return;
    try { await releaseAllFunds(escrowId); toast.success('Đã giải phóng tiền thành công!'); const buyerIds = await getMyEscrows(true); const sellerIds = await getMyEscrows(false); await loadEscrowDetails(buyerIds, sellerIds); }
    catch (err: any) { toast.error(err.message || 'Lỗi giải phóng tiền'); }
  };

  const handleDispute = async (escrowId: number) => {
    const reason = prompt('Nhập lý do tranh chấp:'); if (!reason) return;
    try { await openDispute(escrowId, reason); toast.success('Đã mở tranh chấp!'); const buyerIds = await getMyEscrows(true); const sellerIds = await getMyEscrows(false); await loadEscrowDetails(buyerIds, sellerIds); }
    catch (err: any) { toast.error(err.message || 'Lỗi mở tranh chấp'); }
  };

  const handleCancel = async (escrowId: number) => {
    if (!confirm('Xác nhận hủy escrow và hoàn tiền?')) return;
    try { await cancelEscrow(escrowId); toast.success('Đã hủy escrow!'); const buyerIds = await getMyEscrows(true); const sellerIds = await getMyEscrows(false); await loadEscrowDetails(buyerIds, sellerIds); }
    catch (err: any) { toast.error(err.message || 'Lỗi hủy escrow'); }
  };

  const handleCompleteMilestone = async (escrowId: number, index: number) => {
    try { await completeMilestone(escrowId, index); toast.success('Đã đánh dấu milestone hoàn thành!'); const buyerIds = await getMyEscrows(true); const sellerIds = await getMyEscrows(false); await loadEscrowDetails(buyerIds, sellerIds); }
    catch (err: any) { toast.error(err.message || 'Lỗi cập nhật milestone'); }
  };

  const handleApproveMilestone = async (escrowId: number, index: number) => {
    try { await approveMilestone(escrowId, index); toast.success('Đã phê duyệt milestone và giải phóng tiền!'); const buyerIds = await getMyEscrows(true); const sellerIds = await getMyEscrows(false); await loadEscrowDetails(buyerIds, sellerIds); }
    catch (err: any) { toast.error(err.message || 'Lỗi phê duyệt milestone'); }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!account) return;
    try { const tokenId = await issueCertificate(account, parseInt(certForm.productId), certForm.productName, certForm.quantity, certForm.validityDays, certForm.batchNumber, certForm.origin, `ipfs://certificate/${certForm.productId}`); toast.success(`Đã phát hành NFT Certificate #${tokenId}!`); setCertForm({ productId: '', productName: '', quantity: 1, validityDays: 365, batchNumber: '', origin: 'Vietnam' }); }
    catch (err: any) { toast.error(err.message || 'Lỗi phát hành certificate'); }
  };

  const handleVerifyCertificate = async () => {
    if (!verifyTokenId) return;
    try { const result = await verifyCertificate(parseInt(verifyTokenId)); const cert = await getCertificate(parseInt(verifyTokenId)); setCertResult({ ...result, ...cert }); toast.success('Đã xác minh certificate!'); }
    catch (err: any) { toast.error(err.message || 'Không tìm thấy certificate'); setCertResult(null); }
  };

  const handleRefresh = async () => {
    if (!isConnected || !account) return; setLoading(true);
    try { const rep = await getReputation(); setReputation(rep); const buyerIds = await getMyEscrows(true); const sellerIds = await getMyEscrows(false); setBuyerEscrows(buyerIds); setSellerEscrows(sellerIds); await loadEscrowDetails(buyerIds, sellerIds); toast.success('Đã cập nhật dữ liệu!'); }
    catch (err: any) { toast.error('Lỗi cập nhật dữ liệu'); } finally { setLoading(false); }
  };

  const getStatusBadge = (status: number, statusName: string) => {
    const variants: Record<number, "default" | "secondary" | "destructive" | "outline"> = { 0: "outline", 1: "secondary", 2: "default", 3: "default", 4: "destructive", 5: "outline", 6: "destructive" };
    return <Badge variant={variants[status] || "outline"}>{statusName}</Badge>;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle className="text-center">Connect Your Wallet</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">Connect your Web3 wallet to access the blockchain features</p>
            <Button onClick={connect} disabled={isConnecting} className="w-full">
              {isConnecting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</>) : (<><Wallet className="mr-2 h-4 w-4" />Connect Wallet</>)}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold text-gray-900">Web3 Dashboard</h1><p className="text-gray-600 mt-1">Manage your blockchain transactions and reputation</p></div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="icon" disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
            <Button onClick={disconnect} variant="outline">Disconnect</Button>
          </div>
        </div>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Account Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><p className="text-sm text-gray-600">Address</p><div className="flex items-center gap-2"><p className="font-mono font-medium">{account ? shortenAddress(account) : 'Not connected'}</p><Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}><Copy className="h-3 w-3" /></Button>{account && chainId && (<a href={getExplorerUrl(chainId, 'address', account)} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-6 w-6"><ExternalLink className="h-3 w-3" /></Button></a>)}</div></div>
              <div><p className="text-sm text-gray-600">Balance</p><p className="font-medium">{parseFloat(balance).toFixed(4)} ETH</p></div>
              <div><p className="text-sm text-gray-600">Network</p><Badge variant="outline">{networkName}</Badge></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {[{ id: 'overview', label: 'Tổng quan', icon: TrendingUp }, { id: 'create-escrow', label: 'Tạo Escrow', icon: Plus }, { id: 'my-escrows', label: 'Escrow của tôi', icon: Shield }, { id: 'certificates', label: 'NFT Certificate', icon: FileText }].map((tab) => (
            <Button key={tab.id} onClick={() => setActiveTab(tab.id as any)} variant={activeTab === tab.id ? 'default' : 'outline'} className="flex items-center gap-2"><tab.icon className="h-4 w-4" />{tab.label}</Button>
          ))}
        </div>

        {loading ? (<Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /><span className="ml-2 text-gray-600">Loading data...</span></CardContent></Card>) : (
          <>
            {activeTab === 'overview' && (
              <>
                {reputation && (<Card><CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Reputation Score</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><div className="text-center p-4 bg-blue-50 rounded-lg"><p className="text-sm text-gray-600">Level</p><p className="text-2xl font-bold text-blue-600">{reputation.level}</p></div><div className="text-center p-4 bg-green-50 rounded-lg"><p className="text-sm text-gray-600">Score</p><p className="text-2xl font-bold text-green-600">{reputation.score}</p></div><div className="text-center p-4 bg-purple-50 rounded-lg"><p className="text-sm text-gray-600">Positive</p><p className="text-2xl font-bold text-purple-600">{parseFloat(reputation.positiveScore).toFixed(2)}</p></div><div className="text-center p-4 bg-orange-50 rounded-lg"><p className="text-sm text-gray-600">Transactions</p><p className="text-2xl font-bold text-orange-600">{reputation.totalTransactions}</p></div></div></CardContent></Card>)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Buyer Escrows</CardTitle></CardHeader><CardContent><div className="text-center py-6"><p className="text-4xl font-bold text-blue-600">{buyerEscrows.length}</p><p className="text-gray-600 mt-2">Active as Buyer</p></div>{buyerEscrows.length > 0 && (<div className="mt-4 space-y-2"><p className="text-sm font-medium text-gray-700">Escrow IDs:</p><div className="flex flex-wrap gap-2">{buyerEscrows.slice(0, 5).map((id) => (<Badge key={id} variant="secondary">#{id}</Badge>))}{buyerEscrows.length > 5 && (<Badge variant="outline">+{buyerEscrows.length - 5} more</Badge>)}</div></div>)}</CardContent></Card>
                  <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Seller Escrows</CardTitle></CardHeader><CardContent><div className="text-center py-6"><p className="text-4xl font-bold text-green-600">{sellerEscrows.length}</p><p className="text-gray-600 mt-2">Active as Seller</p></div>{sellerEscrows.length > 0 && (<div className="mt-4 space-y-2"><p className="text-sm font-medium text-gray-700">Escrow IDs:</p><div className="flex flex-wrap gap-2">{sellerEscrows.slice(0, 5).map((id) => (<Badge key={id} variant="secondary">#{id}</Badge>))}{sellerEscrows.length > 5 && (<Badge variant="outline">+{sellerEscrows.length - 5} more</Badge>)}</div></div>)}</CardContent></Card>
                </div>
                <Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Button className="w-full" variant="outline" onClick={() => setActiveTab('create-escrow')}><Plus className="mr-2 h-4 w-4" />Create Escrow</Button><Button className="w-full" variant="outline" onClick={() => setActiveTab('certificates')}><FileText className="mr-2 h-4 w-4" />Issue Certificate</Button><Button className="w-full" variant="outline" onClick={() => setActiveTab('my-escrows')}><Eye className="mr-2 h-4 w-4" />View My Escrows</Button></div></CardContent></Card>
              </>
            )}

            {activeTab === 'create-escrow' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Hợp đồng có thể tạo Escrow</CardTitle></CardHeader><CardContent>{loadingContracts ? (<div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>) : contracts.length === 0 ? (<p className="text-gray-500 text-center py-8">Không có hợp đồng active nào</p>) : (<div className="space-y-3 max-h-96 overflow-y-auto">{contracts.map((contract) => (<div key={contract.id} className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition" onClick={() => handleSelectContract(contract)}><div className="flex justify-between items-start mb-2"><h3 className="font-semibold">{contract.product.name}</h3><Badge variant="secondary">Active</Badge></div><div className="grid grid-cols-2 gap-2 text-sm text-gray-600"><div>Supplier: {contract.supplier.company_name}</div><div>Giá: {formatPrice(contract.agreed_price)}</div><div>Số lượng: {contract.quantity}</div><div className="font-semibold text-blue-600">Tổng: {formatPrice(contract.agreed_price * contract.quantity)}</div></div><Button size="sm" className="mt-3 w-full" variant="outline"><Plus className="mr-2 h-4 w-4" />Chọn hợp đồng này</Button></div>))}</div>)}</CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Tạo Escrow mới</CardTitle></CardHeader><CardContent><form onSubmit={handleCreateEscrow} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Contract ID (từ hệ thống)</label><input type="number" value={createForm.contractId} onChange={(e) => setCreateForm({ ...createForm, contractId: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="ID hợp đồng" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ ví người bán *</label><input type="text" value={createForm.sellerAddress} onChange={(e) => setCreateForm({ ...createForm, sellerAddress: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" placeholder="0x..." required /><p className="text-xs text-gray-500 mt-1">Nhập địa chỉ ví MetaMask của supplier</p></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label><input type="text" value={createForm.productName} onChange={(e) => setCreateForm({ ...createForm, productName: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Laptop Dell XPS 15" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label><input type="number" value={createForm.quantity} onChange={(e) => setCreateForm({ ...createForm, quantity: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" min="1" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (ETH) *</label><input type="text" value={createForm.amountEth} onChange={(e) => setCreateForm({ ...createForm, amountEth: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="0.1" required /></div></div><Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>Khi tạo escrow, <strong>{createForm.amountEth || '0'} ETH</strong> sẽ được chuyển vào smart contract.</AlertDescription></Alert><Button type="submit" disabled={creating || !createForm.sellerAddress} className="w-full">{creating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tạo...</>) : (<><Send className="mr-2 h-4 w-4" />Tạo Escrow ({createForm.amountEth} ETH)</>)}</Button></form></CardContent></Card>
              </div>
            )}

            {activeTab === 'my-escrows' && (
              <div className="space-y-6">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Escrow mua hàng (Buyer)</CardTitle></CardHeader><CardContent>{buyerEscrowDetails.length === 0 ? (<p className="text-gray-500 text-center py-8">Chưa có escrow nào</p>) : (<div className="space-y-4">{buyerEscrowDetails.map((escrow) => (<div key={escrow.id} className="p-4 border rounded-lg"><div className="flex flex-wrap justify-between items-start gap-4 mb-4"><div><div className="flex items-center gap-2 mb-1"><span className="font-bold text-lg">Escrow #{escrow.id}</span>{getStatusBadge(escrow.status, escrow.statusName)}</div><p className="text-gray-600">{escrow.productName || 'N/A'}</p></div><div className="text-right"><p className="text-2xl font-bold">{escrow.totalAmount} ETH</p><p className="text-gray-500 text-sm">Đã release: {escrow.releasedAmount} ETH</p></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4"><div><p className="text-gray-500">Seller</p><p className="font-mono">{shortenAddress(escrow.seller)}</p></div><div><p className="text-gray-500">Số lượng</p><p>{escrow.quantity}</p></div><div><p className="text-gray-500">Contract ID</p><p>#{escrow.contractId}</p></div><div><p className="text-gray-500">Ngày tạo</p><p>{escrow.createdAt.toLocaleDateString()}</p></div></div>{escrow.milestones && escrow.milestones.length > 0 && (<div className="mb-4"><p className="text-sm font-medium text-gray-700 mb-2">Milestones:</p><div className="space-y-2">{escrow.milestones.map((m: any, idx: number) => (<div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2"><span className="text-sm">{m.description}</span><div className="flex items-center gap-2"><span className="text-gray-500 text-sm">{m.amount} ETH</span>{getStatusBadge(m.status, m.statusName)}{m.status === 1 && (<Button size="sm" onClick={() => handleApproveMilestone(escrow.id, idx)}>Approve</Button>)}</div></div>))}</div></div>)}{(escrow.status === 1 || escrow.status === 2) && (<div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => handleReleaseAll(escrow.id)}><CheckCircle className="mr-2 h-4 w-4" />Giải phóng tiền</Button><Button size="sm" variant="destructive" onClick={() => handleDispute(escrow.id)}><AlertTriangle className="mr-2 h-4 w-4" />Mở tranh chấp</Button>{escrow.status === 1 && (<Button size="sm" variant="outline" onClick={() => handleCancel(escrow.id)}><XCircle className="mr-2 h-4 w-4" />Hủy & Hoàn tiền</Button>)}</div>)}</div>))}</div>)}</CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Escrow bán hàng (Seller)</CardTitle></CardHeader><CardContent>{sellerEscrowDetails.length === 0 ? (<p className="text-gray-500 text-center py-8">Chưa có escrow nào</p>) : (<div className="space-y-4">{sellerEscrowDetails.map((escrow) => (<div key={escrow.id} className="p-4 border rounded-lg"><div className="flex flex-wrap justify-between items-start gap-4 mb-4"><div><div className="flex items-center gap-2 mb-1"><span className="font-bold text-lg">Escrow #{escrow.id}</span>{getStatusBadge(escrow.status, escrow.statusName)}</div><p className="text-gray-600">{escrow.productName || 'N/A'}</p></div><div className="text-right"><p className="text-2xl font-bold text-green-600">{escrow.totalAmount} ETH</p><p className="text-gray-500 text-sm">Đã nhận: {escrow.releasedAmount} ETH</p></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4"><div><p className="text-gray-500">Buyer</p><p className="font-mono">{shortenAddress(escrow.buyer)}</p></div><div><p className="text-gray-500">Số lượng</p><p>{escrow.quantity}</p></div><div><p className="text-gray-500">Contract ID</p><p>#{escrow.contractId}</p></div><div><p className="text-gray-500">Ngày tạo</p><p>{escrow.createdAt.toLocaleDateString()}</p></div></div>{escrow.milestones && escrow.milestones.length > 0 && (<div className="mb-4"><p className="text-sm font-medium text-gray-700 mb-2">Milestones:</p><div className="space-y-2">{escrow.milestones.map((m: any, idx: number) => (<div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2"><span className="text-sm">{m.description}</span><div className="flex items-center gap-2"><span className="text-gray-500 text-sm">{m.amount} ETH</span>{getStatusBadge(m.status, m.statusName)}{m.status === 0 && escrow.status === 2 && (<Button size="sm" variant="secondary" onClick={() => handleCompleteMilestone(escrow.id, idx)}>Hoàn thành</Button>)}</div></div>))}</div></div>)}</div>))}</div>)}</CardContent></Card>
              </div>
            )}

            {activeTab === 'certificates' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Phát hành NFT Certificate</CardTitle></CardHeader><CardContent><form onSubmit={handleIssueCertificate} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Product ID *</label><input type="number" value={certForm.productId} onChange={(e) => setCertForm({ ...certForm, productId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label><input type="number" value={certForm.quantity} onChange={(e) => setCertForm({ ...certForm, quantity: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label><input type="text" value={certForm.productName} onChange={(e) => setCertForm({ ...certForm, productName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label><input type="text" value={certForm.batchNumber} onChange={(e) => setCertForm({ ...certForm, batchNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="BATCH-2024-001" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Xuất xứ</label><input type="text" value={certForm.origin} onChange={(e) => setCertForm({ ...certForm, origin: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Hiệu lực (ngày)</label><input type="number" value={certForm.validityDays} onChange={(e) => setCertForm({ ...certForm, validityDays: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div><Button type="submit" className="w-full"><FileText className="mr-2 h-4 w-4" />Phát hành Certificate</Button></form></CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Xác minh Certificate</CardTitle></CardHeader><CardContent className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Token ID</label><div className="flex gap-2"><input type="number" value={verifyTokenId} onChange={(e) => setVerifyTokenId(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" placeholder="Nhập Token ID" /><Button onClick={handleVerifyCertificate}>Xác minh</Button></div></div>{certResult && (<div className="p-4 border rounded-lg"><div className="flex items-center gap-3 mb-4">{certResult.isValid ? (<CheckCircle className="h-8 w-8 text-green-500" />) : (<XCircle className="h-8 w-8 text-red-500" />)}<div><p className={`font-bold text-lg ${certResult.isValid ? 'text-green-600' : 'text-red-600'}`}>{certResult.isValid ? 'Certificate hợp lệ' : 'Certificate không hợp lệ'}</p><p className="text-gray-500 text-sm">{certResult.status}</p></div></div><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-gray-500">Token ID</p><p className="font-medium">#{certResult.tokenId}</p></div><div><p className="text-gray-500">Product ID</p><p className="font-medium">#{certResult.productId}</p></div><div><p className="text-gray-500">Tên sản phẩm</p><p className="font-medium">{certResult.productName}</p></div><div><p className="text-gray-500">Xuất xứ</p><p className="font-medium">{certResult.origin}</p></div><div><p className="text-gray-500">Batch</p><p className="font-medium">{certResult.batchNumber}</p></div><div><p className="text-gray-500">Còn hiệu lực</p><p className="font-medium">{certResult.daysRemaining} ngày</p></div><div><p className="text-gray-500">Supplier</p><p className="font-mono text-sm">{shortenAddress(certResult.supplier)}</p></div><div><p className="text-gray-500">Owner</p><p className="font-mono text-sm">{shortenAddress(certResult.currentOwner)}</p></div></div></div>)}</CardContent></Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Web3Dashboard;
