import React from "react";

export const CourtFooter: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-6 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">Court AI Demo</span>
          <span>•</span>
          <span>Speech recognition powered by Oliots</span>
        </div>
        <p className="text-center sm:text-right text-slate-400">
          Prototype legal dictation demonstration. Dictated text requires human review before filing.
        </p>
      </div>
    </footer>
  );
};
