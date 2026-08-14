import React from 'react';
import { Mail } from 'lucide-react';

export default function EmailSettings() {
  return (
    <div dir="rtl" className="p-6">
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Mail size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إعدادات البريد</h1>
            <p className="text-sm text-muted-foreground mt-1">إدارة إعدادات البريد الإلكتروني</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground">صفحة إعدادات البريد</p>
        </div>
      </div>
    </div>
  );
}