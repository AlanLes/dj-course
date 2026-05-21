import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'utilizationStatusClass', standalone: true })
export class UtilizationStatusClassPipe implements PipeTransform {
  transform(utilization: number): string {
    if (utilization >= 90) return 'bg-error-100 text-error-800';
    if (utilization >= 75) return 'bg-warning-100 text-warning-800';
    if (utilization >= 50) return 'bg-primary-100 text-primary-800';
    return 'bg-success-100 text-success-800';
  }
}
