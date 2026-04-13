import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, UserPlus, ArrowLeft, Sparkles, Shield, CheckCircle } from 'lucide-react';

interface SignupProps {
  onSwitchToLogin: () => void;
  onPrivacyPolicy: () => void;
}

export function Signup({ onSwitchToLogin, onPrivacyPolicy }: SignupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    birthDate: '',
    area: '',
    category: '' as 'A' | 'B' | 'C' | 'D' | '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.category) {
      setError('অনুগ্রহ করে একটি ক্যাটাগরি নির্বাচন করুন');
      return;
    }

    if (!agreedToTerms) {
      setError('অনুগ্রহ করে শর্তাবলী এবং প্রাইভেসি পলিসি মেনে নিন');
      return;
    }

    setIsLoading(true);
    try {
      await signup(formData.email, formData.password, {
        name: formData.name,
        email: formData.email,
        birthDate: formData.birthDate,
        area: formData.area,
        category: formData.category,
      });
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || 'সাইনআপ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md shadow-2xl animate-bounce-in">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              সাইনআপ সফল!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন আপনি লগইন করতে পারেন।
            </p>
            <Button 
              onClick={onSwitchToLogin}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
              size="lg"
            >
              লগইন পেজে যান
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl relative z-10 animate-fade-in-up">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg animate-glow">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            নতুন অ্যাকাউন্ট
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400 mt-2">
            আমাদের কমিউনিটিতে যোগ দিন
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 animate-shake">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">পূর্ণ নাম</Label>
              <Input
                id="name"
                placeholder="আপনার নাম লিখুন"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">ইমেইল ঠিকানা</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">পাসওয়ার্ড</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="নিরাপদ পাসওয়ার্ড"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  minLength={6}
                  className="h-12 pr-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-gray-700 dark:text-gray-300">জন্ম তারিখ</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                  required
                  className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-700 dark:text-gray-300">ক্যাটাগরি</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">ক্যাটাগরি A</SelectItem>
                    <SelectItem value="B">ক্যাটাগরি B</SelectItem>
                    <SelectItem value="C">ক্যাটাগরি C</SelectItem>
                    <SelectItem value="D">ক্যাটাগরি D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="area" className="text-gray-700 dark:text-gray-300">এলাকা</Label>
              <Input
                id="area"
                placeholder="আপনার এলাকার নাম"
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
                required
                className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-1 border-purple-400 data-[state=checked]:bg-purple-500"
                />
                <div className="text-sm">
                  <label htmlFor="terms" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                    আমি সম্মতি দিচ্ছি যে:
                  </label>
                  <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-400 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>আমার দেওয়া সব তথ্য সত্য ও সঠিক</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>আমি এই প্ল্যাটফর্মের নিয়ম-কানুন মেনে চলব</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>আমি অন্য সদস্যদের সম্মান করব</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>আমি কোনো অনৈতিক কাজে এই প্ল্যাটফর্ম ব্যবহার করব না</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm pl-7">
                <Shield className="w-4 h-4 text-purple-500" />
                <button
                  type="button"
                  onClick={onPrivacyPolicy}
                  className="text-purple-600 hover:text-purple-700 underline font-medium"
                >
                  প্রাইভেসি পলিসি পড়ুন
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  প্রসেসিং...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  অ্যাকাউন্ট তৈরি করুন
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full text-gray-500 hover:text-purple-600"
              onClick={onSwitchToLogin}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন
            </Button>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8), 0 0 60px rgba(236, 72, 153, 0.4); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
