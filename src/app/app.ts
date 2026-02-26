import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { ThemeService } from './core/services/theme.service';

const routeAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ display: 'grid' }),
    query(
      ':enter, :leave',
      [
        style({
          gridArea: '1 / 1 / 2 / 2',
        }),
      ],
      { optional: true }
    ),
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    query(
      ':leave',
      [animate('150ms ease-out', style({ opacity: 0 }))],
      { optional: true }
    ),
    query(
      ':enter',
      [animate('250ms ease-out', style({ opacity: 1 }))],
      { optional: true }
    ),
  ]),
]);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [routeAnimation],
})
export class App {
  protected readonly title = signal('sports');
  private themeService = inject(ThemeService);
}
