import { useState } from 'react';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  ThumbsUp, 
  MessageCircle,
  Edit2,
  Trash2,
  Send,
  Facebook,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import type { Post } from '@/types';

export function Posts() {
  const { posts, createPost, deletePost, addReaction, removeReaction, addComment, deleteComment, getUserReaction } = usePosts();
  const { userData, isAdmin } = useAuth();
  
  const [newPostContent, setNewPostContent] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newPostContent.trim()) {
      setError('অনুগ্রহ করে কিছু লিখুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost(
        newPostContent.trim(), 
        userData!.uid, 
        userData!.name,
        facebookLink.trim() || undefined
      );
      setNewPostContent('');
      setFacebookLink('');
      setSuccess('পোস্ট সফলভাবে তৈরি হয়েছে!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'পোস্ট তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (postId: string, type: 'like' | 'love' | 'wow') => {
    try {
      const post = posts?.find(p => p.id === postId);
      if (!post) return;
      
      const currentReaction = getUserReaction(post, userData!.uid);
      if (currentReaction === type) {
        await removeReaction(postId, userData!.uid);
      } else {
        await addReaction(postId, userData!.uid, type);
      }
    } catch (err: any) {
      setError('রিয়াক্ট দিতে সমস্যা হয়েছে।');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentContent.trim()) return;
    
    try {
      await addComment(postId, userData!.uid, userData!.name, commentContent.trim());
      setCommentContent('');
      setActiveCommentPost(null);
    } catch (err: any) {
      setError('কমেন্ট করতে সমস্যা হয়েছে।');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই পোস্টটি মুছে ফেলতে চান?')) {
      try {
        await deletePost(postId);
        setSuccess('পোস্ট মুছে ফেলা হয়েছে!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError('পোস্ট মুছতে সমস্যা হয়েছে।');
      }
    }
  };

  const getReactionCount = (post: Post, type: 'like' | 'love' | 'wow') => {
    return post?.reactions?.[type]?.length || 0;
  };

  // Safe array check
  const safePosts = Array.isArray(posts) ? posts : [];

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
        কমিউনিটি পোস্টস
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

      {isAdmin && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Textarea
                placeholder="আপনার মনের কথা শেয়ার করুন..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={3}
              />
              <Input
                placeholder="Facebook লিংক (ঐচ্ছিক)"
                value={facebookLink}
                onChange={(e) => setFacebookLink(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Plus className="w-4 h-4 mr-2" />
                {isSubmitting ? 'পোস্ট হচ্ছে...' : 'পোস্ট করুন'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {safePosts.length > 0 ? safePosts.map((post) => {
          if (!post || !post.id) return null;
          
          const userReaction = getUserReaction(post, userData!.uid);
          const likeCount = getReactionCount(post, 'like');
          const loveCount = getReactionCount(post, 'love');
          const wowCount = getReactionCount(post, 'wow');
          const totalReactions = likeCount + loveCount + wowCount;
          const comments = post.comments || [];

          return (
            <Card key={post.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {(post.createdByName || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{post.createdByName || 'অজানা'}</p>
                      <p className="text-sm text-gray-500">
                        {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { 
                          addSuffix: true,
                          locale: bn 
                        }) : '-'}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-800 dark:text-gray-200">{post.content}</p>
                
                {post.facebookLink && (
                  <a 
                    href={post.facebookLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 hover:underline"
                  >
                    <Facebook className="w-5 h-5" />
                    <span className="text-sm">Facebook এ দেখুন</span>
                  </a>
                )}

                {post.thumbnailUrl && (
                  <img 
                    src={post.thumbnailUrl} 
                    alt="Post thumbnail"
                    className="w-full rounded-lg"
                  />
                )}

                {/* Reactions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-4">
                    {totalReactions > 0 && (
                      <span className="text-sm text-gray-500">
                        {totalReactions} রিয়াক্ট
                      </span>
                    )}
                    {comments.length > 0 && (
                      <span className="text-sm text-gray-500">
                        {comments.length} কমেন্ট
                      </span>
                    )}
                  </div>
                </div>

                {/* Reaction Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant={userReaction === 'like' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleReaction(post.id, 'like')}
                    className="flex-1"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {likeCount > 0 && likeCount}
                  </Button>
                  <Button
                    variant={userReaction === 'love' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleReaction(post.id, 'love')}
                    className="flex-1"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {loveCount > 0 && loveCount}
                  </Button>
                  <Button
                    variant={userReaction === 'wow' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleReaction(post.id, 'wow')}
                    className="flex-1"
                  >
                    🤯
                    {wowCount > 0 && wowCount}
                  </Button>
                </div>

                {/* Comments */}
                {comments.length > 0 && (
                  <div className="space-y-2 pt-3 border-t">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-gray-200">
                            {(comment.userName || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                          <p className="font-medium text-sm">{comment.userName || 'অজানা'}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {comment.content}
                          </p>
                        </div>
                        {(isAdmin || comment.userId === userData?.uid) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteComment(post.id, comment.id)}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                {activeCommentPost === post.id ? (
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="কমেন্ট লিখুন..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    />
                    <Button onClick={() => handleAddComment(post.id)}>
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveCommentPost(null)}
                    >
                      বাতিল
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setActiveCommentPost(post.id)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    কমেন্ট করুন
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        }) : (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">কোনো পোস্ট নেই</p>
            {isAdmin && (
              <p className="text-sm text-gray-400 mt-2">উপরে থেকে নতুন পোস্ট তৈরি করুন</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
