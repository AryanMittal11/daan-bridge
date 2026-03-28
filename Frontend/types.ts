
export type UserRole = 'INDIVIDUAL' | 'ORGANIZATION' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  location?: string;
  verified: boolean;
  verificationDocument?: string; // URL/Path to Aadhar or Registration Proof
  skills?: string[]; // For volunteers
  causes?: string[];
  bio?: string;
  phone?: string;
}

export type RequestType = 'MONETARY' | 'MATERIAL' | 'VOLUNTEER' | 'BLOOD' | 'DISASTER';
export type RequestStatus = 'PENDING' | 'VERIFIED' | 'FULFILLED' | 'URGENT' | 'REJECTED';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  organizer: string; // Org Name or User Name
  type: RequestType;
  target: number;
  raised: number; // For money or units
  unit: string; // "USD", "Kits", "Pints"
  status: RequestStatus;
  deadline: string;
  image: string;
  location: { lat: number; lng: number; address: string };
  urgent: boolean;
  category: string;
}

export interface Donation {
  id: string;
  campaignId: string;
  donorName: string;
  amount: number;
  date: string;
  type: 'MONEY' | 'MATERIAL';
  status: 'PROCESSING' | 'COMPLETED';
  items?: string[]; // For material donations
}

export interface BloodStock {
  type: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  units: number;
  lastUpdated: string;
}

export interface BloodRequest {
  id: string;
  requesterName: string;
  bloodType: string;
  units: number;
  hospital: string;
  status: 'PENDING' | 'FULFILLED' | 'URGENT';
  contact: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'ADMIN';
  read: boolean;
  link?: string;
  createdAt: string;
}

// New Types for Logistics & Volunteering
export interface Delivery {
  id: string;
  from: string;
  to: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED';
  driver?: string;
  itemCount: number;
  eta: string;
}

export interface TutorSession {
  id: string;
  subject: string;
  tutorName: string;
  date: string;
  time: string;
  type: 'ONLINE' | 'OFFLINE';
  status: 'OPEN' | 'BOOKED';
  students: number;
  maxStudents: number;
}

export interface VolunteerEvent {
  id: string;
  title: string;
  org: string;
  date: string;
  location: string;
  requiredSkills: string[];
  spots: number;
  filled: number;
}

export interface GalleryPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  image: string;
  caption: string;
  likes: number;
  date: string;
  role: UserRole;
}
