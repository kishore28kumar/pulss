import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import ExcelJS from 'exceljs';

// Helper function to calculate date range
const getDateRange = (startDate?: string, endDate?: string): { start: Date; end: Date } => {
  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required', 400);
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ============================================
// EXPORT ANALYTICS DATA (SUPER_ADMIN ONLY)
// ============================================

export const exportAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      throw new AppError('Super admin access required', 403);
    }

    const { sections, startDate, endDate, format = 'csv' } = req.query as any;

    if (!sections || !startDate || !endDate) {
      throw new AppError('Sections, startDate, and endDate are required', 400);
    }

    const { start, end } = getDateRange(startDate, endDate);
    const sectionsList = (sections as string).split(',');

    // Helper function to escape CSV and prevent CSV injection
    const escapeCSV = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Prevent CSV injection by prepending single quote to formula characters
      const sanitized = /^[=+\-@]/.test(str) ? `'${str}` : str;
      if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n')) {
        return `"${sanitized.replace(/"/g, '""')}"`;
      }
      return sanitized;
    };

    if (format === 'xlsx') {
      // Excel export
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Pulss Analytics';
      workbook.created = new Date();

      // Top Selling Products
      if (sectionsList.includes('topProducts')) {
        const topProducts = await prisma.order_items.groupBy({
          by: ['productId'],
          where: {
            orders: {
              paymentStatus: 'COMPLETED',
              createdAt: { gte: start, lte: end },
            },
          },
          _sum: { quantity: true, total: true },
          orderBy: { _sum: { quantity: 'desc' } },
        });

        const productIds = topProducts.map((p) => p.productId);
        const products = await prisma.products.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));
        const topProductsData = topProducts.map((item, index) => ({
          rank: index + 1,
          name: productMap.get(item.productId)?.name || 'Unknown',
          totalSold: item._sum.quantity || 0,
          revenue: Number((item._sum.total || 0).toFixed(2)),
        }));

        const worksheet = workbook.addWorksheet('Top Selling Products');
        worksheet.columns = [
          { header: 'Rank', key: 'rank', width: 10 },
          { header: 'Product Name', key: 'name', width: 40 },
          { header: 'Total Sold', key: 'totalSold', width: 15 },
          { header: 'Revenue', key: 'revenue', width: 20 },
        ];
        worksheet.addRows(topProductsData);
        worksheet.getRow(1).font = { bold: true };
      }

      // Global Top Searches
      if (sectionsList.includes('globalTopSearches')) {
        const orderItems = await prisma.order_items.findMany({
          where: {
            orders: { createdAt: { gte: start, lte: end } },
          },
          include: {
            orders: { select: { customerId: true } },
            products: { select: { name: true } },
          },
        });

        const searchMap = new Map<string, { count: number; uniqueUsers: Set<string> }>();
        orderItems.forEach((item) => {
          const productName = item.products?.name || 'Unknown';
          if (!searchMap.has(productName)) {
            searchMap.set(productName, { count: 0, uniqueUsers: new Set() });
          }
          const entry = searchMap.get(productName)!;
          entry.count += item.quantity;
          if (item.orders.customerId) {
            entry.uniqueUsers.add(item.orders.customerId);
          }
        });

        const topSearches = Array.from(searchMap.entries())
          .map(([searchTerm, data]) => ({
            searchTerm,
            count: data.count,
            uniqueUsers: data.uniqueUsers.size,
          }))
          .sort((a, b) => b.count - a.count)
          .map((item, index) => ({ ...item, rank: index + 1 }));

        const worksheet = workbook.addWorksheet('Global Top Searches');
        worksheet.columns = [
          { header: 'Rank', key: 'rank', width: 10 },
          { header: 'Search Term', key: 'searchTerm', width: 40 },
          { header: 'Search Count', key: 'count', width: 15 },
          { header: 'Unique Users', key: 'uniqueUsers', width: 15 },
        ];
        worksheet.addRows(topSearches);
        worksheet.getRow(1).font = { bold: true };
      }

      // Top Search Locations
      if (sectionsList.includes('topSearchLocations')) {
        const orders = await prisma.orders.findMany({
          where: {
            createdAt: { gte: start, lte: end },
          },
          select: { customerId: true, shippingAddress: true },
        });

        const locationMap = new Map<string, { count: number; uniqueUsers: Set<string> }>();
        orders
          .filter((order) => order.shippingAddress !== null && order.shippingAddress !== undefined)
          .forEach((order) => {
            const shippingAddress = order.shippingAddress as any;
            const city = shippingAddress?.city || 'Unknown';
            if (!locationMap.has(city)) {
              locationMap.set(city, { count: 0, uniqueUsers: new Set() });
            }
            const entry = locationMap.get(city)!;
            entry.count += 1;
            if (order.customerId) {
              entry.uniqueUsers.add(order.customerId);
            }
          });

        const topLocations = Array.from(locationMap.entries())
          .map(([city, data]) => ({
            city,
            count: data.count,
            uniqueUsers: data.uniqueUsers.size,
          }))
          .sort((a, b) => b.count - a.count)
          .map((item, index) => ({ ...item, rank: index + 1 }));

        const worksheet = workbook.addWorksheet('Top Search Locations');
        worksheet.columns = [
          { header: 'Rank', key: 'rank', width: 10 },
          { header: 'City', key: 'city', width: 30 },
          { header: 'Order Count', key: 'count', width: 15 },
          { header: 'Unique Users', key: 'uniqueUsers', width: 15 },
        ];
        worksheet.addRows(topLocations);
        worksheet.getRow(1).font = { bold: true };
      }

      // Tenant Performance
      if (sectionsList.includes('tenantPerformance')) {
        const tenants = await prisma.tenants.findMany({
          select: { id: true, name: true, slug: true, status: true },
        });

        const tenantPerformance = await Promise.all(
          tenants.map(async (tenant) => {
            const [revenue, orders, customers, products] = await Promise.all([
              prisma.orders.aggregate({
                where: {
                  tenantId: tenant.id,
                  createdAt: { gte: start, lte: end },
                  paymentStatus: 'COMPLETED',
                },
                _sum: { total: true },
              }),
              prisma.orders.count({
                where: { tenantId: tenant.id, createdAt: { gte: start, lte: end } },
              }),
              prisma.customers.count({
                where: { tenantId: tenant.id, createdAt: { gte: start, lte: end } },
              }),
              prisma.products.count({
                where: { tenantId: tenant.id, createdAt: { gte: start, lte: end } },
              }),
            ]);

            return {
              tenantName: tenant.name,
              tenantSlug: tenant.slug,
              status: tenant.status,
              revenue: Number((revenue._sum.total || 0).toFixed(2)),
              orders,
              customers,
              products,
            };
          })
        );

        tenantPerformance.sort((a, b) => b.revenue - a.revenue);

        const worksheet = workbook.addWorksheet('Tenant Performance');
        worksheet.columns = [
          { header: 'Tenant Name', key: 'tenantName', width: 30 },
          { header: 'Slug', key: 'tenantSlug', width: 20 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Revenue', key: 'revenue', width: 20 },
          { header: 'Orders', key: 'orders', width: 15 },
          { header: 'Customers', key: 'customers', width: 15 },
          { header: 'Products', key: 'products', width: 15 },
        ];
        worksheet.addRows(tenantPerformance);
        worksheet.getRow(1).font = { bold: true };
      }

      // Store Performance
      if (sectionsList.includes('storePerformance')) {
        const [totalRevenue, totalOrders, totalCustomers, totalProducts] = await Promise.all([
          prisma.orders.aggregate({
            where: {
              paymentStatus: 'COMPLETED',
              createdAt: { gte: start, lte: end },
            },
            _sum: { total: true },
          }),
          prisma.orders.count({
            where: { createdAt: { gte: start, lte: end } },
          }),
          prisma.customers.count({
            where: { createdAt: { gte: start, lte: end } },
          }),
          prisma.products.count({
            where: { createdAt: { gte: start, lte: end } },
          }),
        ]);

        const worksheet = workbook.addWorksheet('Store Performance');
        worksheet.columns = [
          { header: 'Metric', key: 'metric', width: 30 },
          { header: 'Value', key: 'value', width: 20 },
        ];
        worksheet.addRows([
          { metric: 'Total Revenue', value: Number((totalRevenue._sum.total || 0).toFixed(2)) },
          { metric: 'Total Orders', value: totalOrders },
          { metric: 'Total Customers', value: totalCustomers },
          { metric: 'Total Products', value: totalProducts },
        ]);
        worksheet.getRow(1).font = { bold: true };
      }

      // All Tenants Details
      if (sectionsList.includes('allTenants')) {
        const tenants = await prisma.tenants.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          include: {
            _count: {
              select: {
                users: true,
                products: true,
                orders: true,
                customers: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const tenantsData = tenants.map((tenant) => ({
          name: tenant.name,
          slug: tenant.slug,
          email: tenant.email || '',
          phone: tenant.phone || '',
          city: tenant.city || '',
          state: tenant.state || '',
          pincode: tenant.pincode || '',
          status: tenant.status,
          subscriptionPlan: tenant.subscriptionPlan || '',
          createdAt: tenant.createdAt.toISOString().split('T')[0],
          totalUsers: tenant._count.users,
          totalProducts: tenant._count.products,
          totalOrders: tenant._count.orders,
          totalCustomers: tenant._count.customers,
        }));

        const worksheet = workbook.addWorksheet('All Tenants');
        worksheet.columns = [
          { header: 'Name', key: 'name', width: 30 },
          { header: 'Slug', key: 'slug', width: 20 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Phone', key: 'phone', width: 15 },
          { header: 'City', key: 'city', width: 20 },
          { header: 'State', key: 'state', width: 20 },
          { header: 'Pincode', key: 'pincode', width: 10 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Subscription Plan', key: 'subscriptionPlan', width: 20 },
          { header: 'Created Date', key: 'createdAt', width: 15 },
          { header: 'Total Users', key: 'totalUsers', width: 15 },
          { header: 'Total Products', key: 'totalProducts', width: 15 },
          { header: 'Total Orders', key: 'totalOrders', width: 15 },
          { header: 'Total Customers', key: 'totalCustomers', width: 15 },
        ];
        worksheet.addRows(tenantsData);
        worksheet.getRow(1).font = { bold: true };
      }

      // All Customers Details
      if (sectionsList.includes('allCustomers')) {
        const customers = await prisma.customers.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            tenants: {
              select: {
                name: true,
                slug: true,
              },
            },
            addresses: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            orders: {
              select: {
                total: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const customersData = customers.map((customer) => {
          const totalOrders = customer.orders.length;
          const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.total), 0);
          const lastOrderDate = customer.orders.length > 0 
            ? customer.orders[0].createdAt.toISOString().split('T')[0]
            : '';
          const address = customer.addresses[0];
          const fullName = `${customer.users.firstName || ''} ${customer.users.lastName || ''}`.trim() || customer.users.email;

          return {
            name: fullName,
            email: customer.users.email,
            phone: customer.users.phone || '',
            tenantName: customer.tenants.name,
            tenantSlug: customer.tenants.slug,
            address: address ? `${address.line1 || ''} ${address.line2 || ''}`.trim() : '',
            city: address?.city || '',
            registrationDate: customer.createdAt.toISOString().split('T')[0],
            totalOrders,
            totalSpent: totalSpent.toFixed(2),
            lastOrderDate,
          };
        });

        const worksheet = workbook.addWorksheet('All Customers');
        worksheet.columns = [
          { header: 'Name', key: 'name', width: 30 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Phone', key: 'phone', width: 15 },
          { header: 'Tenant Name', key: 'tenantName', width: 25 },
          { header: 'Tenant Slug', key: 'tenantSlug', width: 20 },
          { header: 'Address', key: 'address', width: 40 },
          { header: 'City', key: 'city', width: 20 },
          { header: 'Registration Date', key: 'registrationDate', width: 18 },
          { header: 'Total Orders', key: 'totalOrders', width: 15 },
          { header: 'Total Spent', key: 'totalSpent', width: 15 },
          { header: 'Last Order Date', key: 'lastOrderDate', width: 18 },
        ];
        worksheet.addRows(customersData);
        worksheet.getRow(1).font = { bold: true };
      }

      // Set response headers
      const filename = `analytics-export-${startDate}-to-${endDate}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await workbook.xlsx.write(res);
      res.end();
    } else {
      // CSV export
      const csvSections: string[] = [];

      // Top Selling Products
      if (sectionsList.includes('topProducts')) {
        const topProducts = await prisma.order_items.groupBy({
          by: ['productId'],
          where: {
            orders: {
              paymentStatus: 'COMPLETED',
              createdAt: { gte: start, lte: end },
            },
          },
          _sum: { quantity: true, total: true },
          orderBy: { _sum: { quantity: 'desc' } },
        });

        const productIds = topProducts.map((p) => p.productId);
        const products = await prisma.products.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));
        const headers = ['Rank', 'Product Name', 'Total Sold', 'Revenue'];
        const rows = topProducts.map((item, index) => [
          index + 1,
          productMap.get(item.productId)?.name || 'Unknown',
          item._sum.quantity || 0,
          (item._sum.total || 0).toFixed(2),
        ]);

        csvSections.push(`Top Selling Products\n${headers.map(escapeCSV).join(',')}\n${rows.map(row => row.map(escapeCSV).join(',')).join('\n')}`);
      }

      // Global Top Searches
      if (sectionsList.includes('globalTopSearches')) {
        const orderItems = await prisma.order_items.findMany({
          where: {
            orders: { createdAt: { gte: start, lte: end } },
          },
          include: {
            orders: { select: { customerId: true } },
            products: { select: { name: true } },
          },
        });

        const searchMap = new Map<string, { count: number; uniqueUsers: Set<string> }>();
        orderItems.forEach((item) => {
          const productName = item.products?.name || 'Unknown';
          if (!searchMap.has(productName)) {
            searchMap.set(productName, { count: 0, uniqueUsers: new Set() });
          }
          const entry = searchMap.get(productName)!;
          entry.count += item.quantity;
          if (item.orders.customerId) {
            entry.uniqueUsers.add(item.orders.customerId);
          }
        });

        const topSearches = Array.from(searchMap.entries())
          .map(([searchTerm, data]) => ({
            searchTerm,
            count: data.count,
            uniqueUsers: data.uniqueUsers.size,
          }))
          .sort((a, b) => b.count - a.count);

        const headers = ['Rank', 'Search Term', 'Search Count', 'Unique Users'];
        const rows = topSearches.map((item, index) => [
          index + 1,
          item.searchTerm,
          item.count,
          item.uniqueUsers,
        ]);

        csvSections.push(`Global Top Searches\n${headers.map(escapeCSV).join(',')}\n${rows.map(row => row.map(escapeCSV).join(',')).join('\n')}`);
      }

      // Top Search Locations
      if (sectionsList.includes('topSearchLocations')) {
        const orders = await prisma.orders.findMany({
          where: {
            createdAt: { gte: start, lte: end },
          },
          select: { customerId: true, shippingAddress: true },
        });

        const locationMap = new Map<string, { count: number; uniqueUsers: Set<string> }>();
        orders
          .filter((order) => order.shippingAddress !== null && order.shippingAddress !== undefined)
          .forEach((order) => {
            const shippingAddress = order.shippingAddress as any;
            const city = shippingAddress?.city || 'Unknown';
            if (!locationMap.has(city)) {
              locationMap.set(city, { count: 0, uniqueUsers: new Set() });
            }
            const entry = locationMap.get(city)!;
            entry.count += 1;
            if (order.customerId) {
              entry.uniqueUsers.add(order.customerId);
            }
          });

        const topLocations = Array.from(locationMap.entries())
          .map(([city, data]) => ({
            city,
            count: data.count,
            uniqueUsers: data.uniqueUsers.size,
          }))
          .sort((a, b) => b.count - a.count);

        const headers = ['Rank', 'City', 'Order Count', 'Unique Users'];
        const rows = topLocations.map((item, index) => [
          index + 1,
          item.city,
          item.count,
          item.uniqueUsers,
        ]);

        csvSections.push(`Top Search Locations\n${headers.map(escapeCSV).join(',')}\n${rows.map(row => row.map(escapeCSV).join(',')).join('\n')}`);
      }

      // Tenant Performance
      if (sectionsList.includes('tenantPerformance')) {
        const tenants = await prisma.tenants.findMany({
          select: { id: true, name: true, slug: true, status: true },
        });

        const tenantPerformance = await Promise.all(
          tenants.map(async (tenant) => {
            const [revenue, orders, customers, products] = await Promise.all([
              prisma.orders.aggregate({
                where: {
                  tenantId: tenant.id,
                  createdAt: { gte: start, lte: end },
                  paymentStatus: 'COMPLETED',
                },
                _sum: { total: true },
              }),
              prisma.orders.count({
                where: { tenantId: tenant.id, createdAt: { gte: start, lte: end } },
              }),
              prisma.customers.count({
                where: { tenantId: tenant.id, createdAt: { gte: start, lte: end } },
              }),
              prisma.products.count({
                where: { tenantId: tenant.id, createdAt: { gte: start, lte: end } },
              }),
            ]);

            return {
              tenantName: tenant.name,
              tenantSlug: tenant.slug,
              status: tenant.status,
              revenue: (revenue._sum.total || 0).toFixed(2),
              orders,
              customers,
              products,
            };
          })
        );

        tenantPerformance.sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

        const headers = ['Tenant Name', 'Slug', 'Status', 'Revenue', 'Orders', 'Customers', 'Products'];
        const rows = tenantPerformance.map((item) => [
          item.tenantName,
          item.tenantSlug,
          item.status,
          item.revenue,
          item.orders,
          item.customers,
          item.products,
        ]);

        csvSections.push(`Tenant Performance\n${headers.map(escapeCSV).join(',')}\n${rows.map(row => row.map(escapeCSV).join(',')).join('\n')}`);
      }

      // Store Performance
      if (sectionsList.includes('storePerformance')) {
        const [totalRevenue, totalOrders, totalCustomers, totalProducts] = await Promise.all([
          prisma.orders.aggregate({
            where: {
              paymentStatus: 'COMPLETED',
              createdAt: { gte: start, lte: end },
            },
            _sum: { total: true },
          }),
          prisma.orders.count({
            where: { createdAt: { gte: start, lte: end } },
          }),
          prisma.customers.count({
            where: { createdAt: { gte: start, lte: end } },
          }),
          prisma.products.count({
            where: { createdAt: { gte: start, lte: end } },
          }),
        ]);

        const headers = ['Metric', 'Value'];
        const rows = [
          ['Total Revenue', (totalRevenue._sum.total || 0).toFixed(2)],
          ['Total Orders', totalOrders],
          ['Total Customers', totalCustomers],
          ['Total Products', totalProducts],
        ];

        csvSections.push(`Store Performance\n${headers.map(escapeCSV).join(',')}\n${rows.map(row => row.map(escapeCSV).join(',')).join('\n')}`);
      }

      // All Tenants Details
      if (sectionsList.includes('allTenants')) {
        const tenants = await prisma.tenants.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          include: {
            _count: {
              select: {
                users: true,
                products: true,
                orders: true,
                customers: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const headers = [
          'Name',
          'Slug',
          'Email',
          'Phone',
          'City',
          'State',
          'Pincode',
          'Status',
          'Subscription Plan',
          'Created Date',
          'Total Users',
          'Total Products',
          'Total Orders',
          'Total Customers',
        ];
        const rows = tenants.map((tenant) => [
          tenant.name,
          tenant.slug,
          tenant.email || '',
          tenant.phone || '',
          tenant.city || '',
          tenant.state || '',
          tenant.pincode || '',
          tenant.status,
          tenant.subscriptionPlan || '',
          tenant.createdAt.toISOString().split('T')[0],
          tenant._count.users,
          tenant._count.products,
          tenant._count.orders,
          tenant._count.customers,
        ]);

        csvSections.push(`All Tenants Details\n${headers.map(escapeCSV).join(',')}\n${rows.map(row => row.map(escapeCSV).join(',')).join('\n')}`);
      }

      // All Customers Details
      if (sectionsList.includes('allCustomers')) {
        const customers = await prisma.customers.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            tenants: {
              select: {
                name: true,
                slug: true,
              },
            },
            addresses: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            orders: {
              select: {
                total: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const headers = [
          'Name',
          'Email',
          'Phone',
          'Tenant Name',
          'Tenant Slug',
          'Address',
          'City',
          'Registration Date',
          'Total Orders',
          'Total Spent',
          'Last Order Date',
        ];
        const rows = customers.map((customer) => {
          const totalOrders = customer.orders.length;
          const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.total), 0);
          const lastOrderDate = customer.orders.length > 0 
            ? customer.orders[0].createdAt.toISOString().split('T')[0]
            : '';
          const address = customer.addresses[0];
          const fullName = `${customer.users.firstName || ''} ${customer.users.lastName || ''}`.trim() || customer.users.email;

          return [
            fullName,
            customer.users.email,
            customer.users.phone || '',
            customer.tenants.name,
            customer.tenants.slug,
            address ? `${address.line1 || ''} ${address.line2 || ''}`.trim() : '',
            address?.city || '',
            customer.createdAt.toISOString().split('T')[0],
            totalOrders,
            totalSpent.toFixed(2),
            lastOrderDate,
          ];
        });

        csvSections.push(`All Customers Details\n${headers.map(escapeCSV).join(',')}\n${rows.map(row => row.map(escapeCSV).join(',')).join('\n')}`);
      }

      const csvContent = csvSections.join('\n\n');
      const filename = `analytics-export-${startDate}-to-${endDate}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.send('\ufeff' + csvContent); // BOM for Excel UTF-8 support
    }
  }
);

