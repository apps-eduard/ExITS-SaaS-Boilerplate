import { Component, OnInit } from '@angular/core';

interface AuditLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: Date;
  details: string;
}

@Component({
  selector: 'app-audit-logs-list',
  templateUrl: './audit-logs-list.component.html',
  styleUrls: ['./audit-logs-list.component.scss']
})
export class AuditLogsListComponent implements OnInit {
  displayedColumns: string[] = ['user', 'action', 'resource', 'timestamp', 'details'];
  logs: AuditLog[] = [];

  constructor() { }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    // TODO: Load audit logs from API
  }
}
