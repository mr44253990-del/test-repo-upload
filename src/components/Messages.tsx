import { useState } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  MessageCircle, 
  Reply, 
  CheckCircle,
  Mail,
  Inbox
} from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

export function Messages() {
  const { sendMessage, replyToMessage, resolveMessage, getUserMessages, getPendingMessages } = useMessages();
  const { userData, isAdmin } = useAuth();
  
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userMessages = getUserMessages(userData?.uid || '');
  const pendingMessages = getPendingMessages();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!subject.trim() || !content.trim()) {
      setError('অনুগ্রহ করে বিষয় ও বার্তা লিখুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendMessage(userData!.uid, userData!.name, subject.trim(), content.trim());
      setSubject('');
      setContent('');
      setSuccess('বার্তা সফলভাবে পাঠানো হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'বার্তা পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!replyContent.trim()) return;
    
    try {
      await replyToMessage(messageId, replyContent.trim());
      setReplyContent('');
      setSelectedMessage(null);
      setSuccess('উত্তর সফলভাবে পাঠানো হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('উত্তর পাঠাতে সমস্যা হয়েছে।');
    }
  };

  const handleResolve = async (messageId: string) => {
    try {
      await resolveMessage(messageId);
      setSuccess('বার্তা সমাধান চিহ্নিত হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('সমাধান চিহ্নিত করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        বার্তা পাঠান
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

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inbox">ইনবক্স</TabsTrigger>
          <TabsTrigger value="new">নতুন বার্তা</TabsTrigger>
          {isAdmin && <TabsTrigger value="pending">অপেক্ষমান ({pendingMessages.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="w-5 h-5" />
                আমার বার্তাসমূহ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userMessages.length > 0 ? userMessages.map((message) => (
                  <div 
                    key={message.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{message.subject}</h4>
                        <p className="text-sm text-gray-500">
                          {message.createdAt ? format(new Date(message.createdAt), 'PPp', { locale: bn }) : '-'}
                        </p>
                      </div>
                      <Badge variant={
                        message.status === 'resolved' ? 'default' :
                        message.status === 'replied' ? 'secondary' :
                        'outline'
                      }>
                        {message.status === 'resolved' ? 'সমাধান হয়েছে' :
                         message.status === 'replied' ? 'উত্তর দেওয়া হয়েছে' :
                         'অপেক্ষমান'}
                      </Badge>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{message.content}</p>
                    
                    {message.reply && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                          অ্যাডমিনের উত্তর:
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">{message.reply}</p>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">কোনো বার্তা নেই</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                অ্যাডমিনকে বার্তা পাঠান
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="space-y-2">
                  <Label>বিষয়</Label>
                  <Input
                    placeholder="বার্তার বিষয় লিখুন"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>বার্তা</Label>
                  <Textarea
                    placeholder="আপনার বার্তা লিখুন..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  অপেক্ষমান বার্তাসমূহ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingMessages.length > 0 ? pendingMessages.map((message) => (
                    <div 
                      key={message.id}
                      className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{message.subject}</h4>
                          <p className="text-sm text-gray-600">
                            থেকে: {message.userName} • {' '}
                            {message.createdAt ? format(new Date(message.createdAt), 'PPp', { locale: bn }) : '-'}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{message.content}</p>
                      
                      {selectedMessage === message.id ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="উত্তর লিখুন..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReply(message.id)}
                            >
                              <Reply className="w-4 h-4 mr-1" />
                              উত্তর দিন
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedMessage(null)}
                            >
                              বাতিল
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setSelectedMessage(message.id)}
                          >
                            <Reply className="w-4 h-4 mr-1" />
                            উত্তর দিন
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolve(message.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            সমাধান
                          </Button>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                      <p className="text-gray-500">সব বার্তার উত্তর দেওয়া হয়েছে</p>
                    </div>
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
