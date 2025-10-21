import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

import { TenantsRoutingModule } from './tenants-routing.module';
import { TenantsListComponent } from './components/tenants-list/tenants-list.component';

@NgModule({
  declarations: [TenantsListComponent],
  imports: [
    CommonModule,
    TenantsRoutingModule,
    MatTableModule
  ]
})
export class TenantsModule { }
