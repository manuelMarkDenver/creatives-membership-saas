'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users } from 'lucide-react';
import { formatPHP } from '@/lib/utils/currency';

interface TopPerformingPlan {
  planId: string;
  planName: string;
  revenue: number;
  memberCount: number;
  renewalRate: number;
  averageValue: number;
}

interface TopPerformingPlansCardProps {
  plans: TopPerformingPlan[];
  isLoading?: boolean;
}

export function TopPerformingPlansCard({ plans, isLoading }: TopPerformingPlansCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
            Top Performing Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
            Top Performing Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No plan data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center">
          <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
          Top Performing Plans
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plans.map((plan, index) => (
            <div key={plan.planId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center space-x-3 flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                  index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                  index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{plan.planName}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Users className="mr-1 h-3 w-3" />
                    <span>{plan.memberCount} members</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {formatPHP(plan.revenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPHP(plan.averageValue)}/member
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
