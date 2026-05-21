import { Component, computed, input } from '@angular/core';

interface ThroughputDataPoint {
  date: string;
  value: number;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  date: string;
}

@Component({
  selector: 'app-throughput-chart',
  standalone: true,
  template: `
    <div class="h-64 bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
      @if (chartPoints().length) {
        <svg class="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="xMidYMid meet">
          <!-- Axes -->
          <line x1="40" y1="20" x2="40" y2="160" stroke="#e5e7eb" stroke-width="2"/>
          <line x1="40" y1="160" x2="480" y2="160" stroke="#e5e7eb" stroke-width="2"/>

          <!-- Horizontal grid lines -->
          @for (line of gridLines; track line) {
            <line
              [attr.x1]="40" [attr.y1]="20 + line * 35"
              [attr.x2]="480" [attr.y2]="20 + line * 35"
              stroke="#f3f4f6" stroke-width="1" stroke-dasharray="5,5"
            />
          }

          <!-- Y-axis labels -->
          @for (label of yAxisLabels(); track label.value) {
            <text [attr.x]="30" [attr.y]="label.y + 5"
                  class="text-xs fill-gray-600 dark:fill-gray-400" text-anchor="end">
              {{ label.value }}
            </text>
          }

          <!-- Line path -->
          <polyline [attr.points]="linePath()"
                    fill="none" stroke="#3B82F6" stroke-width="3" stroke-linejoin="round"/>

          <!-- Data points and value labels -->
          @for (point of chartPoints(); track point.x) {
            <circle [attr.cx]="point.x" [attr.cy]="point.y" r="5"
                    fill="#3B82F6" class="hover:fill-primary-700 cursor-pointer"/>
            <text [attr.x]="point.x" [attr.y]="point.y - 10"
                  class="text-xs fill-gray-900 dark:fill-white font-medium" text-anchor="middle">
              {{ point.value }}
            </text>
          }

          <!-- X-axis labels -->
          @for (point of chartPoints(); track point.x) {
            <text [attr.x]="point.x" [attr.y]="180"
                  class="text-xs fill-gray-600 dark:fill-gray-400" text-anchor="middle">
              {{ point.date }}
            </text>
          }
        </svg>
      } @else {
        <div class="flex items-center justify-center h-full">
          <p class="text-gray-500 dark:text-gray-400">No chart data available</p>
        </div>
      }
    </div>
  `,
})
export class ThroughputChartComponent {
  data = input<ThroughputDataPoint[]>([]);

  readonly gridLines = [0, 1, 2, 3, 4];

  chartPoints = computed<ChartPoint[]>(() => {
    const data = this.data();
    if (!data.length) return [];

    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const count = data.length;

    return data.map((item, index) => ({
      x: this.computeX(index, count),
      y: this.computeY(item.value, min, max),
      value: item.value,
      date: item.date,
    }));
  });

  linePath = computed(() =>
    this.chartPoints().map(p => `${p.x},${p.y}`).join(' ')
  );

  yAxisLabels = computed(() => {
    const data = this.data();
    if (!data.length) return [];
    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const step = (max - min) / 4;
    return [0, 1, 2, 3, 4].map(i => ({
      value: Math.round(max - i * step),
      y: 20 + i * 35,
    }));
  });

  private computeX(index: number, count: number): number {
    if (count <= 1) return 260;
    return 40 + index * (440 / (count - 1));
  }

  private computeY(value: number, min: number, max: number): number {
    const range = max - min;
    if (range === 0) return 90;
    return 160 - ((value - min) / range) * 140;
  }
}
