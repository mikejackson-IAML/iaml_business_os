import { Badge } from "@/dashboard-kit/components/ui/badge";
import { cn } from "@/dashboard-kit/lib/utils";

interface MasteryBadgeProps {
  level: number;
  tier: 'novice' | 'developing' | 'proficient' | 'expert';
  showLevel?: boolean;
  className?: string;
}

const tierConfig = {
  novice: {
    label: "Novice",
    variant: "secondary" as const,
    bgColor: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  },
  developing: {
    label: "Developing",
    variant: "secondary" as const,
    bgColor: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
  },
  proficient: {
    label: "Proficient",
    variant: "secondary" as const,
    bgColor: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
  },
  expert: {
    label: "Expert",
    variant: "secondary" as const,
    bgColor: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
  },
};

export function MasteryBadge({ level, tier, showLevel = false, className }: MasteryBadgeProps) {
  const config = tierConfig[tier];

  return (
    <Badge
      variant={config.variant}
      className={cn(config.bgColor, className)}
    >
      {config.label}
      {showLevel && <span className="ml-1 opacity-70">({level})</span>}
    </Badge>
  );
}

export function getMasteryTier(level: number): 'novice' | 'developing' | 'proficient' | 'expert' {
  if (level >= 10) return 'expert';
  if (level >= 6) return 'proficient';
  if (level >= 3) return 'developing';
  return 'novice';
}
