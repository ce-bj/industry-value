import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentPropsWithoutRef, HTMLAttributes } from 'react';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({ className = '', children, ...props }: ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="ui-dialog-overlay" />
    <DialogPrimitive.Content className={`ui-dialog-content ${className}`} {...props}>
      {children}
      <DialogPrimitive.Close className="ui-dialog-close" aria-label="关闭"><X size={18} /></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>;
}
export function DialogHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={`ui-dialog-header ${className}`} {...props} />; }
export function DialogTitle(props: ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) { return <DialogPrimitive.Title {...props} />; }
export function DialogDescription(props: ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) { return <DialogPrimitive.Description {...props} />; }
