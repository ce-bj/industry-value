import type { ButtonHTMLAttributes } from 'react';

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch({ checked, onCheckedChange, className = '', ...props }: SwitchProps) {
  return <button type="button" role="switch" aria-checked={checked} data-state={checked ? 'checked' : 'unchecked'} className={`ui-switch ${className}`} onClick={() => onCheckedChange?.(!checked)} {...props}>
    <span className="ui-switch-thumb" />
  </button>;
}
