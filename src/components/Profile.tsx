import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFund } from '@/hooks/useFund';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Wallet, 
  Crown,
  Save
} from 'lucide-react';

export function Profile() {
  const { userData, refreshUserData } = useAuth();
  const { fundRequests } = useFund();
  const [editForm, setEditForm] = useState({
    name: userData?.name || '',
    area: userData?.area || '',
    birthDate: userData?.birthDate || '',
  });

  const userRequests = fundRequests.filter(r => r.userId === userData?.uid && r.status === 'approved');

  const handleSave = async () => {
    // Update user data in Firebase
    const { db } = await import('@/lib/firebase');
    const { ref, update } = await import('firebase/database');
    await update(ref(db, `users/${userData?.uid}`), editForm);
    await refreshUserData();
  };

  if (!userData) return null;

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        আমার প্রোফাইল
      </h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {userData.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{userData.name}</h2>
            <p className="text-gray-500">{userData.email}</p>
            {userData.isAdmin && (
              <Badge className="mt-2 bg-purple-500">
                <Crown className="w-3 h-3 mr-1" />
                অ্যাডমিন
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">তথ্য</TabsTrigger>
          <TabsTrigger value="deposits">জমার ইতিহাস</TabsTrigger>
          <TabsTrigger value="edit">এডিট করুন</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>ব্যক্তিগত তথ্য</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <User className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">নাম</p>
                  <p className="font-medium">{userData.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Mail className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">ইমেইল</p>
                  <p className="font-medium">{userData.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <MapPin className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">এলাকা</p>
                  <p className="font-medium">{userData.area}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">জন্ম তারিখ</p>
                  <p className="font-medium">{userData.birthDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <User className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">ক্যাটাগরি</p>
                  <Badge variant="outline">{userData.category}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Wallet className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">মোট জমা</p>
                  <p className="font-bold text-xl text-green-700">
                    ৳{userData.totalDeposit?.toLocaleString('bn-BD') || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle>জমার ইতিহাস</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userRequests.map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">৳{request.amount.toLocaleString('bn-BD')}</p>
                      <p className="text-sm text-gray-500">
                        {request.paymentMethod} • {request.transactionId}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                ))}
                {userRequests.length === 0 && (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">কোনো জমার রেকর্ড নেই</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>প্রোফাইল এডিট করুন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>নাম</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>এলাকা</Label>
                <Input
                  value={editForm.area}
                  onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>জন্ম তারিখ</Label>
                <Input
                  type="date"
                  value={editForm.birthDate}
                  onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                সংরক্ষণ করুন
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
