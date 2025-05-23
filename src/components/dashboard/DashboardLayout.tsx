import React from 'react';

export const DashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-card border-r">
        <div className="p-4 font-bold">PuzzleCraft Forge</div>
      </aside>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout; 