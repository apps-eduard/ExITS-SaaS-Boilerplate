import { Component, OnInit } from '@angular/core';

interface Tenant {
  id: string;
  name: string;
  email: string;
  users: number;
  status: string;
}

@Component({
  selector: 'app-tenants-list',
  templateUrl: './tenants-list.component.html',
  styleUrls: ['./tenants-list.component.scss']
})
export class TenantsListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'email', 'users', 'status', 'actions'];
  tenants: Tenant[] = [];

  constructor() { }

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    // TODO: Load tenants from API
  }

  deleteTenant(id: string): void {
    // TODO: Delete tenant
  }

  editTenant(id: string): void {
    // TODO: Edit tenant
  }
}
