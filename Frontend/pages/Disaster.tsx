import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { ShieldAlert, Radio, Navigation, Phone, Share2, MapPin, CheckCircle } from 'lucide-react';
import { useApp } from '../context';
import API from '../api';

export const Disaster = () => {
   const { user } = useApp();
   const [sosActive, setSosActive] = useState(false);
   const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
   const [reportForm, setReportForm] = useState({ type: 'Flood', description: '' });
   const [locationLoading, setLocationLoading] = useState(false);

   const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
   const [liveReports, setLiveReports] = useState<any[]>([]);

   useEffect(() => {
      fetchLiveData();
      const interval = setInterval(fetchLiveData, 10000);
      return () => clearInterval(interval);
   }, []);

   useEffect(() => {
      if (user && liveAlerts.length > 0) {
         const myAlert = liveAlerts.find(a => a.userId === user.id);
         setSosActive(!!myAlert);
      } else {
         setSosActive(false);
      }
   }, [user, liveAlerts]);

   const fetchLiveData = async () => {
      try {
         const { data } = await API.get('/disaster/live');
         setLiveAlerts(data.alerts || []);
         setLiveReports(data.reports || []);
      } catch (err) {
         console.error(err);
      }
   };

   const handleToggleSOS = async () => {
      if (!user) {
         alert("Please log in to broadcast an SOS signal.");
         return;
      }

      if (!sosActive) {
         setLocationLoading(true);
         if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
               async (position) => {
                  setUserLocation({
                     lat: position.coords.latitude,
                     lng: position.coords.longitude
                  });
                  try {
                     await API.post('/disaster/sos', {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                     });
                     setSosActive(true);
                     fetchLiveData();
                  } catch (e) { console.error(e); }
                  setLocationLoading(false);
               },
               async (error) => {
                  console.error("Error getting location", error);
                  try {
                     await API.post('/disaster/sos', { lat: 0, lng: 0 });
                     setSosActive(true);
                     fetchLiveData();
                  } catch (e) { console.error(e); }
                  setLocationLoading(false);
               }
            );
         } else {
            try {
               await API.post('/disaster/sos', { lat: 0, lng: 0 });
               setSosActive(true);
               fetchLiveData();
            } catch (e) { console.error(e); }
            setLocationLoading(false);
         }
      } else {
         try {
            await API.post('/disaster/sos', { lat: 0, lng: 0 });
            setSosActive(false);
            setUserLocation(null);
            fetchLiveData();
         } catch (e) { console.error(e); }
      }
   };

   const handleReportSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) {
         alert("Please log in to report an incident.");
         return;
      }

      try {
         await API.post('/disaster/report', {
            type: reportForm.type,
            description: reportForm.description,
            lat: userLocation?.lat,
            lng: userLocation?.lng
         });
         alert('Incident Reported! Emergency teams have been notified.');
         setReportForm({ type: 'Flood', description: '' });
         fetchLiveData();
      } catch (e) {
         alert("Failed to report incident. Please try again.");
         console.error(e);
      }
   };

   const updateReportStatus = async (id: string, status: string) => {
      try {
         await API.put(`/disaster/report/${id}/status`, { status });
         fetchLiveData();
      } catch (e) {
         alert("Failed to update status.");
      }
   };

   // Check roles for rendering admin panels
   const isIndividual = user?.role === 'INDIVIDUAL';
   const isAdminOrOrg = user?.role === 'ADMIN' || user?.role === 'ORGANIZATION';

   return (
      <div className="space-y-6">
         {/* SOS Header */}
         <Card className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 overflow-visible relative">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
               <div>
                  <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                     <ShieldAlert size={32} /> Disaster Relief & SOS
                  </h1>
                  <p className="opacity-90 max-w-xl">Use this only in case of extreme emergency. This will broadcast your live location to nearby volunteers and rescue teams.</p>
                  {isIndividual && sosActive && userLocation && (
                     <div className="mt-4 bg-white/20 backdrop-blur-md inline-flex items-center px-4 py-2 rounded-lg text-sm border border-white/30 shadow-sm">
                        <MapPin size={16} className="mr-2 text-white/90" />
                        <span className="font-semibold tracking-wide">
                           Broadcasting at: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        </span>
                     </div>
                  )}
               </div>
               {isIndividual && (
                  <button
                     onClick={handleToggleSOS}
                     disabled={locationLoading}
                     className={`mt-6 md:mt-0 w-32 h-32 rounded-full border-8 border-red-400/50 flex flex-col items-center justify-center font-bold shadow-2xl transition-all duration-300 transform hover:scale-105 ${sosActive ? 'bg-white text-red-600 animate-pulse' : 'bg-red-800 text-white hover:bg-red-700'}`}
                  >
                     <span className="text-2xl">{locationLoading ? '...' : 'SOS'}</span>
                     <span className="text-xs uppercase">{sosActive ? 'Active' : (locationLoading ? 'Locating' : 'Press')}</span>
                  </button>
               )}
            </div>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
         </Card>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Alerts */}
            <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col h-[500px]">
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2">
                     <Radio size={18} className="text-red-500 animate-pulse" /> Live Disaster Feed
                  </h3>
                  <div className="flex gap-2">
                     <Badge variant="danger">{liveAlerts.length} Active SOS</Badge>
                     <Badge variant="warning">{liveReports.filter(r => r.status === 'PENDING').length} Pending Reports</Badge>
                  </div>
               </div>

               {/* Map Simulation */}
               <div className="flex-1 bg-slate-200 dark:bg-slate-800 relative group overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                  {/* Fake Map Markers based on Data (Using Random Scatter due to Missing Proper Geolocation Bounds) */}
                  {liveAlerts.map((alert, i) => (
                     <div key={alert.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 group/marker" style={{ top: `${20 + (i * 15) % 60}%`, left: `${20 + (i * 25) % 60}%` }}>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="w-4 h-4 bg-red-600 border-2 border-white rounded-full relative shadow-xl z-20 cursor-pointer hover:scale-125 transition-transform duration-200"></div>
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1.5 rounded shadow-lg text-xs font-bold whitespace-nowrap z-30 flex flex-col items-center hover:scale-105 transition-transform duration-200 cursor-default">
                           <span>{alert.user?.name || 'SOS Active'}</span>
                           <span className="text-[10px] font-mono mt-1 opacity-90 border-t border-red-400/50 pt-1">
                              {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                           </span>
                        </div>
                     </div>
                  ))}

                  {liveReports.map((report, i) => (
                     <div key={report.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 group/marker z-20" style={{ bottom: `${20 + (i * 15) % 60}%`, right: `${20 + (i * 25) % 60}%` }}>
                        {report.status === 'PENDING' && <div className="w-4 h-4 bg-orange-500 rounded-full animate-ping absolute"></div>}
                        <div className={`w-4 h-4 rounded-full relative border-2 border-white cursor-pointer hover:scale-125 transition-transform duration-200 shadow-md ${report.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-orange-600'}`}></div>
                        <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded shadow-xl text-xs whitespace-nowrap font-bold flex flex-col items-center hover:scale-105 transition-transform duration-200 cursor-default ${report.status === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'}`}>
                           <span>{report.type} ({report.status})</span>
                           {report.lat && report.lng && (
                              <span className={`text-[10px] font-mono mt-1 opacity-90 border-t pt-1 ${report.status === 'RESOLVED' ? 'border-emerald-400/50' : 'border-slate-300 dark:border-slate-600'}`}>
                                 {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                              </span>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </Card>

            {/* Resources & Status */}
            <div className="space-y-6">
               {isIndividual && (
                  <Card className="p-6">
                     <h3 className="font-bold mb-4">Report an Incident</h3>
                     <form className="space-y-4" onSubmit={handleReportSubmit}>
                        <div>
                           <label className="text-xs font-medium text-slate-500 uppercase">Type</label>
                           <select
                              className="w-full mt-1 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                              value={reportForm.type}
                              onChange={e => setReportForm({ ...reportForm, type: e.target.value })}
                           >
                              <option>Flood</option>
                              <option>Earthquake</option>
                              <option>Fire</option>
                              <option>Medical Emergency</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-medium text-slate-500 uppercase">Description</label>
                           <textarea
                              className="w-full mt-1 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm h-20 resize-none"
                              value={reportForm.description}
                              onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                              placeholder="Describe location and situation..."
                              required
                           ></textarea>
                        </div>
                        <Button className="w-full" type="submit">Submit Report</Button>
                     </form>
                  </Card>
               )}

               {isAdminOrOrg && (
                  <Card className="p-6">
                     <h3 className="font-bold mb-4">Manage Reports (Admin/Org)</h3>
                     <div className="space-y-3 h-64 overflow-y-auto">
                        {liveReports.length === 0 && <p className="text-xs text-slate-500">No reports found.</p>}
                        {liveReports.map(report => (
                           <div key={report.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                 <span className="text-sm font-bold">{report.type}</span>
                                 <span className={`text-xs px-2 rounded-full ${report.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : report.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {report.status}
                                 </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">{report.description}</p>

                              <div className="flex justify-between items-center text-[10px] mt-1 mb-2">
                                 <p className="text-slate-400">By: <span className="font-medium text-slate-600 dark:text-slate-300">{report.reporter?.name || 'Unknown'}</span></p>
                                 {report.status === 'RESOLVED' && report.resolvedBy && (
                                    <p className="text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded">
                                       Resolved by: {report.resolvedBy.name}
                                    </p>
                                 )}
                              </div>

                              {report.status !== 'RESOLVED' && (
                                 <div className="flex gap-2 mt-2">
                                    {report.status === 'PENDING' && (
                                       <button onClick={() => updateReportStatus(report.id, 'VERIFIED')} className="flex-1 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                                          Verify
                                       </button>
                                    )}
                                    <button onClick={() => updateReportStatus(report.id, 'RESOLVED')} className="flex-1 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">
                                       Resolve
                                    </button>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </Card>
               )}

               {isIndividual && (liveReports.some(r => r.reporterId === user?.id)) && (
                  <Card className="p-6 border-emerald-500/20 shadow-emerald-500/5">
                     <h3 className="font-bold gap-2 flex items-center mb-4 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle size={18} /> My Reported Incidents
                     </h3>
                     <div className="space-y-3 h-48 overflow-y-auto">
                        {liveReports.filter(r => r.reporterId === user?.id).map(report => (
                           <div key={report.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                 <span className="text-sm font-bold">{report.type}</span>
                                 <span className={`text-xs px-2 rounded-full ${report.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : report.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {report.status}
                                 </span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">{report.description}</p>
                              {report.status === 'RESOLVED' && report.resolvedBy && (
                                 <p className="text-[10px] mt-1 text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-100 dark:bg-emerald-500/10 p-1.5 rounded inline-block w-fit">
                                    ✓ Assistance provided by: <span className="font-bold">{report.resolvedBy.name}</span>
                                 </p>
                              )}
                           </div>
                        ))}
                     </div>
                  </Card>
               )}
            </div>
         </div>
      </div>
   );
};