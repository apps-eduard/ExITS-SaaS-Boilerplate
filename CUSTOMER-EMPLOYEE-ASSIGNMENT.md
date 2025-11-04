# Customer-Employee Assignment System

## Overview

The Customer-Employee Assignment System is a comprehensive UI feature for the Money Loan platform that enables efficient management of customer assignments to collection employees. This system streamlines the payment collection workflow by ensuring each employee can see only their assigned customers.

## 🎯 Key Features

### 1. **Assignment Management Modal**
- **Two-Step Process**: 
  - Step 1: Select an employee from a searchable grid
  - Step 2: Select customers to assign to that employee
- **Real-time Search**: Search employees and customers by name, email, code, or phone
- **Smart Filtering**: Filter customers by assignment status (All/Unassigned/Already Assigned)
- **Bulk Selection**: Select all visible customers or only unassigned ones
- **Visual Feedback**: Shows current assignments and employee workload

### 2. **Enhanced Customers List**
- **Assigned Employee Column**: Display who is assigned to each customer
- **Employee Filter Dropdown**: Filter customers by assigned employee
- **Quick Assign Action**: Individual "Assign to Employee" button per customer
- **Bulk Assign Button**: Global "Assign to Employee" button in header
- **Visual Indicators**: 
  - Purple gradient avatar for assigned employees
  - Gray "Unassigned" badge for customers without assignment

### 3. **Collection Workflow Integration**
- Employees can filter and view only their assigned customers
- Payment collection screens can automatically filter by logged-in employee
- Assignment tracking for performance monitoring
- Assignment history and audit trail support

## 📁 Files Created

### 1. Customer Assignment Modal Component
**Path**: `web/src/app/features/platforms/money-loan/admin/customer-assignment-modal.component.ts`

**Features**:
- Standalone Angular component with signals
- Two-column employee grid with search
- Customer list with checkboxes for multi-selection
- Filter by assignment status (all/unassigned/assigned)
- Quick select actions (select all visible, select unassigned)
- Employee info display (name, email, phone, active assignments)
- Customer info display (name, code, phone, email, current assignment)
- Loading states for both employees and customers
- Save/cancel with API integration
- Toast notifications for success/error states

**Component Inputs/Outputs**:
```typescript
@Output() closed = new EventEmitter<void>();
@Output() assigned = new EventEmitter<{ employeeId: number; customerIds: number[] }>();
```

**Public Methods**:
```typescript
open()  // Opens the modal
close() // Closes the modal and resets state
```

## 📝 Files Modified

### 1. Customers List Component
**Path**: `web/src/app/features/platforms/money-loan/admin/customers-list.component.ts`

**Changes**:
- Added "Assign to Employee" button in header
- Added employee filter dropdown in filters section
- Added "Assigned Employee" column in table
- Added quick assign action button per customer row
- Integrated CustomerAssignmentModalComponent
- Added `@ViewChild` for modal reference
- Added employee loading on init
- Updated filters to include employeeId
- Added assignment event handlers

**New Properties**:
```typescript
@ViewChild('assignmentModal') assignmentModal!: CustomerAssignmentModalComponent;
employees = signal<any[]>([]);
filterEmployee = '';
```

**New Methods**:
```typescript
loadEmployees()
openAssignmentModal()
quickAssign(customerId: number)
onAssignmentModalClosed()
onCustomersAssigned(event)
getEmployeeInitials(fullName: string)
```

### 2. Loan Customer Model
**Path**: `web/src/app/features/platforms/money-loan/shared/models/loan.models.ts`

**Changes**:
- Added `assignedEmployeeId?: number` - ID of assigned employee
- Added `assignedEmployeeName?: string` - Name of assigned employee for display

### 3. Customer Service
**Path**: `web/src/app/features/platforms/money-loan/shared/services/customer.service.ts`

**Changes**:
- Added `employeeId?: string` to listCustomers filter parameters
- Supports filtering customers by assigned employee

## 🔌 API Integration

### Required Endpoints

#### 1. Get Employees for Money Loan Platform
```http
GET /api/platforms/money-loan/employees
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "activeAssignments": 15
    }
  ]
}
```

#### 2. Assign Customers to Employee
```http
POST /api/platforms/money-loan/assignments
```

**Request Body**:
```json
{
  "employeeId": 1,
  "customerIds": [10, 20, 30, 40]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully assigned 4 customers to John Doe",
  "data": {
    "employeeId": 1,
    "assignedCount": 4,
    "assignments": [
      { "customerId": 10, "employeeId": 1, "assignedAt": "2024-01-15T10:30:00Z" },
      { "customerId": 20, "employeeId": 1, "assignedAt": "2024-01-15T10:30:00Z" }
    ]
  }
}
```

#### 3. Get Customers with Filters (Enhanced)
```http
GET /api/platforms/money-loan/customers?employeeId=1&limit=100
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `status`: Customer status filter
- `kycStatus`: KYC status filter
- `employeeId`: Filter by assigned employee (new parameter)
- `employeeId=unassigned`: Special value to get unassigned customers

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "customerCode": "CUST-001",
      "firstName": "Jane",
      "lastName": "Smith",
      "phone": "+1234567890",
      "email": "jane@example.com",
      "assignedEmployeeId": 1,
      "assignedEmployeeName": "John Doe",
      // ... other customer fields
    }
  ],
  "pagination": {
    "total": 100,
    "pages": 10,
    "page": 1,
    "limit": 10
  }
}
```

## 🎨 UI/UX Details

### Assignment Modal Design

**Modal Layout**:
- Fixed width: `max-w-4xl`
- Max height: `90vh` with scrolling
- Backdrop: Semi-transparent black with blur
- Two-column employee grid (responsive to single column on mobile)
- Scrollable customer list with max-height `96` (384px)

**Visual Hierarchy**:
1. **Step 1 - Employee Selection**:
   - Number badge (blue gradient circle with "1")
   - Employee cards in 2-column grid
   - Purple-pink gradient avatars with initials
   - Active assignments count badge
   - Selected employee has blue ring and highlight

2. **Step 2 - Customer Selection**:
   - Number badge (green gradient circle with "2")
   - Selected employee info card (blue background)
   - Customer search with assignment filter dropdown
   - Customer list with checkboxes
   - Blue-purple gradient avatars
   - Yellow badge for already assigned customers

**Color Coding**:
- **Purple/Pink**: Employee avatars and assignment actions
- **Blue**: Selected state, primary actions
- **Green**: Step 2 indicator, success states
- **Yellow**: Already assigned warning
- **Gray**: Unassigned state

### Customers List Enhancements

**Table Columns** (9 total):
1. Customer (avatar + name + ID)
2. Code (monospace font with emoji)
3. Contact (phone + email)
4. **Assigned Employee** (NEW - avatar + name or "Unassigned" badge)
5. Status (colored badge)
6. KYC (colored badge)
7. Active Loans (number)
8. Credit Score (progress bar)
9. Actions (4 buttons)

**Action Buttons** (left to right):
1. 👥 **Assign** (purple) - Quick assign to employee
2. 👁️ **View** (blue) - View customer details
3. ✏️ **Edit** (green) - Edit customer

**Filter Section** (5 columns):
1. Search (name, code, phone)
2. **Assigned Employee** (NEW - dropdown with employees + "Unassigned" option)
3. Status (active/inactive/blocked)
4. KYC Status (verified/pending/rejected)
5. Reset button

## 💡 Usage Examples

### Opening the Assignment Modal

**From Header Button**:
```typescript
// User clicks "Assign to Employee" button
// Opens modal with no pre-selection
openAssignmentModal()
```

**Quick Assign from Customer Row**:
```typescript
// User clicks assign icon next to specific customer
// Opens modal (can be enhanced to pre-select customer)
quickAssign(customerId: number)
```

### Filtering Customers by Employee

**Filter Dropdown Options**:
- "All Employees" - Show all customers
- "Unassigned" - Show only unassigned customers
- Individual employees - Show customers assigned to specific employee

### Assignment Workflow

**Step-by-Step Process**:
1. User opens assignment modal
2. User searches/selects an employee (e.g., "John Doe")
3. Employee card highlights, Step 2 appears
4. User sees blue info card: "Assigning to: John Doe"
5. User searches customers (optional)
6. User filters by "Unassigned Only" (optional)
7. User clicks "Select Unassigned" quick action
8. User reviews selected customers count
9. User clicks "Assign Customers" button
10. API call is made
11. Success toast appears: "Successfully assigned 4 customer(s) to John Doe"
12. Modal closes
13. Customer list refreshes to show new assignments

## 🔧 Backend Implementation Guide

### Database Schema

**Table: customer_assignments**
```sql
CREATE TABLE customer_assignments (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  customer_id INTEGER NOT NULL REFERENCES loan_customers(id),
  employee_id INTEGER NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by INTEGER REFERENCES users(id),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active', -- active, reassigned, removed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(customer_id, status) -- Only one active assignment per customer
);

CREATE INDEX idx_assignments_employee ON customer_assignments(employee_id);
CREATE INDEX idx_assignments_customer ON customer_assignments(customer_id);
CREATE INDEX idx_assignments_tenant ON customer_assignments(tenant_id);
```

### API Controller Examples

**Assignment Controller** (`api/src/controllers/AssignmentController.js`):

```javascript
// POST /api/platforms/money-loan/assignments
async assignCustomers(req, res) {
  const { employeeId, customerIds } = req.body;
  const tenantId = req.user.tenantId;
  const assignedBy = req.user.id;
  
  try {
    // Validate employee exists and belongs to tenant
    const employee = await User.findOne({ 
      where: { id: employeeId, tenantId } 
    });
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }
    
    // Mark old assignments as reassigned
    await CustomerAssignment.update(
      { status: 'reassigned' },
      { where: { customerId: customerIds, status: 'active' } }
    );
    
    // Create new assignments
    const assignments = customerIds.map(customerId => ({
      tenantId,
      customerId,
      employeeId,
      assignedBy,
      status: 'active'
    }));
    
    await CustomerAssignment.bulkCreate(assignments);
    
    res.json({
      success: true,
      message: `Successfully assigned ${customerIds.length} customers to ${employee.firstName} ${employee.lastName}`,
      data: {
        employeeId,
        assignedCount: customerIds.length
      }
    });
  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to assign customers' 
    });
  }
}
```

**Enhanced Customer Controller**:

```javascript
// GET /api/platforms/money-loan/customers
async listCustomers(req, res) {
  const { employeeId, page = 1, limit = 10, search, status, kycStatus } = req.query;
  const tenantId = req.user.tenantId;
  
  try {
    const where = { tenantId };
    
    // Add filters
    if (status) where.status = status;
    if (kycStatus) where.kycStatus = kycStatus;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { customerCode: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Build query with assignment join
    const include = [{
      model: CustomerAssignment,
      as: 'assignment',
      where: { status: 'active' },
      required: false,
      include: [{
        model: User,
        as: 'employee',
        attributes: ['id', 'firstName', 'lastName']
      }]
    }];
    
    // Filter by employee
    if (employeeId) {
      if (employeeId === 'unassigned') {
        // Only customers without active assignment
        include[0].required = false;
        include[0].where = { status: null };
      } else {
        // Customers assigned to specific employee
        include[0].required = true;
        include[0].where.employeeId = employeeId;
      }
    }
    
    const { rows, count } = await LoanCustomer.findAndCountAll({
      where,
      include,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });
    
    // Format response with assignment data
    const customers = rows.map(customer => ({
      ...customer.toJSON(),
      assignedEmployeeId: customer.assignment?.employeeId,
      assignedEmployeeName: customer.assignment?.employee 
        ? `${customer.assignment.employee.firstName} ${customer.assignment.employee.lastName}`
        : null
    }));
    
    res.json({
      success: true,
      data: customers,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch customers' 
    });
  }
}
```

## 🚀 Future Enhancements

### Phase 1 (Current Implementation)
- ✅ Basic assignment modal
- ✅ Employee selection
- ✅ Customer multi-selection
- ✅ Filter by assigned employee
- ✅ Visual indicators

### Phase 2 (Recommended)
- [ ] Assignment history tracking
- [ ] Reassignment with reason notes
- [ ] Bulk unassign action
- [ ] Assignment analytics dashboard
- [ ] Employee workload balancing suggestions

### Phase 3 (Advanced)
- [ ] Auto-assignment based on rules (geography, customer type, etc.)
- [ ] Assignment notifications (email/SMS to employee)
- [ ] Employee performance metrics by assignments
- [ ] Customer grouping/territory management
- [ ] Assignment scheduling (future-dated assignments)

### Phase 4 (Integration)
- [ ] Mobile app support for employees to view assignments
- [ ] Collection route optimization
- [ ] Assignment-based commission calculations
- [ ] Integration with payment collection workflow
- [ ] Real-time assignment updates via WebSocket

## 🎓 Best Practices

### Assignment Strategy
1. **Geographical Clustering**: Assign customers in same area to one employee
2. **Workload Balancing**: Distribute customers evenly across employees
3. **Expertise Matching**: Assign high-risk customers to experienced employees
4. **Performance-Based**: Route difficult collections to top performers

### Data Integrity
1. **Single Active Assignment**: Ensure one customer has only one active employee
2. **Audit Trail**: Track all assignment changes with timestamp and user
3. **Soft Deletion**: Mark assignments as 'reassigned' instead of deleting
4. **Tenant Isolation**: Always filter by tenantId in multi-tenant setup

### User Experience
1. **Quick Actions**: One-click assign for individual customers
2. **Bulk Operations**: Multi-select for assigning many customers at once
3. **Search & Filter**: Help users find the right customers quickly
4. **Visual Feedback**: Clear indicators of assignment status
5. **Confirmation**: Show success messages after assignments

## 📱 Mobile Considerations

When implementing mobile view for employees:

```typescript
// Employee mobile view - My Assigned Customers
GET /api/platforms/money-loan/my-assignments

Response:
{
  "success": true,
  "data": {
    "employee": { "id": 1, "name": "John Doe" },
    "totalAssignments": 25,
    "todaysDue": 5,
    "overdue": 3,
    "customers": [
      // Assigned customers with loan/payment details
    ]
  }
}
```

## 📊 Reporting & Analytics

Suggested reports for assignment effectiveness:

1. **Employee Assignment Report**: Number of customers per employee
2. **Collection Efficiency**: Success rate by assigned employee
3. **Assignment Timeline**: How long customers stay assigned
4. **Unassigned Customers**: Track customers without assignments
5. **Reassignment Frequency**: How often customers change employees

---

**Implementation Status**: ✅ **Complete - Frontend Ready**

**Next Steps**: 
1. Implement backend API endpoints
2. Test assignment workflow end-to-end
3. Add assignment analytics
4. Integrate with mobile app
5. Implement auto-assignment rules

**Questions or Issues?** 
Check the component files or create an issue in the project repository.
