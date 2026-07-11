import { nowISO } from '../utils/dates'

/**
 * Datos iniciales que se cargan la primera vez que se abre la app
 * (cuando LocalStorage está vacío).
 */

export const seedStatuses = [
  { id: 'st-backlog', name: 'Backlog', color: '#eab308', order: 0 },
  { id: 'st-progress', name: 'In Progress', color: '#22c55e', order: 1 },
  { id: 'st-review', name: 'Code Review', color: '#0ea5e9', order: 2 },
  { id: 'st-testing', name: 'Internal Testing', color: '#f97316', order: 3 },
  { id: 'st-feedbackA', name: 'Feedback A', color: '#3b82f6', order: 4 },
  { id: 'st-feedbackB', name: 'Feedback B', color: '#8b5cf6', order: 5 },
  { id: 'st-done', name: 'Done', color: '#10b981', order: 6 },
]

export const seedTypes = [
  { id: 'ty-bug', name: 'Bug', icon: '🐞', color: '#ef4444' },
  { id: 'ty-feature', name: 'Feature', icon: '✨', color: '#6366f1' },
  { id: 'ty-docs', name: 'Documentation', icon: '📄', color: '#0ea5e9' },
  { id: 'ty-improvement', name: 'Improvement', icon: '🔧', color: '#f59e0b' },
  { id: 'ty-deploy', name: 'Deployment', icon: '🚀', color: '#22c55e' },
]

export const seedAssignees = [
  { id: 'as-1', name: 'Jimmy', color: '#6366f1' },
  { id: 'as-2', name: 'Ana', color: '#ec4899' },
  { id: 'as-3', name: 'Carlos', color: '#14b8a6' },
]

export const seedProjects = [
  { id: 'pr-lms', name: 'LMS', color: '#6366f1' },
  { id: 'pr-lms-manager', name: 'LMS Manager', color: '#0ea5e9' },
  { id: 'pr-course-cloud', name: 'Course Cloud', color: '#22c55e' },
]

export function buildSeedTasks() {
  const created = nowISO()
  return [
    {
      id: 'tk-953',
      code: 953,
      ticket: '953',
      projectId: 'pr-lms',
      title: 'Unify Search Functionality Across LMS',
      description: 'Course List, Catalog, My Courses.',
      statusId: 'st-progress',
      typeId: 'ty-feature',
      assigneeIds: ['as-1'],
      createdAt: created,
      backlogAt: '2026-01-15T12:00:00.000Z',
      currentStatusStartAt: '2026-01-30T12:00:00.000Z',
      currentStatusEndAt: null,
      gitlabUrl: '',
      makahaUrl: '',
    },
    {
      id: 'tk-974',
      code: 974,
      ticket: '974',
      projectId: 'pr-lms',
      title: 'Global catalog search bar styling issue',
      description: '',
      statusId: 'st-testing',
      typeId: 'ty-bug',
      assigneeIds: ['as-2'],
      createdAt: created,
      backlogAt: '2026-01-20T12:00:00.000Z',
      currentStatusStartAt: '2026-01-30T12:00:00.000Z',
      currentStatusEndAt: null,
      gitlabUrl: '',
      makahaUrl: '',
    },
    {
      id: 'tk-972',
      code: 972,
      ticket: '972',
      projectId: 'pr-course-cloud',
      title: 'Old Certificate Generation Issues',
      description: '',
      statusId: 'st-done',
      typeId: 'ty-bug',
      assigneeIds: ['as-3'],
      createdAt: created,
      backlogAt: '2025-12-21T12:00:00.000Z',
      currentStatusStartAt: '2026-01-28T12:00:00.000Z',
      currentStatusEndAt: null,
      gitlabUrl: '',
      makahaUrl: '',
    },
    {
      id: 'tk-917',
      code: 917,
      ticket: '917',
      projectId: 'pr-lms-manager',
      title: 'Enable Portal Admin and Supervisor Access to Learner Certificates',
      description: 'Ensure Certificate Visibility.',
      statusId: 'st-feedbackA',
      typeId: 'ty-feature',
      assigneeIds: ['as-1', 'as-2'],
      createdAt: created,
      backlogAt: '2025-12-15T12:00:00.000Z',
      currentStatusStartAt: '2025-12-15T12:00:00.000Z',
      currentStatusEndAt: null,
      gitlabUrl: '',
      makahaUrl: '',
    },
    {
      id: 'tk-955',
      code: 955,
      ticket: '955',
      projectId: 'pr-lms',
      title: 'Fix LMS Redirection After Session Timeout',
      description: '',
      statusId: 'st-feedbackB',
      typeId: 'ty-bug',
      assigneeIds: ['as-3'],
      createdAt: created,
      backlogAt: '2025-12-15T12:00:00.000Z',
      currentStatusStartAt: '2025-12-15T12:00:00.000Z',
      currentStatusEndAt: null,
      gitlabUrl: '',
      makahaUrl: '',
    },
    {
      id: 'tk-922',
      code: 922,
      ticket: '922',
      projectId: 'pr-lms-manager',
      title: 'Sidebar facelift',
      description: 'Still in progress; preparing the Figma links.',
      statusId: 'st-backlog',
      typeId: 'ty-improvement',
      assigneeIds: ['as-1'],
      createdAt: created,
      backlogAt: '2026-01-30T12:00:00.000Z',
      currentStatusStartAt: '2026-01-30T12:00:00.000Z',
      currentStatusEndAt: null,
      gitlabUrl: '',
      makahaUrl: '',
    },
  ]
}

export const seedSeq = 975
