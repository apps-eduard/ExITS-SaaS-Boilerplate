import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuditLogsListComponent } from './components/audit-logs-list/audit-logs-list.component';

const routes: Routes = [
  { path: '', component: AuditLogsListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditLogsRoutingModule { }
