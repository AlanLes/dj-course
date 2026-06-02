import type { Meta, StoryObj } from '@storybook/angular';
import {
  ActivityProgressCardComponent,
  ActivityProgressGoal,
  ActivityProgressMetric,
} from './ActivityProgressCard.component';

const defaultMetrics: ActivityProgressMetric[] = [
  { label: 'Move', value: 420, unit: 'cal', percentage: 85, color: '#FF2D55' },
  { label: 'Exercise', value: 35, unit: 'min', percentage: 70, color: '#4CD964' },
  { label: 'Stand', value: 10, unit: 'hrs', percentage: 83, color: '#007AFF' },
];

const defaultGoals: ActivityProgressGoal[] = [
  { id: '1', text: '30min Morning Yoga', completed: false },
  { id: '2', text: '10k Steps', completed: false },
  { id: '3', text: 'Drink 2L Water', completed: true },
  { id: '4', text: 'New Goal 4', completed: false },
];

const cardTemplate = `
  <div style="background:#030712; min-height:100vh; display:flex; justify-content:center; align-items:flex-start; padding:2rem;">
    <ui-activity-progress-card
      [title]="title"
      [subtitle]="subtitle"
      [goalsTitle]="goalsTitle"
      [detailsLabel]="detailsLabel"
      [detailsHref]="detailsHref"
      [showAddGoal]="showAddGoal"
      [addGoalLabel]="addGoalLabel"
      [metrics]="metrics"
      [goals]="goals"
    ></ui-activity-progress-card>
  </div>
`;

const meta: Meta<ActivityProgressCardComponent> = {
  title: 'UI Library/ActivityProgressCard',
  component: ActivityProgressCardComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => ({
    props: args,
    template: cardTemplate,
  }),
  argTypes: {
    title: {
      description: 'Main heading displayed in the card header.',
      control: { type: 'text' },
      table: { category: 'Text' },
    },
    subtitle: {
      description: 'Secondary label below the title.',
      control: { type: 'text' },
      table: { category: 'Text' },
    },
    goalsTitle: {
      description: 'Section heading above the goals list.',
      control: { type: 'text' },
      table: { category: 'Text' },
    },
    detailsLabel: {
      description: 'Footer link text.',
      control: { type: 'text' },
      table: { category: 'Text' },
    },
    detailsHref: {
      description: 'Footer link URL.',
      control: { type: 'text' },
      table: { category: 'Text' },
    },
    addGoalLabel: {
      description: 'Accessible label for the "+" button.',
      control: { type: 'text' },
      table: { category: 'Text' },
    },
    showAddGoal: {
      description: 'Show or hide the "+" button in the goals header.',
      control: { type: 'boolean' },
      table: { category: 'Behaviour' },
    },
    metrics: {
      description:
        'Array of progress rings. Each item: `{ label, value, unit, percentage (0-100), color (hex) }`.',
      control: { type: 'object' },
      table: { category: 'Data' },
    },
    goals: {
      description:
        'Array of goal items. Each item: `{ id, text, completed }`.',
      control: { type: 'object' },
      table: { category: 'Data' },
    },
  },
  args: {
    title: "Today's Progress",
    subtitle: 'Activity',
    goalsTitle: "Today's Goals",
    detailsLabel: 'View Activity Details',
    detailsHref: '#',
    showAddGoal: true,
    addGoalLabel: 'Add goal',
    metrics: defaultMetrics,
    goals: defaultGoals,
  },
};

// Suppress icon class-property controls that Storybook picks up
// independently of Compodoc (not actual inputs, should not be editable).
const internalIconFields = ['ActivityIcon', 'TargetIcon', 'PlusIcon', 'ExternalLinkIcon'];
internalIconFields.forEach((key) => {
  (meta as { argTypes: Record<string, unknown> }).argTypes![key] = {
    table: { disable: true },
  };
});

export default meta;
type Story = StoryObj<ActivityProgressCardComponent>;

export const Default: Story = {};

export const AllGoalsCompleted: Story = {
  name: 'All Goals Completed',
  args: {
    goals: defaultGoals.map((g) => ({ ...g, completed: true })),
  },
};

export const EmptyGoals: Story = {
  name: 'Empty Goals',
  args: {
    goals: [],
    showAddGoal: true,
  },
};

export const LowProgress: Story = {
  name: 'Low Progress',
  args: {
    metrics: [
      { label: 'Move', value: 90, unit: 'cal', percentage: 18, color: '#FF2D55' },
      { label: 'Exercise', value: 5, unit: 'min', percentage: 10, color: '#4CD964' },
      { label: 'Stand', value: 2, unit: 'hrs', percentage: 17, color: '#007AFF' },
    ],
    goals: [
      { id: '1', text: '30min Morning Yoga', completed: false },
      { id: '2', text: '10k Steps', completed: false },
    ],
  },
};

export const WithoutAddGoal: Story = {
  name: 'Without Add Goal Button',
  args: {
    showAddGoal: false,
  },
};
