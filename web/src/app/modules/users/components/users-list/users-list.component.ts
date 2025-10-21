import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService, User } from '@app/core/services/user.service';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['email', 'first_name', 'last_name', 'status', 'email_verified', 'created_at', 'actions'];
  users: User[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.loading = false;
        },
        error: (error) => {
          this.snackBar.open('Error loading users: ' + error.message, 'Close', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: { isNew: true }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.createUser(result);
      }
    });
  }

  editUser(user: User): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      data: { isNew: false, user }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateUser(user.id, result);
      }
    });
  }

  createUser(data: any): void {
    this.userService.createUser(data).subscribe({
      next: () => {
        this.snackBar.open('User created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open('Error creating user: ' + error.message, 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  updateUser(id: string, data: any): void {
    this.userService.updateUser(id, data).subscribe({
      next: () => {
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open('Error updating user: ' + error.message, 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteUser(id: string, email: string): void {
    const confirmDialog = confirm(`Are you sure you want to delete user: ${email}?`);
    if (!confirmDialog) return;

    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.snackBar.open('User deleted successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open('Error deleting user: ' + error.message, 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'inactive': return 'accent';
      case 'suspended': return 'warn';
      default: return '';
    }
  }
}
