```tsx
import React from 'react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-gray-900/50 border-t border-gray-800 py-8 sm:py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between text-center sm:flex-row sm:text-left">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Prismatic AI. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 sm:mt-0">
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact Us</a>
          </div>
        </div>
        <Separator className="my-8 bg-gray-700" />
        <p className="text-xs text-gray-600 text-center">
          Prismatic AI is an experimental platform for orchestrating multiple Large Language Models.
          API keys are required for full functionality.
        </p>
      </div>
    </footer>
  );
}
```