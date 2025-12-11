import React, { useState, useEffect } from 'react';
import { X, Check, Save } from 'lucide-react';
import { Collection } from '../types';

interface EditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, name: string, icon: string, color: string) => void;
  collection: Collection | null;
  existingCollections: Collection[];
}

const ICONS = ["🚗", "🍔", "🏛️", "🐕", "💼", "📖", "💻", "🏥", "✈️", "🎵", "⚽", "🎨", "🏠", "👔", "🌍", "💡"];
const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#EF4444", // Red
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#EC4899", // Pink
  "#06B6D4"  // Cyan
];

export const EditCollectionModal: React.FC<EditCollectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  collection,
  existingCollections 
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [error, setError] = useState('');

  // Initialize form with collection data
  useEffect(() => {
    if (isOpen && collection) {
      setName(collection.name);
      setSelectedIcon(collection.icon);
      setSelectedColor(collection.color);
      setError('');
    }
  }, [isOpen, collection]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !collection) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    // Validation
    if (!trimmedName) {
      setError("Collection name is required");
      return;
    }

    if (trimmedName.length > 50) {
      setError("Collection name must be under 50 characters");
      return;
    }

    // Check for duplicates (case insensitive), excluding the current collection
    if (existingCollections.some(c => c.id !== collection.id && c.name.toLowerCase() === trimmedName.toLowerCase())) {
        setError("A collection with this name already exists");
        return;
    }

    onSave(collection.id, trimmedName, selectedIcon, selectedColor);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-dark-border relative z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-dark dark:text-dark-text">Edit Collection</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="edit-collection-name" className="block text-sm font-semibold text-gray-700 dark:text-dark-text-sec">
                Collection Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="edit-collection-name"
                value={name}
                onChange={handleNameChange}
                className={`w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-dark-bg border focus:bg-white dark:focus:bg-dark-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 text-dark dark:text-dark-text ${
                  error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-dark-border focus:border-primary'
                }`}
              />
              {error && (
                <p className="text-red-500 text-xs font-medium animate-pulse">
                  {error}
                </p>
              )}
            </div>
            
            {/* Icon Picker */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text-sec">
                Choose Icon
              </label>
              <div className="grid grid-cols-8 sm:grid-cols-8 gap-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`aspect-square flex items-center justify-center text-xl rounded-lg transition-all ${
                      selectedIcon === icon
                        ? 'bg-primary/10 border-2 border-primary scale-110 shadow-sm'
                        : 'bg-gray-50 dark:bg-dark-bg border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text-sec">
                Choose Color
              </label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-300 dark:ring-offset-dark-surface' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && (
                      <Check className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-dark-border shrink-0 bg-white dark:bg-dark-surface">
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !!error}
            className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm ${
              !name.trim() || !!error
                ? 'bg-gray-100 dark:bg-dark-bg text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-hover text-white active:transform active:scale-[0.99]'
            }`}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};