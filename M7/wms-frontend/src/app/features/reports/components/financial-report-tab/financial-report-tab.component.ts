import { Component, computed, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FinancialReport } from '../../reports.model';
import { DropdownComponent } from '../../../../ui-library/Dropdown.component';
import { Heading3Component, Heading4Component } from '../../../../ui-library/Typography/Typography.component';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
import { BillingStatusClassPipe } from '../../pipes/billing-status-class.pipe';
import { ReportCurrencyPipe } from '../../pipes/report-currency.pipe';
import { ActivityProgressCardComponent, ActivityProgressGoal, ActivityProgressMetric } from '../../../../ui-library/ActivityProgressCard.component';

@Component({
  selector: 'app-financial-report-tab',
  standalone: true,
  imports: [
    TitleCasePipe,
    DropdownComponent,
    Heading3Component,
    Heading4Component,
    KpiCardComponent,
    BillingStatusClassPipe,
    ReportCurrencyPipe,
    ActivityProgressCardComponent,
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <ui-heading3>Financial Reports</ui-heading3>
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
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          label="Total Revenue"
          prefix="$"
          [value]="report()?.totalRevenue | reportCurrency"
          [subtitle]="'+' + report()?.revenueGrowth + '% vs last period'"
          colorVariant="success"
          subtitleColorVariant="success"
        />
        <app-kpi-card
          icon="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          label="Operating Costs"
          prefix="$"
          [value]="report()?.operatingCosts | reportCurrency"
          [subtitle]="'+' + report()?.costIncrease + '% vs last period'"
          colorVariant="primary"
          subtitleColorVariant="error"
        />
        <app-kpi-card
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          label="Net Profit"
          prefix="$"
          [value]="report()?.netProfit | reportCurrency"
          [subtitle]="report()?.profitMargin + '% margin'"
          colorVariant="warning"
          subtitleColorVariant="success"
        />
        <app-kpi-card
          icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          label="Outstanding Invoices"
          prefix="$"
          [value]="report()?.outstandingInvoices | reportCurrency"
          [subtitle]="report()?.overdueCount + ' overdue'"
          colorVariant="secondary"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="flex justify-center lg:justify-start">
          <ui-activity-progress-card
            title="Financial Goals"
            [subtitle]="periodLabel()"
            goalsTitle="Period Milestones"
            detailsLabel="View Full Analysis"
            detailsHref="#"
            [metrics]="financialMetrics()"
            [goals]="financialGoals()"
          ></ui-activity-progress-card>
        </div>

        <div class="card p-6">
          <ui-heading4>Monthly Billing Summary</ui-heading4>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-dark-600">
                  <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">Contractor</th>
                  <th class="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">Amount</th>
                  <th class="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-dark-600">
                @for (billing of report()?.billingDetails; track billing.contractorName) {
                  <tr class="py-2">
                    <td class="text-sm text-gray-900 dark:text-white py-2">{{ billing.contractorName }}</td>
                    <td class="text-sm text-gray-900 dark:text-white text-right py-2">\${{ billing.amount | reportCurrency }}</td>
                    <td class="text-right py-2">
                      <span
                        [class]="billing.status | billingStatusClass"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {{ billing.status | titlecase }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FinancialReportTabComponent {
  report = input<FinancialReport | null>(null);
  period = input<string>('month');
  periodChange = output<string>();
  exportRequested = output<void>();

  readonly periodOptions = [
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  readonly periodLabel = computed(
    () => this.periodOptions.find((o) => o.value === this.period())?.label ?? 'Report',
  );

  readonly financialMetrics = computed<ActivityProgressMetric[]>(() => {
    const r = this.report();
    if (!r) return [];
    return [
      {
        label: 'Revenue',
        value: this.formatCompact(r.totalRevenue),
        unit: 'USD',
        // % of a 15% growth target achieved
        percentage: Math.min(100, Math.round((r.revenueGrowth / 15) * 100)),
        color: '#22c55e',
      },
      {
        label: 'Op. Costs',
        value: this.formatCompact(r.operatingCosts),
        unit: 'USD',
        // efficiency score: cost increase above 5% penalised
        percentage: Math.max(0, Math.min(100, Math.round(100 - (r.costIncrease - 5) * 8))),
        color: '#3b82f6',
      },
      {
        label: 'Net Profit',
        value: this.formatCompact(r.netProfit),
        unit: 'USD',
        // % of 35% margin target
        percentage: Math.min(100, Math.round((r.profitMargin / 35) * 100)),
        color: '#f59e0b',
      },
    ];
  });

  readonly financialGoals = computed<ActivityProgressGoal[]>(() => {
    const r = this.report();
    if (!r) return [];
    return [
      {
        id: 'revenue-target',
        text: 'Achieve revenue growth target (15%)',
        completed: r.revenueGrowth >= 15,
      },
      {
        id: 'cost-budget',
        text: 'Keep cost increase below 10%',
        completed: r.costIncrease < 10,
      },
      {
        id: 'profit-margin',
        text: 'Maintain 30%+ profit margin',
        completed: r.profitMargin >= 30,
      },
      {
        id: 'overdue',
        text: `Collect overdue invoices (${r.overdueCount} remaining)`,
        completed: r.overdueCount === 0,
      },
    ];
  });

  private formatCompact(value: number): string {
    if (value >= 1_000_000) {
      const m = value / 1_000_000;
      return (Number.isInteger(m) ? m : m.toFixed(1)) + 'M';
    }
    if (value >= 1_000) {
      return Math.round(value / 1_000) + 'K';
    }
    return String(value);
  }
}
