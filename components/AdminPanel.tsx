
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ShieldCheck, Search, Ban, Coins, 
  Settings2, X, Crown, Layout, Save,
  PlusCircle, Edit3, Percent, ImageIcon, Fingerprint, ShieldAlert, Zap,
  Trash2, Upload, Palette, Sparkles, Gift as GiftIcon, ShoppingBag, Gamepad2, Plus,
  ChevronRight, Target, TrendingUp, AlertTriangle, Menu, Settings, Trash, Image as ImageIcon2
} from 'lucide-react';
import { User, Room, Gift, StoreItem, GameSettings, VIPPackage } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  onUpdateRoom: (roomId: string, data: Partial<Room>) => Promise<void>;
  onDeleteRoom?: (roomId: string) => Promise<void>;
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
  isOpen, onClose, currentUser, users, onUpdateUser, rooms, setRooms, onUpdateRoom, onDeleteRoom, gifts, setGifts, storeItems, setStoreItems, vipLevels, setVipLevels, gameSettings, setGameSettings, appBanner, onUpdateAppBanner
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Modal States
  const [modalType, setModalType] = useState<'room' | 'gift' | 'store' | 'vip' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewBg, setPreviewBg] = useState<string>('');

  const [localGameSettings, setLocalGameSettings] = useState<GameSettings>(gameSettings);
  const [coinAmount, setCoinAmount] = useState<number>(0);
  const [newCustomId, setNewCustomId] = useState<string>('');

  useEffect(() => {
    setLocalGameSettings(gameSettings);
  }, [gameSettings]);

  if (!isOpen || !currentUser.isAdmin) return null;

  // Image Upload Logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'preview' | 'bg') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (target === 'preview') setPreviewImage(event.target.result as string);
          else setPreviewBg(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveItem = async () => {
    const name = (document.getElementById('m-name') as HTMLInputElement)?.value;
    const cost = parseInt((document.getElementById('m-cost') as HTMLInputElement)?.value || '0');
    
    if (modalType === 'gift') {
      const category = (document.getElementById('m-category') as HTMLSelectElement).value;
      const isLucky = (document.getElementById('m-lucky') as HTMLInputElement).checked;
      if (!name || !previewImage) return alert('أكمل البيانات وارفع صورة!');
      
      if (editingItem) {
        setGifts(gifts.map(g => g.id === editingItem.id ? { ...g, name, cost, icon: previewImage, category: category as any, isLucky } : g));
      } else {
        setGifts([...gifts, { id: Date.now().toString(), name, cost, icon: previewImage, category: category as any, isLucky, animationType: 'pop' }]);
      }
    } else if (modalType === 'store') {
      const type = (document.getElementById('m-type') as HTMLSelectElement).value;
      if (!name || !previewImage) return alert('أكمل البيانات وارفع صورة!');
      
      if (editingItem) {
        setStoreItems(storeItems.map(i => i.id === editingItem.id ? { ...i, name, price: cost, url: previewImage, type: type as any } : i));
      } else {
        setStoreItems([...storeItems, { id: 'st_' + Date.now(), name, price: cost, url: previewImage, type: type as any }]);
      }
    } else if (modalType === 'room') {
      const category = (document.getElementById('m-category') as HTMLSelectElement).value;
      if (editingItem) {
        await onUpdateRoom(editingItem.id, { 
          title: name, 
          category: category as any, 
          thumbnail: previewImage || editingItem.thumbnail,
          background: previewBg || editingItem.background 
        });
      }
    }
    
    setModalType(null);
    setEditingItem(null);
    setPreviewImage('');
    setPreviewBg('');
    alert('تم الحفظ بنجاح ✅');
  };

  const handleUpdateId = async () => {
    if (!selectedUser) return;
    const idNum = parseInt(newCustomId);
    if (isNaN(idNum)) return alert('يرجى إدخال رقم ID صحيح');
    await onUpdateUser(selectedUser.id, { customId: idNum, isSpecialId: true });
    alert('تم تحديث الـ ID بنجاح ✅');
    setSelectedUser(null);
    setNewCustomId('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-[#020617] flex flex-col md:flex-row font-cairo overflow-hidden text-right" dir="rtl">
      
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-slate-950 border-l border-white/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
               <ShieldCheck size={22} className="text-white" />
            </div>
            <h1 className="font-black text-white text-lg">لوحة الإدارة</h1>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 p-2"><X size={20}/></button>
        </div>

        <nav className="flex md:flex-col p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto md:overflow-y-auto scrollbar-hide">
          {[
            { id: 'rooms', label: 'مركز الغرف', icon: Layout, color: 'text-emerald-400' },
            { id: 'users', label: 'الأعضاء', icon: Users, color: 'text-blue-400' },
            { id: 'gifts', label: 'الهدايا', icon: GiftIcon, color: 'text-pink-400' },
            { id: 'store', label: 'المتجر', icon: ShoppingBag, color: 'text-cyan-400' },
            { id: 'vip', label: 'VIP', icon: Crown, color: 'text-amber-400' },
            { id: 'games', label: 'الألعاب', icon: Gamepad2, color: 'text-orange-400' },
            { id: 'general', label: 'الإعدادات', icon: Settings, color: 'text-purple-400' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as AdminTab)} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all whitespace-nowrap md:w-full ${activeTab === item.id ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:bg-white/5'}`}>
              <item.icon size={20} className={activeTab === item.id ? item.color : 'text-slate-600'} />
              <span className="text-sm font-black">{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={onClose} className="m-6 py-4 rounded-2xl bg-red-600/10 text-red-500 font-black border border-red-500/20 hover:bg-red-600 hover:text-white transition-all hidden md:block">خروج</button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-900/40 overflow-y-auto p-4 md:p-10 custom-scrollbar pb-24 md:pb-10">
        
        {/* Users Management */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="text" placeholder="بحث باسم المستخدم أو الـ ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3.5 pr-12 text-white text-sm outline-none focus:border-blue-500/50 shadow-xl" />
            </div>
            <div className="bg-slate-950/40 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-right min-w-[700px]">
                <thead className="bg-black/40 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="p-5">العضو</th>
                    <th className="p-5 text-center">ID</th>
                    <th className="p-5 text-center">الرصيد</th>
                    <th className="p-5 text-center">إدارة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.id.includes(searchQuery)).map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors text-white">
                      <td className="p-5 flex items-center gap-3">
                        <img src={u.avatar} className="w-10 h-10 rounded-full border border-white/10" alt=""/>
                        <span className="font-black text-sm">{u.name}</span>
                      </td>
                      <td className="p-5 text-center text-xs font-mono text-slate-400">{u.customId || u.id}</td>
                      <td className="p-5 text-center text-xs text-yellow-500 font-black">🪙 {u.coins.toLocaleString()}</td>
                      <td className="p-5 text-center">
                        <button onClick={() => setSelectedUser(u)} className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Settings2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Room Management */}
        {activeTab === 'rooms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <div key={room.id} className="bg-slate-950/60 rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-emerald-500/30 transition-all shadow-2xl">
                <div className="relative h-40">
                  <img src={room.thumbnail} className="w-full h-full object-cover" alt=""/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-4 right-4"><h3 className="text-white font-black text-lg">{room.title}</h3></div>
                </div>
                <div className="p-5 flex justify-between gap-3">
                  <button onClick={() => { setEditingItem(room); setPreviewImage(room.thumbnail); setPreviewBg(room.background); setModalType('room'); }} className="flex-1 py-3 bg-blue-600/10 text-blue-400 rounded-2xl text-xs font-black border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={16} className="inline ml-1"/>تعديل</button>
                  <button onClick={() => onDeleteRoom?.(room.id)} className="flex-1 py-3 bg-red-600/10 text-red-500 rounded-2xl text-xs font-black border border-red-500/20 hover:bg-red-600 hover:text-white transition-all"><Trash size={16} className="inline ml-1"/>حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gifts Management */}
        {activeTab === 'gifts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white">مركز الهدايا</h3>
              <button onClick={() => { setEditingItem(null); setPreviewImage(''); setModalType('gift'); }} className="bg-pink-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2"><Plus size={18}/> إضافة هدية</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {gifts.map(gift => (
                <div key={gift.id} className="bg-slate-950/60 p-5 rounded-[2rem] border border-white/5 flex flex-col items-center gap-3 relative group transition-all hover:border-pink-500/30">
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingItem(gift); setPreviewImage(gift.icon); setModalType('gift'); }} className="p-1.5 bg-blue-600/10 text-blue-400 rounded-lg"><Edit3 size={14}/></button>
                    <button onClick={() => setGifts(gifts.filter(g => g.id !== gift.id))} className="p-1.5 bg-red-600/10 text-red-500 rounded-lg"><Trash size={14}/></button>
                  </div>
                  <div className="w-14 h-14">{gift.icon.startsWith('http') || gift.icon.startsWith('data:') ? <img src={gift.icon} className="w-full h-full object-contain" /> : <span className="text-4xl">{gift.icon}</span>}</div>
                  <div className="text-center">
                    <p className="text-white font-black text-xs">{gift.name}</p>
                    <p className="text-yellow-500 font-black text-[10px]">🪙 {gift.cost}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Store Management */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white">مركز المتجر</h3>
              <button onClick={() => { setEditingItem(null); setPreviewImage(''); setModalType('store'); }} className="bg-cyan-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2"><Plus size={18}/> إضافة إطار/فقاعة</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {storeItems.map(item => (
                <div key={item.id} className="bg-slate-950/60 p-5 rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-4 group relative">
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingItem(item); setPreviewImage(item.url); setModalType('store'); }} className="p-1.5 bg-blue-600/10 text-blue-400 rounded-lg"><Edit3 size={14}/></button>
                    <button onClick={() => setStoreItems(storeItems.filter(i => i.id !== item.id))} className="p-1.5 bg-red-600/10 text-red-500 rounded-lg"><Trash size={14}/></button>
                  </div>
                  <div className="relative w-20 h-20 flex items-center justify-center bg-black/40 rounded-full">
                    {item.type === 'frame' ? (
                      <div className="relative w-14 h-14">
                        <img src={currentUser.avatar} className="w-full h-full rounded-full opacity-30 grayscale" alt="" />
                        <img src={item.url} className="absolute inset-0 w-full h-full object-contain scale-150" alt="" />
                      </div>
                    ) : (
                      <div className="w-16 h-10 rounded-lg" style={{ backgroundImage: `url(${item.url})`, backgroundSize: 'cover' }}></div>
                    )}
                  </div>
                  <div className="text-center">
                    <h4 className="text-white font-black text-xs">{item.name}</h4>
                    <p className="text-yellow-500 text-[10px] font-black">🪙 {item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Games Config */}
        {activeTab === 'games' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-slate-950/50 p-8 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                 <TrendingUp className="text-emerald-500" size={24} />
                 <h4 className="font-black text-white text-xl">إعدادات الألعاب</h4>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'نسبة فوز السلوتس (%)', key: 'slotsWinRate' },
                  { label: 'نسبة فوز العجلة (%)', key: 'wheelWinRate' },
                  { label: 'نسبة فوز هدايا الحظ (%)', key: 'luckyGiftWinRate' },
                ].map(s => (
                  <div key={s.key} className="space-y-3">
                    <div className="flex justify-between text-xs font-black text-slate-400"><span>{s.label}</span><span>{(localGameSettings as any)[s.key]}%</span></div>
                    <input type="range" min="1" max="100" value={(localGameSettings as any)[s.key]} onChange={e => setLocalGameSettings({...localGameSettings, [s.key]: parseInt(e.target.value)})} className="w-full accent-emerald-500" />
                  </div>
                ))}
              </div>
              <button onClick={() => { setGameSettings(localGameSettings); alert('تم الحفظ ✅'); }} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl">حفظ التغييرات</button>
            </div>
          </div>
        )}
      </div>

      {/* Shared Edit Modal */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-950 border border-white/10 rounded-[3rem] w-full max-w-md p-8 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black text-white">{editingItem ? 'تعديل' : 'إضافة'} عنصر جديد</h3>
                <button onClick={() => { setModalType(null); setEditingItem(null); setPreviewImage(''); setPreviewBg(''); }} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full"><X size={24}/></button>
              </div>

              <div className="space-y-5">
                {/* Image Section */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase mr-2">الصورة الرئيسية</label>
                      <div className="relative aspect-square rounded-2xl bg-slate-900 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group">
                         {previewImage ? <img src={previewImage} className="w-full h-full object-contain" alt="" /> : <Upload size={24} className="text-slate-700" />}
                         <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'preview')} className="hidden" />
                            <ImageIcon2 size={20} className="text-white" />
                         </label>
                      </div>
                   </div>
                   {modalType === 'room' && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase mr-2">خلفية الغرفة</label>
                         <div className="relative aspect-square rounded-2xl bg-slate-900 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group">
                            {previewBg ? <div className="w-full h-full" style={{ background: previewBg.startsWith('url') ? previewBg : `url(${previewBg}) center/cover` }}></div> : <Layout size={24} className="text-slate-700" />}
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                               <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'bg')} className="hidden" />
                               <ImageIcon2 size={20} className="text-white" />
                            </label>
                         </div>
                      </div>
                   )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase mr-2">الاسم / العنوان</label>
                    <input type="text" id="m-name" defaultValue={editingItem?.name || editingItem?.title} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3 text-white text-sm outline-none" />
                  </div>
                  
                  {modalType !== 'room' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase mr-2">السعر (كوينز)</label>
                      <input type="number" id="m-cost" defaultValue={editingItem?.cost || editingItem?.price} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-3 text-yellow-500 font-black text-sm outline-none" />
                    </div>
                  )}

                  {modalType === 'gift' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">القسم</label>
                        <select id="m-category" defaultValue={editingItem?.category || 'popular'} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs">
                          <option value="popular">شائع</option>
                          <option value="exclusive">مميز</option>
                          <option value="lucky">حظ</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <input type="checkbox" id="m-lucky" defaultChecked={editingItem?.isLucky} className="w-5 h-5" />
                        <label className="text-xs font-black text-slate-300">هدية حظ؟</label>
                      </div>
                    </div>
                  )}

                  {modalType === 'store' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase mr-2">النوع</label>
                      <select id="m-type" defaultValue={editingItem?.type || 'frame'} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs">
                        <option value="frame">إطار</option>
                        <option value="bubble">فقاعة</option>
                      </select>
                    </div>
                  )}

                  {modalType === 'room' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase mr-2">التصنيف</label>
                      <select id="m-category" defaultValue={editingItem?.category || 'ترفيه'} className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs">
                        <option value="ترفيه">ترفيه</option>
                        <option value="ألعاب">ألعاب</option>
                        <option value="شعر">شعر</option>
                        <option value="تعارف">تعارف</option>
                      </select>
                    </div>
                  )}
                </div>

                <button onClick={handleSaveItem} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">حفظ التغييرات</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Edit Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-950 border border-white/10 rounded-[2.5rem] w-full max-w-lg p-8 space-y-8 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <img src={selectedUser.avatar} className="w-16 h-16 rounded-full border-2 border-white/10" alt=""/>
                  <div><h3 className="font-black text-white text-xl">{selectedUser.name}</h3><p className="text-xs text-slate-500 font-mono">UID: {selectedUser.customId || selectedUser.id}</p></div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full"><X size={24}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mr-2">تعديل الـ ID</label>
                  <div className="flex gap-2">
                    <input type="number" value={newCustomId} onChange={e => setNewCustomId(e.target.value)} className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" placeholder="ID جديد..." />
                    <button onClick={handleUpdateId} className="bg-blue-600 text-white px-5 rounded-2xl text-xs font-black shadow-lg">تحديث</button>
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mr-2">إضافة كوينز</label>
                   <div className="flex gap-2">
                     <input type="number" value={coinAmount} onChange={e => setCoinAmount(parseInt(e.target.value) || 0)} className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-yellow-500 text-sm font-black outline-none focus:border-yellow-500" />
                     <button onClick={() => { onUpdateUser(selectedUser.id, { coins: selectedUser.coins + coinAmount }); alert('تم الشحن ✅'); }} className="bg-emerald-600 text-white px-5 rounded-2xl font-black shadow-lg"><PlusCircle size={18}/></button>
                   </div>
                </div>
                <div className="col-span-full pt-6 border-t border-white/5">
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { onUpdateUser(selectedUser.id, { isBanned: true }); alert('تم الحظر ✅'); }} className="py-4 bg-red-600/10 text-red-500 rounded-2xl text-xs font-black border border-red-500/10 transition-all hover:bg-red-600 hover:text-white">حظر مؤقت</button>
                      <button onClick={() => { onUpdateUser(selectedUser.id, { isBanned: true, banUntil: 'permanent' }); alert('تم الحظر الدائم ✅'); }} className="py-4 bg-red-600 text-white rounded-2xl text-xs font-black shadow-xl">حظر دائم</button>
                   </div>
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
