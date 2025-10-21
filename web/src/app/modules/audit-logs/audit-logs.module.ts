import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

import { AuditLogsRoutingModule } from './audit-logs-routing.module';
import { AuditLogsListComponent } from './components/audit-logs-list/audit-logs-list.component';

@NgModule({
  declarations: [AuditLogsListComponent],
  imports: [
    CommonModule,
    AuditLogsRoutingModule,
    MatTableModule
  ]
})
export class AuditLogsModule { }
