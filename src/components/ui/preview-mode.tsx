
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { type Concept } from "@shared/schema";
import { Button } from "./button";
import { Download } from "lucide-react";

type PreviewProps = {
  concept: Concept;
  bannerSizes: string[];
};

export function PreviewMode({ concept, bannerSizes }: PreviewProps) {
  const [selectedSize, setSelectedSize] = useState(bannerSizes[0]);
  const [width, height] = selectedSize.split("x").map(Number);

  const exportToDesignTool = () => {
    const data = {
      size: selectedSize,
      concept,
      elements: concept.elements
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `concept-${concept.title}-${selectedSize}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {bannerSizes.map(size => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportToDesignTool}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          
          <div className="border rounded p-4 bg-white overflow-auto">
            <div 
              style={{ 
                width, 
                height,
                transform: width > 600 ? 'scale(0.8)' : 'none',
                transformOrigin: 'top left'
              }} 
              className="relative bg-gray-100 mx-auto"
            >
              <div className="absolute inset-0 p-4">
                <h3 className="text-lg font-bold">{concept.title}</h3>
                <p className="text-sm">{concept.elements.text}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
