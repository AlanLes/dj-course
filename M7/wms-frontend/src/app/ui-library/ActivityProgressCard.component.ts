import { Component, input } from '@angular/core';
import {
  LucideAngularModule,
  Activity,
  Target,
  Plus,
  ExternalLink,
} from 'lucide-angular';
import { ProgressRingComponent } from './ProgressRing.component';
import { GoalItemComponent } from './GoalItem.component';

export interface ActivityProgressMetric {
  label: string;
  value: string | number;
  unit: string;
  percentage: number;
  color: string;
}

export interface ActivityProgressGoal {
  id: string;
  text: string;
  completed: boolean;
}

@Component({
  selector: 'ui-activity-progress-card',
  standalone: true,
  imports: [LucideAngularModule, ProgressRingComponent, GoalItemComponent],
  template: `
    <article class="w-full max-w-[360px] rounded-[28px] bg-black p-6 text-white">
      <header class="mb-6 flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]">
          <lucide-icon [img]="ActivityIcon" [size]="20" class="text-[#FF2D55]"></lucide-icon>
        </div>
        <div>
          <h2 class="text-base font-semibold leading-tight">{{ title() }}</h2>
          <p class="text-sm text-neutral-500">{{ subtitle() }}</p>
        </div>
      </header>

      <div class="mb-8 flex items-start justify-between gap-2">
        @for (metric of metrics(); track metric.label) {
          <ui-progress-ring
            [label]="metric.label"
            [value]="metric.value"
            [unit]="metric.unit"
            [percentage]="metric.percentage"
            [color]="metric.color"
          ></ui-progress-ring>
        }
      </div>

      <section class="mb-6">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <lucide-icon [img]="TargetIcon" [size]="18" class="text-white"></lucide-icon>
            <h3 class="text-base font-semibold">{{ goalsTitle() }}</h3>
          </div>
          @if (showAddGoal()) {
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition-colors hover:text-white"
              [attr.aria-label]="addGoalLabel()"
            >
              <lucide-icon [img]="PlusIcon" [size]="18"></lucide-icon>
            </button>
          }
        </div>

        <div class="space-y-2">
          @for (goal of goals(); track goal.id) {
            <ui-goal-item [text]="goal.text" [completed]="goal.completed"></ui-goal-item>
          }
        </div>
      </section>

      <footer class="border-t border-[#2C2C2E] pt-4">
        <a
          [href]="detailsHref()"
          class="inline-flex items-center gap-1.5 text-sm text-white transition-opacity hover:opacity-80"
        >
          {{ detailsLabel() }}
          <lucide-icon [img]="ExternalLinkIcon" [size]="14"></lucide-icon>
        </a>
      </footer>
    </article>
  `,
})
export class ActivityProgressCardComponent {
  title = input<string>("Today's Progress");
  subtitle = input<string>('Activity');
  goalsTitle = input<string>("Today's Goals");
  detailsLabel = input<string>('View Activity Details');
  detailsHref = input<string>('#');
  showAddGoal = input<boolean>(true);
  addGoalLabel = input<string>('Add goal');
  metrics = input<ActivityProgressMetric[]>([]);
  goals = input<ActivityProgressGoal[]>([]);

  protected readonly ActivityIcon = Activity;
  protected readonly TargetIcon = Target;
  protected readonly PlusIcon = Plus;
  protected readonly ExternalLinkIcon = ExternalLink;
}
