import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  LoanCalculationPreview,
  LoanCalculationRequest,
  LoanSchedulePreviewItem,
  LoanCalculationResult,
} from '../models/loan-calculation.model';

export {
  LoanCalculationPreview,
  LoanCalculationRequest,
  LoanSchedulePreviewItem,
  LoanCalculationResult,
};

/**
 * Thin wrapper that delegates all loan calculations to the backend API.
 * This keeps the mobile app aligned with the single source of truth.
 */
@Injectable({ providedIn: 'root' })
export class LoanCalculatorService {
  private api = inject(ApiService);

  calculateLoanPreview(payload: LoanCalculationRequest): Observable<LoanCalculationPreview> {
    return this.api.calculateLoanPreview(payload);
  }
}
