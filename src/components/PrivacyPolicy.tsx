import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Lock, Eye, Database, Share2 } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          ফিরে যান
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-bold">প্রাইভেসি পলিসি</CardTitle>
            <p className="text-blue-100 mt-2">আপনার তথ্যের নিরাপত্তা আমাদের প্রথম অগ্রাধিকার</p>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">১. তথ্য সংগ্রহ</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                আমরা আপনার নাম, ইমেইল, জন্ম তারিখ, এলাকা এবং ক্যাটাগরি সংগ্রহ করি। 
                এই তথ্যগুলো শুধুমাত্র আমাদের সেবা উন্নয়নের জন্য ব্যবহার করা হয়। 
                আমরা কখনোই আপনার তথ্য তৃতীয় পক্ষের সাথে শেয়ার করি না।
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">২. তথ্য নিরাপত্তা</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                আপনার সব তথ্য এনক্রিপ্টেড ফরম্যাটে সংরক্ষণ করা হয়। 
                Firebase এর মাধ্যমে আমরা উচ্চমানের নিরাপত্তা প্রদান করি। 
                আপনার পাসওয়ার্ড হ্যাশ করা থাকে এবং কেউ এটি দেখতে পারে না।
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">৩. তথ্য ব্যবহার</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                আপনার তথ্য শুধুমাত্র নিম্নলিখিত উদ্দেশ্যে ব্যবহার করা হয়:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-600 dark:text-gray-400 space-y-1">
                <li>অ্যাকাউন্ট তৈরি এবং পরিচালনা</li>
                <li>ফান্ড ম্যানেজমেন্ট সেবা প্রদান</li>
                <li>গুরুত্বপূর্ণ নোটিফিকেশন পাঠানো</li>
                <li>সিস্টেম উন্নয়ন</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Share2 className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">৪. তথ্য শেয়ারিং</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                আমরা কখনোই আপনার ব্যক্তিগত তথ্য বিক্রি, ভাড়া বা শেয়ার করি না। 
                শুধুমাত্র আইনি প্রয়োজনে বা আপনার সম্মতিতে তথ্য শেয়ার করা হতে পারে।
              </p>
            </section>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-8">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">যোগাযোগ</h3>
              <p className="text-gray-600 dark:text-gray-400">
                প্রাইভেসি সম্পর্কিত যেকোনো প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করুন:
              </p>
              <p className="text-blue-600 mt-2">ইমেইল: mr4425390@gmail.com</p>
            </div>

            <p className="text-sm text-gray-500 text-center mt-8">
              শেষ আপডেট: জানুয়ারি ২০২৪
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
