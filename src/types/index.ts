export interface User {
  uid: string;
  name: string;
  email: string;
  birthDate: string;
  area: string;
  category: 'A' | 'B' | 'C' | 'D';
  isAdmin: boolean;
  isBlocked: boolean;
  totalDeposit: number;
  createdAt: string;
  photoURL?: string;
}

export interface FundRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  paymentMethod: 'bkash' | 'nagad' | 'rocket';
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface FundStats {
  totalFund: number;
  totalExpenses: number;
  monthlyDeposit: number;
  monthlyExpense: number;
  balance: number;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  content: string;
  reply?: string;
  status: 'pending' | 'replied' | 'resolved';
  createdAt: string;
  repliedAt?: string;
}

export interface Poll {
  id: string;
  question: string;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
  voters: { [userId: string]: 'yes' | 'no' };
}

export interface Post {
  id: string;
  content: string;
  facebookLink?: string;
  thumbnailUrl?: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  reactions: {
    like: string[];
    love: string[];
    wow: string[];
  };
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface PaymentInfo {
  bkash: string;
  nagad: string;
  rocket: string;
}

export interface AdminContact {
  email: string;
  phone: string;
  facebook: string;
}

export interface SiteConfig {
  siteName: string;
  siteTitle: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  welcomeMessage: string;
  footerText: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}
