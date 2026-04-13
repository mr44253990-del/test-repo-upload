import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push, update, remove, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Post } from '@/types';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const postsRef = ref(db, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const postList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
          comments: value.comments ? Object.entries(value.comments).map(([cid, cval]: [string, any]) => ({
            id: cid,
            ...cval,
          })) : [],
        }));
        setPosts(postList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } else {
        setPosts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const createPost = useCallback(async (
    content: string, 
    createdBy: string, 
    createdByName: string,
    facebookLink?: string,
    thumbnailUrl?: string
  ) => {
    const postsRef = ref(db, 'posts');
    const newPostRef = push(postsRef);
    await set(newPostRef, {
      content,
      facebookLink: facebookLink || null,
      thumbnailUrl: thumbnailUrl || null,
      createdAt: new Date().toISOString(),
      createdBy,
      createdByName,
      reactions: {
        like: [],
        love: [],
        wow: [],
      },
      comments: {},
    });
    return newPostRef.key;
  }, []);

  const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
    const postRef = ref(db, `posts/${postId}`);
    await update(postRef, updates);
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    const postRef = ref(db, `posts/${postId}`);
    await remove(postRef);
  }, []);

  const addReaction = useCallback(async (postId: string, userId: string, reactionType: 'like' | 'love' | 'wow') => {
    const postRef = ref(db, `posts/${postId}`);
    const snapshot = await get(postRef);
    
    if (snapshot.exists()) {
      const post = snapshot.val();
      const reactions = post.reactions || { like: [], love: [], wow: [] };
      
      // Remove user from all reaction types first
      (['like', 'love', 'wow'] as const).forEach((type) => {
        if (reactions[type]) {
          reactions[type] = reactions[type].filter((id: string) => id !== userId);
        }
      });
      
      // Add to new reaction type
      if (!reactions[reactionType]) {
        reactions[reactionType] = [];
      }
      reactions[reactionType].push(userId);
      
      await update(postRef, { reactions });
    }
  }, []);

  const removeReaction = useCallback(async (postId: string, userId: string) => {
    const postRef = ref(db, `posts/${postId}`);
    const snapshot = await get(postRef);
    
    if (snapshot.exists()) {
      const post = snapshot.val();
      const reactions = post.reactions || { like: [], love: [], wow: [] };
      
      (['like', 'love', 'wow'] as const).forEach((type) => {
        if (reactions[type]) {
          reactions[type] = reactions[type].filter((id: string) => id !== userId);
        }
      });
      
      await update(postRef, { reactions });
    }
  }, []);

  const addComment = useCallback(async (
    postId: string, 
    userId: string, 
    userName: string, 
    content: string
  ) => {
    const commentsRef = ref(db, `posts/${postId}/comments`);
    const newCommentRef = push(commentsRef);
    await set(newCommentRef, {
      userId,
      userName,
      content,
      createdAt: new Date().toISOString(),
    });
    return newCommentRef.key;
  }, []);

  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    const commentRef = ref(db, `posts/${postId}/comments/${commentId}`);
    await remove(commentRef);
  }, []);

  const getUserReaction = useCallback((post: Post, userId: string): 'like' | 'love' | 'wow' | null => {
    if (post.reactions?.like?.includes(userId)) return 'like';
    if (post.reactions?.love?.includes(userId)) return 'love';
    if (post.reactions?.wow?.includes(userId)) return 'wow';
    return null;
  }, []);

  return {
    posts,
    createPost,
    updatePost,
    deletePost,
    addReaction,
    removeReaction,
    addComment,
    deleteComment,
    getUserReaction,
  };
}
