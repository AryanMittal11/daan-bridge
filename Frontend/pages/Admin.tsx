import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Tabs, Modal, Select, Input } from '../components/UI';
import API from '../api';
import {
  Shield, Check, X, BarChart2, AlertTriangle, FileText,
  Users, DollarSign, Activity, Download, Search, Filter,
  Eye, Calendar, CheckCircle, Heart
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0d9488', '#f59e0b', '#ef4444', '#3b82f6'];

const REPORTS_LIST = [
  { id: 1, title: 'Monthly Financial Summary', type: 'Finance', date: new Date().toISOString().split('T')[0], size: '2.4 MB', format: 'PDF' },
  { id: 2, title: 'Quarterly Impact Assessment', type: 'Impact', date: new Date().toISOString().split('T')[0], size: '5.1 MB', format: 'PDF' },
  { id: 3, title: 'User Verification Log', type: 'Security', date: new Date().toISOString().split('T')[0], size: '1.2 MB', format: 'CSV' },
  { id: 4, title: 'Donation Trends Analysis', type: 'Analytics', date: new Date().toISOString().split('T')[0], size: '3.8 MB', format: 'XLSX' },
];

export const Admin = () => {
  const [activeTab, setActiveTab] = useState('Verification');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Data states
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [fundingLogs, setFundingLogs] = useState<any[]>([]);
  const [totalFunding, setTotalFunding] = useState(0);
  const [totalFunders, setTotalFunders] = useState(0);

  const [loading, setLoading] = useState(false);

  // Fetch Verification Requests
  const fetchVerificationRequests = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/verification-requests');
      setVerificationRequests(data.requests || []);
    } catch (err) {
      setVerificationRequests([]);
    }
    setLoading(false);
  };

  // Fetch Admin Analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/dashboard/admin-analytics');
      setAnalyticsData(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Fetch Platform Funding Logs
  const fetchFunding = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/funding/logs');
      setFundingLogs(data.logs || []);
      setTotalFunding(data.totalAmount || 0);
      setTotalFunders(data.totalContributions || 0);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'Verification') fetchVerificationRequests();
    if (activeTab === 'Analytics') fetchAnalytics();
    if (activeTab === 'Platform Funding') fetchFunding();
  }, [activeTab]);

  // Handle Verify User
  const handleVerifyUser = async (userId: string, action: 'approve' | 'reject') => {
    await API.post('/admin/verify-user', {
      userId,
      action: action === 'approve' ? 'APPROVED' : 'REJECTED'
    });
    fetchVerificationRequests();
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
          <p className="text-slate-500 dark:text-slate-400">System-wide monitoring, verification, and funding logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
            <Activity size={14} /> System Health: 99.8%
          </div>
        </div>
      </div>

      <Tabs 
        tabs={['Verification', 'Platform Funding', 'Analytics', 'Reports']} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      {/* --- VERIFICATION TAB --- */}
      {activeTab === 'Verification' && (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Pending Verification Queue</h3>
              <Badge variant="warning">{verificationRequests.length} Pending</Badge>
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
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading requests...</td></tr>
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
                          <a href={docUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline text-xs font-medium bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded inline-flex">
                            <FileText size={14} /> View Doc
                          </a>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* --- PLATFORM FUNDING TAB --- */}
      {activeTab === 'Platform Funding' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Total Funds Received</p>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white">₹{totalFunding.toLocaleString('en-IN')}</h3>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-800 rounded-full text-emerald-600 dark:text-emerald-300">
                  <DollarSign size={24} />
                </div>
              </div>
            </Card>
            <Card className="p-6 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total Contributions</p>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalFunders}</h3>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
                  <Heart size={24} />
                </div>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Platform Funding Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="p-4">Donor / Org</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Message</th>
                    <th className="p-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading logs...</td></tr>
                  ) : fundingLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        No platform funding received yet.
                      </td>
                    </tr>
                  ) : (
                    fundingLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={log.user.avatar || `https://ui-avatars.com/api/?name=${log.user.name}`} alt="" className="w-8 h-8 rounded-full" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">{log.user.name}</p>
                              <Badge variant="default" className="text-[10px] mt-0.5">{log.user.role}</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{log.amount.toLocaleString('en-IN')}</span>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 italic">
                          {log.message ? `"${log.message}"` : <span className="text-slate-400">No message</span>}
                        </td>
                        <td className="p-4 text-right text-slate-500 text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* --- ANALYTICS TAB --- */}
      {activeTab === 'Analytics' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center p-12 text-slate-400">Loading analytics...</div>
          ) : analyticsData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Growth Chart */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Activity size={18} className="text-primary-500"/> Platform Growth (Last 6 Months)
                  </h3>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.growth}>
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
                      <Area yAxisId="left" type="monotone" dataKey="donations" name="Donation Volume (₹)" stroke="#0d9488" fillOpacity={1} fill="url(#colorDonations)" />
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
                          data={analyticsData.distribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analyticsData.distribution.map((entry: any, index: number) => (
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
                      <BarChart data={analyticsData.campaigns} layout="vertical">
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
          ) : (
            <div className="flex justify-center p-12 text-slate-400">Failed to load analytics</div>
          )}
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
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateReport} 
                  className="bg-primary-500 hover:bg-primary-400 border-none text-white shadow-lg"
                >
                  {isGeneratingReport ? 'Generating...' : 'Export Data (PDF/CSV)'}
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
    </div>
  );
};
