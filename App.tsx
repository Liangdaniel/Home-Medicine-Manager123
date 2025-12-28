
import React, { useState, useEffect, useRef } from 'react';
import { Medicine, Prescription, Contact, ViewState, User } from './types';
import { MedicineForm } from '@/components/MedicineForm';
import { PrescriptionForm } from '@/components/PrescriptionForm';
import { LoginForm } from '@/components/LoginForm';
import { Pill, NotepadText, Users, Plus, Trash2, Edit3, LogOut, Bell, BellOff, Calendar, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pillpal_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeView, setActiveView] = useState<ViewState>('medicine');
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('pillpal_medicines');
    return saved ? JSON.parse(saved) : [];
  });
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    const saved = localStorage.getItem('pillpal_prescriptions');
    return saved ? JSON.parse(saved) : [];
  });
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('pillpal_contacts');
    return saved ? JSON.parse(saved) : [];
  });

  const [showMedicineForm, setShowMedicineForm] = useState<Medicine | boolean>(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState<Prescription | boolean>(false);
  const [showContactForm, setShowContactForm] = useState<boolean>(false);
  const [newContact, setNewContact] = useState<Omit<Contact, 'id' | 'status'>>({ name: '', phone: '' });
  
  const lastReminderTime = useRef<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pillpal_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pillpal_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('pillpal_medicines', JSON.stringify(medicines));
    localStorage.setItem('pillpal_prescriptions', JSON.stringify(prescriptions));
    localStorage.setItem('pillpal_contacts', JSON.stringify(contacts));
  }, [medicines, prescriptions, contacts]);

  useEffect(() => {
    if (currentUser && "Notification" in window) {
      Notification.requestPermission();
    }
    const interval = setInterval(() => {
      if (currentUser) checkReminders();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser, prescriptions, medicines, contacts]);

  const checkReminders = () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    if (lastReminderTime.current === currentTime) return;
    prescriptions.forEach(p => {
      if (!p.isActive) return;
      if (currentDate >= p.startDate && currentDate <= p.endDate) {
        if (p.reminderTimes.includes(currentTime)) {
          lastReminderTime.current = currentTime;
          triggerNotification(p);
        }
      }
    });
  };

  const triggerNotification = (p: Prescription) => {
    const contact = contacts.find(c => c.id === p.contactId);
    const medNames = p.medicines.map(pm => medicines.find(m => m.id === pm.medicineId)?.name).join(', ');
    const title = p.contactId ? `提醒 ${contact?.name}: 服药时间到！` : "该服药了！";
    const body = `药方：${p.name}\n需服用：${medNames}`;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else {
      alert(`${title}\n${body}`);
    }
  };

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => confirm('确定要退出登录吗？') && setCurrentUser(null);

  const saveMedicine = (med: Medicine) => {
    if (typeof showMedicineForm === 'object') {
      setMedicines(prev => prev.map(m => m.id === med.id ? med : m));
    } else {
      setMedicines(prev => [med, ...prev]);
    }
    setShowMedicineForm(false);
  };

  const savePrescription = (presc: Prescription) => {
    if (typeof showPrescriptionForm === 'object') {
      setPrescriptions(prev => prev.map(p => p.id === presc.id ? presc : p));
    } else {
      setPrescriptions(prev => [presc, ...prev]);
    }
    setShowPrescriptionForm(false);
  };

  const deleteMedicine = (id: string) => {
    if (confirm('确定要删除这个药品吗？')) {
      setMedicines(prev => prev.filter(m => m.id !== id));
      setPrescriptions(prev => prev.map(p => ({
        ...p,
        medicines: p.medicines.filter(pm => pm.medicineId !== id)
      })));
    }
  };

  const togglePrescriptionActive = (id: string) => {
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const deletePrescription = (id: string) => {
    if (confirm('确定要删除这个药方吗？')) {
      setPrescriptions(prev => prev.filter(p => p.id !== id));
    }
  };

  const addContact = () => {
    if (newContact.name && newContact.phone) {
      const status = parseInt(newContact.phone.slice(-1)) % 2 === 0 ? 'connected' : 'local';
      setContacts(prev => [...prev, { ...newContact, id: Date.now().toString(), status: status as any }]);
      setNewContact({ name: '', phone: '' });
      setShowContactForm(false);
    }
  };

  const deleteContact = (id: string) => {
    if (confirm('确定要删除这个联系人吗？')) {
      setContacts(prev => prev.filter(c => c.id !== id));
      setPrescriptions(prev => prev.map(p => p.contactId === id ? { ...p, contactId: undefined } : p));
    }
  };

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-24 max-w-2xl mx-auto shadow-2xl bg-slate-50 relative flex flex-col">
      <header className="sticky top-0 bg-white/90 backdrop-blur-md z-40 p-5 border-b flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3">
            <Pill className="w-6 h-6 -rotate-3" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter">PILLPAL</h1>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              {currentUser.phone.slice(0, 3)}****{currentUser.phone.slice(-4)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (activeView === 'medicine') setShowMedicineForm(true);
              if (activeView === 'prescription') setShowPrescriptionForm(true);
              if (activeView === 'contacts') setShowContactForm(true);
            }}
            className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-6 h-6" />
            <span className="hidden sm:inline text-sm font-bold pr-1">添加</span>
          </button>
        </div>
      </header>

      <main className="p-4 flex-1">
        {activeView === 'medicine' && (
          <div className="space-y-4">
            {medicines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                <AlertCircle className="w-20 h-20 mb-4 stroke-[1.5]" />
                <p className="text-lg font-medium text-slate-400">药品库还是空的</p>
              </div>
            ) : (
              medicines.map(med => (
                <div key={med.id} className="bg-white rounded-3xl border border-slate-100 p-4 flex gap-4 shadow-sm hover:shadow-md transition-all group">
                  {med.image ? (
                    <img src={med.image} className="w-24 h-24 rounded-2xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-400"><Pill className="w-10 h-10" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800 truncate">{med.name}</h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{med.brand}</p>
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setShowMedicineForm(med)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteMedicine(med.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase">{med.indications}</span>
                      <span className="px-2 py-0.5 bg-blue-50 rounded text-[9px] font-bold text-blue-500 uppercase">{med.specs}</span>
                    </div>
                    {med.expiryDate && (
                      <p className={`mt-2 text-[10px] font-bold flex items-center gap-1 ${
                        new Date(med.expiryDate) < new Date() ? 'text-red-500' : 'text-slate-400'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        有效期至: {med.expiryDate}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeView === 'prescription' && (
           <div className="space-y-4">
            {prescriptions.map(presc => (
              <div key={presc.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
                <div className="flex justify-between mb-2">
                  <h3 className="font-black text-lg">{presc.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => togglePrescriptionActive(presc.id)} className={presc.isActive ? 'text-green-500' : 'text-slate-300'}>
                      {presc.isActive ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </button>
                    <button onClick={() => deletePrescription(presc.id)} className="text-red-400"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  {presc.reminderTimes.map(t => <span key={t} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{t}</span>)}
                </div>
                <div className="space-y-2">
                  {presc.medicines.map((pm, i) => (
                    <div key={i} className="text-xs text-slate-500 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      {medicines.find(m => m.id === pm.medicineId)?.name}: {pm.customUsage}
                    </div>
                  ))}
                </div>
              </div>
            ))}
           </div>
        )}

        {activeView === 'contacts' && (
          <div className="space-y-4">
            {contacts.map(c => (
              <div key={c.id} className="bg-white rounded-3xl p-4 flex items-center gap-4 shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-blue-600">{c.name[0]}</div>
                <div className="flex-1">
                  <h4 className="font-bold">{c.name}</h4>
                  <p className="text-xs text-slate-400">{c.phone}</p>
                </div>
                <button onClick={() => deleteContact(c.id)} className="p-2 text-red-300"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white/80 backdrop-blur-lg border-t px-8 py-4 flex justify-around z-40 rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveView('medicine')} className={`flex flex-col items-center transition-all ${activeView === 'medicine' ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
          <Pill className="w-6 h-6" /><span className="text-[9px] font-black uppercase mt-1">药品库</span>
        </button>
        <button onClick={() => setActiveView('prescription')} className={`flex flex-col items-center transition-all ${activeView === 'prescription' ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
          <NotepadText className="w-6 h-6" /><span className="text-[9px] font-black uppercase mt-1">药方</span>
        </button>
        <button onClick={() => setActiveView('contacts')} className={`flex flex-col items-center transition-all ${activeView === 'contacts' ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-400'}`}>
          <Users className="w-6 h-6" /><span className="text-[9px] font-black uppercase mt-1">亲友</span>
        </button>
      </nav>

      {showMedicineForm && (
        <MedicineForm
          initialData={typeof showMedicineForm === 'object' ? showMedicineForm : undefined}
          onSave={saveMedicine}
          onCancel={() => setShowMedicineForm(false)}
        />
      )}
      {showPrescriptionForm && (
        <PrescriptionForm
          initialData={typeof showPrescriptionForm === 'object' ? showPrescriptionForm : undefined}
          medicines={medicines}
          contacts={contacts}
          existingPrescriptions={prescriptions}
          onSave={savePrescription}
          onCancel={() => setShowPrescriptionForm(false)}
        />
      )}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl">
            <h2 className="text-xl font-black mb-6">添加同步亲友</h2>
            <input type="text" placeholder="备注姓名" className="w-full p-4 bg-slate-50 rounded-2xl mb-4" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
            <input type="tel" placeholder="手机号" className="w-full p-4 bg-slate-50 rounded-2xl mb-6" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
            <div className="flex gap-4">
              <button onClick={() => setShowContactForm(false)} className="flex-1 font-bold text-slate-400">取消</button>
              <button onClick={addContact} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
