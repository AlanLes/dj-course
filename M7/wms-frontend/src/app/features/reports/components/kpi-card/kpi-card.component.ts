import { Component, computed, input } from '@angular/core';

type ColorVariant = 'primary' | 'success' | 'warning' | 'error' | 'secondary';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <div class="card p-6">
      <div class="flex items-center">
        <div class="p-2 rounded-lg" [class]="iconBgClass()">
          <svg class="h-6 w-6" [class]="iconColorClass()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path [attr.d]="icon()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ label() }}</p>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ prefix() }}{{ value() }}</p>
          <p class="text-xs" [class]="subtitleColorClass()">{{ subtitle() }}</p>
        </div>
      </div>
    </div>
  `,
})
export class KpiCardComponent {
  icon = input.required<string>();
  label = input.required<string>();
  value = input.required<string | number>();
  prefix = input<string>('');
  subtitle = input<string>('');
  colorVariant = input<ColorVariant>('primary');
  subtitleColorVariant = input<ColorVariant | 'gray'>('gray');

  private readonly bgClasses: Record<ColorVariant, string> = {
    primary: 'bg-primary-100',
    success: 'bg-success-100',
    warning: 'bg-warning-100',
    error: 'bg-error-100',
    secondary: 'bg-secondary-100',
  };

  private readonly colorClasses: Record<ColorVariant, string> = {
    primary: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
    secondary: 'text-secondary-600',
  };

  private readonly subtitleClasses: Record<ColorVariant | 'gray', string> = {
    primary: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
    secondary: 'text-secondary-600',
    gray: 'text-gray-500',
  };

  iconBgClass = computed(() => this.bgClasses[this.colorVariant()]);
  iconColorClass = computed(() => this.colorClasses[this.colorVariant()]);
  subtitleColorClass = computed(() => this.subtitleClasses[this.subtitleColorVariant()]);
}
