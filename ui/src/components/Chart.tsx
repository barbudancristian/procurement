import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useApp } from '../state/AppContext';
import { chartPalette } from '../theme/branding';

export interface ChartColors {
  text: string;
  muted: string;
  grid: string;
  axis: string;
  surface: string;
  series: string[];
  brand: string;
}

/** Thin wrapper around ECharts that re-renders with the current light/dark theme. */
export function EChart({
  build,
  height = 260,
  ariaLabel,
}: {
  build: (c: ChartColors) => echarts.EChartsOption;
  height?: number;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme, dark } = useApp();
  useEffect(() => {
    if (!ref.current) return;
    const colors: ChartColors = {
      text: theme.colorNeutralForeground1,
      muted: theme.colorNeutralForeground3,
      grid: theme.colorNeutralStroke3,
      axis: theme.colorNeutralStroke1,
      surface: theme.colorNeutralBackground1,
      series: dark ? chartPalette.dark : chartPalette.light,
      brand: theme.colorBrandBackground,
    };
    const chart = echarts.init(ref.current, undefined, { renderer: 'svg' });
    const opt = build(colors);
    chart.setOption({
      textStyle: { fontFamily: 'Segoe UI, sans-serif', color: colors.text },
      animationDuration: 400,
      ...opt,
      tooltip: {
        backgroundColor: colors.surface,
        borderColor: colors.axis,
        textStyle: { color: colors.text, fontSize: 12 },
        ...((opt.tooltip as object) ?? {}),
      },
    });
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
    };
  }, [build, theme, dark]);
  return <div ref={ref} role="img" aria-label={ariaLabel} style={{ height, width: '100%' }} />;
}

export const axisStyle = (c: ChartColors) => ({
  axisLine: { lineStyle: { color: c.axis } },
  axisTick: { show: false },
  axisLabel: { color: c.muted, fontSize: 11 },
  splitLine: { lineStyle: { color: c.grid } },
});
