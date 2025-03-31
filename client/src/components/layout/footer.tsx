import React from 'react';
import { Link } from 'wouter';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center sm:flex-row sm:justify-between">
          <div className="flex items-center space-x-1 text-slate-500 text-sm">
            <span>© {new Date().getFullYear()} SecureTransfer</span>
            <span className="material-icons text-xs">fiber_manual_record</span>
            <span>End-to-End Encrypted</span>
          </div>
          <div className="mt-2 sm:mt-0">
            <div className="flex space-x-4 text-sm text-slate-500">
              <Link href="#">
                <a className="hover:text-primary">Privacy Policy</a>
              </Link>
              <Link href="#">
                <a className="hover:text-primary">Terms of Service</a>
              </Link>
              <Link href="#">
                <a className="hover:text-primary">Support</a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
