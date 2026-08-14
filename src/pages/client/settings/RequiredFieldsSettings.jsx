import React from 'react';
import { CheckSquare } from 'lucide-react';

export default function RequiredFieldsSettings() {
  return (
    <div dir="rtl" className="p-6">
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <CheckSquare size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الحقول الإجبارية</h1>
            <p className="text-sm text-muted-foreground mt-1">إدارة الحقول الإجبارية في النماذج</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground">صفحة الحقول الإجبارية</p>
        </div>
      </div>
    </div>
  );
}