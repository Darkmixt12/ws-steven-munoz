import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';

import { CommonModule } from '@angular/common';
import { ClientsStore } from '../../../stores/clientsStore';

@Component({
  selector: 'create-client',
  imports: [CommonModule,FormsModule,ReactiveFormsModule,InputTextModule, InputIconModule,IconFieldModule,ButtonModule,DatePickerModule],
  templateUrl: './createClient.component.html',
  styleUrl: './createClient.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateClientComponent {
  readonly fb = inject(FormBuilder);
  readonly clientsStore = inject(ClientsStore);

  public myFormName: FormGroup = this.fb.group({
    name: [''],
    tel: ['',[Validators.nullValidator]],
    email: [''],
    user_owner: [''],
   })


  submit() {
    if (this.myFormName.invalid) return;
    console.log(this.myFormName.value)
    this.clientsStore.createClient(this.myFormName.value)
    this.myFormName.reset();
 
  }


 










}
