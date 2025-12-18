
import React, { useState, useEffect } from 'react';
import { Home, User as UserIcon, Plus, Bell, Crown, Gem, Settings, ChevronRight, Edit3, Share2, LogOut, Shield, Database, ShoppingBag, Camera, Trophy, Flame, Sparkles, UserX, Star, ShieldCheck, MapPin } from 'lucide-react';
import RoomCard from './components/RoomCard';
import VoiceRoom from './components/VoiceRoom';
import AuthScreen from './components/AuthScreen';
import Toast, { ToastMessage } from './components/Toast';
import VIPModal from './components/VIPModal';
import EditProfileModal from './components/EditProfileModal';
import BagModal from './components/BagModal';
import CreateRoomModal from './components/CreateRoomModal';
import MiniPlayer from './components/MiniPlayer';
import GlobalBanner from './components/GlobalBanner';
import AdminPanel from './components/AdminPanel';
import { MOCK_ROOMS, VIP_LEVELS, GIFTS as INITIAL_GIFTS, STORE_ITEMS, MOCK_CONTRIBUTORS, CURRENT_USER } from './constants';
import { Room, User, VIPPackage, UserLevel, Gift, StoreItem, GameSettings, GlobalAnnouncement } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { db } from './services/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, query, orderBy, addDoc, getDoc, deleteDoc } from 'firebase/firestore';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'rank'>('home');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);
  const [isUserMuted, setIsUserMuted] = useState(true);
  
  // Local Data State
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([CURRENT_USER]);
  const [rooms, setRooms] = useState<Room[]>([]); 
  const [gifts, setGifts] = useState<Gift[]>(INITIAL_GIFTS);
  const [storeItems, setStoreItems] = useState<StoreItem[]>(STORE_ITEMS);
  const [vipLevels, setVipLevels] = useState<VIPPackage[]>(VIP_LEVELS);
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  
  const [appBanner, setAppBanner] = useState('https://img.freepik.com/free-vector/gradient-music-festival-twitch-banner_23-2149051838.jpg');

  const [gameSettings, setGameSettings] = useState<GameSettings>({
     slotsWinRate: 35,
     wheelWinRate: 45,
     luckyGiftWinRate: 30,
     luckyGiftRefundPercent: 200,
     luckyXEnabled: true,
     luckyMultipliers: [
        { label: 'X10', value: 10, chance: 70 },
        { label: 'X50', value: 50, chance: 20 },
        { label: 'X100', value: 100, chance: 8 },
        { label: 'X500', value: 500, chance: 2 },
     ],
     wheelJackpotX: 8,
     wheelNormalX: 2,
     slotsSevenX: 20,
     slotsFruitX: 5
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBagModal, setShowBagModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    // Listen for Global Settings
    const unsubSettings = onSnapshot(doc(db, 'appSettings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appBanner) setAppBanner(data.appBanner);
        if (data.gameSettings) setGameSettings(data.gameSettings);
      }
    });

    // Listen for All Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        if (usersData.length > 0) setUsers(usersData);
    });

    // Listen for Rooms
    const qRooms = query(collection(db, 'rooms'), orderBy('listeners', 'desc'));
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData.length > 0 ? roomsData : MOCK_ROOMS);
    });

    // Listen for VIP Levels from DB
    const unsubVip = onSnapshot(doc(db, 'appSettings', 'vip'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.levels) setVipLevels(data.levels);
      }
    });

    // Handle Local Auth
    const savedUser = localStorage.getItem('voice_chat_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      getDoc(doc(db, 'users', parsedUser.id)).then((docSnap) => {
        if (docSnap.exists()) {
          const freshUser = docSnap.data() as User;
          setUser(freshUser);
          localStorage.setItem('voice_chat_user', JSON.stringify(freshUser));
        }
      });
    }
    
    setInitializing(false);
    return () => {
      unsubSettings();
      unsubRooms();
      unsubUsers();
      unsubVip();
    };
  }, []);

  const handleAdminUpdateUser = async (userId: string, data: Partial<User>) => {
    try {
        await setDoc(doc(db, 'users', userId), data, { merge: true });
    } catch (err) {
        console.error("Cloud update failed:", err);
        addToast("فشل تحديث البيانات في السحابة", "error");
    }
  };

  const handleAuth = async (userData: User) => {
    setUser(userData);
    localStorage.setItem('voice_chat_user', JSON.stringify(userData));
    try {
      await setDoc(doc(db, 'users', userData.id), userData, { merge: true });
    } catch (err) {
      console.error("Failed to sync user on auth", err);
    }
  };

  const handleLogout = () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      setUser(null);
      setCurrentRoom(null);
      localStorage.removeItem('voice_chat_user');
      addToast("تم تسجيل الخروج بنجاح", "info");
      setActiveTab('home');
    }
  };

  const handleCreateRoom = async (roomData: any) => {
    if (!user) return;
    const newRoom = { ...roomData, hostId: user.id, listeners: 1, speakers: [{ ...user, seatIndex: 0 }] };
    try {
      await addDoc(collection(db, 'rooms'), newRoom);
      addToast("تم إنشاء الغرفة بنجاح! 🎙️", "success");
      setShowCreateRoomModal(false);
    } catch (error) {
      addToast("فشل في إنشاء الغرفة", "error");
    }
  };

  const handleUpdateRoom = async (roomId: string, data: Partial<Room>) => {
    try {
      await setDoc(doc(db, 'rooms', roomId), data, { merge: true });
    } catch (error) {
      console.error("Error updating room:", error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      addToast("تم حذف الغرفة بنجاح", "success");
    } catch (error) {
      addToast("فشل حذف الغرفة", "error");
    }
  };

  const handleRoomJoin = async (room: Room) => {
    if (!user) return;
    if (user.isBanned) {
      addToast("عذراً، حسابك محظور من دخول الغرف!", "error");
      return;
    }
    setCurrentRoom(room);
    setIsRoomMinimized(false);
    setIsUserMuted(true);
    await handleUpdateRoom(room.id, { listeners: (room.listeners || 0) + 1 });
  };

  const handleRoomLeave = () => {
    if (currentRoom) {
      handleUpdateRoom(currentRoom.id, { listeners: Math.max(0, (currentRoom.listeners || 1) - 1) });
    }
    setCurrentRoom(null);
    setIsRoomMinimized(false);
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('voice_chat_user', JSON.stringify(newUser));
    try {
      await setDoc(doc(db, 'users', user.id), updatedData, { merge: true });
    } catch (err) {
      console.error("Failed to sync user data to cloud", err);
    }
  };

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const triggerAnnouncement = (ann: GlobalAnnouncement) => {
    setAnnouncement(ann);
    setTimeout(() => setAnnouncement(null), 8000);
  };

  const handleUpdateBanner = async (newUrl: string) => {
    setAppBanner(newUrl);
    try {
      await setDoc(doc(db, 'appSettings', 'global'), { appBanner: newUrl }, { merge: true });
      addToast("تم تحديث بنر التطبيق بنجاح", "success");
    } catch (error) {
      addToast("فشل تحديث البنر في السحابة", "error");
    }
  };

  if (initializing) {
    return (
      <div className="h-[100dvh] w-full bg-[#0f172a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div className="h-[100dvh] w-full bg-[#0f172a] text-white relative md:max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col font-cairo">
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <AnimatePresence>
        {announcement && <GlobalBanner announcement={announcement} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminPanel && (
          <AdminPanel 
            isOpen={showAdminPanel} 
            onClose={() => setShowAdminPanel(false)}
            currentUser={user}
            users={users}
            onUpdateUser={handleAdminUpdateUser}
            rooms={rooms}
            setRooms={setRooms}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            gifts={gifts}
            setGifts={setGifts}
            storeItems={storeItems}
            setStoreItems={setStoreItems}
            vipLevels={vipLevels}
            setVipLevels={setVipLevels}
            gameSettings={gameSettings}
            setGameSettings={setGameSettings}
            appBanner={appBanner}
            onUpdateAppBanner={handleUpdateBanner}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVIPModal && (
          <VIPModal 
            user={user} 
            vipLevels={vipLevels} 
            onClose={() => setShowVIPModal(false)} 
            onBuy={(vip) => {
              if (user.coins >= vip.cost) {
                handleUpdateUser({
                  coins: user.coins - vip.cost,
                  isVip: true,
                  vipLevel: vip.level,
                  frame: vip.frameUrl,
                  nameStyle: vip.nameStyle
                });
                addToast(`مبروك! أصبحت الآن ${vip.name} 👑`, "success");
              }
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBagModal && (
          <BagModal 
            isOpen={showBagModal} 
            onClose={() => setShowBagModal(false)} 
            items={storeItems} 
            user={user} 
            onBuy={(item) => {
              if (user.coins >= item.price) {
                handleUpdateUser({
                  coins: user.coins - item.price,
                  ownedItems: [...(user.ownedItems || []), item.id]
                });
                addToast(`تم شراء ${item.name} بنجاح! 🛍️`, "success");
              }
            }} 
            onEquip={(item) => {
              if (item.type === 'frame') handleUpdateUser({ frame: item.url });
              else handleUpdateUser({ activeBubble: item.url });
              addToast(`تم التجهيز بنجاح`, "info");
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditProfileModal && (
          <EditProfileModal 
            isOpen={showEditProfileModal} 
            onClose={() => setShowEditProfileModal(false)} 
            currentUser={user} 
            onSave={(data) => {
              handleUpdateUser(data);
              addToast("تم تحديث الملف الشخصي", "success");
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateRoomModal && (
          <CreateRoomModal 
            isOpen={showCreateRoomModal} 
            onClose={() => setShowCreateRoomModal(false)} 
            onCreate={handleCreateRoom} 
          />
        )}
      </AnimatePresence>

      {currentRoom && (
        <div className={isRoomMinimized ? 'invisible pointer-events-none absolute' : 'visible pointer-events-auto'}>
           <VoiceRoom 
              room={currentRoom} 
              currentUser={user} 
              onUpdateUser={handleUpdateUser} 
              onLeave={handleRoomLeave} 
              onMinimize={() => setIsRoomMinimized(true)} 
              gifts={gifts} 
              onEditProfile={() => setShowEditProfileModal(true)} 
              gameSettings={gameSettings} 
              onUpdateRoom={handleUpdateRoom} 
              isMuted={isUserMuted} 
              onToggleMute={() => setIsUserMuted(!isUserMuted)}
              onAnnouncement={triggerAnnouncement}
              users={users}
              setUsers={setUsers}
           />
        </div>
      )}

      <AnimatePresence>
        {currentRoom && isRoomMinimized && (
          <MiniPlayer 
            room={currentRoom} 
            onExpand={() => setIsRoomMinimized(false)} 
            onLeave={handleRoomLeave} 
            isMuted={isUserMuted} 
            onToggleMute={() => setIsUserMuted(!isUserMuted)} 
          />
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        {activeTab !== 'profile' && (
           <div className="p-4 flex justify-between items-center bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-30 border-b border-white/5 h-16">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500 rounded-lg p-1">
                  <Crown size={16} className="text-white" />
                </div>
                <h1 className="text-lg font-black text-white">صوت العرب</h1>
              </div>
              <div className="flex gap-3">
                {user.isAdmin && (
                  <button onClick={() => setShowAdminPanel(true)} className="p-2 bg-red-600/20 text-red-500 rounded-full border border-red-500/20">
                    <Shield size={18} />
                  </button>
                )}
                <button className="relative p-2 bg-slate-800 rounded-full" onClick={() => addToast('لا توجد إشعارات', 'info')}>
                  <Bell size={18} className="text-slate-300" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
                </button>
              </div>
           </div>
        )}

        <div className="space-y-4">
           {activeTab === 'home' && (
              <div className="mt-2 space-y-3">
                 <div className="px-4">
                    <div className="relative w-full h-28 rounded-2xl overflow-hidden shadow-lg border border-white/10">
                      <img src={appBanner} className="w-full h-full object-cover" alt="Banner" />
                    </div>
                 </div>
                 <div className="px-4">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xs font-bold text-white flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500" /> كبار الداعمين</h2>
                      <ChevronRight size={12} className="text-slate-500" />
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5 backdrop-blur-sm overflow-x-auto">
                      <div className="flex gap-3 min-w-max">
                        {MOCK_CONTRIBUTORS.map((contributor, idx) => (
                          <div key={contributor.id} className="flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="relative">
                              <div className={`w-12 h-12 rounded-full p-[2px] ${idx === 0 ? 'bg-gradient-to-tr from-yellow-300 via-amber-500 to-yellow-600 shadow-lg shadow-amber-500/20' : idx === 1 ? 'bg-gradient-to-tr from-slate-300 to-slate-500' : 'bg-slate-700'}`}>
                                <img src={contributor.avatar} className="w-full h-full rounded-full object-cover border-2 border-slate-900" alt={contributor.name} />
                              </div>
                              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-slate-900 text-white ${idx === 0 ? 'bg-yellow-500' : 'bg-slate-400'}`}>{contributor.rank}</div>
                            </div>
                            <span className="text-[9px] font-bold text-white max-w-[60px] truncate">{contributor.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
                 <div className="px-4">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xs font-bold text-white flex items-center gap-1.5"><Flame size={14} className="text-orange-500" /> الغرف النشطة</h2>
                      <span className="text-[10px] text-slate-500">الكل</span>
                    </div>
                    <div className="grid gap-2.5">
                      {rooms.length > 0 ? rooms.map(room => (
                        <RoomCard key={room.id} room={room} onClick={handleRoomJoin} />
                      )) : (
                        <div className="text-center text-slate-500 py-10 text-xs">لا توجد غرف متاحة حالياً</div>
                      )}
                    </div>
                 </div>
              </div>
           )}
           {activeTab === 'profile' && user && (
             <div className="relative">
                <div className="h-40 bg-slate-900 relative overflow-hidden">
                  {user.cover ? <img src={user.cover} className="w-full h-full object-cover" alt="Cover" /> : <div className="w-full h-full bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900"></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  <button onClick={() => setShowEditProfileModal(true)} className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white active:scale-95 transition-transform"><Camera size={18} /></button>
                </div>
                <div className="px-5 pb-10">
                   <div className="relative -mt-10 mb-4 flex justify-between items-end">
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-full bg-slate-950 relative flex items-center justify-center ${!user.frame ? 'p-1 border-4 border-slate-800' : ''}`}>
                          <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="Me" />
                          {user.frame && <img src={user.frame} className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-[1.3]" alt="Frame" />}
                        </div>
                      </div>
                      <div className="flex gap-4 text-center mb-1">
                        <div><div className="font-bold text-lg">{user.stats?.followers || 0}</div><div className="text-[10px] text-slate-400">متابعين</div></div>
                        <div><div className="font-bold text-lg">{user.stats?.visitors || 0}</div><div className="text-[10px] text-slate-400">زوار</div></div>
                      </div>
                   </div>
                   <div className="mb-6">
                      <h2 className={`text-2xl flex items-center gap-2 ${user.nameStyle ? user.nameStyle : 'font-bold text-white'}`}>
                        {user.name}
                        <span className="bg-amber-500 text-black text-[10px] px-2 py-0.5 rounded-full font-black">Lv.{user.level}</span>
                      </h2>
                      <div className="mt-1 flex flex-col gap-1">
                        <span className={`font-mono text-xs text-slate-400`}>ID: {user.customId || user.id}</span>
                        {user.location && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin size={12} /> {user.location}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm mt-3">{user.bio}</p>
                   </div>
                   <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-2xl border border-white/5 mb-6 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl">🪙</div>
                        <div>
                          <div className="text-xs text-slate-400">رصيد العملات</div>
                          <div className="font-bold text-lg text-yellow-400">{(user.coins ?? 0).toLocaleString()}</div>
                        </div>
                      </div>
                   </div>
                   <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
                      {user.isAdmin && (
                        <div onClick={() => setShowAdminPanel(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-red-500/5 cursor-pointer">
                          <div className="flex items-center gap-3"><ShieldCheck size={18} className="text-red-500" /><span className="text-sm font-black text-red-500">لوحة الإدارة</span></div>
                          <ChevronRight size={16} className="text-slate-600" />
                        </div>
                      )}
                      <div onClick={() => setShowEditProfileModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                        <div className="flex items-center gap-3"><Edit3 size={18} className="text-emerald-500" /><span className="text-sm font-medium">تعديل الملف الشخصي</span></div>
                        <ChevronRight size={16} className="text-slate-600" />
                      </div>
                      <div onClick={() => setShowVIPModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                        <div className="flex items-center gap-3"><Crown size={18} className="text-amber-500" /><span className="text-sm font-medium">متجر VIP</span></div>
                        <ChevronRight size={16} className="text-slate-600" />
                      </div>
                      <div onClick={() => setShowBagModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                        <div className="flex items-center gap-3"><ShoppingBag size={18} className="text-blue-500" /><span className="text-sm font-medium">الحقيبة</span></div>
                        <ChevronRight size={16} className="text-slate-600" />
                      </div>
                      <div onClick={handleLogout} className="flex items-center justify-between p-4 hover:bg-red-900/10 cursor-pointer">
                        <div className="flex items-center gap-3"><LogOut size={18} className="text-red-500" /><span className="text-sm font-medium text-red-500">تسجيل الخروج</span></div>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center h-20 pb-2 z-20">
         <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'home' ? 'text-amber-400' : 'text-slate-500'}`}><Home size={24} /><span className="text-[10px] font-medium">الرئيسية</span></button>
         <button onClick={() => setShowCreateRoomModal(true)} className="flex flex-col items-center gap-1 p-2 -mt-8 group"><div className="bg-gradient-to-br from-amber-400 to-orange-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-slate-900"><Plus size={28} className="text-white" /></div></button>
         <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'profile' ? 'text-amber-400' : 'text-slate-500'}`}><UserIcon size={24} /><span className="text-[10px] font-medium">حسابي</span></button>
      </div>
    </div>
  );
}
