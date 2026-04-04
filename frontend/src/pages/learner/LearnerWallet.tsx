import { useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Plus, CreditCard, Download, ArrowUpRight, ArrowDownLeft, Loader2, ShieldCheck, Landmark, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LearnerLayout from '@/components/LearnerLayout';
import {
  useWallet,
  useWalletConfig,
  useCreateDepositIntent,
  useVerifyRazorpayPayment,
  usePaymentMethods,
  useCreatePaymentMethod,
} from '@/hooks/useApi';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const loadRazorpayScript = async () => {
  if (window.Razorpay) return true;

  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const StripeDepositForm = ({
  clientSecret,
  onCancel,
}: {
  clientSecret: string;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
    });

    if (result.error) {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-4">
      <PaymentElement />
      <div className="flex gap-3">
        <Button type="submit" disabled={!stripe || isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay Securely'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Stripe securely tokenizes your card details. Your wallet will update after payment confirmation.
      </p>
    </form>
  );
};

const transactionLabel = (tx: any) => {
  switch (tx.type) {
    case 'DEPOSIT':
      return 'Wallet deposit';
    case 'ESCROW_HOLD':
      return 'Session payment held in escrow';
    case 'PAYMENT':
      return 'Escrow released to mentor';
    case 'ESCROW_REFUND':
      return 'Escrow refunded';
    default:
      return tx.description || tx.type;
  }
};

const LearnerWallet = () => {
  const { data: wallet, isLoading } = useWallet();
  const { data: walletConfig } = useWalletConfig();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const createPaymentMethod = useCreatePaymentMethod();
  const createDepositIntent = useCreateDepositIntent();
  const verifyRazorpayPayment = useVerifyRazorpayPayment();
  const { toast } = useToast();

  const [amount, setAmount] = useState('1000');
  const [provider, setProvider] = useState<'RAZORPAY' | 'STRIPE'>('RAZORPAY');
  const [paymentMethodType, setPaymentMethodType] = useState<'CARD' | 'UPI' | 'NETBANKING'>('CARD');
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethodLabel, setNewMethodLabel] = useState('');
  const [newMethodLast4, setNewMethodLast4] = useState('');
  const [newMethodToken, setNewMethodToken] = useState('');

  const stripePromise = useMemo(() => {
    if (!walletConfig?.stripePublishableKey) return null;
    return loadStripe(walletConfig.stripePublishableKey);
  }, [walletConfig?.stripePublishableKey]);

  useEffect(() => {
    if (paymentMethodType !== 'CARD' && provider === 'STRIPE') {
      setProvider('RAZORPAY');
    }
  }, [paymentMethodType, provider]);

  const handleAddFunds = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    try {
      const intent = await createDepositIntent.mutateAsync({
        amount: numAmount,
        provider,
        currency: 'INR',
        paymentMethodType,
      });

      if (intent.provider === 'STRIPE') {
        setStripeClientSecret(intent.clientSecret);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Failed to load Razorpay checkout');
      }

      const razorpay = new window.Razorpay({
        key: intent.keyId,
        amount: intent.amount,
        currency: intent.currency,
        name: intent.merchantName,
        description: intent.description,
        order_id: intent.orderId,
        handler: async (response: Record<string, string>) => {
          await verifyRazorpayPayment.mutateAsync({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          toast({ title: 'Wallet updated', description: 'Your Razorpay payment was captured successfully.' });
        },
        prefill: {
          method: paymentMethodType.toLowerCase(),
        },
        theme: {
          color: '#0f766e',
        },
      });

      razorpay.open();
    } catch (error: any) {
      toast({
        title: 'Unable to start payment',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveMethod = async () => {
    try {
      await createPaymentMethod.mutateAsync({
        provider,
        type: paymentMethodType,
        label: newMethodLabel || `${provider} ${paymentMethodType}`,
        last4: newMethodLast4 || null,
        token: newMethodToken || null,
        isDefault: paymentMethods.length === 0,
      });
      setNewMethodLabel('');
      setNewMethodLast4('');
      setNewMethodToken('');
      setShowAddMethod(false);
      toast({ title: 'Payment method saved' });
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message || 'Could not save payment method.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <LearnerLayout>
        <div className="page-shell flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </LearnerLayout>
    );
  }

  const transactions = wallet?.transactions || [];
  const availableBalance = Number(wallet?.balance || 0);
  const heldBalance = Number(wallet?.heldBalance || 0);

  return (
    <LearnerLayout>
      <div className="page-shell max-w-5xl">
        <h1 className="text-2xl font-bold mb-1">My Wallet</h1>
        <p className="text-muted-foreground mb-6">Add funds, pay securely, and track every transaction.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card className="lg:col-span-2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="p-6">
              <p className="text-sm opacity-80 mb-1">Available Balance</p>
              <p className="text-4xl font-bold mb-2">â‚¹{availableBalance.toLocaleString('en-IN')}</p>
              <p className="text-sm opacity-80">Held in escrow: â‚¹{heldBalance.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="font-medium">Payment Security</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Cards are tokenized by Stripe. India payments route through Razorpay with UPI, cards, and netbanking.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Money</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Gateway</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as 'RAZORPAY' | 'STRIPE')}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
                >
                  {walletConfig?.supportedDepositProviders?.includes('RAZORPAY') && <option value="RAZORPAY">Razorpay (India)</option>}
                  {walletConfig?.supportedDepositProviders?.includes('STRIPE') && <option value="STRIPE">Stripe (International)</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Method</label>
                <select
                  value={paymentMethodType}
                  onChange={(e) => setPaymentMethodType(e.target.value as 'CARD' | 'UPI' | 'NETBANKING')}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
                >
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="NETBANKING">Netbanking</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Button className="w-full sm:w-auto" onClick={handleAddFunds} disabled={createDepositIntent.isPending || verifyRazorpayPayment.isPending}>
                {createDepositIntent.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continue to Payment
              </Button>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                {provider === 'RAZORPAY' ? <Smartphone className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                {provider === 'RAZORPAY'
                  ? 'UPI, cards, and netbanking are available in Razorpay checkout.'
                  : 'Stripe supports international cards and secure 3DS verification.'}
              </div>
            </div>

            {stripeClientSecret && stripePromise && (
              <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                <StripeDepositForm clientSecret={stripeClientSecret} onCancel={() => setStripeClientSecret(null)} />
              </Elements>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Saved Payment Methods</CardTitle>
              <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto" onClick={() => setShowAddMethod((prev) => !prev)}>
                <Plus className="h-3 w-3" /> Add Method
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddMethod && (
              <div className="grid md:grid-cols-3 gap-3 rounded-lg border p-4">
                <input
                  value={newMethodLabel}
                  onChange={(e) => setNewMethodLabel(e.target.value)}
                  placeholder="Label e.g. Personal Visa"
                  className="h-10 px-3 rounded-lg border bg-background text-sm"
                />
                <input
                  value={newMethodLast4}
                  onChange={(e) => setNewMethodLast4(e.target.value)}
                  placeholder="Last 4 digits"
                  className="h-10 px-3 rounded-lg border bg-background text-sm"
                />
                <input
                  value={newMethodToken}
                  onChange={(e) => setNewMethodToken(e.target.value)}
                  placeholder="Gateway token / payment method ID"
                  className="h-10 px-3 rounded-lg border bg-background text-sm"
                />
                <div className="md:col-span-3">
                  <Button onClick={handleSaveMethod} disabled={createPaymentMethod.isPending}>
                    Save Method
                  </Button>
                </div>
              </div>
            )}

            {paymentMethods.map((method: any) => (
              <div key={method.id} className="flex items-start gap-3 p-3 rounded-lg border">
                {method.type === 'UPI' ? <Smartphone className="h-5 w-5 text-muted-foreground" /> : <CreditCard className="h-5 w-5 text-muted-foreground" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{method.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {method.provider} â€¢ {method.type}{method.last4 ? ` â€¢ **** ${method.last4}` : ''}
                  </p>
                </div>
              </div>
            ))}

            {paymentMethods.length === 0 && (
              <div className="text-sm text-muted-foreground">No saved payment methods yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <Button variant="outline" size="sm" className="gap-1"><Download className="h-3 w-3" /> Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx: any) => {
                const isCredit = Number(tx.amount) > 0;
                return (
                  <div key={tx.id} className="flex items-start gap-3 py-3 border-b last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
                      {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{transactionLabel(tx)}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.provider} â€¢ {tx.status} â€¢ {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${isCredit ? 'text-accent' : 'text-foreground'}`}>
                      {isCredit ? '+' : ''}â‚¹{Number(tx.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
              {transactions.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No transactions yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </LearnerLayout>
  );
};

export default LearnerWallet;
