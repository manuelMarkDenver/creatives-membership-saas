'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatPHP } from '@/lib/utils/currency';

interface RevenueCardProps {
  totalRevenue: number;
  growthRate: number;
  growthAmount: number;
  isLoading?: boolean;
}

export function RevenueCard({ totalRevenue, growthRate, growthAmount, isLoading }: RevenueCardProps) {
  const isPositiveGrowth = growthRate >= 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-orange-950/20 border-pink-200 dark:border-pink-900/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 dark:from-pink-400 dark:via-purple-400 dark:to-orange-400 bg-clip-text text-transparent">Total Revenue</CardTitle>
        <DollarSign className="h-4 w-4 text-pink-600 dark:text-pink-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 dark:from-pink-300 dark:via-purple-300 dark:to-orange-300 bg-clip-text text-transparent">{formatPHP(totalRevenue)}</div>
        <div className="flex items-center text-xs mt-1">
          {isPositiveGrowth ? (
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
          )}
          <span className={isPositiveGrowth ? 'text-green-500' : 'text-red-500'}>
            {isPositiveGrowth ? '+' : ''}{growthRate.toFixed(1)}%
          </span>
          <span className="text-muted-foreground ml-1">
            ({isPositiveGrowth ? '+' : ''}{formatPHP(growthAmount)})
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          vs previous period
        </p>
      </CardContent>
    </Card>
  );
}
