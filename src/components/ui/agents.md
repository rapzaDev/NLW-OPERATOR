# UI Component Patterns

Este arquivo define os padrões para criação de componentes em `src/components/ui`.

## Regras obrigatórias

- Use sempre `named exports`. Nunca use `default export`.
- Tipos de props devem estender as props nativas do elemento HTML correspondente.
- Para componentes com variantes, use `tailwind-variants` (`tv` + `VariantProps`).
- Não use `twMerge` quando o componente já usa `tailwind-variants`.
- Passe `className` direto para a função de variantes, por exemplo:
  `buttonVariants({ variant, size, className })`.

## Estrutura recomendada

1. Definir `const componentVariants = tv({ ... })`.
2. Definir `export interface ComponentProps extends NativeProps, VariantProps<typeof componentVariants> {}`.
3. Implementar o componente usando a função de variantes para montar a classe.
4. Exportar componente, variantes e tipos via `index.ts`.

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
