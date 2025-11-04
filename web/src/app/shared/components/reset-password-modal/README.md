# Reset Password Modal Component

A modern, reusable, compact modal component for resetting user passwords throughout the application.

## Features

✨ **Modern Design**
- Clean, compact aesthetic with smooth animations
- Dark mode support
- Gradient user avatar with initials
- Professional purple/blue color scheme

🔐 **Password Validation**
- Real-time password strength indicator
- Visual feedback with color-coded strength levels (Weak, Fair, Good, Strong)
- Requirements checklist:
  - Minimum 8 characters
  - Uppercase letter
  - Number
- Toggle password visibility

⚡ **User Experience**
- Displays user info (name, email, avatar)
- Loading state during password reset
- Success/error toast notifications
- Keyboard-friendly (ESC to close)
- Click outside to close

## Usage

### 1. Import the Component

```typescript
import { ResetPasswordModalComponent } from '../../../shared/components/reset-password-modal/reset-password-modal.component';

@Component({
  selector: 'app-your-component',
  standalone: true,
  imports: [CommonModule, ResetPasswordModalComponent],
  // ...
})
```

### 2. Add to Template

```html
<!-- Add modal to your template -->
<app-reset-password-modal #resetPasswordModal />

<!-- Button to trigger modal -->
<button (click)="openResetPassword(user)">
  Reset Password 🔑
</button>
```

### 3. Add ViewChild Reference

```typescript
export class YourComponent {
  @ViewChild('resetPasswordModal') resetPasswordModal!: ResetPasswordModalComponent;
  
  openResetPassword(user: any) {
    this.resetPasswordModal.open({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email
    });
  }
}
```

## API

### Interface: ResetPasswordModalData

```typescript
interface ResetPasswordModalData {
  userId: number | string;  // User ID to reset password for
  userName: string;          // Full name for display
  userEmail: string;         // Email for display
}
```

### Methods

#### `open(data: ResetPasswordModalData): void`
Opens the modal with user data.

```typescript
this.resetPasswordModal.open({
  userId: 123,
  userName: 'John Doe',
  userEmail: 'john.doe@example.com'
});
```

#### `close(): void`
Closes the modal and resets all state.

```typescript
this.resetPasswordModal.close();
```

## Backend Endpoint

The modal calls the following API endpoint:

```
PUT /api/users/:userId/reset-password
```

**Request Body:**
```json
{
  "newPassword": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Password Strength Calculation

The component calculates password strength based on:

| Criteria | Points |
|----------|--------|
| Length ≥ 8 characters | 25% |
| Length ≥ 12 characters | 25% |
| Contains uppercase letter | 25% |
| Contains number | 25% |

**Strength Levels:**
- 🔴 **Weak** (0-24%): Red indicator
- 🟠 **Fair** (25-49%): Orange indicator  
- 🟡 **Good** (50-74%): Yellow indicator
- 🟢 **Strong** (75-100%): Green indicator

## Examples

### Example 1: Employee List

```typescript
import { ResetPasswordModalComponent } from '../../../shared/components/reset-password-modal/reset-password-modal.component';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, ResetPasswordModalComponent],
  template: `
    <table>
      <tr *ngFor="let employee of employees">
        <td>{{ employee.name }}</td>
        <td>
          <button (click)="resetPassword(employee)">
            Reset Password 🔑
          </button>
        </td>
      </tr>
    </table>
    
    <app-reset-password-modal #resetPasswordModal />
  `
})
export class EmployeesListComponent {
  @ViewChild('resetPasswordModal') resetPasswordModal!: ResetPasswordModalComponent;
  
  resetPassword(employee: any) {
    this.resetPasswordModal.open({
      userId: employee.userId,
      userName: `${employee.firstName} ${employee.lastName}`,
      userEmail: employee.email
    });
  }
}
```

### Example 2: User Profile Settings

```typescript
@Component({
  selector: 'app-user-profile',
  template: `
    <div class="profile-actions">
      <button (click)="resetOwnPassword()">
        Reset My Password
      </button>
    </div>
    
    <app-reset-password-modal #resetPasswordModal />
  `
})
export class UserProfileComponent {
  @ViewChild('resetPasswordModal') resetPasswordModal!: ResetPasswordModalComponent;
  currentUser = signal({ id: 1, name: 'John Doe', email: 'john@example.com' });
  
  resetOwnPassword() {
    const user = this.currentUser();
    this.resetPasswordModal.open({
      userId: user.id,
      userName: user.name,
      userEmail: user.email
    });
  }
}
```

## Styling

The component uses Tailwind CSS classes and supports:
- Light/Dark mode via `dark:` classes
- Responsive design
- Smooth transitions and animations
- Backdrop blur effect

## Accessibility

- ✅ Keyboard navigation (ESC to close)
- ✅ Click outside to close
- ✅ Proper ARIA labels
- ✅ Focus management
- ✅ Screen reader friendly

## Dependencies

- Angular 17+ (signals, standalone components)
- Tailwind CSS
- HttpClient
- ToastService (custom service for notifications)

## Notes

- The modal handles its own API calls and error handling
- Toast notifications are shown automatically on success/failure
- The modal closes automatically on successful password reset
- All state is reset when the modal is closed
- Password validation happens in real-time
