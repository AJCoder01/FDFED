import {
  Global,
  Injectable,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

class SerialTransactionAdapter extends PrismaPg {
  override async connect() {
    const adapter = await super.connect();
    const startTransaction = adapter.startTransaction.bind(adapter);
    adapter.startTransaction = async (isolationLevel) => {
      const transaction = await startTransaction(isolationLevel);
      let pending = Promise.resolve();

      // Prisma can load several relations at once through one transaction connection.
      // Queue those operations on that connection until prisma/orm#30925 is fixed.
      const enqueue = <Args extends unknown[], T>(run: (...args: Args) => Promise<T>) =>
        (...args: Args) => {
          const result = pending.then(() => run(...args));
          pending = result.then(() => undefined, () => undefined);
          return result;
        };

      return Object.assign(transaction, {
        queryRaw: enqueue(transaction.queryRaw.bind(transaction)),
        executeRaw: enqueue(transaction.executeRaw.bind(transaction)),
        commit: enqueue(transaction.commit.bind(transaction)),
        rollback: enqueue(transaction.rollback.bind(transaction)),
      });
    };
    return adapter;
  }
}

@Injectable()
export class Database
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new SerialTransactionAdapter({ connectionString: process.env.DATABASE_URL }),
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
@Global()
@Module({ providers: [Database], exports: [Database] })
export class DatabaseModule {}
