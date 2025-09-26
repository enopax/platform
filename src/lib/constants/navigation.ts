import {
  RiDashboardLine,
  RiProjectorLine,
  RiTeamLine,
  RiBuildingLine,
  RiCodeLine,
  RiServerLine,
} from '@remixicon/react';

export const navigation = [
  {
    name: 'Dashboard',
    href: '/main',
    icon: RiDashboardLine,
    description: 'Overview and activity dashboard'
  },
  {
    name: 'Projects',
    href: '/main/projects',
    icon: RiProjectorLine,
    description: 'Manage your projects and resources'
  },
  {
    name: 'Developer',
    href: '/main/developer',
    icon: RiCodeLine,
    description: 'API keys and developer tools'
  },
  {
    name: 'Organisations',
    href: '/main/organisations',
    icon: RiBuildingLine,
    description: 'Company and organisation management'
  },
  {
    name: 'Teams',
    href: '/main/teams',
    icon: RiTeamLine,
    description: 'Team collaboration and management'
  },
];