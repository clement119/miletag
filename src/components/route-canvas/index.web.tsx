/**
 * Web needs CanvasKit (Skia's WASM build) loaded before any Skia component renders.
 * The wasm file is copied to /public by `npm run postinstall`.
 */

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { ActivityIndicator } from 'react-native';

import { Colors } from '@/constants/theme';

import type { RouteCanvasProps } from './route-canvas-impl';

export type { RouteCanvasProps } from './route-canvas-impl';

export function RouteCanvas(props: RouteCanvasProps) {
  return (
    <WithSkiaWeb
      opts={{ locateFile: () => '/canvaskit.wasm' }}
      getComponent={() => import('./route-canvas-impl')}
      fallback={<ActivityIndicator color={Colors.accent} />}
      componentProps={props}
    />
  );
}
