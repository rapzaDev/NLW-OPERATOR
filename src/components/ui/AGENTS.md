# UI Component Patterns

Este arquivo define os padrões para criação de componentes em `src/components/ui`.

## Regras obrigatórias

- Use sempre `named exports`. Nunca use `default export`.
- Tipos de props devem estender as props nativas do elemento HTML correspondente.
- Para componentes com variantes, use `tailwind-variants` (`tv` + `VariantProps`).
- Não use `twMerge` quando o componente já usa `tailwind-variants`.
- Passe `className` direto para a função de variantes, por exemplo:
  `buttonVariants({ variant, size, className })`.
- Prefira composição para pedaços internos do componente.
  Exemplo: use `ComponentRoot`, `ComponentTitle`, `ComponentDescription`
  em vez de props como `title`, `description`, `label`, `comment`, `prefix`
  ou flags como `showDot`.
- Mantenha props para comportamento e estilo de alto nível.
  Exemplos válidos: `tone`, `kind`, `checked`, `defaultChecked`, `disabled`,
  `value`, `defaultValue`, `onValueChange`.

## Estrutura recomendada

1. Definir `const componentVariants = tv({ ... })`.
2. Definir `export interface ComponentProps extends NativeProps, VariantProps<typeof componentVariants> {}`.
3. Implementar o componente usando a função de variantes para montar a classe.
4. Exportar componente, variantes e tipos via `index.ts`.
5. Quando houver compound components, exportar `ComponentRoot`,
   `ComponentTitle`, `ComponentDescription`, etc., como named exports.

## Exemplo de assinatura

```tsx
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={buttonVariants({ className, variant, size })}
      {...props}
    />
  );
}
```
