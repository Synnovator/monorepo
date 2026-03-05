declare module '*.svg?react' {
  import type { FC, ComponentProps } from 'react';
  const Component: FC<ComponentProps<'svg'>>;
  export default Component;
}
