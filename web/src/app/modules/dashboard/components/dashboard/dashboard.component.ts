import { Component, OnInit } from '@angular/core';

interface DashboardCard {
  title: string;
  value: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  cards: DashboardCard[] = [
    { title: 'Total Users', value: 1234, icon: 'people', color: 'primary' },
    { title: 'Active Tenants', value: 45, icon: 'business', color: 'accent' },
    { title: 'Roles', value: 12, icon: 'security', color: 'warn' },
    { title: 'Audit Logs', value: 5678, icon: 'history', color: 'primary' }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}
