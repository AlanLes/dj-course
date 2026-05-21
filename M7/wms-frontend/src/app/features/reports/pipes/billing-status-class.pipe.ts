import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'billingStatusClass', standalone: true })
export class BillingStatusClassPipe implements PipeTransform {
  transform(status: string): string {
    const classes: Record<string, string> = {
      paid: 'bg-success-100 text-success-800',
      pending: 'bg-warning-100 text-warning-800',
      overdue: 'bg-error-100 text-error-800',
    };
    return classes[status] ?? 'bg-gray-100 text-gray-800';
  }
}
