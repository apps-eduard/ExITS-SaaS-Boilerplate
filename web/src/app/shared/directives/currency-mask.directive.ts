import { Directive, ElementRef, HostListener, Input, AfterViewInit, Optional } from '@angular/core';
import { NgModel } from '@angular/forms';

@Directive({
  selector: '[appCurrencyMask]',
  standalone: true
})
export class CurrencyMaskDirective implements AfterViewInit {
  private previousValue = '';

  // Configurable via input
  @Input() currencyCode: string = 'PHP';
  @Input() locale: string = 'en-PH';

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() private ngModel: NgModel
  ) {}

  ngAfterViewInit(): void {
    // Format initial value
    setTimeout(() => {
      this.formatValue();
    }, 0);
  }

  private formatValue(): void {
    const input = this.el.nativeElement;
    const value = input.value;

    if (!value) return;

    // Remove all non-digit and non-decimal characters
    const cleanValue = value.replace(/[^\d.]/g, '');

    if (!cleanValue || parseFloat(cleanValue) === 0) {
      return;
    }

    // Convert to number
    const numberValue = parseFloat(cleanValue);

    // Format as currency
    const formatted = numberValue.toLocaleString(this.locale, {
      style: 'currency',
      currency: this.currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    input.value = formatted;
    this.previousValue = formatted;
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Store cursor position
    const cursorPosition = input.selectionStart || 0;

    // Remove all non-digit and non-decimal characters
    const cleanValue = value.replace(/[^\d.]/g, '');

    // Prevent invalid states - if empty, clear everything
    if (!cleanValue || cleanValue === '.' || parseFloat(cleanValue) === 0) {
      if (!cleanValue) {
        input.value = '';
        this.previousValue = '';
        if (this.ngModel) {
          this.ngModel.viewToModelUpdate(0);
        }
      }
      return;
    }

    // Convert to number
    const numberValue = parseFloat(cleanValue);

    // Update ngModel with the actual number
    if (this.ngModel) {
      this.ngModel.viewToModelUpdate(numberValue);
    }

    // Don't format while typing - only show the clean number
    // This prevents cursor jumping and allows normal editing
    input.value = cleanValue;
    this.previousValue = cleanValue;
    
    // Restore cursor position
    input.setSelectionRange(cursorPosition, cursorPosition);
  }

  @HostListener('focus', ['$event'])
  onFocus(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remove formatting to show plain number for editing
    const cleanValue = input.value.replace(/[^\d.]/g, '');
    if (cleanValue) {
      input.value = cleanValue;
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleanValue = input.value.replace(/[^\d.]/g, '');
    
    if (!cleanValue || parseFloat(cleanValue) === 0) {
      input.value = '';
      this.previousValue = '';
      if (this.ngModel) {
        this.ngModel.viewToModelUpdate(0);
      }
      return;
    }
    
    // Format as currency when losing focus
    const numberValue = parseFloat(cleanValue);
    const formatted = numberValue.toLocaleString(this.locale, {
      style: 'currency',
      currency: this.currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    input.value = formatted;
    this.previousValue = formatted;
  }
}
