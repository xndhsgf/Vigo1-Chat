
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Room, User, ChatMessage, Gift, UserLevel, GameSettings, GlobalAnnouncement } from '../types';
import { Mic, MicOff, Gift as GiftIcon, X, Send, LayoutGrid, Gamepad2, Settings, ChevronDown, Clover, Sparkles, RotateCcw, LogOut, ShieldCheck, Gem, Timer, Zap, Eraser, Users as UsersIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileSheet from './UserProfileSheet';
import Toast, { ToastMessage } from './Toast';
import WheelGameModal from './WheelGameModal';
import SlotsGameModal from './SlotsGameModal';
import GameCenterModal from './GameCenterModal';
import RoomSettingsModal from './RoomSettingsModal';
import WinStrip from './WinStrip';

interface VoiceRoomProps {
  room: Room;
  onLeave: () => void;
  onMinimize: () => void;
  currentUser: User;
  onUpdateUser: (user: Partial<User>) => void;
  gifts: Gift[];
  onEditProfile: () => void;
  gameSettings: GameSettings;
  onUpdateRoom: (roomId: string, data: Partial<Room>) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onAnnouncement: (ann: GlobalAnnouncement) => void;
  users: User[];
  setUsers: (users: User[]) => void;
}

interface ComboState {
  gift: Gift | null;
  recipientId: string | null;
  timer: number;
  count: number;
  active: boolean;
}

const GIFT_MULTIPLIERS = [1, 10, 20, 50, 99, 100, 520, 999, 1314];

const VoiceRoom: React.FC<VoiceRoomProps> = ({ 
  room, onLeave, onMinimize, currentUser, gifts, gameSettings, onUpdateRoom, isMuted, onToggleMute, onUpdateUser, onAnnouncement, users, setUsers
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [localSeats, setLocalSeats] = useState<(User | null)[]>(new Array(8).fill(null));
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftTab, setGiftTab] = useState<'popular' | 'exclusive' | 'lucky'>('popular');
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showGameCenter, setShowGameCenter] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeGame, setActiveGame] = useState<'wheel' | 'slots' | null>(null);
  const [activeGiftEffect, setActiveGiftEffect] = useState<Gift | null>(null);
  const [giftRecipientId, setGiftRecipientId] = useState<string | null>(null);
  const [selectedGiftQuantity, setSelectedGiftQuantity] = useState(1);
  const [lastSelectedGift, setLastSelectedGift] = useState<Gift | null>(gifts[0] || null);
  const [luckyWinAmount, setLuckyWinAmount] = useState<number>(0);
  
  const [comboState, setComboState] = useState<ComboState>({ gift: null, recipientId: null, timer: 0, count: 0, active: false });
  const [isComboPulsing, setIsComboPulsing] = useState(false);
  const comboTimerRef = useRef<any>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredGifts = useMemo(() => {
    return gifts.filter(gift => {
      if (giftTab === 'lucky') return gift.isLucky || gift.category === 'lucky';
      if (giftTab === 'exclusive') return gift.category === 'exclusive';
      return gift.category === 'popular' || (!gift.category && !gift.isLucky);
    });
  }, [gifts, giftTab]);

  useEffect(() => {
     const newSeats = new Array(8).fill(null);
     room.speakers.forEach((speaker) => {
        const pos = speaker.seatIndex ?? -1;
        if (pos >= 0 && pos < 8) newSeats[pos] = speaker;
     });
     setLocalSeats(newSeats);
  }, [room.speakers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (comboState.active && comboState.timer > 0) {
        if (comboTimerRef.current) clearInterval(comboTimerRef.current);
        comboTimerRef.current = setInterval(() => {
            setComboState(prev => {
                if (prev.timer <= 0.05) {
                    clearInterval(comboTimerRef.current);
                    return { ...prev, active: false, timer: 0, count: 0 };
                }
                return { ...prev, timer: Number((prev.timer - 0.05).toFixed(2)) };
            });
        }, 50);
    }
    return () => { if (comboTimerRef.current) clearInterval(comboTimerRef.current); };
  }, [comboState.active]);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
     const id = Date.now().toString();
     setToasts(prev => [...prev, { id, message, type }]);
     setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2000);
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userLevel: currentUser.level,
      userNameStyle: currentUser.nameStyle || '',
      content: inputValue,
      type: 'text',
      bubbleUrl: currentUser.activeBubble || ''
    };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
  };

  const handleSendGift = (gift: Gift, quantity: number = 1, recipientId: string | null = null, isCombo: boolean = false) => {
    const totalCost = gift.cost * quantity;
    if (currentUser.coins < totalCost) {
      addToast('عذراً، رصيدك لا يكفي! 🪙', 'error');
      setComboState(prev => ({ ...prev, active: false, timer: 0, count: 0 }));
      return;
    }
    if (!isCombo) setShowGiftModal(false);
    const finalRecipientId = recipientId || giftRecipientId;
    let recipientName = 'الجميع';
    if (finalRecipientId) {
       const targetUser = room.speakers.find(s => s.id === finalRecipientId);
       if (targetUser) recipientName = targetUser.name;
    }
    setComboState(prev => ({ gift, recipientId: finalRecipientId, timer: 5, count: isCombo ? prev.count + 1 : 1, active: true }));
    setActiveGiftEffect(gift); 
    setTimeout(() => setActiveGiftEffect(null), 2500);
    let refundAmount = 0;
    let isLuckyWin = false;
    if (gift.isLucky && Math.random() * 100 < gameSettings.luckyGiftWinRate) {
        isLuckyWin = true;
        refundAmount = Math.floor(totalCost * (gameSettings.luckyGiftRefundPercent / 100));
        setLuckyWinAmount(refundAmount);
        setTimeout(() => setLuckyWinAmount(0), 4000);
    }
    onUpdateUser({ coins: currentUser.coins - totalCost + refundAmount, wealth: (currentUser.wealth || 0) + totalCost });
    if (finalRecipientId) {
       const updatedSpeakers = room.speakers.map(s => s.id === finalRecipientId ? { ...s, charm: (s.charm || 0) + totalCost } : s);
       onUpdateRoom(room.id, { speakers: updatedSpeakers });
    }
    const giftMsg: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userLevel: currentUser.level,
      userNameStyle: currentUser.nameStyle || '',
      content: isLuckyWin ? `ربح ${refundAmount.toLocaleString()} كوينز من ${gift.name}! 🍀` : `أرسل ${gift.name} x${quantity} إلى ${recipientName}`,
      type: 'gift', giftData: gift, isLuckyWin, winAmount: refundAmount
    };
    setMessages(prev => [...prev, giftMsg]);
    if (totalCost >= 5000 || isLuckyWin) {
      onAnnouncement({ id: Date.now().toString(), senderName: currentUser.name, recipientName, giftName: gift.name, giftIcon: gift.icon, roomTitle: room.title, roomId: room.id, type: isLuckyWin ? 'lucky_win' : 'gift', amount: isLuckyWin ? refundAmount : totalCost, timestamp: new Date() });
    }
  };

  const handleSeatClick = (index: number) => {
    const userAtSeat = localSeats[index];
    if (userAtSeat) setSelectedUser(userAtSeat);
    else {
      const updatedSpeakersList = room.speakers.filter(s => s.id !== currentUser.id);
      updatedSpeakersList.push({ ...currentUser, seatIndex: index, isMuted: false });
      onUpdateRoom(room.id, { speakers: updatedSpeakersList });
    }
  };

  const handleResetCharismaInRoom = () => {
    if (confirm('هل أنت متأكد من تصفير الكاريزما لجميع المتحدثين في هذه الغرفة؟')) {
      const updatedSpeakers = room.speakers.map(s => ({ ...s, charm: 0 }));
      onUpdateRoom(room.id, { speakers: updatedSpeakers });
      addToast('تم تصفير كاريزما الغرفة بنجاح ✅', 'success');
      setShowMenuModal(false);
    }
  };

  const handleAgencyTransfer = (payload: { amount: number, targetId: string }) => {
     const newAgencyBalance = (currentUser.agencyBalance || 0) - payload.amount;
     onUpdateUser({ agencyBalance: newAgencyBalance });
     const updatedUsers = users.map(u => u.id === payload.targetId ? { ...u, coins: u.coins + payload.amount } : u);
     setUsers(updatedUsers);
     const updatedSpeakers = room.speakers.map(s => s.id === payload.targetId ? { ...s, coins: s.coins + payload.amount } : s);
     onUpdateRoom(room.id, { speakers: updatedSpeakers });
     const target = users.find(u => u.id === payload.targetId);
     const msg: ChatMessage = { id: Date.now().toString(), userId: 'system', userName: 'النظام', userLevel: UserLevel.VIP, content: `الوكيل ${currentUser.name} قام بشحن ${payload.amount.toLocaleString()} كوينز لـ ${target?.name || 'مستخدم'}`, type: 'system' };
     setMessages(prev => [...prev, msg]);
  };

  const renderGiftIcon = (icon: string, className: string = "w-full h-full object-contain") => {
    if (!icon) return null;
    const isImage = icon.startsWith('http') || icon.startsWith('data:');
    return isImage ? <img src={icon} className={className} alt="" /> : <span className="text-3xl leading-none">{icon}</span>;
  };

  const handleComboClick = () => {
    if (!comboState.active || !comboState.gift) return;
    setIsComboPulsing(true);
    setTimeout(() => setIsComboPulsing(false), 200);
    handleSendGift(comboState.gift, 1, comboState.recipientId, true);
  };

  // Smart Background calculation
  const bgStyle = useMemo(() => {
    const isImageUrl = room.background.startsWith('http') || room.background.startsWith('data:image');
    if (isImageUrl) {
        return { backgroundImage: `url(${room.background})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { background: room.background };
  }, [room.background]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col transition-all duration-700" style={bgStyle}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <AnimatePresence>{luckyWinAmount > 0 && <WinStrip amount={luckyWinAmount} />}</AnimatePresence>

      <AnimatePresence>
         {activeGiftEffect && (
            <motion.div initial={{ scale: 0, opacity: 0, y: 100 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 1.5, opacity: 0 }} className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none">
               <div className="flex flex-col items-center relative">
                  <div className="w-44 h-44 relative z-10 drop-shadow-[0_20px_40px_rgba(251,191,36,0.6)]">{renderGiftIcon(activeGiftEffect.icon)}</div>
                  <h3 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-lg">{activeGiftEffect.name}</h3>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <div className="flex justify-between items-center p-4 pt-12 bg-gradient-to-b from-black/60 to-transparent shrink-0">
         <div className="flex items-center gap-2">
            <button onClick={onLeave} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-red-500/20 border border-white/5"><X size={18} /></button>
            <button onClick={onMinimize} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full"><ChevronDown size={20} /></button>
            <div className="text-white"><h2 className="font-bold text-sm truncate max-w-[120px]">{room.title}</h2><p className="text-[9px] opacity-60">ID: {room.id}</p></div>
         </div>
         <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
            <span className="text-xs font-bold text-white">👥 {room.listeners}</span>
         </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto mt-6 scrollbar-hide">
         <div className="grid grid-cols-4 gap-x-2 gap-y-10">
            {localSeats.map((speaker, index) => (
               <div key={index} className="flex flex-col items-center relative">
                  <button onClick={() => handleSeatClick(index)} className="relative w-[60px] h-[60px] rounded-full flex items-center justify-center transition-transform active:scale-90">
                     {speaker ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                           <div className={`w-[84%] h-[84%] rounded-full overflow-hidden ${!speaker.frame ? 'p-[2px] bg-gradient-to-tr from-blue-400 to-cyan-200' : ''}`}><img src={speaker.avatar} className="w-full h-full rounded-full object-cover" /></div>
                           {speaker.frame && <img src={speaker.frame} className="absolute inset-0 w-full h-full object-contain z-20 scale-[1.3]" />}
                           <div className="absolute -bottom-5 w-full text-center"><span className="text-[9px] bg-black/40 backdrop-blur-sm px-2 rounded-full truncate max-w-[120%] border border-white/5 text-white">{speaker.name}</span></div>
                           <div className="absolute -bottom-9 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-full border border-pink-500/40"><span className="text-[9px] text-white font-bold">{(speaker.charm || 0).toLocaleString()}</span></div>
                        </div>
                     ) : (
                        <div className="relative w-full h-full flex items-center justify-center rounded-full bg-slate-800/40 border-2 border-dashed border-slate-700 hover:border-slate-500 transition-colors"><Mic size={18} className="text-slate-600" /></div>
                     )}
                  </button>
               </div>
            ))}
         </div>
      </div>

      <div className="h-[38%] bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent px-4 pb-4 pt-10 flex flex-col justify-end relative shrink-0">
         <div className="overflow-y-auto mb-4 space-y-2 pr-1 scrollbar-hide flex-1">
            {messages.map((msg) => (
               <div key={msg.id} className="flex flex-col items-start">
                  {msg.type === 'gift' ? (
                     <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl p-1.5 pr-4 pl-2 flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
                        <div className="w-8 h-8 rounded-full bg-black/30 p-1 flex items-center justify-center shrink-0">{renderGiftIcon(msg.giftData?.icon || '')}</div>
                        <div className="flex flex-col"><div className="flex items-center gap-1.5"><span className={`text-[10px] font-black ${msg.userNameStyle || 'text-amber-400'}`}>{msg.userName}</span><span className="text-[9px] text-white/50">أرسل {msg.giftData?.name}</span></div><span className="text-[9px] text-white/80 font-bold">{msg.isLuckyWin && <span className="text-green-400">🍀 ربح {msg.winAmount?.toLocaleString()}</span>}</span></div>
                     </motion.div>
                   ) : msg.type === 'system' ? (
                     <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-1 text-[10px] text-blue-300 italic w-full text-center my-1">{msg.content}</div>
                   ) : (
                     <div className="flex items-start gap-2 max-w-[90%]">
                        <div className="mt-1 px-1.5 rounded bg-slate-700 text-slate-300 text-[8px] font-bold h-4 flex items-center">Lv.{msg.userLevel}</div>
                        <div className="flex flex-col"><span className={`text-[9px] mb-0.5 ${msg.userNameStyle || 'text-slate-400'}`}>{msg.userName}</span><div className="rounded-2xl rounded-tr-none px-3 py-1.5 text-xs text-white bg-white/10 backdrop-blur-sm border border-white/5" style={msg.bubbleUrl ? { backgroundImage: `url(${msg.bubbleUrl})`, backgroundSize: 'cover' } : {}}>{msg.content}</div></div>
                     </div>
                  )}
               </div>
            ))}
            <div ref={messagesEndRef} />
         </div>

         <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-slate-800/40 backdrop-blur-xl rounded-full h-11 flex items-center px-4 border border-white/10 shadow-inner group">
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="اكتب رسالة..." className="bg-transparent text-white w-full outline-none text-xs text-right placeholder-white/30" />
                <button onClick={handleSendMessage} className="ml-2 text-blue-400 hover:text-blue-300 transition-colors"><Send size={16} /></button>
            </div>

            <div className="flex items-center gap-1.5 relative shrink-0">
                <AnimatePresence>
                    {comboState.active && (
                       <motion.div initial={{ scale: 0, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute -top-16 left-6 flex flex-col items-center justify-center z-[70]">
                           <button onClick={handleComboClick} className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 active:scale-95 shadow-2xl overflow-hidden ${isComboPulsing ? 'scale-110 brightness-125' : ''}`} style={{ background: 'rgba(139, 92, 246, 0.35)', backdropFilter: 'blur(15px)', borderColor: 'rgba(167, 139, 250, 0.8)' }}>
                              <div className="w-8 h-8 flex items-center justify-center z-10">{comboState.gift && renderGiftIcon(comboState.gift.icon)}</div>
                              <div className="absolute bottom-1 inset-x-0 flex justify-center"><span className="text-[9px] font-black text-white">{Math.ceil(comboState.timer)}s</span></div>
                           </button>
                           <motion.div key={comboState.count} initial={{ scale: 1.8, y: -5 }} animate={{ scale: 1, y: 0 }} className="absolute -top-3 -right-2 bg-gradient-to-b from-yellow-300 via-amber-500 to-orange-600 text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#10141f] z-20 shadow-xl">X{comboState.count}</motion.div>
                       </motion.div>
                    )}
                </AnimatePresence>
                <div className="flex items-center gap-1.5">
                   <button onClick={onToggleMute} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${isMuted ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]'}`}>{isMuted ? <MicOff size={20} /> : <Mic size={20} />}</button>
                   <button onClick={() => setShowGiftModal(true)} className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 rounded-full text-white shadow-xl flex items-center justify-center shrink-0 border border-white/20"><GiftIcon size={18} /></button>
                   <button onClick={() => setShowMenuModal(true)} className="w-10 h-10 bg-slate-800/80 backdrop-blur rounded-full text-white border border-white/10 flex items-center justify-center shrink-0"><LayoutGrid size={18} /></button>
                </div>
            </div>
         </div>
      </div>

      <AnimatePresence>
         {showGiftModal && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-[2px]" onClick={() => setShowGiftModal(false)}>
               <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-sm bg-slate-900/40 backdrop-blur-[45px] rounded-t-[45px] border-t border-white/25 flex flex-col max-h-[75vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                  
                  <div className="p-4 bg-white/5 border-b border-white/10">
                     <div className="text-[10px] font-black text-slate-400 mb-3 px-2 uppercase tracking-widest">إرسال الهدية إلى:</div>
                     <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-2">
                        <button onClick={() => setGiftRecipientId(null)} className={`flex flex-col items-center gap-1.5 shrink-0 transition-all ${giftRecipientId === null ? 'scale-110' : 'opacity-60 grayscale'}`}>
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 border-2 transition-all ${giftRecipientId === null ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-white/10'}`}><UsersIcon size={20} className="text-white" /></div>
                           <span className="text-[9px] font-black text-white">الجميع</span>
                        </button>
                        {room.speakers.map((speaker) => (
                           <button key={speaker.id} onClick={() => setGiftRecipientId(speaker.id)} className={`flex flex-col items-center gap-1.5 shrink-0 transition-all ${giftRecipientId === speaker.id ? 'scale-110' : 'opacity-60 grayscale'}`}>
                              <div className={`w-12 h-12 rounded-full relative p-0.5 border-2 transition-all ${giftRecipientId === speaker.id ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-white/10'}`}><img src={speaker.avatar} className="w-full h-full rounded-full object-cover" alt="" />{giftRecipientId === speaker.id && <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5"><Sparkles size={8} className="text-black" fill="currentColor" /></div>}</div>
                              <span className="text-[9px] font-black text-white truncate w-12 text-center">{speaker.name}</span>
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="p-4 flex items-center justify-between bg-white/5 border-b border-white/10">
                    <div className="flex gap-6">
                      {[{ id: 'popular', label: 'شائع' }, { id: 'exclusive', label: 'مميز' }, { id: 'lucky', label: 'الحظ' }].map(tab => (
                        <button key={tab.id} onClick={() => setGiftTab(tab.id as any)} className={`text-sm font-black transition-all relative ${giftTab === tab.id ? 'text-amber-400 scale-105' : 'text-white/35 hover:text-white/60'}`}>{tab.label}</button>
                      ))}
                    </div>
                    <div className="bg-slate-950/60 px-4 py-2 rounded-full text-yellow-400 text-xs font-black border border-white/15 shadow-inner">🪙 {(currentUser.coins ?? 0).toLocaleString()}</div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 p-6 overflow-y-auto min-h-[25vh] scrollbar-hide">
                    {filteredGifts.map(gift => (
                      <button key={gift.id} onClick={() => { setLastSelectedGift(gift); handleSendGift(gift, selectedGiftQuantity); }} className={`group flex flex-col items-center p-2.5 rounded-[22px] transition-all border ${lastSelectedGift?.id === gift.id ? 'border-amber-400 bg-amber-400/20' : 'border-white/5 bg-white/5'}`}>
                        <div className="w-14 h-14 mb-1.5 flex items-center justify-center text-3xl">{renderGiftIcon(gift.icon)}</div>
                        <span className="text-white text-[10px] font-black truncate w-full text-center">{gift.name}</span>
                        <div className="flex items-center gap-0.5 mt-1 opacity-90"><span className="text-yellow-400 text-[10px] font-black">{gift.cost}</span></div>
                      </button>
                    ))}
                  </div>
                  <div className="p-6 bg-black/30 border-t border-white/15 flex items-center justify-between gap-5">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">{GIFT_MULTIPLIERS.map(qty => (<button key={qty} onClick={() => setSelectedGiftQuantity(qty)} className={`px-3.5 py-2 rounded-2xl text-[10px] font-black transition-all ${selectedGiftQuantity === qty ? 'bg-amber-400 text-black shadow-lg shadow-amber-900/50 scale-110' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>x{qty}</button>))}</div>
                    <button onClick={() => lastSelectedGift && handleSendGift(lastSelectedGift, selectedGiftQuantity)} className="px-10 py-3.5 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-2xl text-black font-black text-sm active:scale-95 flex items-center gap-2">إرسال <Zap size={16} fill="black" /></button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {selectedUser && (
            <UserProfileSheet 
               user={selectedUser} 
               currentUser={currentUser}
               isCurrentUser={selectedUser.id === currentUser.id} 
               onClose={() => setSelectedUser(null)} 
               onAction={(act, payload) => {
                  if (act === 'agencyTransfer') handleAgencyTransfer(payload);
               }} 
            />
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showMenuModal && (
             <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowMenuModal(false)}>
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-sm bg-[#10141f] rounded-t-[30px] p-6 border-t border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => { setShowMenuModal(false); setShowGameCenter(true); }} className="bg-slate-800 p-4 rounded-[2rem] flex flex-col items-center gap-2 border border-white/5 hover:bg-white/5 transition-all">
                      <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400"><Gamepad2 size={28} /></div>
                      <span className="font-black text-xs text-white">الألعاب</span>
                    </button>
                    <button onClick={handleResetCharismaInRoom} className="bg-red-500/10 p-4 rounded-[2rem] flex flex-col items-center gap-2 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all group">
                      <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 group-hover:text-white"><Eraser size={28} /></div>
                      <span className="font-black text-xs">تصفير الكاريزما</span>
                    </button>
                    <button onClick={() => { setShowMenuModal(false); setShowSettingsModal(true); }} className="bg-slate-800 p-4 rounded-[2rem] flex flex-col items-center gap-2 border border-white/5 hover:bg-white/5 transition-all">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400"><Settings size={28} /></div>
                      <span className="font-black text-xs text-white">الإعدادات</span>
                    </button>
                    <button onClick={onLeave} className="bg-slate-800 p-4 rounded-[2rem] flex flex-col items-center gap-2 border border-white/5 hover:bg-red-900/10 transition-all">
                      <div className="w-12 h-12 bg-slate-700/50 rounded-2xl flex items-center justify-center text-slate-400"><LogOut size={28} /></div>
                      <span className="font-black text-xs text-slate-400">مغادرة</span>
                    </button>
                  </div>
                </motion.div>
             </div>
         )}
      </AnimatePresence>

      <GameCenterModal isOpen={showGameCenter} onClose={() => setShowGameCenter(false)} onSelectGame={(game) => { setActiveGame(game); setShowGameCenter(false); }} />
      <RoomSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} room={room} onUpdate={onUpdateRoom} />
      <WheelGameModal isOpen={activeGame === 'wheel'} onClose={() => setActiveGame(null)} userCoins={currentUser.coins} onUpdateCoins={(c) => onUpdateUser({ coins: c })} winRate={gameSettings.wheelWinRate} />
      <SlotsGameModal isOpen={activeGame === 'slots'} onClose={() => setActiveGame(null)} userCoins={currentUser.coins} onUpdateCoins={(c) => onUpdateUser({ coins: c })} winRate={gameSettings.slotsWinRate} />
    </div>
  );
};

export default VoiceRoom;
