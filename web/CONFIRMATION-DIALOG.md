# Global Confirmation Dialog

A modern, compact confirmation dialog system for the application.

## Features

- ✨ Modern, clean design with smooth animations
- 🎨 4 preset types: info, warning, danger, success
- 🌙 Full dark mode support
- 📱 Responsive and mobile-friendly
- ⚡ Promise-based API
- 🎯 TypeScript support
- 🔧 Highly customizable

## Usage

### Basic Confirmation

```typescript
import { ConfirmationService } from '@core/services/confirmation.service';

export class MyComponent {
  constructor(private confirmationService: ConfirmationService) {}

  async onDelete() {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      // User clicked "Delete"
      this.performDelete();
    }
  }
}
```

### Quick Methods

The service provides quick helper methods for common actions:

```typescript
// Delete confirmation
const confirmed = await this.confirmationService.delete('User Account');

// Disable confirmation
const confirmed = await this.confirmationService.disable('User Account');

// Enable confirmation
const confirmed = await this.confirmationService.enable('User Account');
```

### Custom Configuration

```typescript
const confirmed = await this.confirmationService.confirm({
  title: 'Custom Title',
  message: 'Your custom message here',
  confirmText: 'Proceed',      // Optional, defaults to 'Confirm'
  cancelText: 'Go Back',       // Optional, defaults to 'Cancel'
  type: 'warning',             // info | warning | danger | success
  icon: 'trash'                // Optional icon override
});
```

## Configuration Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | - | Dialog title (required) |
| `message` | `string` | - | Dialog message (required) |
| `confirmText` | `string` | `'Confirm'` | Confirm button text |
| `cancelText` | `string` | `'Cancel'` | Cancel button text |
| `type` | `'info' \| 'warning' \| 'danger' \| 'success'` | `'info'` | Dialog type/theme |
| `icon` | `string` | - | Custom icon override |

## Type Styles

### Info (Blue)
- Best for: Informational confirmations
- Color: Blue
- Icon: Information circle

### Warning (Yellow)
- Best for: Disable actions, non-destructive warnings
- Color: Yellow
- Icon: Warning triangle

### Danger (Red)
- Best for: Delete actions, destructive operations
- Color: Red
- Icon: Trash can

### Success (Green)
- Best for: Enable actions, positive confirmations
- Color: Green
- Icon: Check circle

## Examples

### Delete Confirmation
```typescript
async deleteUser(userId: string) {
  const confirmed = await this.confirmationService.confirm({
    title: 'Delete User',
    message: 'Are you sure you want to delete this user? This action cannot be undone.',
    confirmText: 'Delete',
    type: 'danger'
  });

  if (confirmed) {
    await this.userService.delete(userId);
  }
}
```

### Disable/Enable Toggle
```typescript
async toggleStatus(item: any) {
  const isActive = item.status === 'active';
  const action = isActive ? 'disable' : 'enable';
  
  const confirmed = await this.confirmationService.confirm({
    title: `${action === 'disable' ? 'Disable' : 'Enable'} ${item.name}`,
    message: `This will ${action} the item.`,
    confirmText: action === 'disable' ? 'Disable' : 'Enable',
    type: action === 'disable' ? 'warning' : 'success'
  });

  if (confirmed) {
    await this.toggleItemStatus(item.id);
  }
}
```

### Save Changes Confirmation
```typescript
async saveChanges() {
  const confirmed = await this.confirmationService.confirm({
    title: 'Save Changes',
    message: 'Are you sure you want to save these changes?',
    confirmText: 'Save',
    type: 'info'
  });

  if (confirmed) {
    await this.saveData();
  }
}
```

## Design

The confirmation dialog features:

- **Compact size**: Maximum 400px width, responsive on mobile
- **Icon-based**: Visual indicators for different types
- **Smooth animations**: Fade in backdrop, scale in dialog
- **Focus management**: Keyboard accessible
- **Backdrop dismiss**: Click outside to cancel
- **Dark mode**: Full support for light and dark themes

## Technical Details

- **Service**: `ConfirmationService` (singleton, providedIn: 'root')
- **Component**: `ConfirmationDialogComponent` (added to App component)
- **Z-index**: 9998 (backdrop), 9999 (dialog)
- **Return type**: `Promise<boolean>`
- **True**: User confirmed
- **False**: User cancelled or dismissed

## Migration from Native Confirm

Before:
```typescript
const confirmed = confirm('Are you sure?');
if (confirmed) {
  // do something
}
```

After:
```typescript
const confirmed = await this.confirmationService.confirm({
  title: 'Confirm Action',
  message: 'Are you sure?',
  type: 'warning'
});

if (confirmed) {
  // do something
}
```

## Best Practices

1. **Always await**: The service returns a Promise
2. **Use appropriate types**: Match the action severity
3. **Clear messages**: Be explicit about what will happen
4. **Action verbs**: Use specific button text (Delete, Disable, etc.)
5. **Don't overuse**: Only for significant actions
