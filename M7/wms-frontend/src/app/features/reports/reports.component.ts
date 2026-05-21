import { Component, OnInit, inject, signal } from '@angular/core';
import { ReportsService } from './reports.service';
import { OperationalMetrics, UtilizationReport, FinancialReport, AuditTrail } from './reports.model';
import { Heading1Component, SubtitleComponent } from '../../ui-library/Typography/Typography.component';
import { OperationalMetricsTabComponent } from './components/operational-metrics-tab/operational-metrics-tab.component';
import { UtilizationReportTabComponent } from './components/utilization-report-tab/utilization-report-tab.component';
import { FinancialReportTabComponent } from './components/financial-report-tab/financial-report-tab.component';
import { AuditTrailsTabComponent } from './components/audit-trails-tab/audit-trails-tab.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    Heading1Component,
    SubtitleComponent,
    OperationalMetricsTabComponent,
    UtilizationReportTabComponent,
    FinancialReportTabComponent,
    AuditTrailsTabComponent,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <ui-heading1>Reports & Analytics</ui-heading1>
        <ui-subtitle>View warehouse performance reports and analytics</ui-subtitle>
      </div>

      <div class="card">
        <div class="border-b border-gray-200 dark:border-dark-700">
          <nav class="-mb-px flex space-x-8 px-6">
            @for (tab of reportTabs; track tab.id) {
              <button
                (click)="activeTab.set(tab.id)"
                [class]="getTabClass(tab.id)"
                class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
              >
                <svg class="h-5 w-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path [attr.d]="tab.icon" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
                </svg>
                {{ tab.name }}
              </button>
            }
          </nav>
        </div>

        @if (activeTab() === 'operational') {
          <app-operational-metrics-tab
            [metrics]="operationalMetrics()"
            [period]="operationalPeriod()"
            (periodChange)="onOperationalPeriodChange($event)"
            (exportRequested)="exportReport('operational')"
          />
        }
        @if (activeTab() === 'utilization') {
          <app-utilization-report-tab
            [report]="utilizationReport()"
            [period]="utilizationPeriod()"
            (periodChange)="onUtilizationPeriodChange($event)"
            (exportRequested)="exportReport('utilization')"
          />
        }
        @if (activeTab() === 'financial') {
          <app-financial-report-tab
            [report]="financialReport()"
            [period]="financialPeriod()"
            (periodChange)="onFinancialPeriodChange($event)"
            (exportRequested)="exportReport('financial')"
          />
        }
        @if (activeTab() === 'audit') {
          <app-audit-trails-tab
            [trails]="auditTrails()"
            [filter]="auditFilter()"
            [dateFrom]="auditDateFrom()"
            [dateTo]="auditDateTo()"
            (filterChange)="onAuditFilterChange($event)"
            (dateFromChange)="onAuditDateFromChange($event)"
            (dateToChange)="onAuditDateToChange($event)"
            (exportRequested)="exportReport('audit')"
          />
        }
      </div>
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  readonly activeTab = signal('operational');
  readonly operationalPeriod = signal('week');
  readonly utilizationPeriod = signal('month');
  readonly financialPeriod = signal('month');
  readonly auditFilter = signal('all');
  readonly auditDateFrom = signal('');
  readonly auditDateTo = signal('');

  readonly operationalMetrics = signal<OperationalMetrics | null>(null);
  readonly utilizationReport = signal<UtilizationReport | null>(null);
  readonly financialReport = signal<FinancialReport | null>(null);
  readonly auditTrails = signal<AuditTrail | null>(null);

  readonly reportTabs = [
    { id: 'operational', name: 'Operational Metrics', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'utilization', name: 'Utilization Reports', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { id: 'financial', name: 'Financial Reports', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'audit', name: 'Audit Trails', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  private readonly reportsService = inject(ReportsService);

  ngOnInit(): void {
    this.loadOperationalMetrics();
    this.loadUtilizationReports();
    this.loadFinancialReports();
    this.loadAuditTrails();
  }

  getTabClass(tabId: string): string {
    return tabId === this.activeTab()
      ? 'border-primary-500 text-primary-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
  }

  onOperationalPeriodChange(period: string): void {
    this.operationalPeriod.set(period);
    this.loadOperationalMetrics();
  }

  onUtilizationPeriodChange(period: string): void {
    this.utilizationPeriod.set(period);
    this.loadUtilizationReports();
  }

  onFinancialPeriodChange(period: string): void {
    this.financialPeriod.set(period);
    this.loadFinancialReports();
  }

  onAuditFilterChange(filter: string): void {
    this.auditFilter.set(filter);
    this.loadAuditTrails();
  }

  onAuditDateFromChange(dateFrom: string): void {
    this.auditDateFrom.set(dateFrom);
    this.loadAuditTrails();
  }

  onAuditDateToChange(dateTo: string): void {
    this.auditDateTo.set(dateTo);
    this.loadAuditTrails();
  }

  exportReport(type: string): void {
    const periodMap: Record<string, string> = {
      operational: this.operationalPeriod(),
      utilization: this.utilizationPeriod(),
      financial: this.financialPeriod(),
    };
    const period = periodMap[type] ?? 'month';

    this.reportsService.exportReport(type, period).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  private loadOperationalMetrics(): void {
    this.reportsService.getOperationalMetrics(this.operationalPeriod()).subscribe(metrics => {
      this.operationalMetrics.set(metrics);
    });
  }

  private loadUtilizationReports(): void {
    this.reportsService.getUtilizationReport(this.utilizationPeriod()).subscribe(report => {
      this.utilizationReport.set(report);
    });
  }

  private loadFinancialReports(): void {
    this.reportsService.getFinancialReport(this.financialPeriod()).subscribe(report => {
      this.financialReport.set(report);
    });
  }

  private loadAuditTrails(): void {
    this.reportsService.getAuditTrails(
      this.auditFilter(),
      this.auditDateFrom(),
      this.auditDateTo()
    ).subscribe(trails => {
      this.auditTrails.set(trails);
    });
  }
}
