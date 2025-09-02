// components/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

type Props = Omit<ThemeProviderProps, 'attribute'> & {
  /** Keep Tailwind in sync via the `class` attribute. */
  attribute?: 'class';
};

export function ThemeProvider({
  children,
  // sensible defaults you can still override when you use the component
  defaultTheme = 'system',
  enableSystem = true,
  themes = ['light', 'dark'],
  attribute = 'class',
  disableTransitionOnChange = true,
  ...rest
}: Props) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      themes={themes}
      disableTransitionOnChange={disableTransitionOnChange}
      {...rest}
    >
      {children}
    </NextThemesProvider>
  );
}
