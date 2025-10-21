import { Component, OnInit } from '@angular/core';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  currentUser = this.authService.getCurrentUser();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  editProfile(): void {
    // TODO: Implement profile edit
  }

  changePassword(): void {
    // TODO: Implement password change
  }
}
