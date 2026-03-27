import { PASSWORD_RULES } from '@/lib/passwordValidation';
import { Check, X } from 'lucide-react';

interface PasswordHintsProps {
  password: string;
}

export function PasswordHints({ password }: PasswordHintsProps) {
  if (!password) return null;

  return (
    <ul className="mt-1.5 space-y-0.5 text-xs">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-muted-foreground'}`}>
            {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
