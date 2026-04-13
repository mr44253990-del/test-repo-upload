import { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Crown, 
  Ban, 
  CheckCircle, 
  Trash2, 
  Edit2,
  Users,
  UserX,
  Wallet
} from 'lucide-react';
import type { User } from '@/types';

export function UserList() {
  const { users, blockUser, unblockUser, deleteUser, updateUser, getTotalBlockedCount } = useUsers();
  const { userData, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', area: '', birthDate: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const safeUsers = Array.isArray(users) ? users : [];
  
  const filteredUsers = safeUsers.filter(user => 
    user && (
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.area?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      area: user.area || '',
      birthDate: user.birthDate || '',
    });
  };

  const handleSaveEdit = async () => {
    if (editingUser) {
      try {
        await updateUser(editingUser.uid, editForm);
        setEditingUser(null);
        setSuccess('ইউজার তথ্য আপডেট হয়েছে!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError('ইউজার আপডেট করতে সমস্যা হয়েছে।');
      }
    }
  };

  const handleBlock = async (userId: string) => {
    try {
      await blockUser(userId);
      setSuccess('ইউজার ব্লক করা হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('ব্লক করতে সমস্যা হয়েছে।');
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(userId);
      setSuccess('ইউজার আনব্লক করা হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('আনব্লক করতে সমস্যা হয়েছে।');
    }
  };

  const handleDelete = async (userId: string) => {
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

  const totalBlocked = getTotalBlockedCount();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ইউজার লিস্ট
        </h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium">মোট: {safeUsers.length}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <UserX className="w-5 h-5 text-red-600" />
            <span className="font-medium">ব্লক: {totalBlocked}</span>
          </div>
        </div>
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="ইউজার খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card 
            key={user.uid} 
            className={`${user.isAdmin ? 'border-purple-500 border-2' : ''} ${
              user.isBlocked ? 'opacity-60' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    user.isAdmin 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    <span className="text-white font-bold text-lg">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {user.name || 'অজানা'}
                      {user.isAdmin && (
                        <Crown className="w-4 h-4 text-purple-500" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                {user.isBlocked && (
                  <Badge variant="destructive">ব্লক</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">এলাকা:</span>
                  <span>{user.area || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ক্যাটাগরি:</span>
                  <Badge variant="outline">{user.category || '-'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">জন্ম তারিখ:</span>
                  <span>{user.birthDate || '-'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Wallet className="w-4 h-4" />
                    মোট জমা:
                  </span>
                  <span className="font-bold text-green-600">
                    ৳{(user.totalDeposit || 0).toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              {isAdmin && user.uid !== userData?.uid && (
                <div className="flex gap-2 mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>ইউজার এডিট করুন</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm font-medium">নাম</label>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">এলাকা</label>
                          <Input
                            value={editForm.area}
                            onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">জন্ম তারিখ</label>
                          <Input
                            type="date"
                            value={editForm.birthDate}
                            onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                          />
                        </div>
                        <Button onClick={handleSaveEdit} className="w-full">
                          সংরক্ষণ করুন
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {user.isBlocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(user.uid)}
                      className="text-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      আনব্লক
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBlock(user.uid)}
                      className="text-yellow-600"
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      ব্লক
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.uid)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">কোনো ইউজার পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
}
