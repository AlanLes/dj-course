import { Component, input, output } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { AuditTrail } from '../../reports.model';
import { DropdownComponent } from '../../../../ui-library/Dropdown.component';
import { Heading3Component } from '../../../../ui-library/Typography/Typography.component';
import { ActionTypeClassPipe } from '../../pipes/action-type-class.pipe';
import { EventStatusClassPipe } from '../../pipes/event-status-class.pipe';

@Component({
  selector: 'app-audit-trails-tab',
  standalone: true,
  imports: [
    DatePipe,
    TitleCasePipe,
    DropdownComponent,
    Heading3Component,
    ActionTypeClassPipe,
    EventStatusClassPipe,
  ],
  template: `
    <div class="p-6">
      <div class="flex flex-col space-y-4 mb-6">
        <div class="flex justify-between items-center">
          <ui-heading3>Audit Trails</ui-heading3>
          <button (click)="exportRequested.emit()" class="btn btn-secondary">
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>

        <div class="flex flex-wrap gap-3">
          <div class="w-full sm:w-64">
            <ui-dropdown
              label="Filter"
              [options]="filterOptions"
              [value]="filter()"
              (valueChange)="filterChange.emit($event)"
            />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
            <input
              type="date"
              [value]="dateFrom()"
              (change)="onDateFromChange($event)"
              class="input w-full"
            >
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
            <input
              type="date"
              [value]="dateTo()"
              (change)="onDateToChange($event)"
              class="input w-full"
            >
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="card p-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ trails()?.summary?.totalEvents || 0 }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
          </div>
        </div>
        <div class="card p-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600">{{ trails()?.summary?.userActions || 0 }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">User Actions</div>
          </div>
        </div>
        <div class="card p-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-warning-600">{{ trails()?.summary?.securityEvents || 0 }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Security Events</div>
          </div>
        </div>
        <div class="card p-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-success-600">{{ trails()?.summary?.systemEvents || 0 }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">System Events</div>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
            <thead class="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resource</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-700">
              @for (event of trails()?.events; track event.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-dark-700">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ event.timestamp | date:'MMM d, y h:mm:ss a' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ event.userName }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ event.userRole }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      [class]="event.actionType | actionTypeClass"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {{ event.actionType | titlecase }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ event.resourceType }}: {{ event.resourceId }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {{ event.details }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ event.ipAddress }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      [class]="event.status | eventStatusClass"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {{ event.status | titlecase }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="bg-white dark:bg-dark-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-dark-700">
          <div class="flex-1 flex justify-between sm:hidden">
            <button class="btn btn-secondary">Previous</button>
            <button class="btn btn-secondary">Next</button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Showing <span class="font-medium">1</span> to <span class="font-medium">10</span> of
              <span class="font-medium">{{ trails()?.totalCount || 0 }}</span> results
            </p>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button class="btn btn-secondary rounded-l-md">Previous</button>
              <button class="btn btn-secondary">1</button>
              <button class="btn btn-primary">2</button>
              <button class="btn btn-secondary">3</button>
              <button class="btn btn-secondary rounded-r-md">Next</button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuditTrailsTabComponent {
  trails = input<AuditTrail | null>(null);
  filter = input<string>('all');
  dateFrom = input<string>('');
  dateTo = input<string>('');
  filterChange = output<string>();
  dateFromChange = output<string>();
  dateToChange = output<string>();
  exportRequested = output<void>();

  readonly filterOptions = [
    { value: 'all', label: 'All Activities' },
    { value: 'user', label: 'User Actions' },
    { value: 'system', label: 'System Events' },
    { value: 'security', label: 'Security Events' },
    { value: 'data', label: 'Data Changes' },
  ];

  onDateFromChange(event: Event): void {
    this.dateFromChange.emit((event.target as HTMLInputElement).value);
  }

  onDateToChange(event: Event): void {
    this.dateToChange.emit((event.target as HTMLInputElement).value);
  }
}
