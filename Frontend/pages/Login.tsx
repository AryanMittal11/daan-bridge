import React, { useState, useRef } from 'react';
import { useApp } from '../context';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Input, Button } from '../components/UI';
import { User, Mail, Lock, MapPin, Upload } from 'lucide-react';

export const Login = () => {
  const { login, register } = useApp();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('INDIVIDUAL');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Role/Email, 2: Signup Profile
  const [signupData, setSignupData] = useState({
    name: '',
    location: '',
    email: '',
    password: '',
    bio: '',
    docFile: undefined as File | undefined,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handles real API logic
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      // Login flow
      const ok = await login(signupData.email, signupData.password);
      setLoading(false);
      if (ok) navigate('/dashboard');
      else alert('Invalid credentials.');
    } else {
      // Register flow
      let docUrl = '';
      if (role !== 'ADMIN' && signupData.docFile) {
        // In real app: upload document to backend or S3, get URL.
        // For now, just set fake url:
        docUrl = signupData.docFile.name;
      }
      const ok = await register({
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
        role,
        location: signupData.location,
        docUrl,
      });
      setLoading(false);
      if (ok) navigate('/dashboard');
      else alert('Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary-500 to-emerald-400 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
             <span className="text-3xl font-bold text-white">D</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{isLogin ? 'Welcome Back' : 'Join Daan Bridge'}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {isLogin ? 'Sign in to continue your impact journey' : 'Create an account to start making a difference'}
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl mb-6">
          <button onClick={() => { setIsLogin(true); setStep(1); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-500'}`}>Login</button>
          <button onClick={() => { setIsLogin(false); setStep(1); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-500'}`}>Sign Up</button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['INDIVIDUAL', 'ORGANIZATION', 'ADMIN'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-2 rounded-lg text-xs font-medium border transition-all ${role === r ? 'bg-primary-500 text-white border-primary-500' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              type="email"
              placeholder="Email Address"
              className="pl-10"
              required
              value={signupData.email}
              onChange={e => setSignupData({ ...signupData, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              type="password"
              placeholder={isLogin ? "Password" : "Create Password"}
              className="pl-10"
              required
              value={signupData.password}
              onChange={e => setSignupData({ ...signupData, password: e.target.value })}
            />
          </div>

          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  placeholder="Full Name / Org Name"
                  className="pl-10"
                  value={signupData.name}
                  onChange={e => setSignupData({ ...signupData, name: e.target.value })}
                  required
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  placeholder="Location (City, Country)"
                  className="pl-10"
                  value={signupData.location}
                  onChange={e => setSignupData({ ...signupData, location: e.target.value })}
                  required
                />
              </div>
              {role !== 'ADMIN' && (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer relative group">
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    ref={fileInputRef}
                    required={!isLogin && role !== 'ADMIN'}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      setSignupData(sd => ({ ...sd, docFile: file }));
                    }}
                  />
                  <Upload className="mx-auto text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Upload {role === 'INDIVIDUAL' ? 'Aadhar Card' : 'NGO Registration Proof'}
                  </p>
                  <p className="text-xs text-red-500 mt-1">* Mandatory for Verification</p>
                  {signupData.docFile && <p className="text-xs text-primary-600">Selected: {signupData.docFile.name}</p>}
                </div>
              )}
              <Input
                placeholder={role === 'ORGANIZATION' ? "Brief Mission Statement" : "Short Bio"}
                value={signupData.bio}
                onChange={e => setSignupData({ ...signupData, bio: e.target.value })}
              />
            </>
          )}
          <Button type="submit" className="w-full py-3.5 mt-4" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
          </Button>
        </form>
      </div>
    </div>
  );
};
