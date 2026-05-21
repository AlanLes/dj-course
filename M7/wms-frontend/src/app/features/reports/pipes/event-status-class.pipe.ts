import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'eventStatusClass', standalone: true })
export class EventStatusClassPipe implements PipeTransform {
  transform(status: string): string {
    const classes: Record<string, string> = {
      success: 'bg-success-100 text-success-800',
      failed: 'bg-error-100 text-error-800',
      warning: 'bg-warning-100 text-warning-800',
    };
    return classes[status] ?? 'bg-gray-100 text-gray-800';
  }
}
