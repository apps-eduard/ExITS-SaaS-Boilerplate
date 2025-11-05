import { Injectable, BadRequestException } from '@nestjs/common';
import { KnexService } from '../../database/knex.service';
import { CollectorAssignmentService } from './collector-assignment.service';

@Injectable()
export class CollectorVisitsService {
  constructor(
    private knexService: KnexService,
    private collectorAssignmentService: CollectorAssignmentService,
  ) {}

  /**
   * Log a customer visit with GPS check-in
   */
  async logVisit(
    collectorId: number,
    tenantId: number,
    visitDto: {
      customerId: number;
      visitType: 'collection' | 'follow_up' | 'documentation' | 'relationship' | 'other';
      visitPurpose: string;
      latitude: number;
      longitude: number;
      address?: string;
      checkInTime?: Date;
      notes?: string;
    },
  ) {
    const knex = this.knexService.instance;

    // Verify customer is assigned to this collector
    await this.collectorAssignmentService.verifyCustomerAccess(
      visitDto.customerId,
      collectorId,
      tenantId,
    );

    // Get customer's registered address location
    const customer = await knex('customers')
      .where({ id: visitDto.customerId, tenant_id: tenantId })
      .first();

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Calculate distance if customer has coordinates
    let distanceMeters: number | null = null;
    if (customer.latitude && customer.longitude) {
      distanceMeters = this.calculateDistance(
        visitDto.latitude,
        visitDto.longitude,
        customer.latitude,
        customer.longitude,
      );
    }

    // Create visit record
    const [visit] = await knex('money_loan_collector_customer_visits')
      .insert({
        tenant_id: tenantId,
        collector_id: collectorId,
        customer_id: visitDto.customerId,
        visit_type: visitDto.visitType,
        visit_purpose: visitDto.visitPurpose,
        check_in_latitude: visitDto.latitude,
        check_in_longitude: visitDto.longitude,
        check_in_address: visitDto.address,
        check_in_time: visitDto.checkInTime || knex.fn.now(),
        distance_from_customer_meters: distanceMeters,
        notes: visitDto.notes,
        status: 'in_progress',
      })
      .returning('*');

    // Log action
    await this.collectorAssignmentService.logAction({
      tenantId,
      collectorId,
      customerId: visitDto.customerId,
      actionType: 'customer_visit',
      status: 'success',
      notes: `${visitDto.visitType} visit - ${visitDto.visitPurpose}`,
    });

    return visit;
  }

  /**
   * Check out from a customer visit
   */
  async checkOutVisit(
    collectorId: number,
    tenantId: number,
    visitId: number,
    checkOutDto: {
      latitude: number;
      longitude: number;
      address?: string;
      outcome: 'payment_collected' | 'promise_to_pay' | 'customer_not_home' | 'refused_payment' | 'other';
      outcomeNotes: string;
      paymentAmount?: number;
      nextFollowUpDate?: Date;
    },
  ) {
    const knex = this.knexService.instance;

    // Get visit
    const visit = await knex('money_loan_collector_customer_visits')
      .where({ id: visitId, tenant_id: tenantId, collector_id: collectorId })
      .first();

    if (!visit) {
      throw new BadRequestException('Visit not found');
    }

    if (visit.status !== 'in_progress') {
      throw new BadRequestException(`Visit is already ${visit.status}`);
    }

    // Calculate visit duration
    const checkInTime = new Date(visit.check_in_time);
    const checkOutTime = new Date();
    const durationMinutes = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000);

    // Update visit
    const [updatedVisit] = await knex('money_loan_collector_customer_visits')
      .where({ id: visitId })
      .update({
        check_out_latitude: checkOutDto.latitude,
        check_out_longitude: checkOutDto.longitude,
        check_out_address: checkOutDto.address,
        check_out_time: checkOutTime,
        duration_minutes: durationMinutes,
        visit_outcome: checkOutDto.outcome,
        outcome_notes: checkOutDto.outcomeNotes,
        payment_collected_amount: checkOutDto.paymentAmount,
        next_follow_up_date: checkOutDto.nextFollowUpDate,
        status: 'completed',
        updated_at: knex.fn.now(),
      })
      .returning('*');

    return updatedVisit;
  }

  /**
   * Get today's visits for a collector
   */
  async getTodayVisits(collectorId: number, tenantId: number) {
    const knex = this.knexService.instance;
    const today = new Date().toISOString().split('T')[0];

    const visits = await knex('money_loan_collector_customer_visits as v')
      .select(
        'v.*',
        'c.first_name',
        'c.last_name',
        'c.phone_number',
        'c.id_number',
        'c.address',
      )
      .leftJoin('customers as c', 'v.customer_id', 'c.id')
      .where({ 'v.tenant_id': tenantId, 'v.collector_id': collectorId })
      .whereRaw(`DATE(v.check_in_time) = ?`, [today])
      .orderBy('v.check_in_time', 'desc');

    return visits;
  }

  /**
   * Get visit history for a customer
   */
  async getCustomerVisitHistory(
    customerId: number,
    collectorId: number,
    tenantId: number,
    options?: {
      limit?: number;
      offset?: number;
    },
  ) {
    const knex = this.knexService.instance;

    // Verify customer is assigned to this collector
    await this.collectorAssignmentService.verifyCustomerAccess(
      customerId,
      collectorId,
      tenantId,
    );

    const query = knex('money_loan_collector_customer_visits as v')
      .select(
        'v.*',
        'u.username as collector_name',
      )
      .leftJoin('users as u', 'v.collector_id', 'u.id')
      .where({ 'v.tenant_id': tenantId, 'v.customer_id': customerId })
      .orderBy('v.check_in_time', 'desc');

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    const visits = await query;

    return visits;
  }

  /**
   * Get active visit (currently in progress)
   */
  async getActiveVisit(collectorId: number, tenantId: number) {
    const knex = this.knexService.instance;

    const visit = await knex('money_loan_collector_customer_visits as v')
      .select(
        'v.*',
        'c.first_name',
        'c.last_name',
        'c.phone_number',
        'c.address',
      )
      .leftJoin('customers as c', 'v.customer_id', 'c.id')
      .where({ 'v.tenant_id': tenantId, 'v.collector_id': collectorId, 'v.status': 'in_progress' })
      .first();

    return visit;
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
