import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { useFund } from '@/hooks/useFund';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Crown, 
  Users, 
  UserX, 
  Wallet,
  CreditCard,
  Mail,
  Phone,
  Facebook,
  TrendingUp,
  Sparkles,
  Settings,
  Type,
  Image,
  UserPlus,
  Plus,
  Search,
  Trash2,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { ref, onValue, set, push } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { AdminContact, User } from '@/types';

export function AdminPanel() {
  const { userData } = useAuth();
  const { users, blockUser, unblockUser, deleteUser, getTotalBlockedCount } = useUsers();
  const { paymentInfo, updatePaymentInfo } = useFund();
  const { config, updateConfig } = useSiteConfig();
  
  const [contactInfo, setContactInfo] = useState<AdminContact>({
    email: 'mr4425390@gmail.com',
    phone: '019xxxxxxxx',
    facebook: 'https://www.facebook.com/rakibul.islam.140316',
  });
  const [paymentForm, setPaymentForm] = useState(paymentInfo);
  const [siteForm, setSiteForm] = useState({
    siteName: config.siteName,
    siteTitle: config.siteTitle,
    logoUrl: config.logoUrl,
    welcomeMessage: config.welcomeMessage,
    footerText: config.footerText,
  });
  
  // Add User State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    birthDate: '',
    area: '',
    category: 'A' as 'A' | 'B' | 'C' | 'D',
    initialDeposit: '',
  });
  
  // Add Deposit State
  const [depositForm, setDepositForm] = useState({
    userId: '',
    amount: '',
    paymentMethod: 'bkash' as 'bkash' | 'nagad' | 'rocket',
    transactionId: '',
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const contactRef = ref(db, 'adminContact');
    const unsubscribe = onValue(contactRef, (snapshot) => {
      if (snapshot.exists()) {
        setContactInfo(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setPaymentForm(paymentInfo);
  }, [paymentInfo]);

  useEffect(() => {
    setSiteForm({
      siteName: config.siteName,
      siteTitle: config.siteTitle,
      logoUrl: config.logoUrl,
      welcomeMessage: config.welcomeMessage,
      footerText: config.footerText,
    });
  }, [config]);

  const handleUpdatePayment = async () => {
    try {
      await updatePaymentInfo(paymentForm);
      setShowAnimation(true);
      setSuccess('পেমেন্ট নম্বর আপডেট হয়েছে!');
      setTimeout(() => {
        setShowAnimation(false);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError('পেমেন্ট নম্বর আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const handleUpdateContact = async () => {
    try {
      await set(ref(db, 'adminContact'), contactInfo);
      setSuccess('যোগাযোগ তথ্য আপডেট হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('যোগাযোগ তথ্য আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const handleUpdateSiteConfig = async () => {
    try {
      await updateConfig(siteForm);
      setSuccess('ওয়েবসাইট সেটিংস আপডেট হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('সেটিংস আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  // Add New User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) {
      setError('নাম এবং ইমেইল আবশ্যক');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a unique ID for the user
      const userId = 'user_' + Date.now();
      const initialDeposit = parseFloat(newUserForm.initialDeposit) || 0;
      
      const newUser: User = {
        uid: userId,
        name: newUserForm.name.trim(),
        email: newUserForm.email.trim(),
        birthDate: newUserForm.birthDate,
        area: newUserForm.area.trim(),
        category: newUserForm.category,
        isAdmin: false,
        isBlocked: false,
        totalDeposit: initialDeposit,
        createdAt: new Date().toISOString(),
      };
      
      // Save user to database
      await set(ref(db, `users/${userId}`), newUser);
      
      // If initial deposit provided, add it
      if (initialDeposit > 0) {
        const fundRequest = {
          userId,
          userName: newUserForm.name.trim(),
          amount: initialDeposit,
          paymentMethod: 'bkash',
          transactionId: 'ADMIN_ADDED',
          status: 'approved',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: userData?.name || 'Admin',
        };
        
        const requestRef = push(ref(db, 'fundRequests'));
        await set(requestRef, fundRequest);
        
        // Update fund stats
        const statsRef = ref(db, 'fundStats');
        const statsSnapshot = await new Promise<any>((resolve) => {
          onValue(statsRef, resolve, { onlyOnce: true });
        });
        const currentStats = statsSnapshot.val() || {
          totalFund: 0,
          totalExpenses: 0,
          monthlyDeposit: 0,
          monthlyExpense: 0,
          balance: 0,
        };
        
        await set(statsRef, {
          totalFund: currentStats.totalFund + initialDeposit,
          monthlyDeposit: currentStats.monthlyDeposit + initialDeposit,
          balance: currentStats.balance + initialDeposit,
          totalExpenses: currentStats.totalExpenses,
          monthlyExpense: currentStats.monthlyExpense,
        });
      }
      
      setNewUserForm({
        name: '',
        email: '',
        birthDate: '',
        area: '',
        category: 'A',
        initialDeposit: '',
      });
      setSuccess('নতুন ইউজার সফলভাবে যোগ করা হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('ইউজার যোগ করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Deposit for User
  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!depositForm.userId || !depositForm.amount) {
      setError('ইউজার এবং পরিমাণ আবশ্যক');
      return;
    }

    setIsSubmitting(true);
    try {
      const amount = parseFloat(depositForm.amount);
      const user = users.find(u => u.uid === depositForm.userId);
      
      if (!user) {
        setError('ইউজার পাওয়া যায়নি');
        return;
      }
      
      // Add fund request
      const fundRequest = {
        userId: depositForm.userId,
        userName: user.name,
        amount,
        paymentMethod: depositForm.paymentMethod,
        transactionId: depositForm.transactionId || 'ADMIN_ADDED',
        status: 'approved',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: userData?.name || 'Admin',
      };
      
      const requestRef = push(ref(db, 'fundRequests'));
      await set(requestRef, fundRequest);
      
      // Update user's total deposit
      await set(ref(db, `users/${depositForm.userId}/totalDeposit`), (user.totalDeposit || 0) + amount);
      
      // Update fund stats
      const statsRef = ref(db, 'fundStats');
      const statsSnapshot = await new Promise<any>((resolve) => {
        onValue(statsRef, resolve, { onlyOnce: true });
      });
      const currentStats = statsSnapshot.val() || {
        totalFund: 0,
        totalExpenses: 0,
        monthlyDeposit: 0,
        monthlyExpense: 0,
        balance: 0,
      };
      
      await set(statsRef, {
        totalFund: currentStats.totalFund + amount,
        monthlyDeposit: currentStats.monthlyDeposit + amount,
        balance: currentStats.balance + amount,
        totalExpenses: currentStats.totalExpenses,
        monthlyExpense: currentStats.monthlyExpense,
      });
      
      setDepositForm({
        userId: '',
        amount: '',
        paymentMethod: 'bkash',
        transactionId: '',
      });
      setSuccess(`৳${amount.toLocaleString('bn-BD')} জমা সফলভাবে যোগ করা হয়েছে!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('জমা যোগ করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Actions
  const handleBlockUser = async (userId: string) => {
    try {
      await blockUser(userId);
      setSuccess('ইউজার ব্লক করা হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('ব্লক করতে সমস্যা হয়েছে।');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await unblockUser(userId);
      setSuccess('ইউজার আনব্লক করা হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('আনব্লক করতে সমস্যা হয়েছে।');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই ইউজারটি মুছে ফেলতে চান?')) {
      try {
        await deleteUser(userId);
        setSuccess('ইউজার মুছে ফেলা হয়েছে!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError('মুছতে সমস্যা হয়েছে।');
      }
    }
  };

  const totalUsers = users?.length || 0;
  const blockedUsers = getTotalBlockedCount();
  const totalDeposits = users?.reduce((sum, u) => sum + (u.totalDeposit || 0), 0) || 0;

  // Filter users for search
  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Animation */}
      <div className={`text-center py-8 transition-all duration-500 ${showAnimation ? 'scale-110' : ''}`}>
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-4 animate-bounce shadow-lg shadow-purple-500/30">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
          🎉 স্বাগতম অ্যাডমিন প্যানেলে!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {userData?.name}, আপনি এখন অ্যাডমিন হিসেবে লগইন আছেন
        </p>
      </div>

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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-100 flex items-center gap-2">
              <Users className="w-4 h-4" />
              মোট ইউজার
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-100 flex items-center gap-2">
              <UserX className="w-4 h-4" />
              ব্লক করা ইউজার
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{blockedUsers}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-100 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              মোট জমা
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">৳{totalDeposits.toLocaleString('bn-BD')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              সক্রিয় ইউজার
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers - blockedUsers}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            ইউজার ম্যানেজ
          </TabsTrigger>
          <TabsTrigger value="site" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            ওয়েবসাইট
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            পেমেন্ট
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            যোগাযোগ
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            ক্ষমতাসমূহ
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-green-500" />
                  নতুন ইউজার যোগ করুন
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>নাম</Label>
                      <Input
                        value={newUserForm.name}
                        onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                        placeholder="ইউজারের নাম"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ইমেইল</Label>
                      <Input
                        type="email"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>জন্ম তারিখ</Label>
                      <Input
                        type="date"
                        value={newUserForm.birthDate}
                        onChange={(e) => setNewUserForm({ ...newUserForm, birthDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ক্যাটাগরি</Label>
                      <Select
                        value={newUserForm.category}
                        onValueChange={(v: any) => setNewUserForm({ ...newUserForm, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">ক্যাটাগরি A</SelectItem>
                          <SelectItem value="B">ক্যাটাগরি B</SelectItem>
                          <SelectItem value="C">ক্যাটাগরি C</SelectItem>
                          <SelectItem value="D">ক্যাটাগরি D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>এলাকা</Label>
                    <Input
                      value={newUserForm.area}
                      onChange={(e) => setNewUserForm({ ...newUserForm, area: e.target.value })}
                      placeholder="এলাকার নাম"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      প্রাথমিক জমা (ঐচ্ছিক)
                    </Label>
                    <Input
                      type="number"
                      value={newUserForm.initialDeposit}
                      onChange={(e) => setNewUserForm({ ...newUserForm, initialDeposit: e.target.value })}
                      placeholder="টাকার পরিমাণ"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'প্রসেসিং...' : 'ইউজার যোগ করুন'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Add Deposit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  জমা যোগ করুন
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDeposit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>ইউজার নির্বাচন করুন</Label>
                    <Select
                      value={depositForm.userId}
                      onValueChange={(v) => setDepositForm({ ...depositForm, userId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="ইউজার নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {users?.map((user) => (
                          <SelectItem key={user.uid} value={user.uid}>
                            {user.name} - ৳{(user.totalDeposit || 0).toLocaleString('bn-BD')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>টাকার পরিমাণ</Label>
                      <Input
                        type="number"
                        value={depositForm.amount}
                        onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                        placeholder="পরিমাণ"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>পেমেন্ট মেথড</Label>
                      <Select
                        value={depositForm.paymentMethod}
                        onValueChange={(v: any) => setDepositForm({ ...depositForm, paymentMethod: v })}
                      >
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
                    <Label>ট্রানজেকশন আইডি (ঐচ্ছিক)</Label>
                    <Input
                      value={depositForm.transactionId}
                      onChange={(e) => setDepositForm({ ...depositForm, transactionId: e.target.value })}
                      placeholder="ট্রানজেকশন আইডি"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'প্রসেসিং...' : 'জমা যোগ করুন'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* User List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                সব ইউজার
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ইউজার খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.uid}
                    className={`p-4 rounded-lg border ${user.isBlocked ? 'opacity-60 bg-gray-50' : 'bg-white'} ${user.isAdmin ? 'border-purple-500 border-2' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}>
                          <span className="text-white font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      {user.isAdmin && <Crown className="w-4 h-4 text-purple-500" />}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      <p>এলাকা: {user.area}</p>
                      <p>ক্যাটাগরি: {user.category}</p>
                      <p className="font-medium text-green-600">মোট জমা: ৳{(user.totalDeposit || 0).toLocaleString('bn-BD')}</p>
                    </div>
                    {user.uid !== userData?.uid && (
                      <div className="flex gap-2">
                        {user.isBlocked ? (
                          <Button size="sm" variant="outline" onClick={() => handleUnblockUser(user.uid)} className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            আনব্লক
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleBlockUser(user.uid)} className="text-yellow-600">
                            <UserX className="w-3 h-3 mr-1" />
                            ব্লক
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.uid)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Config Tab */}
        <TabsContent value="site">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                ওয়েবসাইট কনফিগারেশন
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    ওয়েবসাইট নাম
                  </Label>
                  <Input
                    value={siteForm.siteName}
                    onChange={(e) => setSiteForm({ ...siteForm, siteName: e.target.value })}
                    placeholder="ওয়েবসাইটের নাম"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    পেজ টাইটেল
                  </Label>
                  <Input
                    value={siteForm.siteTitle}
                    onChange={(e) => setSiteForm({ ...siteForm, siteTitle: e.target.value })}
                    placeholder="ব্রাউজার ট্যাবে দেখানো টাইটেল"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  লোগো URL (ঐচ্ছিক)
                </Label>
                <Input
                  value={siteForm.logoUrl}
                  onChange={(e) => setSiteForm({ ...siteForm, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                {siteForm.logoUrl && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg flex items-center justify-center">
                    <img src={siteForm.logoUrl} alt="Logo Preview" className="max-h-20" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  স্বাগতম বার্তা
                </Label>
                <Input
                  value={siteForm.welcomeMessage}
                  onChange={(e) => setSiteForm({ ...siteForm, welcomeMessage: e.target.value })}
                  placeholder="ড্যাশবোর্ডে দেখানো স্বাগতম বার্তা"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  ফুটার টেক্সট
                </Label>
                <Input
                  value={siteForm.footerText}
                  onChange={(e) => setSiteForm({ ...siteForm, footerText: e.target.value })}
                  placeholder="ফুটারে দেখানো টেক্সট"
                />
              </div>
              
              <Button 
                onClick={handleUpdateSiteConfig}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                সেটিংস আপডেট করুন
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                পেমেন্ট নম্বর আপডেট করুন
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                    bKash নম্বর
                  </Label>
                  <Input
                    value={paymentForm?.bkash || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bkash: e.target.value })}
                    placeholder="bKash নম্বর"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    Nagad নম্বর
                  </Label>
                  <Input
                    value={paymentForm?.nagad || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, nagad: e.target.value })}
                    placeholder="Nagad নম্বর"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    Rocket নম্বর
                  </Label>
                  <Input
                    value={paymentForm?.rocket || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, rocket: e.target.value })}
                    placeholder="Rocket নম্বর"
                  />
                </div>
              </div>
              <Button 
                onClick={handleUpdatePayment}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                আপডেট করুন
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                অ্যাডমিন যোগাযোগ তথ্য
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  ইমেইল
                </Label>
                <Input
                  value={contactInfo?.email || ''}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  placeholder="ইমেইল ঠিকানা"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  ফোন নম্বর
                </Label>
                <Input
                  value={contactInfo?.phone || ''}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  placeholder="ফোন নম্বর"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook লিংক
                </Label>
                <Input
                  value={contactInfo?.facebook || ''}
                  onChange={(e) => setContactInfo({ ...contactInfo, facebook: e.target.value })}
                  placeholder="Facebook প্রোফাইল লিংক"
                />
              </div>
              <Button 
                onClick={handleUpdateContact}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                আপডেট করুন
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>অ্যাডমিন ক্ষমতাসমূহ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                    👥 ইউজার ম্যানেজমেন্ট
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• নতুন ইউজার যোগ করতে পারবেন</li>
                    <li>• ইউজার ব্লক/আনব্লক করতে পারবেন</li>
                    <li>• ইউজার ডিলিট করতে পারবেন</li>
                    <li>• সব ইউজারের তথ্য দেখতে পারবেন</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                    💰 ফান্ড ম্যানেজমেন্ট
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• যেকোনো ইউজারের জন্য জমা যোগ করতে পারবেন</li>
                    <li>• জমার অনুরোধ অনুমোদন/বাতিল করতে পারবেন</li>
                    <li>• খরচ যোগ করতে পারবেন</li>
                    <li>• পেমেন্ট নম্বর আপডেট করতে পারবেন</li>
                  </ul>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                    📢 কন্টেন্ট ম্যানেজমেন্ট
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• পোস্ট তৈরি/এডিট/ডিলিট করতে পারবেন</li>
                    <li>• ভোট তৈরি/বন্ধ করতে পারবেন</li>
                    <li>• কমেন্ট ডিলিট করতে পারবেন</li>
                  </ul>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">
                    ⚙️ সেটিংস ম্যানেজমেন্ট
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• ওয়েবসাইট নাম পরিবর্তন করতে পারবেন</li>
                    <li>• লোগো আপডেট করতে পারবেন</li>
                    <li>• স্বাগতম বার্তা পরিবর্তন করতে পারবেন</li>
                    <li>• যোগাযোগ তথ্য আপডেট করতে পারবেন</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
