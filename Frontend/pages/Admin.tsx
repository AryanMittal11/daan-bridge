import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Tabs, Modal, Select, Input } from '../components/UI';
import API from '../api';
import {
  Shield, Check, X, BarChart2, AlertTriangle, FileText,
  Users, DollarSign, Activity, Download, Search, Filter,
  Eye, Trash2, Flag, Calendar, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const ANALYTICS_DATA = {
  growth: [
    { name: 'Jan', users: 400, donations: 12000 },
    { name: 'Feb', users: 600, donations: 15000 },
    { name: 'Mar', users: 900, donations: 28000 },
    { name: 'Apr', users: 1400, donations: 24000 },
    { name: 'May', users: 1800, donations: 35000 },
    { name: 'Jun', users: 2400, donations: 48000 },
  ],
  distribution: [
    { name: 'Individuals', value: 85 },
    { name: 'Organizations', value: 12 },
    { name: 'Admins', value: 3 },
  ],
  campaigns: [
    { name: 'Medical', value: 45 },
    { name: 'Education', value: 30 },
    { name: 'Disaster', value: 20 },
    { name: 'Other', value: 5 },
  ]
};
const COLORS = ['#0d9488', '#f59e0b', '#ef4444', '#3b82f6'];
const FLAGGED_ITEMS = [
  { id: 'f1', type: 'CAMPAIGN', title: 'Medical Fund for Unknown', reason: 'Suspicious Beneficiary details', reporter: 'System AI', severity: 'HIGH', date: '2024-06-10' },
  { id: 'f2', type: 'USER', title: 'Alex Trade Corp', reason: 'Multiple spam comments reported', reporter: 'User: Sarah J.', severity: 'MEDIUM', date: '2024-06-11' },
  { id: 'f3', type: 'POST', title: 'Gallery Image #8823', reason: 'Inappropriate content', reporter: 'User: Mike R.', severity: 'LOW', date: '2024-06-12' },
  { id: 'f4', type: 'TRANSACTION', title: 'TXN-99283', reason: 'High value transfer from unverified source', reporter: 'Fraud Detection', severity: 'CRITICAL', date: '2024-06-12' },
];
const REPORTS_LIST = [
  { id: 1, title: 'Monthly Financial Summary - May 2024', type: 'Finance', date: '2024-06-01', size: '2.4 MB', format: 'PDF' },
  { id: 2, title: 'Q1 Impact Assessment', type: 'Impact', date: '2024-04-15', size: '5.1 MB', format: 'PDF' },
  { id: 3, title: 'User Verification Audit Log', type: 'Security', date: '2024-06-10', size: '1.2 MB', format: 'CSV' },
  { id: 4, title: 'Donation Trends Analysis', type: 'Analytics', date: '2024-06-05', size: '3.8 MB', format: 'XLSX' },
];

export const Admin = () => {
  const [activeTab, setActiveTab] = useState('Verification');
  const [selectedFlag, setSelectedFlag] = useState<any | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // FOR BACKEND-DATA:
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch verification requests from backend
  const fetchVerificationRequests = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await API.get('/admin/verification-requests');
      setVerificationRequests(data.requests || []);
    } catch (err) {
      setVerificationRequests([]);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (activeTab === 'Verification') fetchVerificationRequests();
  }, [activeTab]);

  // Approve/Reject user
  const handleVerifyUser = async (userId: string, action: 'approve' | 'reject') => {
    await API.post('/admin/verify-user', {
      userId,
      action: action === 'approve' ? 'APPROVED' : 'REJECTED'
    });
    fetchVerificationRequests();
  };

  // Everything else (moderation, analytics, reports) can be left as is, OR use similar patterns for real data.

  const handleAction = (action: string, item: any) => {
    alert(`${action} action taken on ${item.type}: ${item.title}`);
    setSelectedFlag(null);
  };
  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      alert('Report generated and sent to your email.');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Shield className="text-primary-600" /> Admin Console
            </h1>
            <p className="text-slate-500 dark:text-slate-400">System-wide monitoring, moderation, and analytics.</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
               <Activity size={14} /> System Health: 99.8%
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
               <Users size={14} /> Online: 1,240
            </div>
         </div>
      </div>

      <Tabs 
        tabs={['Verification', 'Moderation', 'Analytics', 'Reports']} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      {/* --- VERIFICATION TAB --- */}
      {activeTab === 'Verification' && (
         <div className="space-y-6">
            <div className="flex gap-4">
               <Card className="flex-1 p-4 border-l-4 border-amber-500">
                  <h3 className="font-bold text-2xl">{verificationRequests.length}</h3>
                  <p className="text-sm text-slate-500">Pending Requests</p>
               </Card>
               <Card className="flex-1 p-4 border-l-4 border-emerald-500">
                  <h3 className="font-bold text-2xl">42</h3>
                  <p className="text-sm text-slate-500">Approved Today</p>
               </Card>
               <Card className="flex-1 p-4 border-l-4 border-red-500">
                  <h3 className="font-bold text-2xl">3</h3>
                  <p className="text-sm text-slate-500">Rejected Today</p>
               </Card>
            </div>

            <Card className="overflow-hidden">
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-700 dark:text-slate-200">Pending Verification Queue</h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 uppercase">
                        <tr>
                           <th className="p-4">User / Org</th>
                           <th className="p-4">Role</th>
                           <th className="p-4">Document</th>
                           <th className="p-4">Location</th>
                           <th className="p-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="text-sm">
                        {loadingUsers ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading...</td></tr>
                        ) : verificationRequests.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">
                              <CheckCircle size={48} className="mx-auto text-emerald-200 mb-2" />
                              <p>All Caught Up! No pending verifications.</p>
                            </td>
                          </tr>
                        ) : (
                          verificationRequests.map(({ user, docUrl }: any) => (
                          <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-white">{user.name}</p>
                                  <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4"><Badge variant="info">{user.role}</Badge></td>
                            <td className="p-4">
                              <button className="flex items-center gap-1 text-primary-600 hover:underline text-xs font-medium bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded">
                                <FileText size={14} /> {docUrl}
                              </button>
                            </td>
                            <td className="p-4 text-slate-600">{user.location}</td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="danger" onClick={() => handleVerifyUser(user.id, 'reject')}>Reject</Button>
                                <Button size="sm" variant="primary" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleVerifyUser(user.id, 'approve')}>
                                  Approve
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )))
                        }
                     </tbody>
                  </table>
               </div>
            </Card>
         </div>
      )}

      {/* --- MODERATION TAB --- */}
      {activeTab === 'Moderation' && (
         <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <Card className="p-4 border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/10">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-bold text-red-600 uppercase">Critical Flags</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">5</h3>
                     </div>
                     <AlertTriangle className="text-red-500" />
                  </div>
               </Card>
               <Card className="p-4 border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-bold text-amber-600 uppercase">Pending Review</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">12</h3>
                     </div>
                     <Flag className="text-amber-500" />
                  </div>
               </Card>
               <Card className="p-4 border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase">Resolved (Today)</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">28</h3>
                     </div>
                     <Check className="text-emerald-500" />
                  </div>
               </Card>
            </div>
            <Card className="overflow-hidden">
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-700 dark:text-slate-200">Flagged Content Queue</h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 uppercase">
                        <tr>
                           <th className="p-4">Flagged Entity</th>
                           <th className="p-4">Type</th>
                           <th className="p-4">Reason</th>
                           <th className="p-4">Severity</th>
                           <th className="p-4">Action</th>
                        </tr>
                     </thead>
                     <tbody className="text-sm">
                        {FLAGGED_ITEMS.map((item) => (
                           <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-4">
                                 <p className="font-bold text-slate-800 dark:text-white">{item.title}</p>
                                 <p className="text-xs text-slate-500">Reported by: {item.reporter} on {item.date}</p>
                              </td>
                              <td className="p-4"><Badge variant="default">{item.type}</Badge></td>
                              <td className="p-4 text-slate-600 dark:text-slate-300">{item.reason}</td>
                              <td className="p-4">
                                 <Badge variant={item.severity === 'CRITICAL' ? 'danger' : (item.severity === 'HIGH' ? 'warning' : 'info')}>
                                    {item.severity}
                                 </Badge>
                              </td>
                              <td className="p-4">
                                 <Button size="sm" variant="outline" onClick={() => setSelectedFlag(item)}>Review</Button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
         </div>
      )}

      {/* --- ANALYTICS TAB --- */}
      {activeTab === 'Analytics' && (
         <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Growth Chart */}
               <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity size={18} className="text-primary-500"/> Platform Growth
                     </h3>
                     <Select className="w-32">
                        <option>Last 6 Months</option>
                        <option>Last Year</option>
                     </Select>
                  </div>
                  <div className="h-72">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ANALYTICS_DATA.growth}>
                           <defs>
                              <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                           <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                           <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                           <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                           <Legend />
                           <Area yAxisId="left" type="monotone" dataKey="donations" name="Donation Volume ($)" stroke="#0d9488" fillOpacity={1} fill="url(#colorDonations)" />
                           <Area yAxisId="right" type="monotone" dataKey="users" name="New Users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </Card>

               {/* Distribution Charts */}
               <div className="space-y-6">
                  <Card className="p-6 h-[calc(50%-12px)]">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Users size={18} className="text-blue-500"/> User Distribution
                     </h3>
                     <div className="h-48 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={ANALYTICS_DATA.distribution}
                                 cx="50%"
                                 cy="50%"
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={5}
                                 dataKey="value"
                              >
                                 {ANALYTICS_DATA.distribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                              </Pie>
                              <Tooltip />
                              <Legend verticalAlign="middle" align="right" layout="vertical" />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                  </Card>
                  <Card className="p-6 h-[calc(50%-12px)]">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart2 size={18} className="text-amber-500"/> Campaign Categories
                     </h3>
                     <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={ANALYTICS_DATA.campaigns} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                              <Tooltip cursor={{fill: 'transparent'}} />
                              <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </Card>
               </div>
            </div>
         </div>
      )}

      {/* --- REPORTS TAB --- */}
      {activeTab === 'Reports' && (
         <div className="space-y-6">
             <Card className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                   <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                         <FileText /> Generate Custom Report
                      </h2>
                      <p className="text-slate-300 opacity-80 mt-1">Select parameters to export system data for external analysis.</p>
                   </div>
                   <div className="flex gap-2 bg-white/10 p-1 rounded-lg">
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">Last 7 Days</Button>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">Last 30 Days</Button>
                      <Button 
                         onClick={handleGenerateReport} 
                         className="bg-primary-500 hover:bg-primary-400 border-none text-white shadow-lg"
                      >
                         {isGeneratingReport ? 'Generating...' : 'Export Data'}
                      </Button>
                   </div>
                </div>
             </Card>
             <Card>
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                   <h3 className="font-bold text-slate-700 dark:text-slate-200">Available Reports</h3>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 uppercase">
                      <tr>
                         <th className="p-4">Report Name</th>
                         <th className="p-4">Type</th>
                         <th className="p-4">Date Generated</th>
                         <th className="p-4">Size</th>
                         <th className="p-4 text-right">Download</th>
                      </tr>
                   </thead>
                   <tbody className="text-sm">
                      {REPORTS_LIST.map((report) => (
                         <tr key={report.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-4 font-medium flex items-center gap-2">
                               {report.format === 'PDF' ? <FileText size={16} className="text-red-500"/> : <BarChart2 size={16} className="text-green-500"/>}
                               {report.title}
                            </td>
                            <td className="p-4"><Badge variant="default">{report.type}</Badge></td>
                            <td className="p-4 text-slate-500">{report.date}</td>
                            <td className="p-4 text-slate-500 font-mono">{report.size}</td>
                            <td className="p-4 text-right">
                               <button className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                                  <Download size={18} />
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </Card>
         </div>
      )}

      {/* --- MODALS --- */}
      <Modal isOpen={!!selectedFlag} onClose={() => setSelectedFlag(null)} title="Review Flagged Item">
         {selectedFlag && (
            <div className="space-y-4">
               <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between mb-2">
                     <span className="text-xs font-bold text-slate-500 uppercase">Type: {selectedFlag.type}</span>
                     <Badge variant="danger">{selectedFlag.severity}</Badge>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{selectedFlag.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Reason: {selectedFlag.reason}</p>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
                     <Flag size={12} /> Reported by {selectedFlag.reporter}
                  </div>
               </div>
               <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin Notes</label>
                  <textarea className="w-full mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-24 resize-none outline-none focus:ring-2 focus:ring-primary-500" placeholder="Add investigation notes..."></textarea>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => handleAction('Dismissed', selectedFlag)}>Dismiss Flag</Button>
                  <Button variant="primary" onClick={() => handleAction('Warning Sent', selectedFlag)}>Send Warning</Button>
                  <Button variant="danger" className="col-span-2 flex items-center justify-center gap-2" onClick={() => handleAction('Removed', selectedFlag)}>
                     <Trash2 size={16} /> Remove Content & Suspend User
                  </Button>
               </div>
            </div>
         )}
      </Modal>
    </div>
  );
};
