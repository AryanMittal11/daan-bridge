
import React, { useState, useEffect } from 'react';
import { useApp } from '../context';
import { Card, Badge, ProgressBar, Button, Modal, Input, Select } from '../components/UI';
import { Heart, Users, DollarSign, Activity, ArrowUpRight, MapPin, Truck, AlertTriangle, CheckCircle, Calendar, Building2, Upload, CreditCard, Package, Gift, Info, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../api';

// ─── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, loading }: any) => (
  <Card className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{label}</p>
        {loading ? (
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        ) : (
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
  </Card>
);

// ─── Format helpers ─────────────────────────────────────────────────────────
const formatCurrency = (n: number) => {
  if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}k`;
  return `₹${n}`;
};

const formatNumber = (n: number) => n.toLocaleString('en-IN');

// ─── Dashboard Component ────────────────────────────────────────────────────
export const Dashboard = () => {
  const { user } = useApp();

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpRequest, setHelpRequest] = useState({ title: '', type: 'Financial Aid', description: '', attachment: '', targetOrgId: 'ALL' });
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationTarget, setDonationTarget] = useState<any>(null);
  const [donationType, setDonationType] = useState<'MONEY' | 'MATERIAL'>('MONEY');
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedNGO, setSelectedNGO] = useState<any>(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const role = user.role.toLowerCase();

        // Fetch stats for the current role
        const [statsRes, chartRes, notifRes] = await Promise.all([
          API.get(`/dashboard/${role}`),
          API.get('/dashboard/chart-data'),
          API.get('/notifications'),
        ]);
        setStats(statsRes.data);
        setChartData(chartRes.data.chartData || []);
        setNotifications((notifRes.data.notifications || []).slice(0, 5));

        // Role-specific fetches
        if (user.role === 'INDIVIDUAL') {
          const [orgsRes, campaignsRes] = await Promise.all([
            API.get('/dashboard/organizations-list'),
            API.get('/dashboard/suggested-campaigns'),
          ]);
          setOrganizations(orgsRes.data.organizations || []);
          setCampaigns(campaignsRes.data.campaigns || []);
        } else if (user.role === 'ORGANIZATION') {
          const campaignsRes = await API.get('/dashboard/org-campaigns');
          setCampaigns(campaignsRes.data.campaigns || []);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  // ─── Modal Actions ──────────────────────────────────────────────────────
  const openDonateModal = (org: any, type: 'MONEY' | 'MATERIAL') => {
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

  // ─── Stat Renderers ────────────────────────────────────────────────────
  const renderIndividualStats = () => (
    <>
      <StatCard icon={Heart} label="Lives Impacted" value={formatNumber(stats?.livesImpacted ?? 0)} color="bg-rose-500" loading={loading} />
      <StatCard icon={DollarSign} label="Total Contributed" value={formatCurrency(stats?.totalContributed ?? 0)} color="bg-emerald-500" loading={loading} />
      <StatCard icon={Users} label={`Volunteer in ${stats?.volunteerInEvents ?? 0} Events`} value={stats?.volunteerInEvents ?? 0} color="bg-blue-500" loading={loading} />
      <StatCard icon={Calendar} label="Events Attended" value={formatNumber(stats?.eventsAttended ?? 0)} color="bg-indigo-500" loading={loading} />
    </>
  );

  const renderOrgStats = () => (
    <>
      <StatCard icon={Heart} label="Active Campaigns" value={stats?.activeCampaigns ?? 0} color="bg-rose-500" loading={loading} />
      <StatCard icon={DollarSign} label="Funds Raised" value={formatCurrency(stats?.fundsRaised ?? 0)} color="bg-emerald-500" loading={loading} />
      <StatCard icon={Truck} label="Material Units" value={formatNumber(stats?.materialUnits ?? 0)} color="bg-blue-500" loading={loading} />
      <StatCard icon={Users} label="Volunteers Recruited" value={formatNumber(stats?.volunteersRecruited ?? 0)} color="bg-indigo-500" loading={loading} />
    </>
  );

  const renderAdminStats = () => (
    <>
      <StatCard icon={AlertTriangle} label="Pending Verifications" value={stats?.pendingVerifications ?? 0} color="bg-amber-500" loading={loading} />
      <StatCard icon={DollarSign} label="Platform Volume" value={formatCurrency(stats?.platformVolume ?? 0)} color="bg-emerald-500" loading={loading} />
      <StatCard icon={Users} label="Total Users" value={formatNumber(stats?.totalUsers ?? 0)} color="bg-blue-500" loading={loading} />
      <StatCard icon={CheckCircle} label="Active Orgs" value={stats?.activeOrgs ?? 0} color="bg-indigo-500" loading={loading} />
    </>
  );

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* ─── Individual: Connect with NGOs ──────────────────────────────── */}
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

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : organizations.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">No verified organizations found yet.</Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((ngo: any) => (
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


                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-[10px] uppercase px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-300 font-bold">
                      {ngo.campaignCount} Active Campaigns
                    </span>
                  </div>

                  <div className="space-y-2 mt-auto">
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDonateModal(ngo, 'MONEY')} className="flex items-center justify-center gap-1">
                        <DollarSign size={14} /> Donate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openDonateModal(ngo, 'MATERIAL')} className="flex items-center justify-center gap-1">
                        <Gift size={14} /> Materials
                      </Button>
                    </div>
                    <Button size="sm" variant="ghost" className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" onClick={() => openHelpRequest(ngo.id)}>
                      Request Support from {ngo.name}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Charts + Notifications Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="col-span-1 lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {user?.role === 'INDIVIDUAL' ? 'Your Impact History' : 'Fundraising Overview'}
            </h3>
          </div>
          <div className="h-64 w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data available yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Notifications</h3>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-3 p-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : notifications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No notifications yet</p>
            ) : (
              notifications.slice(0, 2).map((note: any) => (
                <div key={note.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                    note.type === 'SUCCESS' ? 'bg-emerald-500' :
                    note.type === 'URGENT' ? 'bg-red-500' :
                    note.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{note.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{note.message}</p>
                    <span className="text-xs text-slate-400 mt-2 block">{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <Button variant="ghost" className="w-full mt-4 text-sm">View All Notifications</Button>
        </Card>
      </div>

      {/* ─── Individual: Suggested Campaigns / Org: Active Campaigns ──── */}
      {user?.role !== 'ADMIN' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {user?.role === 'ORGANIZATION' ? 'Your Active Campaigns' : 'Suggested for You'}
            </h3>
            <Button to="/campaigns" variant="ghost" className="text-primary-600">View All</Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              {user?.role === 'ORGANIZATION' ? 'You haven\'t created any campaigns yet.' : 'No campaigns available right now.'}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.slice(0, 3).map((campaign: any) => (
                <Card key={campaign.id} className="flex flex-col h-full">
                  <div className="relative h-48">
                    <img
                      src={campaign.image || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800'}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
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
                        {campaign.location ? (typeof campaign.location === 'string' ? campaign.location : campaign.location.address?.split(',')[0]) : 'Location N/A'}
                      </div>
                      {user?.role === 'INDIVIDUAL' && (
                        <button className="text-primary-600 font-semibold text-sm hover:underline">Donate Now</button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Admin Quick Actions ─────────────────────────────────────────── */}
      {user?.role === 'ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div className="p-4 rounded-full bg-emerald-100 text-emerald-600 mb-3"><CheckCircle size={32} /></div>
            <h3 className="font-bold">Verify Users</h3>
            <p className="text-sm text-slate-500 mt-1">Review pending ID docs</p>
          </Card>
          <Card className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div className="p-4 rounded-full bg-rose-100 text-rose-600 mb-3"><AlertTriangle size={32} /></div>
            <h3 className="font-bold">Fraud Alerts</h3>
            <p className="text-sm text-slate-500 mt-1">Review flagged transactions</p>
          </Card>
          <Card className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-3"><Activity size={32} /></div>
            <h3 className="font-bold">System Reports</h3>
            <p className="text-sm text-slate-500 mt-1">Download monthly analytics</p>
          </Card>
        </div>
      )}

      {/* ─── Create Help Request Modal ──────────────────────────────────── */}
      <Modal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} title="Create Help Request">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm">
            <strong>Note:</strong> All requests require valid proof and are subject to verification by our Admin team before being forwarded to NGOs.
          </div>

          <Select
            label="Target Organization"
            value={helpRequest.targetOrgId}
            onChange={(e: any) => setHelpRequest({ ...helpRequest, targetOrgId: e.target.value })}
          >
            <option value="ALL">Broadcast to All NGOs (Recommended for urgency)</option>
            {organizations.map((n: any) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </Select>

          <Input label="Request Title" placeholder="e.g. Medical Aid for Child" value={helpRequest.title} onChange={(e: any) => setHelpRequest({ ...helpRequest, title: e.target.value })} />

          <Select label="Request Type" value={helpRequest.type} onChange={(e: any) => setHelpRequest({ ...helpRequest, type: e.target.value })}>
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
              onChange={(e: any) => setHelpRequest({ ...helpRequest, description: e.target.value })}
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

      {/* ─── Direct Donation Modal ──────────────────────────────────────── */}
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
                {['₹100', '₹500', '₹1000'].map(amt => (
                  <button key={amt} onClick={() => setDonationAmount(amt.replace('₹', ''))} className="py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">{amt}</button>
                ))}
              </div>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Custom Amount" className="pl-10" value={donationAmount} onChange={(e: any) => setDonationAmount(e.target.value)} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex items-center gap-3">
                <CreditCard className="text-slate-400" />
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Payment Method</p>
                  <p className="text-sm">UPI / Card</p>
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

      {/* ─── NGO Details Modal ──────────────────────────────────────────── */}
      <Modal isOpen={!!selectedNGO} onClose={() => setSelectedNGO(null)} title="Organization Profile">
        {selectedNGO && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <img src={selectedNGO.avatar} className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 mb-3" alt={selectedNGO.name} />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {selectedNGO.name}
                {selectedNGO.verified && <CheckCircle size={18} className="text-blue-500" />}
              </h2>
              <p className="text-sm text-slate-500">{selectedNGO.location}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 uppercase font-bold">Active Campaigns</p>
                <p className="text-xl font-bold text-primary-600">{selectedNGO.campaignCount}</p>
              </div>
              <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 uppercase font-bold">Inventory Items</p>
                <p className="text-xl font-bold text-emerald-600">{selectedNGO.inventoryItems?.length || 0}</p>
              </div>
            </div>

            {/* Inventory Details */}
            {selectedNGO.inventoryItems && selectedNGO.inventoryItems.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-3">Current Inventory</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedNGO.inventoryItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
