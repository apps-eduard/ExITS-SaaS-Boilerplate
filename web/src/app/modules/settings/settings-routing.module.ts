import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from './components/settings/settings.component';
import { GeneralSettingsComponent } from './components/general-settings/general-settings.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      { path: 'general', component: GeneralSettingsComponent },
      { path: 'users', component: GeneralSettingsComponent }, // Placeholder - replace with UserSettingsComponent
      { path: 'roles', component: GeneralSettingsComponent }, // Placeholder - replace with RoleSettingsComponent
      { path: 'billing', component: GeneralSettingsComponent }, // Placeholder - replace with BillingSettingsComponent
      { path: 'integrations', component: GeneralSettingsComponent }, // Placeholder - replace with IntegrationsSettingsComponent
      { path: 'security', component: GeneralSettingsComponent } // Placeholder - replace with SecuritySettingsComponent
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }

