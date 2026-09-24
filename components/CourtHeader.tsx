"use client";
import React from "react";
import { Scale } from "lucide-react";

export const CourtHeader: React.FC = () => {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-court-700 flex items-center justify-center text-white shadow-sm">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                COURT AI
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                DEMO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              AI-Powered Court Speech-to-Document
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Legal Dictation System
          </div>
          <div className="text-xs text-slate-600 font-medium">
            Next.js + OpenAI Whisper
          </div>
        </div>
      </div>
    </header>
  );
};
