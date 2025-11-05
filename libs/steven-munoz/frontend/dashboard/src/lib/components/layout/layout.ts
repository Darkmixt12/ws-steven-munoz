import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'steven-munoz-layout',
  standalone: true,
  imports: [Sidebar, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {}
