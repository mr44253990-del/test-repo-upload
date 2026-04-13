import { useMemo, useEffect, useState } from 'react';
import { useFund } from '@/hooks/useFund';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  UserCheck, 
  UserX,
  Sparkles,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export function Dashboard() {
  const { fundStats, fundRequests, expenses } = useFund();
  const { users, getTotalBlockedCount } = useUsers();
  const { userData } = useAuth();
  const { config } = useSiteConfig();
  const [animatedStats, setAnimatedStats] = useState({
    totalFund: 0,
    totalExpenses: 0,
    balance: 0,
    monthlyDeposit: 0
  });

  // Animate stats on load
  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedStats({
        totalFund: Math.floor((fundStats?.totalFund || 0) * easeOut),
        totalExpenses: Math.floor((fundStats?.totalExpenses || 0) * easeOut),
        balance: Math.floor((fundStats?.balance || 0) * easeOut),
        monthlyDeposit: Math.floor((fundStats?.monthlyDeposit || 0) * easeOut)
      });
      
      if (step >= steps) clearInterval(timer);
    }, interval);
    
    return () => clearInterval(timer);
  }, [fundStats]);

  // Real monthly data calculation
  const monthlyData = useMemo(() => {
    const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const currentYear = new Date().getFullYear();
    
    // Initialize all months with 0
    const data = months.map((month, index) => ({
      name: month,
      deposit: 0,
      expense: 0,
      month: index,
      year: currentYear
    }));

    // Calculate deposits per month from fund requests
    const safeFundRequests = Array.isArray(fundRequests) ? fundRequests : [];
    safeFundRequests.forEach(request => {
      if (request.status === 'approved' && request.createdAt) {
        const date = new Date(request.createdAt);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        
        if (year === currentYear && data[monthIndex]) {
          data[monthIndex].deposit += request.amount || 0;
        }
      }
    });

    // Calculate expenses per month
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    safeExpenses.forEach(expense => {
      if (expense.createdAt) {
        const date = new Date(expense.createdAt);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        
        if (year === currentYear && data[monthIndex]) {
          data[monthIndex].expense += expense.amount || 0;
        }
      }
    });

    // Return last 6 months
    const currentMonth = new Date().getMonth();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      result.push(data[monthIndex]);
    }
    return result;
  }, [fundRequests, expenses]);

  // Weekly trend data
  const weeklyData = useMemo(() => {
    const days = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
    const today = new Date();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayDeposits = (fundRequests || [])
        .filter(r => r.status === 'approved' && r.createdAt)
        .filter(r => {
          const rDate = new Date(r.createdAt);
          return rDate.toDateString() === date.toDateString();
        })
        .reduce((sum, r) => sum + (r.amount || 0), 0);
      
      data.push({
        name: days[date.getDay()],
        amount: dayDeposits
      });
    }
    return data;
  }, [fundRequests]);

  const categoryData = useMemo(() => {
    const categories = { A: 0, B: 0, C: 0, D: 0 };
    const safeUsers = Array.isArray(users) ? users : [];
    safeUsers.forEach(user => {
      if (user && categories[user.category] !== undefined) {
        categories[user.category]++;
      }
    });
    return [
      { name: 'ক্যাটাগরি A', value: categories.A, color: '#6366F1' },
      { name: 'ক্যাটাগরি B', value: categories.B, color: '#10B981' },
      { name: 'ক্যাটাগরি C', value: categories.C, color: '#F59E0B' },
      { name: 'ক্যাটাগরি D', value: categories.D, color: '#EF4444' },
    ];
  }, [users]);

  const totalBlocked = getTotalBlockedCount();
  const safeFundRequests = Array.isArray(fundRequests) ? fundRequests : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  // Calculate growth percentage
  const lastMonthDeposit = monthlyData[4]?.deposit || 0;
  const thisMonthDeposit = monthlyData[5]?.deposit || 0;
  const growthPercent = lastMonthDeposit > 0 
    ? Math.round(((thisMonthDeposit - lastMonthDeposit) / lastMonthDeposit) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            স্বাগতম, {userData?.name}!
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">
            {config?.welcomeMessage || 'আমাদের ফান্ড ম্যানেজমেন্ট সিস্টেমে আপনাকে স্বাগতম।'}
          </p>
        </div>
        
        {/* Animated Circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -right-5 -bottom-5 w-32 h-32 bg-pink-400/20 rounded-full blur-xl animate-pulse delay-500" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              মোট ওয়েব ফান্ড
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">৳{animatedStats.totalFund.toLocaleString('bn-BD')}</p>
                {growthPercent > 0 && (
                  <p className="text-xs text-green-200 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +{growthPercent}% এই মাসে
                  </p>
                )}
              </div>
              <Wallet className="w-10 h-10 text-blue-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-100 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              মোট খরচ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">৳{animatedStats.totalExpenses.toLocaleString('bn-BD')}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              এই মাসে জমা
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">৳{animatedStats.monthlyDeposit.toLocaleString('bn-BD')}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-200/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              বর্তমান ব্যালেন্স
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">৳{animatedStats.balance.toLocaleString('bn-BD')}</p>
              </div>
              <Wallet className="w-10 h-10 text-purple-200/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              মোট ইউজার
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{safeUsers.length}</p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">সক্রিয়</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              সক্রিয় ইউজার
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-green-600">{safeUsers.length - totalBlocked}</p>
              <Badge variant="secondary" className="bg-green-100 text-green-700">অনলাইন</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <UserX className="w-4 h-4" />
              ব্লক করা ইউজার
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-red-600">{totalBlocked}</p>
              <Badge variant="secondary" className="bg-red-100 text-red-700">সাসপেন্ড</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              মাসিক জমা ও খরচ (বাস্তব ডেটা)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="deposit" name="জমা" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="খরচ" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              সাপ্তাহিক জমার ট্রেন্ড
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  name="জমা" 
                  stroke="#6366F1" 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-500" />
              ক্যাটাগরি অনুযায়ী ইউজার
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              সাম্প্রতিক কার্যকলাপ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {[...safeFundRequests, ...safeExpenses]
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, 8)
                .map((item, index) => {
                  const isExpense = 'description' in item;
                  return (
                    <div 
                      key={item.id || index} 
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isExpense 
                            ? 'bg-red-100 text-red-600' 
                            : item.status === 'approved' 
                              ? 'bg-green-100 text-green-600'
                              : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {isExpense ? (
                            <ArrowDownRight className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {isExpense ? item.description : item.userName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {isExpense 
                              ? `${item.category} • ${item.createdByName}`
                              : `${item.paymentMethod} • ${item.transactionId?.slice(0, 10)}...`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                          {isExpense ? '-' : '+'}৳{(item.amount || 0).toLocaleString('bn-BD')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.createdAt 
                            ? new Date(item.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                  );
                })}
              {safeFundRequests.length === 0 && safeExpenses.length === 0 && (
                <p className="text-center text-gray-500 py-8">কোনো কার্যকলাপ নেই</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
