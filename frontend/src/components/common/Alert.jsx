import { useEffect, useState } from 'react';

const Alert = ({ type, message, onClose, autoClose = true, duration = 5000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoClose && message) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, autoClose, duration, onClose]);

  if (!message || !visible) return null;

  const bgColor = type === 'error' 
    ? 'bg-red-100 border-red-400 text-red-700' 
    : type === 'success'
      ? 'bg-green-100 border-green-400 text-green-700'
      : 'bg-blue-100 border-blue-400 text-blue-700';

  return (
    <div className={`${bgColor} px-4 py-3 rounded relative mb-4 border`} role="alert">
      <span className="block sm:inline">{message}</span>
      {onClose && (
        <button 
          onClick={() => {
            setVisible(false);
            onClose();
          }}
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
        >
          <span className="text-xl">&times;</span>
        </button>
      )}
    </div>
  );
};

export default Alert;