import { ChangeDetectionStrategy, Component, inject, effect } from '@angular/core';
import { ClientsStore } from '../../../stores/clientsStore';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import {MatTableModule} from '@angular/material/table';
import { CardModule } from 'primeng/card';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CreateClientComponent } from '../createClient/createClient.component';

@Component({
  selector: 'dashboard-user',
  imports: [CommonModule,TableModule, MatTableModule, CardModule, InputIconModule, IconFieldModule, InputTextModule, ButtonModule],
  providers: [DialogService],
  templateUrl: './clientsDashboard.component.html',
  styleUrl: './clientsDashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsDashboardComponent {

    ref: DynamicDialogRef | null = null;
    dialogService = inject(DialogService)

  clientstore = inject(ClientsStore);
  displayedColumns: string[] = ['position', 'name', 'email',];
  clients = this.clientstore.getClientsSignal();

  constructor() {
    effect(() => {
      console.log('Clientes cargados:', this.clients());
    });
  }

  show() {
        this.ref = this.dialogService.open(CreateClientComponent, { 
          header: 'Crear Cliente',
          width: '20vw',
          height: '50vh',
          closable: true,
          modal: true,
          
        });
    }
}
