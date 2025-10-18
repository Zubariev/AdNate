import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type Asset = {
  id: string;
  name: string;
  url: string;
  file?: File; // Store the original File object for upload
  type: "logo" | "image" | "color";
  description?: string;
};

interface AssetLibraryContextType {
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  clearAssets: () => void;
  getLogoAssets: () => Asset[];
  getImageAssets: () => Asset[];
  getColorAssets: () => Asset[];
}

const AssetLibraryContext = createContext<AssetLibraryContextType | undefined>(undefined);

export const AssetLibraryProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>([]);

  const addAsset = useCallback((asset: Asset) => {
    setAssets(prev => [...prev, asset]);
  }, []);

  const removeAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  }, []);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(asset => 
      asset.id === id ? { ...asset, ...updates } : asset
    ));
  }, []);

  const clearAssets = useCallback(() => {
    setAssets([]);
  }, []);

  const getLogoAssets = useCallback(() => {
    return assets.filter(a => a.type === 'logo');
  }, [assets]);

  const getImageAssets = useCallback(() => {
    return assets.filter(a => a.type === 'image');
  }, [assets]);

  const getColorAssets = useCallback(() => {
    return assets.filter(a => a.type === 'color');
  }, [assets]);

  return (
    <AssetLibraryContext.Provider value={{
      assets,
      addAsset,
      removeAsset,
      updateAsset,
      clearAssets,
      getLogoAssets,
      getImageAssets,
      getColorAssets
    }}>
      {children}
    </AssetLibraryContext.Provider>
  );
};

export const useAssetLibrary = () => {
  const context = useContext(AssetLibraryContext);
  if (!context) {
    throw new Error('useAssetLibrary must be used within an AssetLibraryProvider');
  }
  return context;
};

