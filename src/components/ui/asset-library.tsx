
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { useDropzone } from "react-dropzone";
import { X, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./dialog";

type Asset = {
  id: string;
  name: string;
  url: string;
  type: "logo" | "image" | "color";
  description?: string;
};

export function AssetLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [colorInput, setColorInput] = useState("");

  // Logo dropzone
  const onLogosDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAsset: Asset = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          url: reader.result as string,
          type: "logo",
          description: ""
        };
        setAssets(prev => [...prev, newAsset]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Other images dropzone
  const onImagesDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAsset: Asset = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          url: reader.result as string,
          type: "image",
          description: ""
        };
        setAssets(prev => [...prev, newAsset]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps, isDragActive: isLogoDragActive } = useDropzone({ 
    onDrop: onLogosDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg']
    }
  });

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({ 
    onDrop: onImagesDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg']
    }
  });

  const addColor = () => {
    if (!colorInput.trim()) return;
    
    // Validate RGB or Hex format
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbPattern = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
    
    if (!hexPattern.test(colorInput) && !rgbPattern.test(colorInput)) {
      alert("Please enter a valid hex (#FFFFFF) or RGB (rgb(255,255,255)) color value");
      return;
    }

    const newAsset: Asset = {
      id: Date.now().toString() + Math.random(),
      name: colorInput,
      url: colorInput,
      type: "color"
    };
    setAssets([...assets, newAsset]);
    setColorInput("");
  };

  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  const openDescriptionModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setTempDescription(asset.description || "");
    setIsDescriptionModalOpen(true);
  };

  const saveDescription = () => {
    if (selectedAsset) {
      setAssets(prev => prev.map(asset => 
        asset.id === selectedAsset.id 
          ? { ...asset, description: tempDescription }
          : asset
      ));
    }
    setIsDescriptionModalOpen(false);
    setSelectedAsset(null);
    setTempDescription("");
  };

  return (
    <>
      <Card className="w-full backdrop-blur-sm border-purple-400/20 bg-white/5">
        <CardHeader>
          <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Asset Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-purple-300">Logo</h3>
            <div {...getLogoRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isLogoDragActive ? 'border-purple-400 bg-purple-400/10' : 'border-gray-400 hover:border-purple-400/50 hover:bg-purple-400/5'}`}>
              <input {...getLogoInputProps()} />
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              {isLogoDragActive ? (
                <p className="text-purple-300">Drop the logo here...</p>
              ) : (
                <p className="text-gray-300">Drag 'n' drop logo here, or click to select files</p>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {assets.filter(a => a.type === "logo").map(asset => (
                <div key={asset.id} className="relative group">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-24 object-cover cursor-pointer rounded border border-gray-300"
                    onClick={() => openDescriptionModal(asset)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", asset.url);
                    }}
                  />
                  <button
                    onClick={() => removeAsset(asset.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Other Elements Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-pink-300">Other Elements</h3>
            <div {...getImageRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isImageDragActive ? 'border-pink-400 bg-pink-400/10' : 'border-gray-400 hover:border-pink-400/50 hover:bg-pink-400/5'}`}>
              <input {...getImageInputProps()} />
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              {isImageDragActive ? (
                <p className="text-pink-300">Drop the images here...</p>
              ) : (
                <p className="text-gray-300">Drag 'n' drop images here, or click to select files</p>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {assets.filter(a => a.type === "image").map(asset => (
                <div key={asset.id} className="relative group">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-24 object-cover cursor-pointer rounded border border-gray-300"
                    onClick={() => openDescriptionModal(asset)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", asset.url);
                    }}
                  />
                  <button
                    onClick={() => removeAsset(asset.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Colors Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-blue-300">Colors</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter hex (#FFFFFF) or RGB (rgb(255,255,255))"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="text-white border-0 bg-white/10 placeholder:text-gray-400 focus-visible:ring-blue-400"
              />
              <Button 
                onClick={addColor}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Add
              </Button>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {assets.filter(a => a.type === "color").map(asset => (
                <div key={asset.id} className="relative group">
                  <div
                    style={{ backgroundColor: asset.url }}
                    className="w-full h-12 rounded cursor-pointer border border-gray-300"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", asset.url);
                    }}
                  />
                  <button
                    onClick={() => removeAsset(asset.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-400 mt-1 text-center">{asset.name}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description Modal */}
      <Dialog open={isDescriptionModalOpen} onOpenChange={setIsDescriptionModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Description</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <img
                src={selectedAsset.url}
                alt={selectedAsset.name}
                className="w-full max-h-64 object-contain rounded"
              />
              <Textarea
                placeholder="Enter a description for this image (optional)"
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                className="text-white border-gray-600 bg-gray-800 placeholder:text-gray-400"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDescriptionModalOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button onClick={saveDescription} className="bg-purple-500 hover:bg-purple-600">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
