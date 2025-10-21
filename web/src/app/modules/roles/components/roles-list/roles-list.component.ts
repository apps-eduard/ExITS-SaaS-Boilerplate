import { Component, OnInit } from '@angular/core';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: number;
}

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrls: ['./roles-list.component.scss']
})
export class RolesListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'description', 'permissions', 'actions'];
  roles: Role[] = [];

  constructor() { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    // TODO: Load roles from API
  }

  deleteRole(id: string): void {
    // TODO: Delete role
  }

  editRole(id: string): void {
    // TODO: Edit role
  }
}
