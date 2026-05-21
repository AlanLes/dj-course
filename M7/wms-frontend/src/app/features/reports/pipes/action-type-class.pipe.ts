import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'actionTypeClass', standalone: true })
export class ActionTypeClassPipe implements PipeTransform {
  transform(actionType: string): string {
    const classes: Record<string, string> = {
      create: 'bg-success-100 text-success-800',
      update: 'bg-primary-100 text-primary-800',
      delete: 'bg-error-100 text-error-800',
      login: 'bg-secondary-100 text-secondary-800',
      logout: 'bg-gray-100 text-gray-800',
    };
    return classes[actionType] ?? 'bg-gray-100 text-gray-800';
  }
}
