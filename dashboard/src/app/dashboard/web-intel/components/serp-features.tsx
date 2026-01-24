'use client';

import {
  Star,
  HelpCircle,
  MapPin,
  Video,
  ImageIcon,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/dashboard-kit/lib/utils';

interface SerpFeaturesProps {
  hasFeaturedSnippet: boolean;
  hasPeopleAlsoAsk: boolean;
  hasLocalPack: boolean;
  hasVideoResults: boolean;
  hasImagePack: boolean;
  hasKnowledgePanel: boolean;
  className?: string;
}

export function SerpFeatures({
  hasFeaturedSnippet,
  hasPeopleAlsoAsk,
  hasLocalPack,
  hasVideoResults,
  hasImagePack,
  hasKnowledgePanel,
  className,
}: SerpFeaturesProps) {
  // Check if any features are present
  const hasAnyFeature =
    hasFeaturedSnippet ||
    hasPeopleAlsoAsk ||
    hasLocalPack ||
    hasVideoResults ||
    hasImagePack ||
    hasKnowledgePanel;

  // Return null if no features present
  if (!hasAnyFeature) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {hasFeaturedSnippet && (
        <span title="Featured Snippet">
          <Star className="h-4 w-4 text-muted-foreground fill-current" />
        </span>
      )}
      {hasPeopleAlsoAsk && (
        <span title="People Also Ask">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </span>
      )}
      {hasLocalPack && (
        <span title="Local Pack">
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </span>
      )}
      {hasVideoResults && (
        <span title="Video Results">
          <Video className="h-4 w-4 text-muted-foreground" />
        </span>
      )}
      {hasImagePack && (
        <span title="Image Pack">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </span>
      )}
      {hasKnowledgePanel && (
        <span title="Knowledge Panel">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </span>
      )}
    </div>
  );
}
