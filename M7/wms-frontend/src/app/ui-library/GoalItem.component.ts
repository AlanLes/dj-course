import { Component, input } from '@angular/core';
import { LucideAngularModule, CircleCheck, CircleCheckBig } from 'lucide-angular';

@Component({
  selector: 'ui-goal-item',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="flex items-center gap-3 rounded-2xl bg-[#1C1C1E] px-4 py-3.5">
      @if (completed()) {
        <lucide-icon [img]="CircleCheckBigIcon" [size]="20" class="text-[#30D158]"></lucide-icon>
      } @else {
        <lucide-icon [img]="CircleCheckIcon" [size]="20" class="text-neutral-600"></lucide-icon>
      }
      <span
        class="text-sm"
        [class.text-white]="!completed()"
        [class.text-neutral-500]="completed()"
        [class.line-through]="completed()"
      >
        {{ text() }}
      </span>
    </div>
  `,
})
export class GoalItemComponent {
  text = input<string>('');
  completed = input<boolean>(false);

  protected readonly CircleCheckIcon = CircleCheck;
  protected readonly CircleCheckBigIcon = CircleCheckBig;
}
