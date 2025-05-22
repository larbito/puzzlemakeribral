// Adapted from shadcn/ui toast component
import { useState, useEffect } from 'react';

interface ToastProps {
  title?: string;
  description?: string;
  duration?: number;
  type?: 'default' | 'success' | 'error' | 'warning';
}

interface ToastState extends ToastProps {
  id: string;
  visible: boolean;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const toast = ({ title, description, duration = 5000, type = 'default' }: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastState = {
      id,
      title,
      description,
      duration,
      type,
      visible: true,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss
    setTimeout(() => {
      dismissToast(id);
    }, duration);

    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        toast.id === id ? { ...toast, visible: false } : toast
      )
    );

    // Remove from state after animation (300ms)
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 300);
  };

  // For simplicity, we'll just return the toast function
  // In a real implementation, you'd render actual toast components
  return { toast, toasts, dismissToast };
} 