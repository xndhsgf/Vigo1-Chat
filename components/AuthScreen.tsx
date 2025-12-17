
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, LogIn, Crown, ShieldAlert } from 'lucide-react';
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

    // محاكاة تسجيل دخول
    setTimeout(() => {
      if (isLogin) {
        if (!email.includes('@')) {
           setError('الرجاء إدخال بريد إلكتروني صحيح');
           setLoading(false);
           return;
        }

        // الحساب المخصص: Super Admin
        if (email.toLowerCase() === 'superadmin@vigo1.com') {
          const adminUser: UserType = {
            id: 'admin_root',
            customId: 1,
            name: 'سوبر أدمن (المالك)',
            avatar: 'https://cdn-icons-png.flaticon.com/512/6024/6024190.png',
            level: UserLevel.VIP,
            coins: 99999999,
            wealth: 5000000, 
            charm: 5000000, 
            isVip: true, 
            vipLevel: 12,
            frame: 'https://cdn-icons-png.flaticon.com/512/2165/2165039.png',
            nameStyle: 'text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 font-black animate-pulse drop-shadow-md',
            bio: 'مطور ومؤسس تطبيق صوت العرب 👑 (Super Admin)',
            location: 'المقر الرئيسي',
            stats: { likes: 99999, visitors: 1000000, following: 0, followers: 999999 },
            ownedItems: [], 
            isFollowing: false, 
            isMuted: false, 
            isAdmin: true, // تفعيل لوحة التحكم
            status: 'owner'
          };
          onAuth(adminUser);
          setLoading(false);
          return;
        }

        // مستخدم افتراضي عادي
        const mockUser: UserType = {
            id: 'u' + Date.now(),
            customId: Math.floor(10000 + Math.random() * 90000),
            name: email.split('@')[0],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            level: UserLevel.SILVER,
            coins: 10000,
            wealth: 0, charm: 0, isVip: false, vipLevel: 0,
            bio: 'مرحباً بك في ملفي الشخصي 🌹',
            stats: { likes: 120, visitors: 300, following: 10, followers: 5 },
            ownedItems: [], isFollowing: false, isMuted: false, isAdmin: false
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
            coins: 2000,
            wealth: 0, charm: 0, isVip: false, vipLevel: 0,
            bio: 'مستخدم جديد في صوت العرب',
            stats: { likes: 0, visitors: 0, following: 0, followers: 0 },
            ownedItems: [], isFollowing: false, isMuted: false, isAdmin: false
        };
        onAuth(newUser);
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden font-cairo">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl mb-4 shadow-lg shadow-orange-900/50">
                    <Crown size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">صوت العرب</h1>
                <p className="text-slate-400 text-sm">مجتمع صوتي تفاعلي آمن ومميز</p>
                {email.toLowerCase() === 'superadmin@vigo1.com' && (
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-red-500 font-bold text-xs animate-pulse">
                    <ShieldAlert size={14} /> الدخول كمسؤول النظام
                  </div>
                )}
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                    <div className="relative group">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={20} />
                        <input type="text" placeholder="الاسم المستعار" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-amber-500 outline-none transition-all" />
                    </div>
                )}
                <div className="relative group">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={20} />
                    <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-amber-500 outline-none transition-all" />
                </div>
                <div className="relative group">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={20} />
                    <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-amber-500 outline-none transition-all" />
                </div>

                {error && <div className="text-red-400 text-xs bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex items-center gap-2">
                   <ShieldAlert size={16} /> {error}
                </div>}

                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isLogin ? 'دخول الحساب' : 'إنشاء حساب جديد')}
                </button>
            </form>

            <div className="mt-8 text-center">
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-slate-500 font-bold hover:text-amber-400 transition-colors text-xs">
                    {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
                </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5 text-center">
               <p className="text-[10px] text-slate-600">نسخة السوبر أدمن - 2025</p>
            </div>
        </motion.div>
    </div>
  );
};

export default AuthScreen;
