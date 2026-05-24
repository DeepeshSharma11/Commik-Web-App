import React, { useEffect, useState } from 'react';
import { useUIStore } from '../store';

const LoadingBar: React.FC = () => {
  const activeRequests = useUIStore((state) => state.activeRequests);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (activeRequests > 0) {
      setVisible(true);
      setProgress((prev) => (prev < 15 ? 15 : prev));
      
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          // Asymptotic progress mapping
          const remaining = 100 - prev;
          return prev + remaining * 0.15;
        });
      }, 150);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timeout);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeRequests]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-300 ease-out shadow-[0_1px_10px_rgba(16,185,129,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default LoadingBar;
