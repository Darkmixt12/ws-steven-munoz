import { Route } from '@angular/router';
import { DashboardRoute } from './components/routeComponents/dashboardRoute/dashboardRoute';
import { ContentRoute } from './components/routeComponents/contentRoute/contentRoute';
import { AnalyticsRoute } from './components/routeComponents/analyticsRoute/analyticsRoute';
import { CommentsRoute } from './components/routeComponents/commentsRoute/commentsRoute';
import { Sidebar } from './components/sidebar/sidebar';

export const DashboardRoutes: Route[] = [
  {
    path: '',
    component: Sidebar,
    children: [
      { path: 'board', component: DashboardRoute },
      { path: 'content', component: ContentRoute },
      { path: 'analytics', component: AnalyticsRoute },
      { path: 'comments', component: CommentsRoute },
      {path: '',redirectTo: 'board', pathMatch: 'full'}
    ],
  },
];
