import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('Insufficient funds.');
    }

    let relatedCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!relatedCategory) {
      relatedCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(relatedCategory);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: relatedCategory,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
