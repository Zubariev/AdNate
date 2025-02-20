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
  currentHeight
}) => {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);

  return (
    <dialog open={isOpen} className="p-4 rounded-lg shadow-lg">
      <h2 className="mb-4 text-lg font-semibold">Custom Size</h2>
      <form className="space-y-4">
        <div>
          <label htmlFor="canvas-width" className="block text-sm font-medium">
            Width (px)
          </label>
          <input
            id="canvas-width"
            name="canvas-width"
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="canvas-height" className="block text-sm font-medium">
            Height (px)
          </label>
          <input
            id="canvas-height"
            name="canvas-height"
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(width, height);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </form>
    </dialog>
  );
};

export default CustomSizeDialog; 