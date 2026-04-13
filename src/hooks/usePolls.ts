import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push, update, remove, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Poll } from '@/types';

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    const pollsRef = ref(db, 'polls');
    const unsubscribe = onValue(pollsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const pollList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        setPolls(pollList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } else {
        setPolls([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const createPoll = useCallback(async (question: string, createdBy: string) => {
    const pollsRef = ref(db, 'polls');
    const newPollRef = push(pollsRef);
    await set(newPollRef, {
      question,
      yesVotes: 0,
      noVotes: 0,
      totalVotes: 0,
      createdAt: new Date().toISOString(),
      createdBy,
      isActive: true,
      voters: {},
    });
    return newPollRef.key;
  }, []);

  const votePoll = useCallback(async (pollId: string, userId: string, vote: 'yes' | 'no') => {
    const pollRef = ref(db, `polls/${pollId}`);
    const snapshot = await get(pollRef);
    
    if (snapshot.exists()) {
      const poll = snapshot.val();
      const voters = poll.voters || {};
      
      // Check if user already voted
      if (voters[userId]) {
        // Remove previous vote
        if (voters[userId] === 'yes') {
          poll.yesVotes = Math.max(0, (poll.yesVotes || 0) - 1);
        } else {
          poll.noVotes = Math.max(0, (poll.noVotes || 0) - 1);
        }
      }
      
      // Add new vote
      voters[userId] = vote;
      if (vote === 'yes') {
        poll.yesVotes = (poll.yesVotes || 0) + 1;
      } else {
        poll.noVotes = (poll.noVotes || 0) + 1;
      }
      
      await update(pollRef, {
        yesVotes: poll.yesVotes,
        noVotes: poll.noVotes,
        totalVotes: poll.yesVotes + poll.noVotes,
        voters,
      });
    }
  }, []);

  const closePoll = useCallback(async (pollId: string) => {
    const pollRef = ref(db, `polls/${pollId}`);
    await update(pollRef, { isActive: false });
  }, []);

  const deletePoll = useCallback(async (pollId: string) => {
    const pollRef = ref(db, `polls/${pollId}`);
    await remove(pollRef);
  }, []);

  const getVotersList = useCallback((poll: Poll) => {
    return Object.entries(poll.voters || {}).map(([userId, vote]) => ({
      userId,
      vote: vote as 'yes' | 'no',
    }));
  }, []);

  return {
    polls,
    createPoll,
    votePoll,
    closePoll,
    deletePoll,
    getVotersList,
  };
}
