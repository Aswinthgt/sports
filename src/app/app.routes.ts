import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((c) => c.DashboardComponent),
  },
  {
    path: 'players',
    loadComponent: () =>
      import('./features/players/players.component').then((c) => c.PlayersComponent),
  },
  {
    path: 'split',
    loadComponent: () => import('./features/split/split.component').then((c) => c.SplitComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then((c) => c.HistoryComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
