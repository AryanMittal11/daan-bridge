import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Modal, Input, Select } from '../components/UI';
import { Calendar, MapPin, Users, Video, BookOpen, Clock, Star, MessageSquare, CheckCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export const Tutoring = () => {
   const navigate = useNavigate();

   // State for Tutor Flow
   const [isRegisteredTutor, setIsRegisteredTutor] = useState(false);
   const [tutorProfile, setTutorProfile] = useState<any | null>(null);
   const [showRegisterModal, setShowRegisterModal] = useState(false);
   const [showSessionModal, setShowSessionModal] = useState(false);
   const [sessions, setSessions] = useState<any[]>([]);
   const [enrolledSessionIds, setEnrolledSessionIds] = useState<Set<string>>(new Set());
   const [enrolledSuccessSession, setEnrolledSuccessSession] = useState<any | null>(null);
   const [showManageModal, setShowManageModal] = useState(false);
   const [selectedManageSession, setSelectedManageSession] = useState<any | null>(null);

   // Filters
   const [searchTerm, setSearchTerm] = useState('');
   const [modeFilter, setModeFilter] = useState('All');

   // Forms
   const [registerForm, setRegisterForm] = useState({
      bio: '',
      subjects: '',
      mode: 'Online',
      address: ''
   });

   const [sessionForm, setSessionForm] = useState({
      subject: '',
      date: '',
      time: '',
      mode: 'Online',
      address: '',
      meetingLink: '',
      maxStudents: 5
   });

   // Tutor Profile View State
   const [selectedTutor, setSelectedTutor] = useState<any | null>(null);

   useEffect(() => {
      fetchTutorStatus();
      fetchSessions();
   }, []);

   const fetchTutorStatus = async () => {
      try {
         const { data } = await API.get('/tutoring/me');
         if (data.profile) {
            setIsRegisteredTutor(true);
            setTutorProfile(data.profile);
         }
         if (data.enrolledSessions) {
            const enrolledIds = new Set(data.enrolledSessions.map((es: any) => es.sessionId));
            setEnrolledSessionIds(enrolledIds);
         }
      } catch (error) {
         console.error('Error fetching tutor status', error);
      }
   };

   const fetchSessions = async () => {
      try {
         const { data } = await API.get('/tutoring/sessions');
         setSessions(data);
      } catch (error) {
         console.error('Error fetching sessions', error);
      }
   };

   const handleViewTutor = (tutorObj: any, tutorUserObj: any) => {
      const fallbackAvatar = `https://ui-avatars.com/api/?name=${tutorUserObj.name}&background=random`;
      setSelectedTutor({
         name: tutorUserObj.name,
         avatar: tutorUserObj.avatar || fallbackAvatar,
         role: 'Registered Tutor',
         rating: tutorObj.rating,
         reviews: tutorObj.reviews,
         bio: tutorObj.bio || 'Passionate educator.',
         subjects: tutorObj.subjects.split(',').map((s: string) => s.trim()),
         verified: tutorObj.verified,
      });
   };

   const handleRegisterSubmit = async () => {
      try {
         await API.post('/tutoring/register', registerForm);
         setIsRegisteredTutor(true);
         setShowRegisterModal(false);
         fetchTutorStatus();
         alert("Congratulations! You are now a registered tutor. You can start creating sessions.");
      } catch (error: any) {
         if (error.response?.data?.error) {
            alert(error.response.data.error);
         } else {
            alert("Failed to register as tutor.");
         }
         console.error(error);
      }
   };

   const handleCreateSession = async () => {
      try {
         await API.post('/tutoring/sessions', sessionForm);
         setShowSessionModal(false);
         fetchSessions();
         alert("Session Created Successfully!");
      } catch (error: any) {
         alert("Failed to create session.");
         console.error(error);
      }
   };

   const handleJoinSession = async (session: any) => {
      try {
         await API.post(`/tutoring/sessions/${session.id}/join`);
         setEnrolledSuccessSession(session);
         fetchTutorStatus(); // update enrolled sessions
         fetchSessions(); // update session full status
      } catch (error: any) {
         if (error.response?.data?.error) {
            alert(error.response.data.error);
         } else {
            alert("Failed to join session.");
         }
      }
   };

   const handleMessageTutor = () => {
      navigate('/chat');
   };

   const handleManageSession = (session: any) => {
      // Find the detailed session from backend/tutorProfile to get students (if any additional fetch is needed. Usually it's in tutorProfile)
      // Since tutorProfile.sessions contains enrollments and logs, let's use that one.
      const detailedSession = tutorProfile?.sessions?.find((s: any) => s.id === session.id) || session;
      setSelectedManageSession(detailedSession);
      setShowManageModal(true);
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tutoring Center</h1>
               <p className="text-slate-500 dark:text-slate-400">Share your expertise or join a session to learn something new.</p>
            </div>
         </div>

         <div className="space-y-6">
            {/* Tutor CTA Banner */}
            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
               <div>
                  <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300">
                     {isRegisteredTutor ? 'Manage Your Sessions' : 'Become a Tutor'}
                  </h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
                     {isRegisteredTutor
                        ? 'Create new learning opportunities or manage existing classes.'
                        : 'Share your expertise and help students succeed.'}
                  </p>
               </div>
               <Button
                  onClick={() => isRegisteredTutor ? setShowSessionModal(true) : setShowRegisterModal(true)}
                  className="flex items-center gap-2"
               >
                  {isRegisteredTutor ? <><Plus size={18} /> Create Session</> : 'Register Now'}
               </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-2">
               <div className="flex-1">
                  <Input 
                     placeholder="Search by subject or tutor..." 
                     value={searchTerm}
                     onChange={(e: any) => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="w-full md:w-48">
                  <Select 
                     value={modeFilter}
                     onChange={(e: any) => setModeFilter(e.target.value)}
                  >
                     <option value="All">All Modes</option>
                     <option value="Online">Online</option>
                     <option value="Offline">Offline</option>
                  </Select>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {sessions.filter(s => {
                  const matchSearch = s.subject.toLowerCase().includes(searchTerm.toLowerCase()) || s.tutor.user.name.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchMode = modeFilter === 'All' || s.mode === modeFilter;
                  return matchSearch && matchMode;
               }).length === 0 ? (
                  <div className="text-slate-500 col-span-full py-8 text-center italic">No sessions found matching your criteria.</div>
               ) : sessions.filter(s => {
                  const matchSearch = s.subject.toLowerCase().includes(searchTerm.toLowerCase()) || s.tutor.user.name.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchMode = modeFilter === 'All' || s.mode === modeFilter;
                  return matchSearch && matchMode;
               }).map(session => {
                  const isEnrolled = enrolledSessionIds.has(session.id);
                  const isFull = session.status === 'FULL' || session._count.enrollments >= session.maxStudents;
                  const isMySession = tutorProfile && tutorProfile.id === session.tutorId;

                  return (
                     <Card key={session.id} className="p-5 border-l-4 border-indigo-500 flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                           <Badge variant={session.mode === 'Online' ? 'success' : 'warning'}>{session.mode}</Badge>
                           <span className="flex items-center text-xs font-bold text-slate-400">
                              <Clock size={12} className="mr-1" /> {session.time}
                           </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{session.subject}</h3>

                        {/* Tutor Link */}
                        <div className="mb-4">
                           <span className="text-sm text-slate-500">Tutor: </span>
                           <button
                              onClick={() => handleViewTutor(session.tutor, session.tutor.user)}
                              className="text-sm font-semibold text-primary-600 hover:underline focus:outline-none"
                           >
                              {session.tutor.user.name}
                           </button>
                        </div>

                        <div className="flex items-center justify-between text-sm mb-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg mt-auto">
                           <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300"><Users size={14} /> {session._count.enrollments}/{session.maxStudents} Students</span>
                           <span className="font-mono text-slate-500">{session.date}</span>
                        </div>

                        <div className="space-y-2 mt-auto">
                           <Button
                              variant={isMySession ? "outline" : isEnrolled ? "solid" : "outline"}
                              className="w-full"
                              disabled={!isMySession && (isEnrolled || isFull)}
                              onClick={() => isMySession ? handleManageSession(session) : handleJoinSession(session)}
                           >
                              {isMySession ? 'Manage Session' : isEnrolled ? 'Enrolled' : isFull ? 'Full' : 'Join Session'}
                           </Button>
                           
                           {isEnrolled && !isMySession && (
                              <div className="text-sm p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 rounded-lg border border-indigo-100 dark:border-indigo-800 inline-block w-full">
                                 {session.mode === 'Online' && session.meetingLink ? (
                                    <><span className="font-semibold block mb-1 text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Meeting Link</span> <a href={session.meetingLink} target="_blank" rel="noreferrer" className="underline break-all">{session.meetingLink}</a></>
                                 ) : session.mode === 'Offline' && session.address ? (
                                    <><span className="font-semibold block mb-1 text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Venue</span> <span className="break-words">{session.address}</span></>
                                 ) : (
                                    <span className="italic text-indigo-500">Details will be shared shortly.</span>
                                 )}
                              </div>
                           )}
                        </div>
                     </Card>
                  )
               })}
            </div>
         </div>

         {/* Register as Tutor Modal */}
         <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} title="Tutor Registration">
            <div className="space-y-4">
               <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-300">
                  Join our network of educators. Please provide details about your expertise and teaching preferences.
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio & Experience</label>
                  <textarea
                     className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none h-24 resize-none"
                     placeholder="Briefly describe your teaching experience and methodology..."
                     value={registerForm.bio}
                     onChange={e => setRegisterForm({ ...registerForm, bio: e.target.value })}
                  />
               </div>

               <Input
                  label="Subjects (Comma separated)"
                  placeholder="e.g. Math, Physics, English"
                  value={registerForm.subjects}
                  onChange={e => setRegisterForm({ ...registerForm, subjects: e.target.value })}
               />

               <Select
                  label="Preferred Mode"
                  value={registerForm.mode}
                  onChange={e => setRegisterForm({ ...registerForm, mode: e.target.value })}
               >
                  <option>Online</option>
                  <option>Offline</option>
                  <option>Hybrid (Both)</option>
               </Select>

               {/* Conditional Address Field for Registration */}
               {(registerForm.mode === 'Offline' || registerForm.mode === 'Hybrid (Both)') && (
                  <div className="animate-fade-in">
                     <Input
                        label="Base Location / Studio Address"
                        placeholder="Where will offline sessions primarily be held?"
                        value={registerForm.address}
                        onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })}
                     />
                  </div>
               )}

               <Button className="w-full mt-2" onClick={handleRegisterSubmit}>Submit Profile</Button>
            </div>
         </Modal>

         {/* Create Session Modal (Only for Registered Tutors) */}
         <Modal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} title="Create New Session">
            <div className="space-y-4">
               <Input
                  label="Subject / Topic"
                  placeholder="e.g. Advanced Calculus"
                  value={sessionForm.subject}
                  onChange={e => setSessionForm({ ...sessionForm, subject: e.target.value })}
               />

               <div className="grid grid-cols-2 gap-4">
                  <Input
                     type="date"
                     label="Date"
                     value={sessionForm.date}
                     onChange={e => setSessionForm({ ...sessionForm, date: e.target.value })}
                  />
                  <Input
                     type="time"
                     label="Time"
                     value={sessionForm.time}
                     onChange={e => setSessionForm({ ...sessionForm, time: e.target.value })}
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <Select
                     label="Session Mode"
                     value={sessionForm.mode}
                     onChange={e => setSessionForm({ ...sessionForm, mode: e.target.value })}
                  >
                     <option>Online</option>
                     <option>Offline</option>
                  </Select>
                  <Input
                     type="number"
                     label="Max Students"
                     value={sessionForm.maxStudents}
                     onChange={e => setSessionForm({ ...sessionForm, maxStudents: parseInt(e.target.value as string) || 5 })}
                  />
               </div>

               {/* Conditional Address Field for Session */}
               {sessionForm.mode === 'Offline' && (
                  <div className="animate-fade-in">
                     <Input
                        label="Session Venue Address"
                        placeholder="Full address of the classroom/location"
                        value={sessionForm.address}
                        onChange={e => setSessionForm({ ...sessionForm, address: e.target.value })}
                     />
                  </div>
               )}

               {sessionForm.mode === 'Online' && (
                  <div className="animate-fade-in space-y-4">
                     <Input
                        label="Meeting Link (Google Meet / Zoom)"
                        placeholder="https://meet.google.com/..."
                        value={sessionForm.meetingLink}
                        onChange={e => setSessionForm({ ...sessionForm, meetingLink: e.target.value })}
                     />
                     <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs flex items-center gap-2">
                        <Video size={16} />
                        Provide a meeting link for students to join at the scheduled time.
                     </div>
                  </div>
               )}

               <Button className="w-full" onClick={handleCreateSession}>Publish Session</Button>
            </div>
         </Modal>

         {/* Tutor Profile Modal */}
         <Modal isOpen={!!selectedTutor} onClose={() => setSelectedTutor(null)} title="Tutor Profile">
            {selectedTutor && (
               <div className="text-center space-y-6">
                  <div className="flex flex-col items-center">
                     <img
                        src={selectedTutor.avatar}
                        alt={selectedTutor.name}
                        className="w-24 h-24 rounded-full border-4 border-primary-100 dark:border-primary-900 mb-3"
                     />
                     <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {selectedTutor.name}
                        {selectedTutor.verified && <CheckCircle size={18} className="text-blue-500" />}
                     </h3>
                     <p className="text-primary-600 font-medium text-sm">{selectedTutor.role}</p>

                     <div className="flex items-center gap-1 mt-2">
                        <Star size={16} className="text-amber-400 fill-amber-400" />
                        <span className="font-bold text-slate-800 dark:text-white">{selectedTutor.rating}</span>
                        <span className="text-slate-400 text-sm">({selectedTutor.reviews} Reviews)</span>
                     </div>
                  </div>

                  <div className="text-left bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                     <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{selectedTutor.bio}"</p>
                  </div>

                  <div className="text-left">
                     <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Expertise</h4>
                     <div className="flex flex-wrap gap-2">
                        {selectedTutor.subjects.map((sub: string) => (
                           <Badge key={sub} variant="info">{sub}</Badge>
                        ))}
                     </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                     <Button className="w-full flex items-center justify-center gap-2" onClick={handleMessageTutor}>
                        <MessageSquare size={18} /> Message Tutor
                     </Button>
                  </div>
               </div>
            )}
         </Modal>

         {/* Enrollment Success Modal */}
         <Modal isOpen={!!enrolledSuccessSession} onClose={() => setEnrolledSuccessSession(null)} title="Registration Successful">
            {enrolledSuccessSession && (
               <div className="text-center space-y-4 py-4">
                  <div className="flex justify-center">
                     <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle size={32} />
                     </div>
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-800 dark:text-white">You're Enrolled!</h3>
                     <p className="text-slate-500 dark:text-slate-400 mt-2">
                        You have successfully registered for <strong>{enrolledSuccessSession.subject}</strong>.
                     </p>
                     
                     <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-left inline-block w-full">
                        {enrolledSuccessSession.mode === 'Online' ? (
                           <>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1"><Video size={16}/> Meeting Link</span>
                              {enrolledSuccessSession.meetingLink ? (
                                 <a href={enrolledSuccessSession.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all font-mono">
                                    {enrolledSuccessSession.meetingLink}
                                 </a>
                              ) : (
                                 <span className="text-sm text-slate-500 italic">No link provided yet.</span>
                              )}
                           </>
                        ) : (
                           <>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1"><MapPin size={16}/> Venue Address</span>
                              {enrolledSuccessSession.address ? (
                                 <span className="text-sm text-slate-600 dark:text-slate-400 block break-words">
                                    {enrolledSuccessSession.address}
                                 </span>
                              ) : (
                                 <span className="text-sm text-slate-500 italic">No address provided yet.</span>
                              )}
                           </>
                        )}
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-500 text-xs flex items-center gap-1 font-medium">
                           <Clock size={14} /> Please ensure you join on time at {enrolledSuccessSession.time} on {enrolledSuccessSession.date}.
                        </div>
                     </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => setEnrolledSuccessSession(null)}>Got it!</Button>
               </div>
            )}
         </Modal>

         {/* Manage Session Modal */}
         <Modal isOpen={showManageModal} onClose={() => setShowManageModal(false)} title="Manage Session">
            {selectedManageSession && (
               <div className="space-y-6">
                  <div>
                     <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{selectedManageSession.subject}</h3>
                     <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {selectedManageSession.date}</span>
                        <span className="flex items-center gap-1"><Clock size={14} /> {selectedManageSession.time}</span>
                        <span className="flex items-center gap-1"><Badge variant={selectedManageSession.mode === 'Online' ? 'success' : 'warning'}>{selectedManageSession.mode}</Badge></span>
                     </div>
                     {selectedManageSession.mode === 'Online' && selectedManageSession.meetingLink && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                           <span className="text-sm font-semibold text-blue-900 dark:text-blue-300 block mb-1">Meeting Link</span>
                           <a href={selectedManageSession.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all">
                              {selectedManageSession.meetingLink}
                           </a>
                        </div>
                     )}
                     {selectedManageSession.mode === 'Offline' && selectedManageSession.address && (
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                           <span className="text-sm font-semibold text-amber-900 dark:text-amber-300 block mb-1">Venue Address</span>
                           <span className="text-amber-700 dark:text-amber-400 text-sm">
                              {selectedManageSession.address}
                           </span>
                        </div>
                     )}
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                     <h4 className="font-bold text-slate-800 dark:text-white mb-3">Enrolled Students ({selectedManageSession.enrollments?.length || 0})</h4>
                     {selectedManageSession.enrollments?.length > 0 ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                           {selectedManageSession.enrollments.map((env: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                                 <img src={env.student.avatar || `https://ui-avatars.com/api/?name=${env.student.name}`} alt={env.student.name} className="w-8 h-8 rounded-full" />
                                 <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{env.student.name}</p>
                                    <p className="text-xs text-slate-500">{env.student.email}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <p className="text-sm text-slate-500 italic">No students enrolled yet.</p>
                     )}
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                     <h4 className="font-bold text-slate-800 dark:text-white mb-3">Activity Logs</h4>
                     {selectedManageSession.logs?.length > 0 ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                           <div className="relative pl-6 space-y-4">
                           {selectedManageSession.logs.map((log: any, idx: number) => (
                              <div key={idx} className="relative">
                                 <div className="absolute left-[-29px] w-4 h-4 rounded-full bg-primary-500 border-4 border-white dark:border-slate-900 mt-1"></div>
                                 <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                    {log.action === 'SESSION_CREATED' ? 'Session Created' : 'Student Enrolled'}
                                 </p>
                                 <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                                 <p className="text-xs text-slate-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                              </div>
                           ))}
                           </div>
                        </div>
                     ) : (
                        <p className="text-sm text-slate-500 italic">No logs available.</p>
                     )}
                  </div>
               </div>
            )}
         </Modal>
      </div>
   );
};
