import React from 'react';
import { BookOpen, Clock, Compass, Feather, Users } from 'lucide-react';
import { AppSection } from '../types';

interface NavigationProps {
  currentSection: AppSection;
  onNavigate: (section: AppSection) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentSection, onNavigate }) => {
  const navItems = [
    { id: AppSection.HOME, label: 'Front Page', icon: <BookOpen size={20} /> },
    { id: AppSection.PORTALS, label: 'Classifieds', icon: <Clock size={20} /> },
    { id: AppSection.CHRONICLE, label: 'Ripples', icon: <Feather size={20} /> },
    { id: AppSection.MENTORS, label: 'Personas', icon: <Users size={20} /> },
    { id: AppSection.EDITOR, label: 'Editor', icon: <Compass size={20} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-paper border-t-4 border-double border-ink shadow-lg pb-safe">
      <div className="max-w-3xl mx-auto flex justify-around items-center px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              flex flex-col items-center justify-center py-3 px-2 w-full transition-all duration-300
              ${currentSection === item.id 
                ? 'text-ink font-bold bg-vintage-gold/20 -translate-y-2 border-x border-t border-ink rounded-t-md shadow-sm' 
                : 'text-ink-light hover:text-ink hover:-translate-y-1'}
            `}
          >
            <div className="mb-1">{item.icon}</div>
            <span className="text-[10px] uppercase tracking-widest font-serif">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};