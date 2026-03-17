import type { Metadata } from "next";
import Link from "next/link";
import {
  Button,
  buttonSizeOptions,
  buttonVariantOptions,
  CodeBlock,
  CodeBlockHeader,
  CodeEditorBody,
  CodeEditorComment,
  CodeEditorHeader,
  CodeEditorInput,
  CodeEditorLanguageSelect,
  CodeEditorLineNumbers,
  CodeEditorRoot,
  DiffLineCode,
  DiffLinePrefix,
  DiffLineRoot,
  diffLineKindOptions,
  StatusBadgeDot,
  StatusBadgeRoot,
  StatusBadgeText,
  statusBadgeToneOptions,
  ToggleLabel,
  ToggleRoot,
  ToggleThumb,
  ToggleTrack,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Componentes | NLW22",
  description: "Página de showcase dos componentes UI e suas variantes.",
};

const componentCatalog = [
  {
    name: "Button",
    notes: "Ações principais, secundárias e de navegação textual.",
    variants: buttonVariantOptions.length,
  },
  {
    name: "Toggle",
    notes:
      "Controle binário com compound API via Base UI (`ToggleRoot`, `ToggleTrack`, `ToggleThumb`, `ToggleLabel`).",
    variants: 4,
  },
  {
    name: "StatusBadge",
    notes:
      "Indicador semântico curto com composição opcional de `StatusBadgeDot` e `StatusBadgeText`.",
    variants: statusBadgeToneOptions.length,
  },
  {
    name: "CodeBlock",
    notes:
      "Bloco de código SSR com Shiki e header opcional composto fora dele.",
    variants: 1,
  },
  {
    name: "CodeEditor",
    notes:
      "Editor client-side com slots de `CodeEditorHeader`, `CodeEditorComment`, `CodeEditorBody`, `CodeEditorLineNumbers` e `CodeEditorInput`.",
    variants: 1,
  },
  {
    name: "DiffLine",
    notes:
      "Linha de diff com subcomponentes para `DiffLinePrefix` e `DiffLineCode`.",
    variants: diffLineKindOptions.length,
  },
] as const;

const buttonLabelByVariant = {
  link: "$ view_all >>",
  primary: "$ roast_my_code",
  secondary: "$ share_roast",
} as const;

const codeSample = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}`;

export default async function ComponentsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="border border-stroke bg-panel-strong p-8 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <SectionEyebrow>src/app/components</SectionEyebrow>
              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                component_library
              </h1>
              <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-muted sm:text-base">
                Showcase alinhada com a página selecionada no Pencil, focada nos
                componentes pequenos e repetitivos da interface.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Componentes"
                value={String(componentCatalog.length).padStart(2, "0")}
              />
              <MetricCard
                label="Botões"
                value={String(buttonVariantOptions.length).padStart(2, "0")}
              />
              <MetricCard
                label="Estados"
                value={String(statusBadgeToneOptions.length + 4).padStart(
                  2,
                  "0",
                )}
              />
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {componentCatalog.map((component) => (
            <article
              className="border border-stroke bg-panel p-5"
              key={component.name}
            >
              <p className="font-display text-[11px] uppercase tracking-[0.24em] text-accent-green">
                UI Component
              </p>
              <h2 className="mt-3 font-display text-lg text-foreground">
                {component.name}
              </h2>
              <p className="mt-3 font-body text-sm leading-6 text-muted">
                {component.notes}
              </p>
              <p className="mt-6 font-display text-[11px] uppercase tracking-[0.2em] text-subtle">
                {component.variants} variante(s)
              </p>
            </article>
          ))}
        </section>

        <ShowcaseSection
          description="Ações principais e secundárias em escala mono, com a variante textual usada para navegação curta."
          title="buttons"
        >
          <div className="grid gap-px bg-stroke lg:grid-cols-[140px_repeat(3,minmax(0,1fr))]">
            <div className="bg-surface px-4 py-3 font-display text-[11px] uppercase tracking-[0.2em] text-subtle">
              size
            </div>
            {buttonVariantOptions.map((variant) => (
              <div
                className="bg-surface px-4 py-3 font-display text-[11px] uppercase tracking-[0.2em] text-subtle"
                key={variant}
              >
                {variant}
              </div>
            ))}

            {buttonSizeOptions.map((size) => (
              <div className="contents" key={size}>
                <div className="bg-panel px-4 py-5 font-display text-[11px] uppercase tracking-[0.2em] text-muted">
                  {size}
                </div>
                {buttonVariantOptions.map((variant) => (
                  <div
                    className="bg-panel px-4 py-5"
                    key={`${size}-${variant}`}
                  >
                    <Button size={size} variant={variant}>
                      {buttonLabelByVariant[variant]}
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ShowcaseSection>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <ShowcaseSection
            description="Estados ligados, desligados e bloqueados usando o primitive `Switch` do Base UI."
            title="toggle"
          >
            <div className="grid gap-4 border border-stroke bg-panel p-6">
              <div className="flex flex-wrap gap-8">
                <ToggleRoot defaultChecked>
                  <ToggleTrack>
                    <ToggleThumb />
                  </ToggleTrack>
                  <ToggleLabel>roast mode</ToggleLabel>
                </ToggleRoot>
                <ToggleRoot>
                  <ToggleTrack>
                    <ToggleThumb />
                  </ToggleTrack>
                  <ToggleLabel>roast mode</ToggleLabel>
                </ToggleRoot>
              </div>
              <div className="flex flex-wrap gap-8">
                <ToggleRoot defaultChecked disabled>
                  <ToggleTrack>
                    <ToggleThumb />
                  </ToggleTrack>
                  <ToggleLabel>roast mode</ToggleLabel>
                </ToggleRoot>
                <ToggleRoot disabled>
                  <ToggleTrack>
                    <ToggleThumb />
                  </ToggleTrack>
                  <ToggleLabel>roast mode</ToggleLabel>
                </ToggleRoot>
              </div>
            </div>
          </ShowcaseSection>

          <ShowcaseSection
            description="Badges curtas para severidade, status e pequenos metadados."
            title="badge_status"
          >
            <div className="flex flex-wrap gap-6 border border-stroke bg-panel p-6">
              <StatusBadgeRoot tone="critical">
                <StatusBadgeDot />
                <StatusBadgeText>critical</StatusBadgeText>
              </StatusBadgeRoot>
              <StatusBadgeRoot tone="warning">
                <StatusBadgeDot />
                <StatusBadgeText>warning</StatusBadgeText>
              </StatusBadgeRoot>
              <StatusBadgeRoot tone="success">
                <StatusBadgeDot />
                <StatusBadgeText>good</StatusBadgeText>
              </StatusBadgeRoot>
              <StatusBadgeRoot tone="critical">
                <StatusBadgeText>needs_serious_help</StatusBadgeText>
              </StatusBadgeRoot>
              <StatusBadgeRoot tone="muted">
                <StatusBadgeText>javascript</StatusBadgeText>
              </StatusBadgeRoot>
            </div>
          </ShowcaseSection>
        </div>

        <ShowcaseSection
          description="Bloco renderizado apenas no servidor com Shiki, tema `vesper` e moldura semelhante ao editor do Pencil."
          title="code_block"
        >
          <div className="border border-stroke bg-panel p-6">
            <figure className="max-w-3xl overflow-hidden border border-stroke bg-surface">
              <CodeBlockHeader filename="calculate.js" />
              <CodeBlock code={codeSample} lang="javascript" />
            </figure>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          description="Área editável para testar snippets diretamente na interface, com comentário contextual e line numbers sincronizados."
          title="code_editor"
        >
          <div className="border border-stroke bg-panel p-6">
            <CodeEditorRoot className="max-w-3xl" defaultValue={codeSample}>
              <CodeEditorHeader>
                <CodeEditorLanguageSelect />
              </CodeEditorHeader>
              <CodeEditorComment>
                {
                  "// edit this example, replace it, or paste your own code here"
                }
              </CodeEditorComment>
              <CodeEditorBody>
                <CodeEditorLineNumbers />
                <CodeEditorInput placeholder="// start typing your code here" />
              </CodeEditorBody>
            </CodeEditorRoot>
          </div>
        </ShowcaseSection>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <ShowcaseSection
            description="Linhas de diff para revisão de código com semântica visual de adição, remoção e contexto."
            title="diff_line"
          >
            <div className="grid gap-2 border border-stroke bg-panel p-6">
              <DiffLineRoot kind="removed">
                <DiffLinePrefix kind="removed" />
                <DiffLineCode>var total = 0;</DiffLineCode>
              </DiffLineRoot>
              <DiffLineRoot kind="added">
                <DiffLinePrefix kind="added" />
                <DiffLineCode>const total = 0;</DiffLineCode>
              </DiffLineRoot>
              <DiffLineRoot kind="context">
                <DiffLinePrefix kind="context" />
                <DiffLineCode>
                  {"for (let i = 0; i < items.length; i++) {"}
                </DiffLineCode>
              </DiffLineRoot>
            </div>
          </ShowcaseSection>

          <ShowcaseSection
            description="Recorte aplicado nesta rodada. Componentes de composição maior ficam para uma etapa posterior."
            title="escopo"
          >
            <div className="border border-stroke bg-panel p-6">
              <ul className="grid gap-3 font-body text-sm leading-6 text-muted">
                <li>`Navbar` ficou fora por ser estrutura de layout.</li>
                <li>`ScoreRing` ficou fora por ser visual mais específico.</li>
                <li>
                  `AnalysisCard` e `LeaderboardRow` ficaram fora por serem
                  composições maiores.
                </li>
              </ul>
            </div>
          </ShowcaseSection>
        </div>

        <footer className="flex flex-col gap-4 border border-stroke bg-panel px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-sm text-muted">
            Todos os componentes acima vivem em `src/components/ui`.
          </p>
          <Link
            className="font-display text-[12px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent-green"
            href="/"
          >
            Voltar para a home
          </Link>
        </footer>
      </div>
    </main>
  );
}

function ShowcaseSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="grid gap-4">
      <div>
        <SectionEyebrow>{title}</SectionEyebrow>
        <p className="mt-3 max-w-3xl font-body text-sm leading-6 text-muted">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[12px] uppercase tracking-[0.3em] text-accent-green">
      {"// "}
      {children}
    </p>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-stroke bg-surface px-4 py-4">
      <p className="font-display text-[11px] uppercase tracking-[0.24em] text-subtle">
        {label}
      </p>
      <p className="mt-3 font-display text-2xl text-foreground">{value}</p>
    </div>
  );
}
