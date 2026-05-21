import { Component, input, output } from '@angular/core';
import { UtilizationReport } from '../../reports.model';
import { DropdownComponent } from '../../../../ui-library/Dropdown.component';
import { Heading3Component, Heading4Component } from '../../../../ui-library/Typography/Typography.component';
import { UtilizationBarComponent } from '../utilization-bar/utilization-bar.component';
import { UtilizationBarClassPipe } from '../../pipes/utilization-bar-class.pipe';
import { UtilizationStatusClassPipe } from '../../pipes/utilization-status-class.pipe';
import { UtilizationStatusPipe } from '../../pipes/utilization-status.pipe';

@Component({
  selector: 'app-utilization-report-tab',
  standalone: true,
  imports: [
    DropdownComponent,
    Heading3Component,
    Heading4Component,
    UtilizationBarComponent,
    UtilizationBarClassPipe,
    UtilizationStatusClassPipe,
    UtilizationStatusPipe,
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <ui-heading3>Utilization Reports</ui-heading3>
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

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card p-6">
          <ui-heading4>Space Utilization</ui-heading4>
          <div class="space-y-4">
            @for (zone of report()?.spaceUtilization; track zone.zoneName) {
              <app-utilization-bar
                [label]="zone.zoneName"
                [value]="zone.utilization"
              />
            }
          </div>
        </div>

        <div class="card p-6">
          <ui-heading4>Equipment Utilization</ui-heading4>
          <div class="space-y-4">
            @for (equipment of report()?.equipmentUtilization; track equipment.equipmentType) {
              <app-utilization-bar
                [label]="equipment.equipmentType"
                [value]="equipment.utilization"
                [detail]="equipment.activeHours + 'h active / ' + equipment.totalHours + 'h total'"
              />
            }
          </div>
        </div>

        <div class="card p-6">
          <ui-heading4>Personnel Utilization</ui-heading4>
          <div class="space-y-4">
            @for (personnel of report()?.personnelUtilization; track personnel.role) {
              <app-utilization-bar
                [label]="personnel.role"
                [value]="personnel.utilization"
                [detail]="personnel.activeEmployees + ' / ' + personnel.totalEmployees + ' employees'"
              />
            }
          </div>
        </div>
      </div>

      <div class="card p-6 mt-6">
        <ui-heading4>Detailed Utilization Breakdown</ui-heading4>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
            <thead class="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resource</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capacity</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Used</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Utilization</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
              @for (item of report()?.detailedBreakdown; track item.name) {
                <tr class="hover:bg-gray-50 dark:hover:bg-dark-700">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ item.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ item.type }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ item.capacity }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ item.used }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-16 bg-gray-200 dark:bg-dark-700 rounded-full h-2 mr-2">
                        <div
                          [class]="item.utilization | utilizationBarClass"
                          class="h-2 rounded-full"
                          [style.width.%]="item.utilization"
                        ></div>
                      </div>
                      <span class="text-sm text-gray-900 dark:text-white">{{ item.utilization }}%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      [class]="item.utilization | utilizationStatusClass"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {{ item.utilization | utilizationStatus }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class UtilizationReportTabComponent {
  report = input<UtilizationReport | null>(null);
  period = input<string>('month');
  periodChange = output<string>();
  exportRequested = output<void>();

  readonly periodOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
  ];
}
