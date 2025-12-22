import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../../web3/Web3Context';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, Wallet, TrendingUp, ShoppingCart, Award } from 'lucide-react';

const Web3Dashboard: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    account,
    balance,
    networkName,
    connect,
    disconnect,
    getReputation,
    getMyEscrows,
  } = useWeb3();

  const [loading, setLoading] = useState(false);
  const [reputation, setReputation] = useState<any>(null);
  const [buyerEscrows, setBuyerEscrows] = useState<number[]>([]);
  const [sellerEscrows, setSellerEscrows] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load user data when connected
  useEffect(() => {
    const loadUserData = async () => {
      if (!isConnected || !account) return;

      setLoading(true);
      setError(null);

      try {
        // Get reputation - no need to pass account, it uses the connected account by default
        const rep = await getReputation();
        setReputation(rep);

        // Get escrows - pass boolean values (true for buyer, false for seller)
        const buyerIds = await getMyEscrows(true);
        const sellerIds = await getMyEscrows(false);
        
        setBuyerEscrows(buyerIds);
        setSellerEscrows(sellerIds);
      } catch (err: any) {
        console.error('Error loading user data:', err);
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isConnected, account, getReputation, getMyEscrows]);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Connect your Web3 wallet to access the blockchain features
            </p>
            <Button 
              onClick={connect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Web3 Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your blockchain transactions and reputation
            </p>
          </div>
          <Button onClick={disconnect} variant="outline">
            Disconnect
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-mono font-medium">
                  {account ? shortenAddress(account) : 'Not connected'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="font-medium">{parseFloat(balance).toFixed(4)} ETH</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Network</p>
                <Badge variant="outline">{networkName}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading data...</span>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Reputation Card */}
            {reputation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Reputation Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Level</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {reputation.level}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Score</p>
                      <p className="text-2xl font-bold text-green-600">
                        {reputation.score}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Positive</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {parseFloat(reputation.positiveScore).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Transactions</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {reputation.totalTransactions}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Escrows Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Buyer Escrows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-4xl font-bold text-blue-600">
                      {buyerEscrows.length}
                    </p>
                    <p className="text-gray-600 mt-2">Active as Buyer</p>
                  </div>
                  {buyerEscrows.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Escrow IDs:</p>
                      <div className="flex flex-wrap gap-2">
                        {buyerEscrows.slice(0, 5).map((id) => (
                          <Badge key={id} variant="secondary">
                            #{id}
                          </Badge>
                        ))}
                        {buyerEscrows.length > 5 && (
                          <Badge variant="outline">
                            +{buyerEscrows.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Seller Escrows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-4xl font-bold text-green-600">
                      {sellerEscrows.length}
                    </p>
                    <p className="text-gray-600 mt-2">Active as Seller</p>
                  </div>
                  {sellerEscrows.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Escrow IDs:</p>
                      <div className="flex flex-wrap gap-2">
                        {sellerEscrows.slice(0, 5).map((id) => (
                          <Badge key={id} variant="secondary">
                            #{id}
                          </Badge>
                        ))}
                        {sellerEscrows.length > 5 && (
                          <Badge variant="outline">
                            +{sellerEscrows.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="w-full" variant="outline">
                    Create Escrow
                  </Button>
                  <Button className="w-full" variant="outline">
                    Issue Certificate
                  </Button>
                  <Button className="w-full" variant="outline">
                    View History
                 </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Web3Dashboard;