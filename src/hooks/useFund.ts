import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push, update, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { FundRequest, Expense, FundStats, PaymentInfo } from '@/types';

export function useFund() {
  const [fundStats, setFundStats] = useState<FundStats>({
    totalFund: 0,
    totalExpenses: 0,
    monthlyDeposit: 0,
    monthlyExpense: 0,
    balance: 0,
  });
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    bkash: '01941429881',
    nagad: '01941429881',
    rocket: '01941429881',
  });

  // Listen to fund stats
  useEffect(() => {
    const statsRef = ref(db, 'fundStats');
    const unsubscribe = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setFundStats(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to fund requests
  useEffect(() => {
    const requestsRef = ref(db, 'fundRequests');
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const requests = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        setFundRequests(requests.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } else {
        setFundRequests([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to expenses
  useEffect(() => {
    const expensesRef = ref(db, 'expenses');
    const unsubscribe = onValue(expensesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const expenseList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        setExpenses(expenseList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } else {
        setExpenses([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to payment info
  useEffect(() => {
    const paymentRef = ref(db, 'paymentInfo');
    const unsubscribe = onValue(paymentRef, (snapshot) => {
      if (snapshot.exists()) {
        setPaymentInfo(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, []);

  const addFundRequest = useCallback(async (request: Omit<FundRequest, 'id' | 'status' | 'createdAt'>) => {
    const requestsRef = ref(db, 'fundRequests');
    const newRequestRef = push(requestsRef);
    await set(newRequestRef, {
      ...request,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return newRequestRef.key;
  }, []);

  const approveFundRequest = useCallback(async (requestId: string, _adminId: string, adminName: string) => {
    const requestRef = ref(db, `fundRequests/${requestId}`);
    const snapshot = await get(requestRef);
    
    if (snapshot.exists()) {
      const request = snapshot.val();
      
      // Update request status
      await update(requestRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: adminName,
      });
      
      // Update user's total deposit
      const userRef = ref(db, `users/${request.userId}`);
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        await update(userRef, {
          totalDeposit: (userData.totalDeposit || 0) + request.amount,
        });
      }
      
      // Update fund stats
      const statsRef = ref(db, 'fundStats');
      const statsSnapshot = await get(statsRef);
      const currentStats = statsSnapshot.exists() ? statsSnapshot.val() : {
        totalFund: 0,
        totalExpenses: 0,
        monthlyDeposit: 0,
        monthlyExpense: 0,
        balance: 0,
      };
      
      const now = new Date();
      const requestDate = new Date(request.createdAt);
      const isSameMonth = now.getMonth() === requestDate.getMonth() && 
                          now.getFullYear() === requestDate.getFullYear();
      
      await update(statsRef, {
        totalFund: (currentStats.totalFund || 0) + request.amount,
        monthlyDeposit: isSameMonth ? (currentStats.monthlyDeposit || 0) + request.amount 
                                     : currentStats.monthlyDeposit || 0,
        balance: (currentStats.totalFund || 0) + request.amount - (currentStats.totalExpenses || 0),
      });
    }
  }, []);

  const rejectFundRequest = useCallback(async (requestId: string) => {
    const requestRef = ref(db, `fundRequests/${requestId}`);
    await update(requestRef, {
      status: 'rejected',
    });
  }, []);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const expensesRef = ref(db, 'expenses');
    const newExpenseRef = push(expensesRef);
    await set(newExpenseRef, {
      ...expense,
      createdAt: new Date().toISOString(),
    });
    
    // Update fund stats
    const statsRef = ref(db, 'fundStats');
    const statsSnapshot = await get(statsRef);
    const currentStats = statsSnapshot.exists() ? statsSnapshot.val() : {
      totalFund: 0,
      totalExpenses: 0,
      monthlyDeposit: 0,
      monthlyExpense: 0,
      balance: 0,
    };
    
    await update(statsRef, {
      totalExpenses: (currentStats.totalExpenses || 0) + expense.amount,
      monthlyExpense: (currentStats.monthlyExpense || 0) + expense.amount,
      balance: (currentStats.totalFund || 0) - (currentStats.totalExpenses || 0) - expense.amount,
    });
    
    return newExpenseRef.key;
  }, []);

  const updatePaymentInfo = useCallback(async (info: PaymentInfo) => {
    const paymentRef = ref(db, 'paymentInfo');
    await set(paymentRef, info);
  }, []);

  return {
    fundStats,
    fundRequests,
    expenses,
    paymentInfo,
    addFundRequest,
    approveFundRequest,
    rejectFundRequest,
    addExpense,
    updatePaymentInfo,
  };
}
