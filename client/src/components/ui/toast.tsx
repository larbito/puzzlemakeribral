import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from './use-toast';

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning';
  visible: boolean;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  title, 
  description, 
  type = 'default',
  visible,
  onDismiss
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className={`rounded-lg border shadow-sm p-4 ${getColor()} flex items-start gap-3 w-full max-w-sm`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1">
        {title && <h3 className="font-medium">{title}</h3>}
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      <button 
        onClick={() => onDismiss(id)} 
        className="flex-shrink-0 rounded-full p-1 hover:bg-gray-200 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export const ToastProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { toasts, dismissToast } = useToast();

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              title={toast.title}
              description={toast.description}
              type={toast.type}
              visible={toast.visible}
              onDismiss={dismissToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}; 