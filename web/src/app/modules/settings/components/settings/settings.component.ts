import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

interface SettingsNavItem {
  label: string;
  path: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  activeTab = 'general';

  settingsNavItems: SettingsNavItem[] = [
    {
      label: 'General',
      path: 'general',
      icon: 'settings',
      description: 'Organization basic information'
    },
    {
      label: 'Users',
      path: 'users',
      icon: 'people',
      description: 'Manage users and members'
    },
    {
      label: 'Roles & Permissions',
      path: 'roles',
      icon: 'security',
      description: 'Configure roles and permissions'
    },
    {
      label: 'Billing',
      path: 'billing',
      icon: 'payment',
      description: 'Subscription and billing settings'
    },
    {
      label: 'Integrations',
      path: 'integrations',
      icon: 'extension',
      description: 'Third-party integrations'
    },
    {
      label: 'Security',
      path: 'security',
      icon: 'lock',
      description: 'Security and privacy settings'
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Set active tab based on current route
    this.route.firstChild?.url.subscribe(url => {
      if (url && url.length > 0) {
        this.activeTab = url[0].path;
      }
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path], { relativeTo: this.route });
    this.activeTab = path;
  }
}
