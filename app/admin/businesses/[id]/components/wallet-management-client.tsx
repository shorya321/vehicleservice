'use client';

/**
 * Wallet Management Client Component
 * Fetches wallet data and renders the wallet overview
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { WalletOverview } from './wallet-overview';

interface WalletManagementClientProps {
  businessId: string;
}

export function WalletManagementClient({ businessId }: WalletManagementClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWalletData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/wallet`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load wallet data');
      }

      setWalletData(data.data);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load wallet data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const handleRefresh = useCallback(() => {
    loadWalletData();
  }, [loadWalletData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4 max-w-md">
          <div className="flex items-center justify-center">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Failed to Load Wallet</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No wallet data available</p>
        </div>
      </div>
    );
  }

  return <WalletOverview walletData={walletData} onRefresh={handleRefresh} />;
}
