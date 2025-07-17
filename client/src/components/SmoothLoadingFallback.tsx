import React from 'react';
import Layout from './Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SmoothLoadingFallbackProps {
  type?: 'page' | 'content' | 'minimal';
}

const SmoothLoadingFallback: React.FC<SmoothLoadingFallbackProps> = ({ type = 'page' }) => {
  if (type === 'minimal') {
    return (
      <div className="flex items-center justify-center p-8 content-container">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (type === 'content') {
    return (
      <div className="space-y-4 p-6 content-container opacity-100 animate-pulse">
        <Skeleton className="h-8 w-64 skeleton-pulse" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full skeleton-pulse" />
          <Skeleton className="h-4 w-3/4 skeleton-pulse" />
          <Skeleton className="h-4 w-1/2 skeleton-pulse" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-48 skeleton-pulse" />
              <Skeleton className="h-4 w-full skeleton-pulse" />
              <Skeleton className="h-4 w-full skeleton-pulse" />
              <Skeleton className="h-4 w-2/3 skeleton-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 opacity-100 animate-pulse">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64 skeleton-pulse" />
          <Skeleton className="h-10 w-32 skeleton-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="transition-all duration-200 opacity-100">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48 skeleton-pulse" />
                  <Skeleton className="h-4 w-full skeleton-pulse" />
                  <Skeleton className="h-4 w-3/4 skeleton-pulse" />
                  <div className="pt-4">
                    <Skeleton className="h-10 w-24 skeleton-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card className="transition-all duration-200 opacity-100">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 skeleton-pulse" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full skeleton-pulse" />
                <Skeleton className="h-4 w-full skeleton-pulse" />
                <Skeleton className="h-4 w-2/3 skeleton-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SmoothLoadingFallback;