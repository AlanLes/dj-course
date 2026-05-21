import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'utilizationBarClass', standalone: true })
export class UtilizationBarClassPipe implements PipeTransform {
  transform(utilization: number): string {
    if (utilization >= 90) return 'bg-error-500';
    if (utilization >= 75) return 'bg-warning-500';
    if (utilization >= 50) return 'bg-primary-500';
    return 'bg-success-500';
  }
}
