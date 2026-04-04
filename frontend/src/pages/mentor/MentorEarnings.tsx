import { useState } from 'react';
import { Download, ArrowUpRight, ArrowDownLeft, CreditCard, Landmark, Smartphone, Wallet2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MentorLayout from '@/components/MentorLayout';
import { useMentorAnalytics, useWallet, usePayoutMethods, useCreatePayoutMethod, useCreateWithdrawal } from '@/hooks/useApi';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const MentorEarnings = () => {
  const { data: analytics, isLoading: analyticsLoading } = useMentorAnalytics();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: payoutMethods = [] } = usePayoutMethods();
  const createPayoutMethod = useCreatePayoutMethod();
  const createWithdrawal = useCreateWithdrawal();
  const { toast } = useToast();

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPayoutMethodId, setSelectedPayoutMethodId] = useState('');
  const [methodType, setMethodType] = useState<'BANK_ACCOUNT' | 'UPI'>('BANK_ACCOUNT');
  const [methodLabel, setMethodLabel] = useState('');
  const [provider, setProvider] = useState<'RAZORPAY' | 'STRIPE' | 'MANUAL'>('MANUAL');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [gatewayToken, setGatewayToken] = useState('');

  if (analyticsLoading || walletLoading) {
    return (
      <MentorLayout>
        <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MentorLayout>
    );
  }

  const availableToWithdraw = Number(wallet?.balance || 0);
  const transactions = wallet?.transactions || [];

  const handleSavePayoutMethod = async () => {
    try {
      const method = await createPayoutMethod.mutateAsync({
        provider,
        type: methodType,
        label: methodLabel || (methodType === 'UPI' ? upiId : `${bankName} payout`),
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        upiId,
        token: gatewayToken || null,
        isDefault: payoutMethods.length === 0,
        metadata: {
          destinationAccountId: gatewayToken || null,
          fundAccountId: gatewayToken || null,
        },
      });
      setSelectedPayoutMethodId(method.id);
      setMethodLabel('');
      setAccountHolderName('');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setUpiId('');
      setGatewayToken('');
      toast({ title: 'Payout method saved' });
    } catch (error: any) {
      toast({
        title: 'Could not save payout method',
        description: error.message || 'Please check your details and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleWithdraw = async () => {
    try {
      await createWithdrawal.mutateAsync({
        amount: Number(withdrawAmount),
        payoutMethodId: selectedPayoutMethodId,
        currency: 'INR',
      });
      setWithdrawAmount('');
      toast({ title: 'Withdrawal submitted', description: 'Your payout request has been created.' });
    } catch (error: any) {
      toast({
        title: 'Withdrawal failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <MentorLayout>
      <div className="p-6 md:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-1">Earnings</h1>
        <p className="text-muted-foreground mb-6">Withdraw available earnings and maintain payout destinations.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold mt-1">â‚¹{Number(analytics?.totalEarnings || 0).toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Completed Sessions</p>
              <p className="text-2xl font-bold mt-1 text-accent">{analytics?.completedSessions || '0'}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="p-5">
              <p className="text-sm opacity-80">Available to Withdraw</p>
              <p className="text-2xl font-bold mt-1">â‚¹{availableToWithdraw.toLocaleString('en-IN')}</p>
              <p className="text-xs opacity-80 mt-2">Held in escrow: â‚¹{Number(wallet?.heldBalance || 0).toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Payout Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-3 gap-3">
              <select value={methodType} onChange={(e) => setMethodType(e.target.value as 'BANK_ACCOUNT' | 'UPI')} className="h-10 px-3 rounded-lg border bg-background text-sm">
                <option value="BANK_ACCOUNT">Bank Account</option>
                <option value="UPI">UPI</option>
              </select>
              <select value={provider} onChange={(e) => setProvider(e.target.value as 'RAZORPAY' | 'STRIPE' | 'MANUAL')} className="h-10 px-3 rounded-lg border bg-background text-sm">
                <option value="MANUAL">Manual settlement</option>
                <option value="RAZORPAY">Razorpay payout</option>
                <option value="STRIPE">Stripe transfer</option>
              </select>
              <input value={methodLabel} onChange={(e) => setMethodLabel(e.target.value)} placeholder="Method label" className="h-10 px-3 rounded-lg border bg-background text-sm" />
              <input value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} placeholder="Account holder name" className="h-10 px-3 rounded-lg border bg-background text-sm" />
              {methodType === 'BANK_ACCOUNT' ? (
                <>
                  <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name" className="h-10 px-3 rounded-lg border bg-background text-sm" />
                  <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account number" className="h-10 px-3 rounded-lg border bg-background text-sm" />
                  <input value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} placeholder="IFSC code" className="h-10 px-3 rounded-lg border bg-background text-sm" />
                </>
              ) : (
                <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="UPI ID" className="h-10 px-3 rounded-lg border bg-background text-sm" />
              )}
              <input value={gatewayToken} onChange={(e) => setGatewayToken(e.target.value)} placeholder="Gateway token / connected account ID" className="h-10 px-3 rounded-lg border bg-background text-sm md:col-span-2" />
            </div>
            <Button onClick={handleSavePayoutMethod} disabled={createPayoutMethod.isPending}>
              {createPayoutMethod.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Payout Method
            </Button>

            <div className="space-y-3">
              {payoutMethods.map((method: any) => (
                <div key={method.id} className={`flex items-center gap-3 p-3 rounded-lg border ${selectedPayoutMethodId === method.id ? 'border-primary bg-primary/5' : ''}`}>
                  {method.type === 'UPI' ? <Smartphone className="h-5 w-5 text-muted-foreground" /> : <Landmark className="h-5 w-5 text-muted-foreground" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {method.provider} â€¢ {method.type}{method.accountNumberLast4 ? ` â€¢ ****${method.accountNumberLast4}` : method.upiId ? ` â€¢ ${method.upiId}` : ''}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPayoutMethodId(method.id)}>
                    Use
                  </Button>
                </div>
              ))}
              {payoutMethods.length === 0 && (
                <div className="text-sm text-muted-foreground">No payout methods saved yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Withdraw Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount to withdraw"
                className="h-10 px-3 rounded-lg border bg-background text-sm"
              />
              <select value={selectedPayoutMethodId} onChange={(e) => setSelectedPayoutMethodId(e.target.value)} className="h-10 px-3 rounded-lg border bg-background text-sm">
                <option value="">Select payout method</option>
                {payoutMethods.map((method: any) => (
                  <option key={method.id} value={method.id}>{method.label}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleWithdraw} disabled={createWithdrawal.isPending || !withdrawAmount || !selectedPayoutMethodId}>
              {createWithdrawal.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet2 className="mr-2 h-4 w-4" />}
              Withdraw Now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Wallet Ledger</CardTitle>
              <Button variant="outline" size="sm" className="gap-1"><Download className="h-3 w-3" /> Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx: any) => {
                const isCredit = Number(tx.amount) > 0;
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
                      {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">{tx.provider} â€¢ {tx.status} â€¢ {format(new Date(tx.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <span className={`text-sm font-semibold ${isCredit ? 'text-accent' : 'text-foreground'}`}>
                      {isCredit ? '+' : ''}â‚¹{Number(tx.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
              {transactions.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No wallet activity yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MentorLayout>
  );
};

export default MentorEarnings;
