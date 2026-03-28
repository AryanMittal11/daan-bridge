
import { User, Campaign, BloodStock, Message, Notification, Donation, Delivery, TutorSession, VolunteerEvent, BloodRequest, GalleryPost } from './types';

// Mock Users
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'John Doe', email: 'john@example.com', role: 'INDIVIDUAL', avatar: 'https://i.pravatar.cc/150?u=u1', verified: true, location: 'New York, NY', skills: ['Teaching', 'Driving'], bio: 'Passionate about education and disaster relief.' },
  { id: 'u2', name: 'Global Relief Foundation', email: 'contact@grf.org', role: 'ORGANIZATION', avatar: 'https://i.pravatar.cc/150?u=u2', verified: true, location: 'London, UK', causes: ['Disaster', 'Poverty'], bio: 'International aid organization dedicated to rapid disaster response and long-term rehabilitation projects across 3 continents.' },
  { id: 'u3', name: 'Admin User', email: 'admin@daanbridge.com', role: 'ADMIN', avatar: 'https://i.pravatar.cc/150?u=u3', verified: true, bio: 'System Administrator' },
  { id: 'u4', name: 'City Health Care', email: 'health@city.org', role: 'ORGANIZATION', avatar: 'https://i.pravatar.cc/150?u=u4', verified: true, location: 'Chicago, IL', causes: ['Health', 'Blood'], bio: 'Citywide health initiative and blood bank providing 24/7 emergency services.' },
  { id: 'u5', name: 'EduCare NGO', email: 'edu@care.org', role: 'ORGANIZATION', avatar: 'https://i.pravatar.cc/150?u=u5', verified: false, verificationDocument: 'reg_cert_educare.pdf', location: 'Austin, TX', causes: ['Education'], bio: 'Empowering youth through education and vocational training programs.' },
  { id: 'u6', name: 'Michael Chen', email: 'mike@example.com', role: 'INDIVIDUAL', avatar: 'https://i.pravatar.cc/150?u=u6', verified: false, verificationDocument: 'aadhar_card_encrypted.jpg', location: 'San Francisco, CA', bio: 'New volunteer ready to help.' },
];

// Mock Campaigns
export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    title: 'Earthquake Relief Fund',
    description: 'Urgent medical supplies and shelter needed for earthquake victims.',
    organizer: 'Global Relief Foundation',
    type: 'DISASTER',
    target: 50000,
    raised: 32500,
    unit: 'USD',
    status: 'URGENT',
    deadline: '2024-12-31',
    image: 'https://images.unsplash.com/photo-1585134248076-e79e046489d1?auto=format&fit=crop&q=80&w=800',
    location: { lat: 34.05, lng: -118.24, address: 'Los Angeles, CA' },
    urgent: true,
    category: 'Disaster Relief'
  },
  {
    id: 'c2',
    title: 'Weekend Math Tutoring',
    description: 'Looking for volunteers to teach math to underprivileged high school students.',
    organizer: 'Education For All',
    type: 'VOLUNTEER',
    target: 20,
    raised: 12,
    unit: 'Volunteers',
    status: 'VERIFIED',
    deadline: '2024-06-15',
    image: 'https://images.unsplash.com/photo-1509062522246-37559cc792f9?auto=format&fit=crop&q=80&w=800',
    location: { lat: 40.71, lng: -74.00, address: 'New York, NY' },
    urgent: false,
    category: 'Education'
  },
  {
    id: 'c3',
    title: 'O+ Blood Emergency',
    description: 'Urgent need for O+ blood donors at City Hospital.',
    organizer: 'City Blood Bank',
    type: 'BLOOD',
    target: 50,
    raised: 15,
    unit: 'Pints',
    status: 'URGENT',
    deadline: '2024-05-20',
    image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=800',
    location: { lat: 51.50, lng: -0.12, address: 'London, UK' },
    urgent: true,
    category: 'Health'
  },
    {
    id: 'c4',
    title: 'Winter Clothes Drive',
    description: 'Collecting jackets and blankets for the homeless.',
    organizer: 'Community Care',
    type: 'MATERIAL',
    target: 500,
    raised: 120,
    unit: 'Items',
    status: 'VERIFIED',
    deadline: '2024-11-01',
    image: 'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?auto=format&fit=crop&q=80&w=800',
    location: { lat: 41.87, lng: -87.62, address: 'Chicago, IL' },
    urgent: false,
    category: 'Welfare'
  },
];

export const MOCK_BLOOD_STOCK: BloodStock[] = [
  { type: 'A+', units: 45, lastUpdated: '2h ago' },
  { type: 'A-', units: 12, lastUpdated: '5h ago' },
  { type: 'B+', units: 50, lastUpdated: '1h ago' },
  { type: 'B-', units: 8, lastUpdated: '1d ago' },
  { type: 'O+', units: 20, lastUpdated: '30m ago' },
  { type: 'O-', units: 5, lastUpdated: '10m ago' },
  { type: 'AB+', units: 15, lastUpdated: '4h ago' },
  { type: 'AB-', units: 3, lastUpdated: '6h ago' },
];

export const MOCK_BLOOD_REQUESTS: BloodRequest[] = [
  { id: 'br1', requesterName: 'General Hospital', bloodType: 'A+', units: 5, hospital: 'City General, Ward 3', status: 'URGENT', contact: '555-0123' },
  { id: 'br2', requesterName: 'Jane Doe (Family)', bloodType: 'O-', units: 2, hospital: 'St. Marys', status: 'PENDING', contact: '555-0456' },
  { id: 'br3', requesterName: 'Emergency Trauma Ctr', bloodType: 'AB+', units: 10, hospital: 'Downtown Trauma', status: 'URGENT', contact: '555-0999' },
];

export const MOCK_MESSAGES: Message[] = [
  { id: 'm1', senderId: 'u2', senderName: 'Global Relief', text: 'Thank you for your generous donation!', timestamp: '10:30 AM', isRead: false },
  { id: 'm2', senderId: 'u4', senderName: 'Sarah Smith', text: 'Is the volunteer event still happening tomorrow?', timestamp: 'Yesterday', isRead: true },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Donation Received', message: 'Your donation of $50 has been processed.', type: 'SUCCESS', read: false, createdAt: new Date().toISOString() },
  { id: 'n2', title: 'Urgent Alert', message: 'Heavy rains reported in your registered area. Stay safe.', type: 'WARNING', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
];

export const MOCK_DONATIONS: Donation[] = [
    { id: 'd1', campaignId: 'c1', donorName: 'Anonymous', amount: 50, date: '2024-05-10', type: 'MONEY', status: 'COMPLETED' },
    { id: 'd2', campaignId: 'c1', donorName: 'John Doe', amount: 100, date: '2024-05-11', type: 'MONEY', status: 'COMPLETED' },
    { id: 'd3', campaignId: 'c4', donorName: 'Jane Smith', amount: 5, date: '2024-05-12', type: 'MATERIAL', status: 'PROCESSING', items: ['2 Jackets', '1 Blanket'] },
];

export const MOCK_DELIVERIES: Delivery[] = [
  { id: 'dl1', from: 'Jane Smith (Donor)', to: 'Community Care Hub', status: 'PENDING', itemCount: 3, eta: 'Pending Assignment' },
  { id: 'dl2', from: 'Local Pharmacy', to: 'City Hospital', status: 'IN_TRANSIT', driver: 'Mike Ross', itemCount: 50, eta: '20 mins' },
  { id: 'dl3', from: 'Food Bank', to: 'Shelter 4', status: 'DELIVERED', driver: 'Harvey S.', itemCount: 200, eta: 'Arrived' },
];

export const MOCK_TUTOR_SESSIONS: TutorSession[] = [
  { id: 'ts1', subject: 'Mathematics - Algebra', tutorName: 'Alice Johnson', date: '2024-06-01', time: '14:00', type: 'ONLINE', status: 'OPEN', students: 2, maxStudents: 5 },
  { id: 'ts2', subject: 'Science - Physics', tutorName: 'Bob Wilson', date: '2024-06-02', time: '16:00', type: 'OFFLINE', status: 'BOOKED', students: 4, maxStudents: 4 },
  { id: 'ts3', subject: 'English Literature', tutorName: 'Carol Danvers', date: '2024-06-03', time: '10:00', type: 'ONLINE', status: 'OPEN', students: 1, maxStudents: 3 },
];

export const MOCK_VOLUNTEER_EVENTS: VolunteerEvent[] = [
  { id: 've1', title: 'Beach Cleanup', org: 'Green Earth', date: '2024-06-10', location: 'Santa Monica Pier', requiredSkills: ['Physical Labor'], spots: 50, filled: 32 },
  { id: 've2', title: 'Food Serving', org: 'City Kitchen', date: '2024-06-12', location: 'Downtown Shelter', requiredSkills: ['Food Prep'], spots: 10, filled: 8 },
];

export const MOCK_GALLERY_POSTS: GalleryPost[] = [
  {
    id: 'g1',
    userId: 'u2',
    userName: 'Global Relief Foundation',
    userAvatar: 'https://i.pravatar.cc/150?u=u2',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    caption: 'Our volunteers working tirelessly to distribute food packets in the flood-affected regions. Together we can make a difference!',
    likes: 245,
    date: '2 days ago',
    role: 'ORGANIZATION'
  },
  {
    id: 'g2',
    userId: 'u1',
    userName: 'John Doe',
    userAvatar: 'https://i.pravatar.cc/150?u=u1',
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800',
    caption: 'Completed my first tutoring session today with these bright minds! Feeling grateful for the opportunity to share knowledge.',
    likes: 89,
    date: '5 hours ago',
    role: 'INDIVIDUAL'
  },
  {
    id: 'g3',
    userId: 'u4',
    userName: 'City Health Care',
    userAvatar: 'https://i.pravatar.cc/150?u=u4',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=800',
    caption: 'Successful blood donation camp at Central Park. A big thank you to all the 50+ donors who showed up!',
    likes: 156,
    date: '1 week ago',
    role: 'ORGANIZATION'
  },
  {
    id: 'g4',
    userId: 'u1',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://i.pravatar.cc/150?u=s1',
    image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800',
    caption: 'Just donated a box of winter clothes. It feels good to give back to the community. #DaanBridge #Charity',
    likes: 42,
    date: 'Just now',
    role: 'INDIVIDUAL'
  }
];
