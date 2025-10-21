import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

import { RolesRoutingModule } from './roles-routing.module';
import { RolesListComponent } from './components/roles-list/roles-list.component';

@NgModule({
  declarations: [RolesListComponent],
  imports: [
    CommonModule,
    RolesRoutingModule,
    MatTableModule
  ]
})
export class RolesModule { }
