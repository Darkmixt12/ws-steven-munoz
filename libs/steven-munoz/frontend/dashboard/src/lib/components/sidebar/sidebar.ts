import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MatToolbarModule } from '@angular/material/toolbar'
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { CustomSideNavComponent } from '../customSideNavComponent/CustomSideNavComponent';




@Component({
  selector: 'steven-munoz-sidebar',
  imports: [DrawerModule,CustomSideNavComponent, ButtonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  visible = false;
  collapsed = signal(false)
  sidenavWidth = computed(() => this.collapsed() ? '65px' : '250px')
}
