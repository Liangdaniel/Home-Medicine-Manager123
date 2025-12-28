import { Medicine } from "../types";

const STORAGE_KEY_PREFIX = 'pillpal_proxy_limit_';
const getTodayKey = () => `${STORAGE_KEY_PREFIX}${new Date().toISOString().split('T')[0]}`;

export const getRemainingUses = (): number => {
  const count = parseInt(localStorage.getItem(getTodayKey()) || '0', 10);
  return Math.max(0, 5 - count);
};

const incrementUsage = () => {
  const count = parseInt(localStorage.getItem(getTodayKey()) || '0', 10);
  localStorage.setItem(getTodayKey(), (count + 1).toString());
};

export const analyzeMedicineImage = async (base64Image: string): Promise<Partial<Medicine> | null> => {
  const remaining = getRemainingUses();
  
  if (remaining <= 0) {
    throw new Error("今日免费识别额度已用完，请明天再试");
  }

  try {
    // 自动适配 Vercel 的 API 路径
    const response = await fetch('/api/analyze-medicine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.debug || data.error || '服务器请求失败');
    }
    
    incrementUsage();
    return data;
  } catch (error: any) {
    console.error("Service Request Error:", error);
    throw error;
  }
};