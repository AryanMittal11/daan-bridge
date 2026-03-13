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
   const [showSuccessModal, setShowSuccessModal] = useState(false);

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

   const handleJoinSession = async (sessionId: string) => {
      try {
         await API.post(`/tutoring/sessions/${sessionId}/join`);
         setShowSuccessModal(true);
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {sessions.length === 0 ? (
                  <div className="text-slate-500 col-span-full py-8 text-center italic">No upcoming tutoring sessions right now. Be the first to create one!</div>
               ) : sessions.map(session => {
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

                        <Button
                           variant={isEnrolled ? "solid" : "outline"}
                           className="w-full"
                           disabled={isEnrolled || isFull || isMySession}
                           onClick={() => handleJoinSession(session.id)}
                        >
                           {isMySession ? 'Your Session' : isEnrolled ? 'Enrolled' : isFull ? 'Full' : 'Join Session'}
                        </Button>
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
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs flex items-center gap-2">
                     <Video size={16} />
                     A Google Meet/Zoom link will be generated automatically upon creation.
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
         <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Registration Successful">
            <div className="text-center space-y-4 py-4">
               <div className="flex justify-center">
                  <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                     <CheckCircle size={32} />
                  </div>
               </div>
               <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">You're Enrolled!</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">
                     You have successfully registered for the session. Necessary details will be shared with you before the session start time.
                  </p>
               </div>
               <Button className="w-full mt-2" onClick={() => setShowSuccessModal(false)}>Got it!</Button>
            </div>
         </Modal>
      </div>
   );
};
