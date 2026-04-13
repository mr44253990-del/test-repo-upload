import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Message } from '@/types';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const messagesRef = ref(db, 'messages');
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const messageList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        setMessages(messageList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } else {
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const sendMessage = useCallback(async (
    userId: string,
    userName: string,
    subject: string,
    content: string
  ) => {
    const messagesRef = ref(db, 'messages');
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      userId,
      userName,
      subject,
      content,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return newMessageRef.key;
  }, []);

  const replyToMessage = useCallback(async (messageId: string, reply: string) => {
    const messageRef = ref(db, `messages/${messageId}`);
    await update(messageRef, {
      reply,
      status: 'replied',
      repliedAt: new Date().toISOString(),
    });
  }, []);

  const resolveMessage = useCallback(async (messageId: string) => {
    const messageRef = ref(db, `messages/${messageId}`);
    await update(messageRef, {
      status: 'resolved',
    });
  }, []);

  const getUserMessages = useCallback((userId: string) => {
    return messages.filter(m => m.userId === userId);
  }, [messages]);

  const getPendingMessages = useCallback(() => {
    return messages.filter(m => m.status === 'pending');
  }, [messages]);

  return {
    messages,
    sendMessage,
    replyToMessage,
    resolveMessage,
    getUserMessages,
    getPendingMessages,
  };
}
