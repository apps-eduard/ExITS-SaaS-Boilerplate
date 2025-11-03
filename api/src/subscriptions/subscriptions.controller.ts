import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @Permissions('subscriptions:read', 'subscriptions:manage-plans')
  async listPlans() {
    const plans = await this.subscriptionsService.listPlans();
    return {
      success: true,
      data: plans,
    };
  }

  @Post('plans')
  @Permissions('subscriptions:manage-plans')
  async createPlan(@Body() dto: CreatePlanDto) {
    const plan = await this.subscriptionsService.createPlan(dto);
    return {
      success: true,
      data: plan,
    };
  }

  @Put('plans/:id')
  @Permissions('subscriptions:manage-plans')
  async updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanDto,
  ) {
    const plan = await this.subscriptionsService.updatePlan(id, dto);
    return {
      success: true,
      data: plan,
    };
  }

  @Delete('plans/:id')
  @Permissions('subscriptions:manage-plans')
  async deletePlan(@Param('id', ParseIntPipe) id: number) {
    await this.subscriptionsService.deletePlan(id);
    return {
      success: true,
    };
  }
}
