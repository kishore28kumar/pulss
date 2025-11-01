const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { tenantMiddleware, enforceTenantIsolation } = require('../middleware/tenant');

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(enforceTenantIsolation);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     tags: [Customers]
 *     summary: Get all customers
 *     description: Retrieve a list of all customers for the authenticated tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Not authenticated
 */
router.get('/', customersController.getCustomers);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer by ID
 *     description: Retrieve detailed information about a specific customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Customer not found
 */
router.get('/:id', customersController.getCustomer);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     tags: [Customers]
 *     summary: Create a new customer (Admin only)
 *     description: Add a new customer to the tenant's customer base
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: +919876543210
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', requireRole('admin', 'super_admin'), customersController.createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     tags: [Customers]
 *     summary: Update customer (Admin only)
 *     description: Update customer information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Customer not found
 */
router.put('/:id', requireRole('admin', 'super_admin'), customersController.updateCustomer);

/**
 * @swagger
 * /api/customers/{id}/stats:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer statistics
 *     description: Get purchase history, loyalty points, and other stats for a customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Customer stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_orders:
 *                   type: integer
 *                 total_spent:
 *                   type: number
 *                 loyalty_points:
 *                   type: integer
 *                 avg_order_value:
 *                   type: number
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Customer not found
 */
router.get('/:id/stats', customersController.getCustomerStats);

module.exports = router;
