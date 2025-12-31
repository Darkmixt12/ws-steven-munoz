import { ChangeDetectionStrategy, Component, computed, Input, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list'
import { MatIconModule } from '@angular/material/icon'
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';



export type MenuItem = {
  icon: string;
  label: string;
  route: string
}

@Component({
  selector: 'steven-munoz-custom-side-nav-component',
  imports: [MatListModule, MatIconModule, CommonModule, RouterModule],
  templateUrl: './CustomSideNavComponent.html',
  styleUrl: './CustomSideNavComponent.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomSideNavComponent {

  sideNavCollapsed = signal(false)
  @Input() set collapsed(val: boolean) {
    this.sideNavCollapsed.set(val)
  }

  menuItems = signal<MenuItem[]>([
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: 'board'
    },
    {
      icon: 'video_library',
      label: 'Content',
      route: 'content'
    },
    {
      icon: 'analytics',
      label: 'Analytics',
      route: 'analytics'
    },
    {
      icon: 'comment',
      label: 'Comments',
      route: 'comments'
    }
  ])

  profilePicSize = computed(()  => this.sideNavCollapsed() ? '32' : '100' )
}
