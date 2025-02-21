
import React from 'react';
import { Skeleton } from './skeleton';

export const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

export const ComponentLoading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export const DesignEditorSkeleton = () => (
  <div className="grid grid-cols-4 gap-4 h-screen">
    <div className="col-span-1 p-4 space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
    <div className="col-span-2 p-4">
      <Skeleton className="h-full w-full" />
    </div>
    <div className="col-span-1 p-4 space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);

export const BlogListSkeleton = () => (
  <div className="space-y-6">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-6 border rounded-lg space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex space-x-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    ))}
  </div>
);
