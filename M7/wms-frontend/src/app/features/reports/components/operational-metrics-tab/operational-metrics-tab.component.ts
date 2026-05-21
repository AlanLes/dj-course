import { Component, input, output } from '@angular/core';
import { OperationalMetrics } from '../../reports.model';
import { DropdownComponent } from '../../../../ui-library/Dropdown.component';
import { Heading3Component, SectionHeadingComponent } from '../../../../ui-library/Typography/Typography.component';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
import { ThroughputChartComponent } from '../throughput-chart/throughput-chart.component';

@Component({
  selector: 'app-operational-metrics-tab',
  standalone: true,
  imports: [
    DropdownComponent,
    Heading3Component,
    SectionHeadingComponent,
    KpiCardComponent,
    ThroughputChartComponent,
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <ui-heading3>Operational Metrics & KPIs</ui-heading3>
        <div class="flex space-x-3">
          <ui-dropdown
            label="Period"
            [options]="periodOptions"
            [value]="period()"
            (valueChange)="periodChange.emit($event)"
          />
          <button (click)="exportRequested.emit()" class="btn btn-secondary">
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <app-kpi-card
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          label="Throughput"
          [value]="metrics()?.throughput || 0"
          subtitle="items/hour"
          colorVariant="primary"
        />
        <app-kpi-card
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          label="Order Accuracy"
          [value]="(metrics()?.orderAccuracy || 0) + '%'"
          subtitle="accuracy rate"
          colorVariant="success"
        />
        <app-kpi-card
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          label="Avg Processing Time"
          [value]="metrics()?.avgProcessingTime || 0"
          subtitle="minutes"
          colorVariant="warning"
        />
        <app-kpi-card
          icon="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          label="Error Rate"
          [value]="(metrics()?.errorRate || 0) + '%'"
          subtitle="error rate"
          colorVariant="error"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-6">
          <ui-section-heading>Daily Throughput Trend</ui-section-heading>
          <app-throughput-chart [data]="metrics()?.dailyThroughputTrend || []" />
        </div>

        <div class="card p-6">
          <ui-section-heading>Order Processing Performance</ui-section-heading>
          <div class="space-y-4">
            @for (metric of metrics()?.detailedMetrics; track metric.name) {
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ metric.name }}</span>
                <div class="flex items-center space-x-2">
                  <div class="w-24 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                    <div class="bg-primary-600 h-2 rounded-full" [style.width.%]="metric.value"></div>
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ metric.value }}%</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OperationalMetricsTabComponent {
  metrics = input<OperationalMetrics | null>(null);
  period = input<string>('week');
  periodChange = output<string>();
  exportRequested = output<void>();

  readonly periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
  ];
}
