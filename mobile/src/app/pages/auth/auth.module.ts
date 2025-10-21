import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { LoginPage } from './login/login.page';
import { RegisterPage } from './register/register.page';
import { AuthRoutingModule } from './auth-routing.module';

@NgModule({
  declarations: [LoginPage, RegisterPage],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AuthRoutingModule,
  ],
})
export class AuthModule {}
