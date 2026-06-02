import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'ui-progress-ring',
  standalone: true,
  template: `
    <div class="flex flex-col items-center">
      <div class="relative" [style.width.px]="size()" [style.height.px]="size()">
        <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="viewBox()">
          <circle
            [attr.cx]="center()"
            [attr.cy]="center()"
            [attr.r]="radius()"
            fill="none"
            stroke="#2C2C2E"
            [attr.stroke-width]="strokeWidth()"
          />
          <circle
            [attr.cx]="center()"
            [attr.cy]="center()"
            [attr.r]="radius()"
            fill="none"
            [attr.stroke]="color()"
            [attr.stroke-width]="strokeWidth()"
            stroke-linecap="round"
            [attr.stroke-dasharray]="circumference()"
            [attr.stroke-dashoffset]="dashOffset()"
            [attr.transform]="rotationTransform()"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-xl font-bold text-white leading-none">{{ value() }}</span>
          <span class="text-[11px] text-neutral-500 mt-0.5">{{ unit() }}</span>
        </div>
      </div>
      <div class="mt-3 text-center">
        <p class="text-sm text-white">{{ label() }}</p>
        <p class="text-xs text-neutral-500 mt-0.5">{{ percentage() }}%</p>
      </div>
    </div>
  `,
})
export class ProgressRingComponent {
  label = input<string>('');
  value = input<string | number>('');
  unit = input<string>('');
  percentage = input<number>(0);
  color = input<string>('#FF2D55');
  size = input<number>(88);
  strokeWidth = input<number>(7);

  center = computed(() => this.size() / 2);
  radius = computed(() => (this.size() - this.strokeWidth()) / 2);
  circumference = computed(() => 2 * Math.PI * this.radius());
  dashOffset = computed(() => {
    const clamped = Math.min(100, Math.max(0, this.percentage()));
    return this.circumference() * (1 - clamped / 100);
  });
  viewBox = computed(() => `0 0 ${this.size()} ${this.size()}`);
  rotationTransform = computed(() => `rotate(-90 ${this.center()} ${this.center()})`);
}
