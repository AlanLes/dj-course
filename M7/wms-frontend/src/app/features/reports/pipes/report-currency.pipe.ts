import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'reportCurrency', standalone: true })
export class ReportCurrencyPipe implements PipeTransform {
  transform(value: number | undefined): string {
    if (!value) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  }
}
