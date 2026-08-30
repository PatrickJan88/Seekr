import React from 'react';

interface NoDataStateProps {
  icon?: string;
  alt?: string;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const NoDataState: React.FC<NoDataStateProps> = ({
  icon = '/icons/crunch.svg',
  alt = 'No data available',
  title = 'No data available',
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center text-center gap-3 py-12 px-4 animate-in fade-in duration-300 ${className}`}>
      <div className="w-[104px] h-[104px] aspect-square flex items-center justify-center">
        <img
          src={icon}
          alt={alt}
          className="w-full h-full object-contain"
        />
      </div>
      <span className="font-semibold text-sm text-[#121722]">
        {title}
      </span>
      {description && (
        <p className="text-xs text-[#777c86] max-w-sm">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-5 py-2.5 bg-[#0068f9] text-white text-xs font-semibold rounded-full hover:bg-[#024bb1] transition-all cursor-pointer shadow-2xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default NoDataState;
