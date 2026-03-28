
import React, { useState } from 'react';
import { useApp } from '../context';
import { Card, Badge, ProgressBar, Button, Modal, Input, Select, Tabs } from '../components/UI';
import { MOCK_CAMPAIGNS, MOCK_NOTIFICATIONS, MOCK_USERS } from '../data';
import { Heart, Users, DollarSign, Activity, ArrowUpRight, MapPin, Truck, AlertTriangle, CheckCircle, Calendar, Building2, Upload, CreditCard, Package, Gift, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { User } from '../types';

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <Card className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm text-emerald-500">
        <ArrowUpRight size={16} className="mr-1" />
        <span>{trend} vs last month</span>
      </div>
    )}
  </Card>
);

const chartData = [
  { name: 'Jan', amount: 4000 },
  { name: 'Feb', amount: 3000 },
  { name: 'Mar', amount: 2000 },
  { name: 'Apr', amount: 2780 },
  { name: 'May', amount: 1890 },
  { name: 'Jun', amount: 2390 },
  { name: 'Jul', amount: 3490 },
];

export const Dashboard = () => {
  const { user } = useApp();
  
  // State for Help Request
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpRequest, setHelpRequest] = useState({ title: '', type: 'Financial Aid', description: '', attachment: '', targetOrgId: 'ALL' });

  // State for Direct Donation
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationTarget, setDonationTarget] = useState<User | null>(null);
  const [donationType, setDonationType] = useState<'MONEY' | 'MATERIAL'>('MONEY');
  const [donationAmount, setDonationAmount] = useState('');

  // State for NGO Details
  const [selectedNGO, setSelectedNGO] = useState<User | null>(null);

  const renderIndividualStats = () => (
    <>
      <StatCard icon={Heart} label="Lives Impacted" value="1,240" trend="+12%" color="bg-rose-500" />
      <StatCard icon={DollarSign} label="Total Contributed" value="$45.2k" trend="+8%" color="bg-emerald-500" />
      <StatCard icon={Activity} label="Volunteer Hours" value="128h" trend="+24%" color="bg-blue-500" />
      <StatCard icon={Calendar} label="Events Attended" value="12" trend="+2" color="bg-indigo-500" />
    </>
  );

  const renderOrgStats = () => (
    <>
      <StatCard icon={Heart} label="Active Campaigns" value="8" trend="+2" color="bg-rose-500" />
      <StatCard icon={DollarSign} label="Funds Raised" value="$124k" trend="+15%" color="bg-emerald-500" />
      <StatCard icon={Truck} label="Material Units" value="5,400" trend="+400" color="bg-blue-500" />
      <StatCard icon={Users} label="Volunteers Recruited" value="342" trend="+18" color="bg-indigo-500" />
    </>
  );

  const renderAdminStats = () => (
    <>
       <StatCard icon={AlertTriangle} label="Pending Verifications" value="14" trend="-5" color="bg-amber-500" />
       <StatCard icon={DollarSign} label="Platform Volume" value="$1.2M" trend="+22%" color="bg-emerald-500" />
       <StatCard icon={Users} label="Total Users" value="15,234" trend="+120" color="bg-blue-500" />
       <StatCard icon={CheckCircle} label="Active Orgs" value="450" trend="+12" color="bg-indigo-500" />
    </>
  );

  const ngos = MOCK_USERS.filter(u => u.role === 'ORGANIZATION');

  const openDonateModal = (org: User, type: 'MONEY' | 'MATERIAL') => {
    setDonationTarget(org);
    setDonationType(type);
    setShowDonateModal(true);
  };

  const openHelpRequest = (orgId: string = 'ALL') => {
    setHelpRequest(prev => ({ ...prev, targetOrgId: orgId }));
    setShowHelpModal(true);
  };

  const handleDonationSubmit = () => {
    alert(`Thank you! Your ${donationType === 'MONEY' ? 'donation' : 'pledge'} to ${donationTarget?.name} has been recorded.`);
    setShowDonateModal(false);
    setDonationAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Hello, {user?.name} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === 'ADMIN' ? 'System overview and moderation queue.' : 'Here\'s what\'s happening in your impact circle today.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
            <Badge variant={user?.verified ? 'success' : 'warning'}>{user?.verified ? 'Verified Profile' : 'Pending Verification'}</Badge>
            <span className="text-sm text-slate-400">ID: {user?.id}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'INDIVIDUAL' && renderIndividualStats()}
        {user?.role === 'ORGANIZATION' && renderOrgStats()}
        {user?.role === 'ADMIN' && renderAdminStats()}
      </div>

      {/* Individual Specific: NGO Directory & Request */}
      {user?.role === 'INDIVIDUAL' && (
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Connect with NGOs</h3>
                <p className="text-sm text-slate-500">Donate directly or request support from registered organizations.</p>
              </div>
              <Button onClick={() => openHelpRequest('ALL')} className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30">
                Create Need / Request Help (Broadcast)
              </Button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ngos.map(ngo => (
                 <Card key={ngo.id} className="p-6 flex flex-col h-full relative group">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={ngo.avatar} alt={ngo.name} className="w-16 h-16 rounded-full border-2 border-slate-100 dark:border-slate-700" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-lg leading-tight truncate pr-2">{ngo.name}</h4>
                           <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedNGO(ngo); }}
                              className="text-slate-400 hover:text-primary-600 p-1"
                              title="View Details"
                           >
                              <Info size={18} />
                           </button>
                        </div>
                        <p className="text-xs text-slate-500">{ngo.location}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{ngo.bio}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                       {ngo.causes?.map(cause => (
                          <span key={cause} className="text-[10px] uppercase px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 font-bold">{cause}</span>
                       ))}
                    </div>
                    <div className="space-y-2 mt-auto">
                       <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" variant="outline" onClick={() => openDonateModal(ngo, 'MONEY')} className="flex items-center justify-center gap-1">
                             <DollarSign size={14}/> Donate
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openDonateModal(ngo, 'MATERIAL')} className="flex items-center justify-center gap-1">
                             <Gift size={14}/> Materials
                          </Button>
                       </div>
                       <Button size="sm" variant="ghost" className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" onClick={() => openHelpRequest(ngo.id)}>
                          Request Support from {ngo.name}
                       </Button>
                    </div>
                 </Card>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="col-span-1 lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white">
               {user?.role === 'INDIVIDUAL' ? 'Your Impact History' : 'Fundraising Overview'}
             </h3>
             <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 text-sm">
               <option>Last 6 Months</option>
               <option>Last Year</option>
             </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Notifications</h3>
          <div className="space-y-4">
            {MOCK_NOTIFICATIONS.map((note) => (
              <div key={note.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${note.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{note.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{note.message}</p>
                  <span className="text-xs text-slate-400 mt-2 block">{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4 text-sm">View All Notifications</Button>
        </Card>
      </div>

      {/* Conditional Bottom Section */}
      {user?.role !== 'ADMIN' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {user?.role === 'ORGANIZATION' ? 'Your Active Campaigns' : 'Suggested for You'}
            </h3>
            <Button variant="ghost" className="text-primary-600">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_CAMPAIGNS.slice(0, 3).map((campaign) => (
              <Card key={campaign.id} className="flex flex-col h-full">
                <div className="relative h-48">
                  <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
                  {campaign.urgent && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md animate-pulse">URGENT</span>
                  )}
                  <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded">
                    {campaign.type}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{campaign.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 flex-1">{campaign.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                       <span className="text-slate-700 dark:text-slate-300">{campaign.raised} {campaign.unit}</span>
                       <span className="text-slate-400">Target: {campaign.target}</span>
                    </div>
                    <ProgressBar value={campaign.raised} max={campaign.target} />
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                     <div className="flex items-center text-xs text-slate-500">
                        <MapPin size={14} className="mr-1" />
                        {campaign.location.address.split(',')[0]}
                     </div>
                     {user?.role === 'INDIVIDUAL' && (
                        <button className="text-primary-600 font-semibold text-sm hover:underline">Donate Now</button>
                     )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {user?.role === 'ADMIN' && (
        // Admin Quick Actions
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="p-4 rounded-full bg-emerald-100 text-emerald-600 mb-3"><CheckCircle size={32}/></div>
              <h3 className="font-bold">Verify Users</h3>
              <p className="text-sm text-slate-500 mt-1">Review pending ID docs</p>
           </Card>
           <Card className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="p-4 rounded-full bg-rose-100 text-rose-600 mb-3"><AlertTriangle size={32}/></div>
              <h3 className="font-bold">Fraud Alerts</h3>
              <p className="text-sm text-slate-500 mt-1">Review flagged transactions</p>
           </Card>
           <Card className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-3"><Activity size={32}/></div>
              <h3 className="font-bold">System Reports</h3>
              <p className="text-sm text-slate-500 mt-1">Download monthly analytics</p>
           </Card>
        </div>
      )}

      {/* Create Help Request Modal */}
      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="Create Help Request">
         <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm">
               <strong>Note:</strong> All requests require valid proof and are subject to verification by our Admin team before being forwarded to NGOs.
            </div>
            
            <Select 
                label="Target Organization" 
                value={helpRequest.targetOrgId} 
                onChange={e => setHelpRequest({...helpRequest, targetOrgId: e.target.value})}
            >
               <option value="ALL">Broadcast to All NGOs (Recommended for urgency)</option>
               {ngos.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </Select>

            <Input label="Request Title" placeholder="e.g. Medical Aid for Child" value={helpRequest.title} onChange={e => setHelpRequest({...helpRequest, title: e.target.value})} />
            
            <Select label="Request Type" value={helpRequest.type} onChange={e => setHelpRequest({...helpRequest, type: e.target.value})}>
               <option>Financial Aid</option>
               <option>Food & Supplies</option>
               <option>Medical Support</option>
               <option>Education Support</option>
            </Select>

            <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Detailed Description</label>
               <textarea className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none h-24 resize-none" 
                 placeholder="Describe your situation, what you need, and why..."
                 value={helpRequest.description}
                 onChange={e => setHelpRequest({...helpRequest, description: e.target.value})}
               ></textarea>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer relative transition-colors group">
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={() => alert('File Selected')} />
               <div className="group-hover:scale-105 transition-transform">
                   <Upload className="mx-auto text-slate-400 mb-2" />
                   <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload Proof of Need</p>
                   <p className="text-xs text-slate-500">Medical Reports, Income Certificates, Photo Evidence</p>
               </div>
               <p className="text-xs text-red-500 mt-2 font-semibold">* Mandatory for Admin Verification</p>
            </div>

            <Button className="w-full" onClick={() => { setShowHelpModal(false); alert('Request Submitted for Admin Verification'); }}>Submit Request</Button>
         </div>
      </Modal>

      {/* Direct Donation Modal */}
      <Modal isOpen={showDonateModal} onClose={() => setShowDonateModal(false)} title={`Donate to ${donationTarget?.name}`}>
         <div className="space-y-4">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
               <button 
                 onClick={() => setDonationType('MONEY')}
                 className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${donationType === 'MONEY' ? 'bg-white dark:bg-slate-600 shadow' : 'text-slate-500'}`}
               >
                 Money
               </button>
               <button 
                 onClick={() => setDonationType('MATERIAL')}
                 className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${donationType === 'MATERIAL' ? 'bg-white dark:bg-slate-600 shadow' : 'text-slate-500'}`}
               >
                 Material (Clothes/Food)
               </button>
            </div>

            {donationType === 'MONEY' ? (
              <div className="space-y-4 animate-fade-in">
                 <div className="grid grid-cols-3 gap-2">
                    {['$10', '$50', '$100'].map(amt => (
                       <button key={amt} onClick={() => setDonationAmount(amt.replace('$',''))} className="py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">{amt}</button>
                    ))}
                 </div>
                 <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <Input placeholder="Custom Amount" className="pl-10" value={donationAmount} onChange={e => setDonationAmount(e.target.value)} />
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                    <CreditCard className="text-slate-400" />
                    <div>
                       <p className="text-xs font-bold uppercase text-slate-500">Payment Method</p>
                       <p className="text-sm">Visa ending in 4242</p>
                    </div>
                    <button className="ml-auto text-xs text-primary-600 hover:underline">Change</button>
                 </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                 <Select label="Item Category">
                    <option>Clothes</option>
                    <option>Food (Non-perishable)</option>
                    <option>Books/Stationery</option>
                    <option>Medical Supplies</option>
                    <option>Other</option>
                 </Select>
                 <Input label="Description of Items" placeholder="e.g. 2 bags of winter jackets" />
                 <div className="flex gap-2">
                    <Input type="date" label="Pickup Date" className="flex-1" />
                    <Input type="time" label="Time" className="flex-1" />
                 </div>
                 <Input label="Pickup Address" placeholder="Your full address" />
              </div>
            )}

            <Button className="w-full mt-2" onClick={handleDonationSubmit}>
               {donationType === 'MONEY' ? 'Confirm Donation' : 'Schedule Pickup'}
            </Button>
         </div>
      </Modal>

      {/* NGO Details Modal */}
      <Modal isOpen={!!selectedNGO} onClose={() => setSelectedNGO(null)} title="Organization Profile">
         {selectedNGO && (
            <div className="space-y-6">
               <div className="flex flex-col items-center text-center">
                  <img src={selectedNGO.avatar} className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 mb-3" alt={selectedNGO.name} />
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     {selectedNGO.name} 
                     {selectedNGO.verified && <CheckCircle size={18} className="text-blue-500"/>}
                  </h2>
                  <p className="text-sm text-slate-500">{selectedNGO.location}</p>
                  <div className="flex gap-2 mt-2">
                     {selectedNGO.causes?.map(cause => (
                        <Badge key={cause} variant="info">{cause}</Badge>
                     ))}
                  </div>
               </div>

               <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedNGO.bio}
                  <p className="mt-2 font-bold">Registration ID: #NGO-{selectedNGO.id.toUpperCase()}</p>
               </div>

               <div className="grid grid-cols-3 gap-4 text-center">
                   <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <p className="text-xs text-slate-500 uppercase font-bold">Campaigns</p>
                      <p className="text-xl font-bold text-primary-600">24</p>
                   </div>
                   <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <p className="text-xs text-slate-500 uppercase font-bold">Raised</p>
                      <p className="text-xl font-bold text-emerald-600">$1.2M</p>
                   </div>
                   <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <p className="text-xs text-slate-500 uppercase font-bold">Members</p>
                      <p className="text-xl font-bold text-blue-600">500+</p>
                   </div>
               </div>

               <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-white">Recent Work</h4>
                  {[1, 2].map(i => (
                     <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                        <div className="w-12 h-12 rounded bg-slate-200 dark:bg-slate-700 flex-shrink-0"></div>
                        <div>
                           <p className="text-sm font-bold">Community Food Drive #{i}</p>
                           <p className="text-xs text-slate-500">Successfully distributed 500 meals.</p>
                        </div>
                     </div>
                  ))}
               </div>

               <div className="flex gap-2">
                   <Button className="flex-1" onClick={() => {
                      setSelectedNGO(null);
                      openDonateModal(selectedNGO, 'MONEY');
                   }}>Donate Now</Button>
                   <Button variant="outline" className="flex-1" onClick={() => {
                      setSelectedNGO(null);
                      openHelpRequest(selectedNGO.id);
                   }}>Request Help</Button>
               </div>
            </div>
         )}
      </Modal>
    </div>
  );
};
