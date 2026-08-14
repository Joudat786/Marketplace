import React from 'react';
import { HardDrive } from 'lucide-react';

export default function BackupAndRestore() {
  return (
    <div dir="rtl" className="p-6">
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <HardDrive size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">النسخ الاحتياطي</h1>
            <p className="text-sm text-muted-foreground mt-1">إدارة النسخ الاحتياطية واستعادة البيانات</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground">صفحة النسخ الاحتياطي</p>
        </div>
      </div>
    </div>
  );
}