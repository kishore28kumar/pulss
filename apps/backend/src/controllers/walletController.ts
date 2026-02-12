import { Request, Response } from 'express';
import { prisma } from '@pulss/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { CreateWalletTransactionDTO, WalletTransactionType } from '@pulss/types';

// Get wallet history for a customer
export const getWalletHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params; // Customer ID
    const tenantId = req.tenantId;

    if (!tenantId) {
      throw new AppError('Tenant ID is required', 400);
    }

    const history = await prisma.wallet_transactions.findMany({
      where: {
        customerId: id,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: history,
    });
  }
);

// Manually update wallet balance (Admin only)
export const updateWalletBalance = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params; // Customer ID
    const tenantId = req.tenantId;
    const { amount, type, description, referenceId }: CreateWalletTransactionDTO = req.body;

    if (!tenantId) {
      throw new AppError('Tenant ID is required', 400);
    }

    if (!amount || amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    if (!Object.values(WalletTransactionType).includes(type)) {
      throw new AppError('Invalid transaction type', 400);
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get current customer balance
      const customer = await tx.customers.findUnique({
        where: { id },
      });

      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      if (customer.tenantId !== tenantId) {
        throw new AppError('Customer does not belong to this tenant', 403);
      }

      // Calculate new balance
      let newBalance = customer.creditBalance;
      if (type === WalletTransactionType.CREDIT) {
        newBalance += amount;
      } else if (type === WalletTransactionType.DEBIT) {
        // Allow negative balance? Usually Debit means subtract.
        // User didn't specify strict limits, but usually we subtract.
        newBalance -= amount;
      } else if (type === WalletTransactionType.REFUND) {
        // Refund usually adds money back to wallet
        newBalance += amount;
      }

      // Update customer balance
      await tx.customers.update({
        where: { id },
        data: { creditBalance: newBalance },
      });

      // Create transaction record
      const transaction = await tx.wallet_transactions.create({
        data: {
          tenantId,
          customerId: id,
          amount,
          type,
          description,
          referenceId,
        },
      });

      return { newBalance, transaction };
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Wallet updated successfully',
    });
  }
);
