
import React, { useState } from 'react';
import { Prescription, Medicine, Contact, PrescriptionMedicine } from '../types';
import { Plus, Save, Trash2, X, Clock, Calendar } from 'lucide-react';

interface Props {
  initialData?: Prescription;
  medicines: Medicine[];
  contacts: Contact[];
  existingPrescriptions: Prescription[];
  onSave: (prescription: Prescription) => void;
  onCancel: () => void;
}

export const PrescriptionForm: React.FC<Props> = ({ 
  initialData, 
  medicines, 
  contacts, 
  existingPrescriptions,
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Prescription>(initialData || {
    id: Date.now().toString(),
    name: '',
    medicines: [],
    contactId: undefined,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reminderTimes: ["08:00"],
    isActive: true,
  });

  const [error, setError] = useState('');

  const handleSave = () => {
    if (!formData.name.trim()) {
      setError('请输入药方名称');
      return;
    }

    const isDuplicate = existingPrescriptions.some(p => p.name === formData.name && p.id !== formData.id);
    if (isDuplicate) {
      setError('药方名称已存在');
      return;
    }

    if (formData.medicines.length === 0) {
      setError('请至少添加一种药品');
      return;
    }

    if (formData.reminderTimes.length === 0) {
      setError('请至少设置一个提醒时间');
      return;
    }

    onSave(formData);
  };

  const addTimeSlot = () => {
    if (formData.reminderTimes.length < 5) {
      setFormData({
        ...formData,
        reminderTimes: [...formData.reminderTimes, "12:00"]
      });
    }
  };

  const removeTimeSlot = (index: number) => {
    const newTimes = [...formData.reminderTimes];
    newTimes.splice(index, 1);
    setFormData({ ...formData, reminderTimes: newTimes });
  };

  const updateTimeSlot = (index: number, val: string) => {
    const newTimes = [...formData.reminderTimes];
    newTimes[index] = val;
    setFormData({ ...formData, reminderTimes: newTimes });
  };

  const addMedicineRow = () => {
    if (medicines.length === 0) return;
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { medicineId: medicines[0].id, customUsage: medicines[0].usage }]
    });
  };

  const removeMedicineRow = (index: number) => {
    const newMeds = [...formData.medicines];
    newMeds.splice(index, 1);
    setFormData({ ...formData, medicines: newMeds });
  };

  const updateMedicineRow = (index: number, updates: Partial<PrescriptionMedicine>) => {
    const newMeds = [...formData.medicines];
    newMeds[index] = { ...newMeds[index], ...updates };
    if (updates.medicineId) {
      const selectedMed = medicines.find(m => m.id === updates.medicineId);
      if (selectedMed) newMeds[index].customUsage = selectedMed.usage;
    }
    setFormData({ ...formData, medicines: newMeds });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {initialData ? '编辑药方' : '新建药方'}
            </h2>
            <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">药方名称</label>
              <input
                type="text"
                placeholder="例如：感冒常规药"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.name}
                onChange={e => { setFormData({...formData, name: e.target.value}); setError(''); }}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> 开始日期
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> 结束日期
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>

            {/* Reminder Times */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase ml-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 提醒时间 (最多5个)
                </label>
                {formData.reminderTimes.length < 5 && (
                  <button onClick={addTimeSlot} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                    + 添加时间
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.reminderTimes.map((time, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-2 py-1.5 rounded-lg">
                    <input
                      type="time"
                      className="bg-transparent text-sm font-medium text-blue-700 outline-none"
                      value={time}
                      onChange={e => updateTimeSlot(idx, e.target.value)}
                    />
                    <button onClick={() => removeTimeSlot(idx)} className="text-blue-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Link */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">提醒联系人 (需双方安装App)</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.contactId || ''}
                onChange={e => setFormData({...formData, contactId: e.target.value})}
              >
                <option value="">仅提醒自己</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.status === 'connected' ? '✅ 已同步' : '(待连接)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Medicines List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">包含药品</label>
                <button onClick={addMedicineRow} className="text-sm font-medium text-blue-600 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> 添加药品
                </button>
              </div>
              {formData.medicines.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative">
                  <button onClick={() => removeMedicineRow(index)} className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-3">
                    <select
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      value={item.medicineId}
                      onChange={e => updateMedicineRow(index, { medicineId: e.target.value })}
                    >
                      {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <textarea
                      placeholder="用法用量"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      rows={2}
                      value={item.customUsage}
                      onChange={e => updateMedicineRow(index, { customUsage: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="mt-4 text-red-500 text-sm text-center font-medium">{error}</p>}

          <div className="mt-8">
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98]"
            >
              保存并同步药方
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
