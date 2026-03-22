export interface Mentor {
  id: string;
  name: string;
  avatar: string;
  expertise: string[];
  title: string;
  experience: number; // years
  hourlyRate: number; // INR
  rating: number;
  reviewCount: number;
  sessionsCompleted: number;
  isVerified: boolean;
  isAvailableNow: boolean;
  bio: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
  mentorCount: number;
}

export interface Session {
  id: string;
  mentorId: string;
  learnerId: string;
  date: string;
  duration: number; // hours
  status: 'upcoming' | 'completed' | 'cancelled';
  totalPrice: number;
}

export interface Review {
  id: string;
  mentorId: string;
  learnerName: string;
  learnerAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'learner' | 'mentor';
  walletBalance: number;
}
