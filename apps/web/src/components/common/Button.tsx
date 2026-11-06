import React from 'react';

/*
 * The one clickable primitive. Every button, and every link styled as a control, goes through it:
 * pick a `variant` for color, a `size` for shape, pass `className` to add layout (margins, width,
 * gaps) and `as` to render another element, e.g. `as="a" href="#race-control"`.
 *
 * There is no class merging, so `className` adds and never overrides: a class that fights one set
 * here (another display, color or padding) wins or loses by stylesheet order. When a call site
 * needs a different look, add a variant or size here instead.
 */

export type ButtonVariant =
  | 'primary' // ink fill, paper text
  | 'secondary' // hairline border, ink text
  | 'danger' // hairline border, danger text
  | 'ghost' // mute text, ink on hover: close, restart, theme toggle
  | 'link' // mute text, ink and underline on hover: in-page links
  | 'toggle' // a segment of a text switch; `pressed` makes it ink
  | 'plain'; // no color of its own, for triggers that are content (a driver name)

export type ButtonSize =
  | 'sm' // 32px
  | 'md' // 36px
  | 'lg' // 40px
  | 'icon' // 36px square
  | 'icon-sm' // 32px square, pulled into the line with -m-2 so it adds no height
  | 'inline'; // no box: text-sized, for links, toggles and content triggers

interface ButtonOwnProps<E extends React.ElementType> {
  /** Element to render; defaults to `button` (which also defaults to `type="button"`) */
  as?: E;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon, hidden from assistive tech */
  icon?: React.ReactNode;
  /** For `toggle`: whether this segment is the selected one; sets `aria-pressed` on buttons */
  pressed?: boolean;
  className?: string;
}

export type ButtonProps<E extends React.ElementType = 'button'> = ButtonOwnProps<E> &
  Omit<React.ComponentPropsWithoutRef<E>, keyof ButtonOwnProps<E>>;

const SIZE: Record<ButtonSize, string> = {
  sm: 'inline-flex h-8 items-center gap-1.5 rounded px-3 text-data',
  md: 'inline-flex h-9 items-center gap-2 rounded px-3.5 text-data',
  lg: 'inline-flex h-10 items-center gap-2 rounded px-4 text-ui',
  icon: 'inline-flex h-9 w-9 items-center justify-center rounded',
  'icon-sm': '-m-2 inline-flex h-8 w-8 items-center justify-center rounded',
  inline: 'rounded-sm',
};

const variantClass = (variant: ButtonVariant, pressed: boolean): string =>
  ({
    primary: 'bg-ink font-semibold text-paper hover:bg-ink/85',
    secondary: 'border border-rule font-semibold text-ink hover:border-mute',
    danger: 'border border-rule font-semibold text-danger hover:border-danger',
    ghost: 'font-semibold text-mute hover:text-ink',
    link: 'text-mute underline-offset-2 hover:text-ink hover:underline',
    // Both states stay 600 so a switch never changes width when it flips
    toggle: `font-semibold ${pressed ? 'text-ink' : 'text-mute hover:text-ink'}`,
    plain: '',
  })[variant];

/** The classes Button renders, for the rare element that cannot be a Button itself */
export function buttonClasses({
  variant = 'secondary',
  size = 'md',
  pressed = false,
  className = '',
}: Pick<ButtonOwnProps<'button'>, 'variant' | 'size' | 'pressed' | 'className'> = {}): string {
  return [
    'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
    SIZE[size],
    variantClass(variant, pressed),
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

function ButtonImpl<E extends React.ElementType = 'button'>(
  {
    as,
    variant = 'secondary',
    size = 'md',
    icon,
    pressed,
    className = '',
    children,
    ...props
  }: ButtonProps<E> & { children?: React.ReactNode },
  ref: React.ForwardedRef<Element>
) {
  const Component: React.ElementType = as ?? 'button';
  const isButton = Component === 'button';
  const extra: Record<string, unknown> = {};
  if (isButton && !(props as { type?: string }).type) extra.type = 'button';
  if (isButton && variant === 'toggle' && pressed !== undefined) extra['aria-pressed'] = pressed;

  return (
    <Component
      ref={ref}
      className={buttonClasses({ variant, size, pressed: !!pressed, className })}
      {...extra}
      {...props}
    >
      {icon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </Component>
  );
}

export const Button = React.forwardRef(ButtonImpl) as <E extends React.ElementType = 'button'>(
  props: ButtonProps<E> & { children?: React.ReactNode; ref?: React.Ref<Element> }
) => React.ReactElement | null;
