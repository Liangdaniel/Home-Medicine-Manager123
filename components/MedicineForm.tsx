
import React, { useState, useEffect } from 'react';
import { Medicine } from '../types';
import { analyzeMedicineImage, getRemainingUses } from '@/services/geminiService';
import { Camera, Loader2, Save, X, Info } from 'lucide-react';

interface Props {
  initialData?: Medicine;
  onSave: (medicine: Medicine) => void;
  onCancel: () => void;
}

export const MedicineForm: React.FC<Props> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Medicine>(initialData || {
    id: Date.now().toString(),
    name: '',
    brand: '',
    ingredients: '',
    specs: '',
    indications: '',
    usage: '',
    expiryDate: '',
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [remaining, setRemaining] = useState(getRemainingUses());

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (remaining <= 0) {
      alert('今日试用到期，请明天再试');
      return;
    }

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = (event.target?.result as string).split(',')[1];
        const result = await analyzeMedicineImage(base64);
        if (result) {
          setFormData(prev => ({ ...prev, ...result, image: event.target?.result as string }));
          setRemaining(getRemainingUses());
        }
      } catch (error: any) {
        if (error.message === 'LIMIT_REACHED') {
          alert('今日试用到期，请明天再试');
        } else {
          alert('识别失败，请检查网络或重试');
        }
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {initialData ? '编辑药品' : '新增药品'}
            </h2>
            <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {!initialData && (
            <div className="space-y-4 mb-6">
              <div className="flex flex-col gap-3">
                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-xl p-6 cursor-pointer hover:bg-blue-50 transition-colors">
                  <Camera className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-sm font-bold text-blue-600">拍照/上传识别</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Info className="w-3 h-3" />
                  今日剩余免费 AI 识别次数: <span className={remaining > 0 ? 'text-blue-500' : 'text-red-500'}>{remaining} / 5</span>
                </div>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
              <p className="text-gray-600 font-medium">AI 正在努力识别中...</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">药品名称</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">品牌</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">规格</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.specs}
                  onChange={e => setFormData({...formData, specs: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">有效期</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.expiryDate}
                  onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">主要成分</label>
              <textarea
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                rows={2}
                value={formData.ingredients}
                onChange={e => setFormData({...formData, ingredients: e.target.value})}
              />
            </div>
             <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">适应症</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.indications}
                onChange={e => setFormData({...formData, indications: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 ml-1">用法用量</label>
              <textarea
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                rows={2}
                value={formData.usage}
                onChange={e => setFormData({...formData, usage: e.target.value})}
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => onSave(formData)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              <Save className="w-5 h-5" />
              保存药品
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
