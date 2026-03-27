const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Uma letra maiúscula' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Uma letra minúscula' },
  { test: (p: string) => /\d/.test(p), label: 'Um número' },
  { test: (p: string) => /[^a-zA-Z\d\s]/.test(p), label: 'Um caractere especial' },
];

export function getPasswordErrors(password: string) {
  return PASSWORD_RULES.filter((r) => !r.test(password));
}

export function isPasswordValid(password: string) {
  return PASSWORD_RULES.every((r) => r.test(password));
}

export { PASSWORD_RULES };
