import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
// import { generateImageProxy } from "../api/huggingface";
import { useToast } from "./ui/use-toast";

interface ImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
  onAddElement: (element: any) => void; // Assuming onAddElement is defined elsewhere
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated, onAddElement }) => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateImageProxy({
        prompt: prompt.trim(),
        options: {
          width: 512,
          height: 512,
          guidance_scale: 7.5,
          num_inference_steps: 20,
        }
      });

      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addToCanvas = () => {
    if (generatedImage && onAddElement) {
      onAddElement({
        id: Date.now().toString(),
        type: "image",
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        src: generatedImage,
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, WebP, or SVG image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file signature for additional security
    const isValidImage = await validateImageFile(file);
    if (!isValidImage) {
      toast({
        title: "Invalid Image",
        description: "The uploaded file doesn't appear to be a valid image.",
        variant: "destructive",
      });
      return;
    }

    try {
      const imageUrl = URL.createObjectURL(file);
      setGeneratedImage(imageUrl);
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateImageFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer);
        let header = "";
        for (let i = 0; i < 4; i++) {
          header += arr[i].toString(16);
        }

        // Check common image file signatures
        const isJPEG = header.startsWith("ffd8ff");
        const isPNG = arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47;
        const isWebP = header.includes("52494646") || header.includes("57454250");
        const isSVG = file.type === 'image/svg+xml';

        resolve(isJPEG || isPNG || isWebP || isSVG);
      };
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>AI Image Generator</CardTitle>
        <CardDescription>Describe your image or upload one.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic cityscape at sunset..."
            className="h-12"
          />
        </div>

        {generatedImage && (
          <div className="flex justify-center">
            <img src={generatedImage} alt="Generated" className="object-contain max-h-64 rounded-md" />
          </div>
        )}

        <Button onClick={generateImage} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 w-4 h-4" />
              Generate Image
            </>
          )}
        </Button>

        <div className="relative">
          <div className="flex absolute inset-0 items-center">
            <span className="w-full border-t" />
          </div>
          <div className="flex relative justify-center text-xs uppercase">
            <span className="px-2 bg-background text-muted-foreground">Or</span>
          </div>
        </div>

        <div className="space-y-2">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleFileUpload}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            Upload JPEG, PNG, WebP, or SVG (max 5MB)
          </p>
        </div>

        {generatedImage && onAddElement && (
          <Button onClick={addToCanvas} className="w-full bg-green-500 hover:bg-green-600">
            Add to Canvas
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageGenerator;