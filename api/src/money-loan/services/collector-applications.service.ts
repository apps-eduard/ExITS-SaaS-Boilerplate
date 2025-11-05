import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { KnexService } from '../../database/knex.service';
import { CollectorAssignmentService } from './collector-assignment.service';

@Injectable()
export class CollectorApplicationsService {
  constructor(
    private knexService: KnexService,
    private collectorAssignmentService: CollectorAssignmentService,
  ) {}

  /**
   * Approve an application (with limit check)
   */
  async approveApplication(
    collectorId: number,
    tenantId: number,
    applicationId: number,
    approveDto: {
      approvedAmount: number;
      approvedTermDays: number;
      approvedInterestRate: number;
      notes?: string;
    },
  ) {
    const knex = this.knexService.instance;

    // Get application
    const application = await knex('money_loan_applications')
      .where({ id: applicationId, tenant_id: tenantId })
      .first();

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    if (application.status !== 'submitted' && application.status !== 'under_review') {
      throw new BadRequestException(`Application is already ${application.status}`);
    }

    // Verify customer is assigned to this collector
    await this.collectorAssignmentService.verifyCustomerAccess(
      application.customer_id,
      collectorId,
      tenantId,
    );

    // Check approval limit
    const canApprove = await this.collectorAssignmentService.canApprove(
      collectorId,
      tenantId,
      approveDto.approvedAmount,
    );

    if (!canApprove.canApprove) {
      throw new ForbiddenException(canApprove.reason);
    }

    // Update application
    const [updatedApplication] = await knex('money_loan_applications')
      .where({ id: applicationId })
      .update({
        status: 'approved',
        reviewed_by: collectorId,
        reviewed_at: knex.fn.now(),
        approved_amount: approveDto.approvedAmount,
        approved_term_days: approveDto.approvedTermDays,
        approved_interest_rate: approveDto.approvedInterestRate,
        review_notes: approveDto.notes,
        updated_at: knex.fn.now(),
      })
      .returning('*');

    // Create loan record
    const product = await knex('money_loan_products')
      .where({ id: application.loan_product_id })
      .first();

    const loanNumber = `ML-${Date.now()}-${application.id}`;

    const [loan] = await knex('money_loan_loans')
      .insert({
        tenant_id: tenantId,
        loan_number: loanNumber,
        customer_id: application.customer_id,
        loan_product_id: application.loan_product_id,
        application_id: applicationId,
        principal_amount: approveDto.approvedAmount,
        interest_rate: approveDto.approvedInterestRate,
        interest_type: product.interest_type,
        term_days: approveDto.approvedTermDays,
        processing_fee: (approveDto.approvedAmount * (product.processing_fee_percent / 100)),
        platform_fee: product.platform_fee,
        status: 'approved',
        approved_by: collectorId,
        approved_at: knex.fn.now(),
      })
      .returning('*');

    // Log action
    await this.collectorAssignmentService.logAction({
      tenantId,
      collectorId,
      customerId: application.customer_id,
      actionType: 'approve_application',
      applicationId,
      loanId: loan.id,
      amount: approveDto.approvedAmount,
      previousValue: { status: application.status },
      newValue: { status: 'approved', approvedAmount: approveDto.approvedAmount },
      status: 'success',
      notes: approveDto.notes,
    });

    return {
      application: updatedApplication,
      loan,
    };
  }

  /**
   * Reject an application
   */
  async rejectApplication(
    collectorId: number,
    tenantId: number,
    applicationId: number,
    rejectDto: {
      rejectionReason: string;
      notes?: string;
    },
  ) {
    const knex = this.knexService.instance;

    // Get application
    const application = await knex('money_loan_applications')
      .where({ id: applicationId, tenant_id: tenantId })
      .first();

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    if (application.status !== 'submitted' && application.status !== 'under_review') {
      throw new BadRequestException(`Application is already ${application.status}`);
    }

    // Verify customer is assigned to this collector
    await this.collectorAssignmentService.verifyCustomerAccess(
      application.customer_id,
      collectorId,
      tenantId,
    );

    // Update application
    const [updatedApplication] = await knex('money_loan_applications')
      .where({ id: applicationId })
      .update({
        status: 'rejected',
        reviewed_by: collectorId,
        reviewed_at: knex.fn.now(),
        review_notes: `${rejectDto.rejectionReason}${rejectDto.notes ? `\n\nNotes: ${rejectDto.notes}` : ''}`,
        updated_at: knex.fn.now(),
      })
      .returning('*');

    // Log action
    await this.collectorAssignmentService.logAction({
      tenantId,
      collectorId,
      customerId: application.customer_id,
      actionType: 'reject_application',
      applicationId,
      previousValue: { status: application.status },
      newValue: { status: 'rejected', reason: rejectDto.rejectionReason },
      status: 'success',
      notes: rejectDto.notes,
    });

    return updatedApplication;
  }

  /**
   * Request manager review for application above limit
   */
  async requestReview(
    collectorId: number,
    tenantId: number,
    applicationId: number,
    requestDto: {
      notes: string;
    },
  ) {
    const knex = this.knexService.instance;

    // Get application
    const application = await knex('money_loan_applications')
      .where({ id: applicationId, tenant_id: tenantId })
      .first();

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    // Verify customer is assigned to this collector
    await this.collectorAssignmentService.verifyCustomerAccess(
      application.customer_id,
      collectorId,
      tenantId,
    );

    // Update application to under_review
    const [updatedApplication] = await knex('money_loan_applications')
      .where({ id: applicationId })
      .update({
        status: 'under_review',
        review_notes: `Collector review request: ${requestDto.notes}`,
        updated_at: knex.fn.now(),
      })
      .returning('*');

    // Log action
    await this.collectorAssignmentService.logAction({
      tenantId,
      collectorId,
      customerId: application.customer_id,
      actionType: 'request_application_review',
      applicationId,
      amount: application.requested_amount,
      status: 'pending_approval',
      notes: requestDto.notes,
    });

    return updatedApplication;
  }
}
