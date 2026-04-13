import { useState } from 'react';
import { useFund } from '@/hooks/useFund';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Check, 
  X, 
  ArrowUpCircle, 
  ArrowDownCircle,
  CreditCard,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

export function FundManagement() {
  const { 
    fundStats, 
    fundRequests, 
    expenses, 
    paymentInfo, 
    addFundRequest, 
    approveFundRequest, 
    rejectFundRequest,
    addExpense
  } = useFund();
  const { userData, isAdmin } = useAuth();
  
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('অনুগ্রহ করে সঠিক পরিমাণ লিখুন');
      return;
    }
    if (!transactionId.trim()) {
      setError('অনুগ্রহ করে ট্রানজেকশন আইডি লিখুন');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addFundRequest({
        userId: userData!.uid,
        userName: userData!.name,
        amount: parseFloat(amount),
        paymentMethod,
        transactionId: transactionId.trim(),
      });
      setAmount('');
      setTransactionId('');
      setSuccess('আপনার জমার অনুরোধ সফলভাবে পাঠানো হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      setError('অনুগ্রহ করে সঠিক পরিমাণ লিখুন');
      return;
    }
    if (!expenseDescription.trim()) {
      setError('অনুগ্রহ করে বিবরণ লিখুন');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addExpense({
        amount: parseFloat(expenseAmount),
        description: expenseDescription.trim(),
        category: expenseCategory.trim() || 'অন্যান্য',
        createdBy: userData!.uid,
        createdByName: userData!.name,
      });
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseCategory('');
      setSuccess('খরচ সফলভাবে যোগ করা হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'খরচ যোগ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await approveFundRequest(requestId, userData!.uid, userData!.name);
      setSuccess('জমার অনুরোধ অনুমোদিত হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'অনুমোদন করতে সমস্যা হয়েছে।');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectFundRequest(requestId);
      setSuccess('জমার অনুরোধ বাতিল করা হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'বাতিল করতে সমস্যা হয়েছে।');
    }
  };

  // Safe filter with null check
  const userRequests = fundRequests?.filter(r => r.userId === userData?.uid) || [];
  const pendingRequests = fundRequests?.filter(r => r.status === 'pending') || [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        ফান্ড ম্যানেজমেন্ট
      </h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Fund Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              মোট ফান্ড
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">৳{(fundStats?.totalFund || 0).toLocaleString('bn-BD')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">মোট খরচ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">৳{(fundStats?.totalExpenses || 0).toLocaleString('bn-BD')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">ব্যালেন্স</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">৳{(fundStats?.balance || 0).toLocaleString('bn-BD')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600 dark:text-gray-400">আমার মোট জমা</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">৳{(userData?.totalDeposit || 0).toLocaleString('bn-BD')}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="add">টাকা জমা দিন</TabsTrigger>
          <TabsTrigger value="history">জমার হিস্টরি</TabsTrigger>
          <TabsTrigger value="expenses">খরচের হিস্টরি</TabsTrigger>
          {isAdmin && <TabsTrigger value="pending">অপেক্ষমান ({pendingRequests.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                টাকা জমা দিন
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold mb-2">পেমেন্ট নম্বর:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-pink-500" />
                    <span className="text-sm">bKash: {paymentInfo?.bkash || '01941429881'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Nagad: {paymentInfo?.nagad || '01941429881'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Rocket: {paymentInfo?.rocket || '01941429881'}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAddMoney} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>টাকার পরিমাণ</Label>
                    <Input
                      type="number"
                      placeholder="পরিমাণ লিখুন"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>পেমেন্ট মেথড</Label>
                    <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bkash">bKash</SelectItem>
                        <SelectItem value="nagad">Nagad</SelectItem>
                        <SelectItem value="rocket">Rocket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ট্রানজেকশন আইডি</Label>
                  <Input
                    placeholder="ট্রানজেকশন আইডি লিখুন"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'প্রসেসিং...' : 'জমা দিন'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>আমার জমার হিস্টরি</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userRequests.length > 0 ? userRequests.map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowUpCircle className={`w-5 h-5 ${
                        request.status === 'approved' ? 'text-green-500' :
                        request.status === 'rejected' ? 'text-red-500' :
                        'text-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium">৳{(request.amount || 0).toLocaleString('bn-BD')}</p>
                        <p className="text-sm text-gray-500">{request.paymentMethod} - {request.transactionId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        request.status === 'approved' ? 'default' :
                        request.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {request.status === 'approved' ? 'অনুমোদিত' :
                         request.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমান'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {request.createdAt ? format(new Date(request.createdAt), 'PP', { locale: bn }) : '-'}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-8">কোনো জমার রেকর্ড নেই</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>খরচের হিস্টরি</CardTitle>
              {isAdmin && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      খরচ যোগ করুন
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>নতুন খরচ যোগ করুন</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddExpense} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>টাকার পরিমাণ</Label>
                        <Input
                          type="number"
                          placeholder="পরিমাণ লিখুন"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          min="1"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>বিবরণ</Label>
                        <Input
                          placeholder="কিসে খরচ হয়েছে"
                          value={expenseDescription}
                          onChange={(e) => setExpenseDescription(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ক্যাটাগরি</Label>
                        <Input
                          placeholder="ক্যাটাগরি (ঐচ্ছিক)"
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'প্রসেসিং...' : 'খরচ যোগ করুন'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses && expenses.length > 0 ? expenses.map((expense) => (
                  <div 
                    key={expense.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowDownCircle className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-500">
                          {expense.category} • {expense.createdByName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">৳{(expense.amount || 0).toLocaleString('bn-BD')}</p>
                      <p className="text-xs text-gray-500">
                        {expense.createdAt ? format(new Date(expense.createdAt), 'PP', { locale: bn }) : '-'}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-8">কোনো খরচের রেকর্ড নেই</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>অপেক্ষমান জমার অনুরোধ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingRequests.length > 0 ? pendingRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200"
                    >
                      <div>
                        <p className="font-medium">{request.userName}</p>
                        <p className="text-sm text-gray-600">
                          ৳{(request.amount || 0).toLocaleString('bn-BD')} • {request.paymentMethod} • {request.transactionId}
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.createdAt ? format(new Date(request.createdAt), 'PPp', { locale: bn }) : '-'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(request.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          অনুমোদন
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          বাতিল
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-gray-500 py-8">কোনো অপেক্ষমান অনুরোধ নেই</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
