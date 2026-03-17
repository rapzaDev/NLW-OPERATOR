"use client";

import { Switch } from "@base-ui/react/switch";
import {
  type ComponentPropsWithoutRef,
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useState,
} from "react";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ToggleRootState = Parameters<
  Exclude<
    ComponentPropsWithoutRef<typeof Switch.Root>["className"],
    string | undefined
  >
>[0];

type ToggleThumbState = Parameters<
  Exclude<
    ComponentPropsWithoutRef<typeof Switch.Thumb>["className"],
    string | undefined
  >
>[0];

function composeClassName<TState>(
  baseClassName: string,
  className: string | ((state: TState) => string | undefined) | undefined,
) {
  if (typeof className === "function") {
    return (state: TState) => joinClasses(baseClassName, className(state));
  }

  return joinClasses(baseClassName, className);
}

type ToggleContextValue = {
  checked: boolean;
};

const ToggleContext = createContext<ToggleContextValue | null>(null);

function useToggleContext() {
  const context = useContext(ToggleContext);

  if (!context) {
    throw new Error("Toggle subcomponents must be used within ToggleRoot.");
  }

  return context;
}

export interface ToggleRootProps
  extends Omit<ComponentPropsWithoutRef<typeof Switch.Root>, "children"> {
  children: ReactNode;
}

export function ToggleRoot({
  checked,
  children,
  className,
  defaultChecked,
  disabled,
  onCheckedChange,
  ...props
}: ToggleRootProps) {
  const [uncontrolledChecked, setUncontrolledChecked] = useState(
    defaultChecked ?? false,
  );
  const isControlled = checked !== undefined;
  const currentChecked = isControlled ? checked : uncontrolledChecked;

  return (
    <ToggleContext.Provider value={{ checked: currentChecked }}>
      <Switch.Root
        checked={currentChecked}
        className={composeClassName<ToggleRootState>(
          joinClasses(
            "inline-flex items-center gap-3 font-display text-[12px] leading-none transition-colors duration-150",
            disabled && "cursor-not-allowed opacity-60",
          ),
          className,
        )}
        disabled={disabled}
        onCheckedChange={(nextChecked, eventDetails) => {
          if (!isControlled) {
            setUncontrolledChecked(nextChecked);
          }

          onCheckedChange?.(nextChecked, eventDetails);
        }}
        {...props}
      >
        {children}
      </Switch.Root>
    </ToggleContext.Provider>
  );
}

export interface ToggleTrackProps extends HTMLAttributes<HTMLSpanElement> {}

export function ToggleTrack({
  children,
  className,
  ...props
}: ToggleTrackProps) {
  const { checked } = useToggleContext();

  return (
    <span
      aria-hidden="true"
      className={joinClasses(
        "inline-flex h-[22px] w-10 items-center rounded-full px-[3px] transition-all duration-150",
        checked ? "justify-end bg-accent-green" : "justify-start bg-stroke",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface ToggleThumbProps
  extends ComponentPropsWithoutRef<typeof Switch.Thumb> {}

export function ToggleThumb({ className, ...props }: ToggleThumbProps) {
  const { checked } = useToggleContext();

  return (
    <Switch.Thumb
      className={composeClassName<ToggleThumbState>(
        joinClasses(
          "block size-4 rounded-full transition-colors duration-150",
          checked ? "bg-background" : "bg-muted",
        ),
        className,
      )}
      {...props}
    />
  );
}

export interface ToggleLabelProps extends HTMLAttributes<HTMLSpanElement> {}

export function ToggleLabel({
  children,
  className,
  ...props
}: ToggleLabelProps) {
  const { checked } = useToggleContext();

  return (
    <span
      className={joinClasses(
        "transition-colors duration-150",
        checked ? "text-accent-green" : "text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export type ToggleProps = ToggleRootProps;
