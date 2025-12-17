
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ShieldCheck, Search, ChevronRight, Ban, Coins, 
  Settings2, X, Crown, Zap, Trash2, Clock, CheckCircle2, 
  Wallet, Fingerprint, RefreshCcw, Truck, Layout, 
  Gift as GiftIcon, ShoppingBag, Gamepad2, Save,
  Upload, PlusCircle, Edit3, Star, Sparkles, Percent, Target, TrendingUp, Eraser, AlertTriangle, Image as ImageIcon, Menu
} from 'lucide-react';
import { User, VIPPackage, Room, Gift, StoreItem, GameSettings } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  setUsers: (users: User[]) => void;
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  gifts: Gift[];
  setGifts: (gifts: Gift[]) => void;
  storeItems: StoreItem[];
  setStoreItems: (items: StoreItem[]) => void;
  vipLevels: VIPPackage[];
  setVipLevels: (levels: VIPPackage[]) => void;
  gameSettings: GameSettings;
  setGameSettings: (settings: GameSettings) => void;
  appBanner: string;
  onUpdateAppBanner: (url: string) => void;
}

type AdminTab = 'users' | 'rooms' | 'gifts' | 'store' | 'vip' | 'games' | 'general';

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isOpen, onClose, currentUser, users, setUsers, rooms, setRooms, gifts, setGifts, storeItems, setStoreItems, vipLevels, setVipLevels, gameSettings, setGameSettings, appBanner, onUpdateAppBanner
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [coinAmount, setCoinAmount] = useState<number>(0);
  const [agencyAmount, setAgencyAmount] = useState<number>(0);
  const [newCustomId, setNewCustomId] = useState<string>('');
  
  const [localGameSettings, setLocalGameSettings] = useState<GameSettings>(gameSettings);
  const [tempBanner, setTempBanner] = useState(appBanner);

  useEffect(() => {
    setLocalGameSettings(gameSettings);
  }, [gameSettings]);

  useEffect(() => {
    setTempBanner(appBanner);
  }, [appBanner]);

  const [editingGift, setEditingGift] = useState<Partial<Gift> | null>(null);
  const [editingStoreItem, setEditingStoreItem] = useState<Partial<StoreItem> | null>(null);

  if (!isOpen || !currentUser.isAdmin) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) callback(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateUserInList = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setSelectedUser(updatedUser);
  };

  const handleUpdateId = () => {
    if (!selectedUser) return;
    const idNum = parseInt(newCustomId);
    if (isNaN(idNum)) return alert('أدخل رقم صحيح');
    updateUserInList({ ...selectedUser, customId: idNum, isSpecialId: idNum < 10000 });
  };

  const handleDeleteRoom = (roomId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الغرفة نهائياً؟')) {
      setRooms(rooms.filter(r => r.id !== roomId));
      alert('تم حذف الغرفة بنجاح ✅');
    }
  };

  const handleResetAllCharisma = () => {
    if (confirm('هل أنت متأكد من تصفير الكاريزما للجميع؟')) {
      const updatedRooms = rooms.map(room => ({
        ...room,
        speakers: room.speakers.map(speaker => ({ ...speaker, charm: 0 }))
      }));
      setRooms(updatedRooms);
      alert('تم التصفير بنجاح ✅');
    }
  };

  const renderBgPreview = (bg: string) => {
    const isImg = bg.startsWith('http') || bg.startsWith('data:image');
    if (isImg) return { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    return { background: bg };
  };

  const saveGift = () => {
    if (!editingGift?.name || !editingGift?.icon) return alert('أكمل البيانات');
    if (editingGift.id) {
      setGifts(gifts.map(g => g.id === editingGift.id ? (editingGift as Gift) : g));
    } else {
      const newGift = { ...editingGift, id: Date.now().toString() } as Gift;
      setGifts([...gifts, newGift]);
    }
    setEditingGift(null);
  };

  const saveStoreItem = () => {
    if (!editingStoreItem?.name || !editingStoreItem?.url) return alert('أكمل البيانات');
    if (editingStoreItem.id) {
      setStoreItems(storeItems.map(s => s.id === editingStoreItem.id ? (editingStoreItem as StoreItem) : s));
    } else {
      const newItem = { ...editingStoreItem, id: Date.now().toString() } as StoreItem;
      setStoreItems([...storeItems, newItem]);
    }
    setEditingStoreItem(null);
  };

  const sidebarItems = [
    { id: 'general', label: 'العامة', icon: ImageIcon, color: 'text-purple-400' },
    { id: 'users', label: 'الأعضاء', icon: Users, color: 'text-blue-400' },
    { id: 'rooms', label: 'الغرف', icon: Layout, color: 'text-emerald-400' },
    { id: 'gifts', label: 'الهدايا', icon: GiftIcon, color: 'text-pink-400' },
    { id: 'store', label: 'المتجر', icon: ShoppingBag, color: 'text-cyan-400' },
    { id: 'vip', label: 'VIP', icon: Crown, color: 'text-amber-400' },
    { id: 'games', label: 'الألعاب', icon: Gamepad2, color: 'text-orange-400' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-[#020617] flex flex-col md:flex-row font-cairo overflow-hidden text-right" dir="rtl">
      
      {/* Sidebar for Desktop / Header Scroll for Mobile */}
      <div className="w-full md:w-64 bg-slate-950 border-l md:border-l border-b md:border-b-0 border-white/5 flex flex-col shrink-0">
        <div className="flex items-center justify-between md:justify-start gap-3 p-4 md:p-6 md:mb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-red-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
               <ShieldCheck size={24} className="text-white" />
             </div>
             <div className="md:block">
               <h1 className="font-black text-white text-sm md:text-lg leading-none">لوحة التحكم</h1>
               <span className="text-[8px] md:text-[10px] text-red-500 font-bold uppercase">التحكم الكامل</span>
             </div>
          </div>
          <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white"><X size={20}/></button>
        </div>

        {/* Mobile Tabs Scrollable */}
        <nav className="flex md:flex-col overflow-x-auto md:overflow-y-auto px-4 md:px-6 pb-4 md:pb-6 gap-2 scrollbar-hide">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl transition-all shrink-0 md:w-full ${
                activeTab === item.id ? 'bg-white/10 text-white' : 'text-slate-500'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? item.color : 'text-slate-600'} />
              <span className="text-xs md:text-sm font-bold whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <button onClick={onClose} className="hidden md:block mt-auto m-6 py-4 rounded-2xl bg-red-600/10 text-red-500 font-black border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">إغلاق اللوحة</button>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40 overflow-hidden">
        <header className="h-16 md:h-20 border-b border-white/5 px-4 md:px-8 flex items-center justify-between bg-slate-950/60 backdrop-blur-xl shrink-0">
           <h2 className="text-sm md:text-xl font-black text-white">إدارة {sidebarItems.find(i => i.id === activeTab)?.label}</h2>
           {(activeTab === 'gifts' || activeTab === 'store') && (
              <button onClick={() => activeTab === 'gifts' ? setEditingGift({ name: '', cost: 10, icon: '🌹', category: 'popular' }) : setEditingStoreItem({ name: '', price: 100, type: 'frame', url: '' })} className="bg-emerald-600 text-white px-4 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-black transition-all shadow-lg"><PlusCircle size={16} className="inline ml-1" /> إضافة</button>
           )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {/* General Tab */}
          {activeTab === 'general' && (
             <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-slate-950/50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 space-y-4">
                   <h4 className="font-black text-white text-sm md:text-base">بنر الواجهة الرئيسي</h4>
                   <div className="relative w-full h-32 md:h-40 rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-slate-900 group">
                      <img src={tempBanner} className="w-full h-full object-cover" alt="Banner" />
                      <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                         <Upload size={24} className="text-white" />
                         <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => setTempBanner(url))} />
                      </label>
                   </div>
                   <input type="text" value={tempBanner} onChange={(e) => setTempBanner(e.target.value)} placeholder="رابط مباشر..." className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-[10px] md:text-xs outline-none" />
                   <button onClick={() => { onUpdateAppBanner(tempBanner); alert('تم التحديث ✅'); }} className="w-full py-4 bg-purple-600 text-white font-black rounded-xl md:rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs md:text-sm"><Save size={18} /> حفظ البنر</button>
                </div>
             </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pr-12 text-white text-xs outline-none focus:border-blue-500/50" />
              </div>
              <div className="bg-slate-950/40 rounded-2xl overflow-x-auto border border-white/5 shadow-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-black/40 text-slate-500 text-[10px] font-black uppercase">
                     <tr><th className="p-4">العضو</th><th className="p-4">ID</th><th className="p-4">الرصيد</th><th className="p-4"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {users.filter(u => u.name.includes(searchQuery)).map(u => (
                       <tr key={u.id} className="hover:bg-white/5">
                          <td className="p-4 flex items-center gap-3">
                            <img src={u.avatar} className="w-8 h-8 rounded-full" alt=""/>
                            <span className="font-bold truncate max-w-[80px]">{u.name}</span>
                          </td>
                          <td className="p-4 font-mono">{u.customId || u.id}</td>
                          <td className="p-4 text-yellow-500">{u.coins.toLocaleString()}</td>
                          <td className="p-4 text-center"><button onClick={() => setSelectedUser(u)} className="p-2 bg-white/5 rounded-lg"><Settings2 size={16}/></button></td>
                       </tr>
                     ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rooms Tab */}
          {activeTab === 'rooms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {rooms.map(room => (
                 <div key={room.id} className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-4 group">
                    <div className="flex justify-between items-center">
                       <div className="flex gap-3 items-center">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-slate-900">
                             <img src={room.thumbnail} className="w-full h-full object-cover" alt=""/>
                             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, (url) => setRooms(rooms.map(r => r.id === room.id ? {...r, thumbnail: url} : r)))} />
                          </div>
                          <div className="max-w-[120px] md:max-w-none">
                             <input value={room.title} onChange={(e) => setRooms(rooms.map(r => r.id === room.id ? {...r, title: e.target.value} : r))} className="bg-transparent text-white font-bold text-xs outline-none border-b border-white/5 w-full" />
                             <p className="text-[9px] text-slate-500 mt-1">👥 {room.listeners}</p>
                          </div>
                       </div>
                       <button onClick={() => handleDeleteRoom(room.id)} className="p-2 bg-red-600/10 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                    <div className="relative h-20 rounded-xl overflow-hidden border border-white/5 group/bg">
                        <div className="w-full h-full" style={renderBgPreview(room.background)}></div>
                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/bg:opacity-100 cursor-pointer text-[10px] text-white font-black transition-opacity">تغيير الخلفية <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, (url) => setRooms(rooms.map(r => r.id === room.id ? {...r, background: url} : r)))} /></label>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {/* Gifts Tab */}
          {activeTab === 'gifts' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {gifts.map(gift => (
                 <div key={gift.id} className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-2 text-center relative group">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => setEditingGift(gift)} className="p-1.5 bg-blue-600 rounded-md text-white"><Edit3 size={10}/></button>
                       <button onClick={() => setGifts(gifts.filter(g => g.id !== gift.id))} className="p-1.5 bg-red-600 rounded-md text-white"><Trash2 size={10}/></button>
                    </div>
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-black/40 rounded-xl flex items-center justify-center text-2xl md:text-3xl">
                       {gift.icon.startsWith('http') ? <img src={gift.icon} className="w-10 h-10 object-contain" /> : gift.icon}
                    </div>
                    <div className="w-full">
                       <h4 className="text-white font-bold text-[10px] md:text-xs truncate">{gift.name}</h4>
                       <div className="text-yellow-500 font-bold text-[9px] mt-1">{gift.cost} 🪙</div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {/* Store Tab */}
          {activeTab === 'store' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {storeItems.map(item => (
                 <div key={item.id} className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-3 group">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center shrink-0">
                          <img src={item.url} className="w-10 h-10 object-contain" alt=""/>
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold text-xs truncate">{item.name}</h4>
                          <span className="text-cyan-400 text-[10px] font-bold">{item.price} 🪙</span>
                       </div>
                       <button onClick={() => setStoreItems(storeItems.filter(s => s.id !== item.id))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {/* VIP Tab */}
          {activeTab === 'vip' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vipLevels.map(vip => (
                   <div key={vip.level} className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4 group">
                      <div className="relative w-12 h-12 md:w-16 md:h-16 bg-black/40 rounded-full flex items-center justify-center overflow-hidden">
                         <img src={vip.frameUrl} className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, (url) => setVipLevels(vipLevels.map(v => v.level === vip.level ? {...v, frameUrl: url} : v)))} />
                      </div>
                      <div className="flex-1 space-y-1">
                         <input value={vip.name} onChange={(e) => setVipLevels(vipLevels.map(v => v.level === vip.level ? {...v, name: e.target.value} : v))} className="bg-transparent text-white font-bold text-xs md:text-sm outline-none w-full" />
                         <div className="flex items-center gap-1">
                            <span className="text-[8px] text-slate-500">السعر:</span>
                            <input type="number" value={vip.cost} onChange={(e) => setVipLevels(vipLevels.map(v => v.level === vip.level ? {...v, cost: parseInt(e.target.value) || 0} : v))} className="bg-transparent text-amber-500 font-bold text-[10px] outline-none flex-1" />
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div className="max-w-4xl mx-auto space-y-4">
               <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="font-black text-white text-sm">أدوات إدارة الغرف</h4>
                  <button onClick={handleResetAllCharisma} className="w-full py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl font-black text-xs hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"><Eraser size={16} /> تصفير الكاريزما للجميع</button>
               </div>
               <button onClick={() => { setGameSettings(localGameSettings); alert('تم الحفظ ✅'); }} className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black rounded-2xl shadow-xl text-sm"><Save size={20} className="inline ml-2" /> حفظ إعدادات الألعاب</button>
            </div>
          )}
        </main>
      </div>

      {/* Edit Modals Optimized for Mobile */}
      <AnimatePresence>
        {editingGift && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-950 border border-white/10 rounded-3xl w-full max-w-sm p-6 space-y-4">
              <h3 className="text-lg font-black text-white">إضافة/تعديل هدية</h3>
              <div className="relative w-20 h-20 bg-black/40 rounded-2xl mx-auto flex items-center justify-center group overflow-hidden border-2 border-dashed border-white/10">
                 {editingGift.icon?.startsWith('http') ? <img src={editingGift.icon} className="w-full h-full object-contain p-2" /> : <span className="text-3xl">{editingGift.icon}</span>}
                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageUpload(e, (url) => setEditingGift({...editingGift, icon: url}))} />
              </div>
              <input value={editingGift.name} onChange={e => setEditingGift({...editingGift, name: e.target.value})} placeholder="اسم الهدية" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none" />
              <input type="number" value={editingGift.cost} onChange={e => setEditingGift({...editingGift, cost: parseInt(e.target.value) || 0})} placeholder="السعر" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-yellow-500 font-black text-xs outline-none" />
              <button onClick={saveGift} className="w-full py-3 bg-pink-600 text-white font-black rounded-xl text-xs">حفظ</button>
              <button onClick={() => setEditingGift(null)} className="w-full text-slate-500 text-[10px] font-bold">إلغاء</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Edit Modal Optimized for Mobile */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-950 border border-white/10 rounded-3xl w-full max-w-sm max-h-[85vh] overflow-y-auto p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <img src={selectedUser.avatar} className="w-12 h-12 rounded-full border-2 border-amber-500" alt=""/>
                  <div><h3 className="text-base font-black text-white">{selectedUser.name}</h3><p className="text-slate-500 text-[10px]">ID: {selectedUser.customId || selectedUser.id}</p></div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400"><X size={20}/></button>
              </div>

              <div className="space-y-3">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase">تعديل الـ ID</h4>
                 <div className="flex gap-2">
                    <input type="number" value={newCustomId} onChange={e => setNewCustomId(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs" />
                    <button onClick={handleUpdateId} className="bg-cyan-600 px-4 rounded-xl text-[10px] font-black">تحديث</button>
                 </div>
              </div>

              <div className="space-y-3">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase">إضافة كوينز</h4>
                 <div className="flex gap-2">
                    <input type="number" value={coinAmount} onChange={e => setCoinAmount(parseInt(e.target.value) || 0)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-yellow-500 text-xs" />
                    <button onClick={() => updateUserInList({...selectedUser, coins: selectedUser.coins + coinAmount})} className="bg-emerald-600 px-4 rounded-xl text-white"><CheckCircle2 size={16}/></button>
                 </div>
              </div>

              <div className="space-y-3">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase">الحظر</h4>
                 <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateUserInList({...selectedUser, isBanned: true, banUntil: 'permanent'})} className="py-2.5 bg-red-600/20 text-red-500 rounded-xl text-[10px] font-bold">حظر أبدي</button>
                    {selectedUser.isBanned && <button onClick={() => updateUserInList({...selectedUser, isBanned: false})} className="py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold">فك الحظر</button>}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminPanel;
