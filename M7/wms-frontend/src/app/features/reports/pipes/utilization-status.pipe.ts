import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'utilizationStatus', standalone: true })
export class UtilizationStatusPipe implements PipeTransform {
  transform(utilization: number): string {
    if (utilization >= 90) return 'Critical';
    if (utilization >= 75) return 'High';
    if (utilization >= 50) return 'Moderate';
    return 'Low';
  }
}
