
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, LogIn, Crown, AlertCircle } from 'lucide-react';
import { UserLevel, User as UserType } from '../types';

interface AuthScreenProps {
  onAuth: (user: UserType) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // محاكاة تسجيل دخول محلي
    setTimeout(() => {
      if (isLogin) {
        if (!email.includes('@')) {
           setError('الرجاء إدخال بريد إلكتروني صحيح');
           setLoading(false);
           return;
        }
        // مستخدم افتراضي
        const mockUser: UserType = {
            id: 'u' + Date.now(),
            customId: Math.floor(10000 + Math.random() * 90000),
            name: email.split('@')[0],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            level: UserLevel.SILVER,
            coins: 50000,
            wealth: 0, charm: 0, isVip: false, vipLevel: 0,
            bio: 'مرحباً بك في ملفي الشخصي 🌹',
            stats: { likes: 120, visitors: 300, following: 10, followers: 5 },
            ownedItems: [], isFollowing: false, isMuted: false, isAdmin: email === 'admin@voicechat.com'
        };
        onAuth(mockUser);
      } else {
        if (!name) {
           setError('الرجاء إدخال الاسم');
           setLoading(false);
           return;
        }
        const newUser: UserType = {
            id: 'u' + Date.now(),
            customId: Math.floor(10000 + Math.random() * 90000),
            name: name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            level: UserLevel.NEW,
            coins: 1000,
            wealth: 0, charm: 0, isVip: false, vipLevel: 0,
            bio: 'مستخدم جديد في صوت العرب',
            stats: { likes: 0, visitors: 0, following: 0, followers: 0 },
            ownedItems: [], isFollowing: false, isMuted: false, isAdmin: false
        };
        onAuth(newUser);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden font-cairo">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl mb-4 shadow-lg shadow-orange-900/50">
                    <Crown size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">صوت العرب</h1>
                <p className="text-slate-400 text-sm">مجتمع صوتي تفاعلي (نسخة محلية)</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                    <div className="relative">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input type="text" placeholder="الاسم المستعار" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pr-12 pl-4 text-white focus:border-amber-500 outline-none transition-colors" />
                    </div>
                )}
                <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pr-12 pl-4 text-white focus:border-amber-500 outline-none transition-colors" />
                </div>
                <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pr-12 pl-4 text-white focus:border-amber-500 outline-none transition-colors" />
                </div>

                {error && <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>}

                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-amber-400 font-bold hover:text-amber-300 transition-colors text-xs">
                    {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
                </button>
            </div>
        </motion.div>
    </div>
  );
};

export default AuthScreen;
