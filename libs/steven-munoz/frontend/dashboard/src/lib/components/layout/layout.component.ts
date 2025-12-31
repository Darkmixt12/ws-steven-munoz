import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { SideNavComponent } from '../sideNavComponent/side-nav.component';

@Component({
  selector: 'steven-munoz-layout',
  imports: [
    RouterModule,
    DrawerModule,
    SideNavComponent,
    ButtonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {

  visible = false;
  collapsed = signal(false);
  sidenavWidth = computed(() => (this.collapsed() ? '65px' : '250px'));
}
