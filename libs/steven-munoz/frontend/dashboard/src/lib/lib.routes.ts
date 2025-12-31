import { Route } from '@angular/router';
import { Layout } from './components/layout/layout';
import { DashboardRoute } from './components/routeComponents/dashboardRoute/dashboardRoute';
import { ContentRoute } from './components/routeComponents/contentRoute/contentRoute';
import { AnalyticsRoute } from './components/routeComponents/analyticsRoute/analyticsRoute';
import { CommentsRoute } from './components/routeComponents/commentsRoute/commentsRoute';

export const DashboardRoutes: Route[] = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'board', component: DashboardRoute },
      { path: 'content', component: ContentRoute },
      { path: 'analytics', component: AnalyticsRoute },
      { path: 'comments', component: CommentsRoute },
    ],
  },
];
