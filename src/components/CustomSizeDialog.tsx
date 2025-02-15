import React, { useState } from 'react';

interface CustomSizeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (width: number, height: number) => void;
  currentWidth: number;
  currentHeight: number;
}

const CustomSizeDialog: React.FC<CustomSizeDialogProps> = ({
  isOpen,
  onClose,
  onApply,
  currentWidth,
  currentHeight,
}) => {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="p-6 bg-white rounded-lg shadow-xl w-96">
        <h3 className="mb-4 text-lg font-semibold">Custom Size</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Width (px)
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="100"
              max="3000"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Height (px)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="100"
              max="3000"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApply(width, height);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomSizeDialog; 