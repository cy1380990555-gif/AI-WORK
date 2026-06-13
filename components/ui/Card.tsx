import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hoverable = false, selected = false, onClick }: CardProps) {
  return (
    <div
      className={`
        rounded-xl border bg-white p-4 shadow-sm
        ${hoverable ? 'cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all duration-200' : ''}
        ${selected ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-md' : 'border-gray-200'}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
