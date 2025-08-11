
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { useDropzone } from "react-dropzone";

type Asset = {
  id: string;
  name: string;
  url: string;
  type: "image" | "color" | "logo";
};

export function AssetLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAsset: Asset = {
          id: Date.now().toString(),
          name: file.name,
          url: reader.result as string,
          type: "image"
        };
        setAssets(prev => [...prev, newAsset]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    }
  });

  const addColor = (color: string) => {
    const newAsset: Asset = {
      id: Date.now().toString(),
      name: color,
      url: color,
      type: "color"
    };
    setAssets([...assets, newAsset]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Asset Library</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="images">
          <TabsList>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
          </TabsList>
          <TabsContent value="images" className="space-y-4">
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 ${isDragActive ? 'border-primary' : 'border-gray-300'}`}>
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files here ...</p>
              ) : (
                <p>Drag 'n' drop images here, or click to select files</p>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {assets.filter(a => a.type === "image").map(asset => (
                <img
                  key={asset.id}
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-24 object-cover cursor-pointer rounded"
                  onClick={() => setSelectedAsset(asset)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", asset.url);
                  }}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="colors" className="space-y-4">
            <Input type="color" onChange={(e) => addColor(e.target.value)} />
            <div className="grid grid-cols-8 gap-2">
              {assets.filter(a => a.type === "color").map(asset => (
                <div
                  key={asset.id}
                  style={{ backgroundColor: asset.url }}
                  className="w-full h-8 rounded cursor-pointer"
                  onClick={() => setSelectedAsset(asset)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", asset.url);
                  }}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
