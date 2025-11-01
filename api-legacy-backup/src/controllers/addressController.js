/**
 * Philippine Address Controller
 * Handles CRUD operations for Philippine addresses
 */

const db = require('../config/database');

/**
 * Get all addresses for a tenant
 * @route GET /api/addresses
 */
exports.getAllAddresses = async (req, res) => {
  try {
    const { tenant_id } = req.user;
    const { type, status, is_primary } = req.query;

    let query = `
      SELECT 
        pa.*,
        CONCAT_WS(', ',
          NULLIF(CONCAT_WS(' ', pa.unit_number, pa.house_number, pa.street_name), ''),
          pa.barangay,
          pa.city_municipality,
          pa.province,
          CASE
            WHEN pa.region = 'NCR' THEN 'Metro Manila'
            WHEN pa.region = 'CAR' THEN 'Cordillera Administrative Region'
            WHEN pa.region = 'Region_I' THEN 'Ilocos Region'
            WHEN pa.region = 'Region_II' THEN 'Cagayan Valley'
            WHEN pa.region = 'Region_III' THEN 'Central Luzon'
            WHEN pa.region = 'Region_IV_A' THEN 'CALABARZON'
            WHEN pa.region = 'Region_IV_B' THEN 'MIMAROPA'
            WHEN pa.region = 'Region_V' THEN 'Bicol Region'
            WHEN pa.region = 'Region_VI' THEN 'Western Visayas'
            WHEN pa.region = 'Region_VII' THEN 'Central Visayas'
            WHEN pa.region = 'Region_VIII' THEN 'Eastern Visayas'
            WHEN pa.region = 'Region_IX' THEN 'Zamboanga Peninsula'
            WHEN pa.region = 'Region_X' THEN 'Northern Mindanao'
            WHEN pa.region = 'Region_XI' THEN 'Davao Region'
            WHEN pa.region = 'Region_XII' THEN 'SOCCSKSARGEN'
            WHEN pa.region = 'Region_XIII' THEN 'Caraga'
            WHEN pa.region = 'BARMM' THEN 'Bangsamoro Autonomous Region'
            ELSE pa.region::TEXT
          END,
          pa.zip_code
        ) AS formatted_address
      FROM addresses pa
      WHERE pa.tenant_id = $1 
        AND pa.deleted_at IS NULL
    `;

    const params = [tenant_id];
    let paramIndex = 2;

    if (type) {
      query += ` AND pa.address_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      query += ` AND pa.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (is_primary !== undefined) {
      query += ` AND pa.is_primary = $${paramIndex}`;
      params.push(is_primary === 'true');
      paramIndex++;
    }

    query += ' ORDER BY pa.is_primary DESC, pa.created_at DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
      error: error.message
    });
  }
};

/**
 * Get address by ID
 * @route GET /api/addresses/:id
 */
exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    const result = await db.query(
      `SELECT * FROM addresses 
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [id, tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch address',
      error: error.message
    });
  }
};

/**
 * Create new address
 * @route POST /api/addresses
 */
exports.createAddress = async (req, res) => {
  const client = await db.getClient();
  
  try {
    const requesting_user_id = req.userId; // System admin or tenant admin creating the address
    const {
      userId,
      addressType,
      street,
      barangay,
      cityMunicipality,
      province,
      region,
      zipCode,
      country,
      isPrimary,
      // Also support snake_case for backward compatibility
      address_type,
      is_primary,
      label,
      unit_number,
      house_number,
      street_name,
      city_municipality,
      zip_code,
      latitude,
      longitude,
      landmark,
      delivery_instructions,
      contact_person,
      contact_phone
    } = req.body;

    // Get the user's tenant_id to associate the address
    const userResult = await db.query(
      'SELECT tenant_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const tenant_id = userResult.rows[0].tenant_id;

    // Normalize field names (support both camelCase and snake_case)
    const finalBarangay = barangay;
    const finalCityMunicipality = cityMunicipality || city_municipality;
    const finalProvince = province;
    const finalRegion = region;

    // Validation
    if (!finalBarangay || !finalCityMunicipality || !finalProvince || !finalRegion) {
      return res.status(400).json({
        success: false,
        message: 'Barangay, City/Municipality, Province, and Region are required'
      });
    }

    await client.query('BEGIN');

    // Normalize values
    const finalAddressType = addressType || address_type || 'home';
    const finalIsPrimary = isPrimary !== undefined ? isPrimary : (is_primary || false);
    const finalStreet = street || street_name;
    const finalZipCode = zipCode || zip_code;

    // If setting as primary, unset other primary addresses
    if (finalIsPrimary) {
      await client.query(
        `UPDATE addresses 
         SET is_primary = FALSE 
         WHERE tenant_id = $1 AND address_type = $2 AND is_primary = TRUE`,
        [tenant_id, finalAddressType]
      );
    }

    const result = await client.query(
      `INSERT INTO addresses (
        tenant_id, address_type, is_primary, label,
        unit_number, house_number, street_name, barangay,
        city_municipality, province, region, zip_code,
        latitude, longitude, landmark, delivery_instructions,
        contact_person, contact_phone, created_by, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        tenant_id,
        finalAddressType,
        finalIsPrimary,
        label,
        unit_number,
        house_number,
        finalStreet,
        finalBarangay,
        finalCityMunicipality,
        finalProvince,
        finalRegion,
        finalZipCode,
        latitude,
        longitude,
        landmark,
        delivery_instructions,
        contact_person,
        contact_phone,
        requesting_user_id,
        userId // The user this address belongs to
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error creating address:', error);
    console.error('Error details:', {
      message: error.message,
      detail: error.detail,
      hint: error.hint,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create address',
      error: error.message,
      detail: error.detail
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * Update address
 * @route PUT /api/addresses/:id
 */
exports.updateAddress = async (req, res) => {
  const client = await db.getClient();
  
  try {
    const { id } = req.params;
    const { tenant_id, id: user_id } = req.user;
    const {
      address_type,
      is_primary,
      label,
      unit_number,
      house_number,
      street_name,
      barangay,
      city_municipality,
      province,
      region,
      zip_code,
      latitude,
      longitude,
      landmark,
      delivery_instructions,
      contact_person,
      contact_phone,
      status
    } = req.body;

    // Check if address exists
    const checkResult = await client.query(
      'SELECT * FROM addresses WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [id, tenant_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await client.query('BEGIN');

    // If setting as primary, unset other primary addresses
    if (is_primary) {
      await client.query(
        `UPDATE addresses 
         SET is_primary = FALSE 
         WHERE tenant_id = $1 AND address_type = $2 AND is_primary = TRUE AND id != $3`,
        [tenant_id, address_type || checkResult.rows[0].address_type, id]
      );
    }

    const result = await client.query(
      `UPDATE addresses 
       SET 
         address_type = COALESCE($1, address_type),
         is_primary = COALESCE($2, is_primary),
         label = COALESCE($3, label),
         unit_number = COALESCE($4, unit_number),
         house_number = COALESCE($5, house_number),
         street_name = COALESCE($6, street_name),
         barangay = COALESCE($7, barangay),
         city_municipality = COALESCE($8, city_municipality),
         province = COALESCE($9, province),
         region = COALESCE($10, region),
         zip_code = COALESCE($11, zip_code),
         latitude = COALESCE($12, latitude),
         longitude = COALESCE($13, longitude),
         landmark = COALESCE($14, landmark),
         delivery_instructions = COALESCE($15, delivery_instructions),
         contact_person = COALESCE($16, contact_person),
         contact_phone = COALESCE($17, contact_phone),
         status = COALESCE($18, status),
         updated_by = $19,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $20 AND tenant_id = $21
       RETURNING *`,
      [
        address_type,
        is_primary,
        label,
        unit_number,
        house_number,
        street_name,
        barangay,
        city_municipality,
        province,
        region,
        zip_code,
        latitude,
        longitude,
        landmark,
        delivery_instructions,
        contact_person,
        contact_phone,
        status,
        user_id,
        id,
        tenant_id
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Delete address (soft delete)
 * @route DELETE /api/addresses/:id
 */
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    const result = await db.query(
      `UPDATE addresses 
       SET deleted_at = CURRENT_TIMESTAMP, status = 'deleted'
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message
    });
  }
};

/**
 * Set address as primary
 * @route PATCH /api/addresses/:id/set-primary
 */
exports.setPrimaryAddress = async (req, res) => {
  const client = await db.getClient();
  
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    // Check if address exists
    const checkResult = await client.query(
      'SELECT address_type FROM addresses WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [id, tenant_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await client.query('BEGIN');

    // Unset other primary addresses of the same type
    await client.query(
      `UPDATE addresses 
       SET is_primary = FALSE 
       WHERE tenant_id = $1 AND address_type = $2 AND is_primary = TRUE`,
      [tenant_id, checkResult.rows[0].address_type]
    );

    // Set this address as primary
    const result = await client.query(
      `UPDATE addresses 
       SET is_primary = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenant_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Address set as primary',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting primary address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set primary address',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Verify address
 * @route PATCH /api/addresses/:id/verify
 */
exports.verifyAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id, id: user_id } = req.user;

    const result = await db.query(
      `UPDATE addresses 
       SET is_verified = TRUE, 
           verified_at = CURRENT_TIMESTAMP,
           verified_by = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [user_id, id, tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      message: 'Address verified successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error verifying address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify address',
      error: error.message
    });
  }
};

/**
 * Get Philippine regions list
 * @route GET /api/addresses/regions
 */
exports.getRegions = async (req, res) => {
  try {
    const regions = [
      { code: 'NCR', name: 'National Capital Region (Metro Manila)' },
      { code: 'CAR', name: 'Cordillera Administrative Region' },
      { code: 'Region_I', name: 'Region I - Ilocos Region' },
      { code: 'Region_II', name: 'Region II - Cagayan Valley' },
      { code: 'Region_III', name: 'Region III - Central Luzon' },
      { code: 'Region_IV_A', name: 'Region IV-A - CALABARZON' },
      { code: 'Region_IV_B', name: 'Region IV-B - MIMAROPA' },
      { code: 'Region_V', name: 'Region V - Bicol Region' },
      { code: 'Region_VI', name: 'Region VI - Western Visayas' },
      { code: 'Region_VII', name: 'Region VII - Central Visayas' },
      { code: 'Region_VIII', name: 'Region VIII - Eastern Visayas' },
      { code: 'Region_IX', name: 'Region IX - Zamboanga Peninsula' },
      { code: 'Region_X', name: 'Region X - Northern Mindanao' },
      { code: 'Region_XI', name: 'Region XI - Davao Region' },
      { code: 'Region_XII', name: 'Region XII - SOCCSKSARGEN' },
      { code: 'Region_XIII', name: 'Region XIII - Caraga' },
      { code: 'BARMM', name: 'Bangsamoro Autonomous Region in Muslim Mindanao' }
    ];

    res.json({
      success: true,
      data: regions
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regions',
      error: error.message
    });
  }
};
