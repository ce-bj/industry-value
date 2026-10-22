import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentPropsWithoutRef } from 'react';

export const Tabs = TabsPrimitive.Root;
export function TabsList({ className = '', ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={`ui-tabs-list ${className}`} {...props} />;
}
export function TabsTrigger({ className = '', ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger className={`ui-tabs-trigger ${className}`} {...props} />;
}
export function TabsContent({ className = '', ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={`ui-tabs-content ${className}`} {...props} />;
}
