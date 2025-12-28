
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Pill, Phone, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

export const LoginForm: React.FC<Props> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    setError('');
    setIsSending(true);
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      setCountdown(60);
      alert('验证码已发送（演示：123456）');
    }, 1000);
  };

  const handleLogin = () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    if (code !== '123456') {
      setError('验证码错误 (演示请用 123456)');
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      onLogin({
        id: phone,
        phone: phone,
        isNew: true // Simulate auto-register logic
      });
      setIsLoggingIn(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 justify-center items-center">
      <div className="w-full max-w-sm space-y-12">
        {/* Branding */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200 rotate-12">
            <Pill className="w-10 h-10 text-white -rotate-12" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">PILLPAL</h1>
            <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mt-2">智能居家备药助手</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Phone className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="tel"
                placeholder="请输入手机号"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <div className="relative group flex-1">
                <ShieldCheck className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="验证码"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
              </div>
              <button
                disabled={countdown > 0 || isSending}
                onClick={handleSendCode}
                className="px-6 rounded-3xl font-black text-xs uppercase tracking-wider bg-white border-2 border-slate-100 text-slate-500 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 transition-all"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (countdown > 0 ? `${countdown}s` : '获取验证码')}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center px-2">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all"
          >
            {isLoggingIn ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                进入应用
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 font-medium">
          未注册手机号验证后将自动注册
          <br />
          登录即代表同意 <span className="text-blue-500 underline cursor-pointer">服务协议</span> 与 <span className="text-blue-500 underline cursor-pointer">隐私政策</span>
        </p>
      </div>
    </div>
  );
};
