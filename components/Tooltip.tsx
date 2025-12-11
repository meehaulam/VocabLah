import React, { useState, useEffect, useRef } from 'react';

interface TooltipProps {
  content: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, className = '' }) => {
  const [isActive, setIsActive] = useState(false);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(!isActive);
    
    // Auto hide after 5 seconds on mobile/click
    if (!isActive) {
        setTimeout(() => {
            if (tooltipRef.current) setIsActive(false);
        }, 5000);
    }
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsActive(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <span 
        ref={tooltipRef}
        className={`tooltip-wrapper ${isActive ? 'active' : ''} ${className}`}
        onClick={handleClick}
        onMouseEnter={() => setIsActive(true)}
        onMouseLeave={() => setIsActive(false)}
    >
      <span className="tooltip-icon">?</span>
      <span className="tooltip-text">{content}</span>
    </span>
  );
};