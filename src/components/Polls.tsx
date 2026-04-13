import { useState } from 'react';
import { usePolls } from '@/hooks/usePolls';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  ThumbsUp, 
  ThumbsDown, 
  Users,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import type { Poll } from '@/types';

export function Polls() {
  const { polls, createPoll, votePoll, closePoll } = usePolls();
  const { userData, isAdmin } = useAuth();
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newQuestion.trim()) {
      setError('অনুগ্রহ করে একটি প্রশ্ন লিখুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPoll(newQuestion.trim(), userData!.uid);
      setNewQuestion('');
      setSuccess('ভোট সফলভাবে তৈরি হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'ভোট তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (pollId: string, vote: 'yes' | 'no') => {
    try {
      await votePoll(pollId, userData!.uid, vote);
    } catch (err: any) {
      setError('ভোট দিতে সমস্যা হয়েছে।');
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      await closePoll(pollId);
      setSuccess('ভোট বন্ধ করা হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('ভোট বন্ধ করতে সমস্যা হয়েছে।');
    }
  };

  const hasVoted = (poll: Poll) => {
    return poll?.voters && poll.voters[userData!.uid];
  };

  const getUserVote = (poll: Poll) => {
    return poll?.voters?.[userData!.uid];
  };

  // Safe array check
  const safePolls = Array.isArray(polls) ? polls : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ভোটিং সিস্টেম
        </h1>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                নতুন ভোট তৈরি করুন
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>নতুন ভোট তৈরি করুন</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePoll} className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">ভোটের বিষয়</label>
                  <Input
                    placeholder="প্রশ্ন লিখুন..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'তৈরি হচ্ছে...' : 'ভোট তৈরি করুন'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safePolls.map((poll) => {
          if (!poll || !poll.id) return null;
          
          const totalVotes = poll.totalVotes || 0;
          const yesPercent = totalVotes > 0 ? Math.round((poll.yesVotes / totalVotes) * 100) : 0;
          const noPercent = totalVotes > 0 ? Math.round((poll.noVotes / totalVotes) * 100) : 0;
          const userVoted = hasVoted(poll);
          const userVote = getUserVote(poll);

          return (
            <Card key={poll.id} className={!poll.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{poll.question}</CardTitle>
                  <div className="flex gap-2">
                    {!poll.isActive && (
                      <Badge variant="secondary">বন্ধ</Badge>
                    )}
                    {userVoted && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        ভোট দেওয়া হয়েছে
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {poll.createdAt ? format(new Date(poll.createdAt), 'PP', { locale: bn }) : '-'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Yes Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      হ্যাঁ
                    </span>
                    <span className="font-medium">{yesPercent}% ({poll.yesVotes || 0} ভোট)</span>
                  </div>
                  <Progress value={yesPercent} className="h-2" />
                </div>

                {/* No Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                      না
                    </span>
                    <span className="font-medium">{noPercent}% ({poll.noVotes || 0} ভোট)</span>
                  </div>
                  <Progress value={noPercent} className="h-2" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    মোট {totalVotes} ভোট
                  </div>
                  
                  {poll.isActive && !userVoted && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVote(poll.id, 'yes')}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        হ্যাঁ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVote(poll.id, 'no')}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        না
                      </Button>
                    </div>
                  )}

                  {userVoted && (
                    <Badge variant="outline">
                      আপনি "{userVote === 'yes' ? 'হ্যাঁ' : 'না'}" ভোট দিয়েছেন
                    </Badge>
                  )}
                </div>

                {isAdmin && poll.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleClosePoll(poll.id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    ভোট বন্ধ করুন
                  </Button>
                )}

                {isAdmin && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-gray-600 mb-2">ভোটদাতার তালিকা:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {Object.entries(poll.voters || {}).map(([userId, vote]) => (
                        <div key={userId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">ইউজার ID: {userId.slice(0, 8)}...</span>
                          <Badge variant={vote === 'yes' ? 'default' : 'destructive'}>
                            {vote === 'yes' ? 'হ্যাঁ' : 'না'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {safePolls.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">কোনো ভোট নেই</p>
          {isAdmin && (
            <p className="text-sm text-gray-400 mt-2">নতুন ভোট তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
          )}
        </div>
      )}
    </div>
  );
}
