const Queue = require("bull");
const mongoose = require("mongoose");
const { faker } = require('@faker-js/faker');

const EMAIL_QUEUE_NAME = "TRANSFER_QUEUE";

const queue = new Queue(EMAIL_QUEUE_NAME, {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PW,
  },
});

const MONGODB_URI = process.env.MONGO_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const bankAccountSchema = new mongoose.Schema({
  accountNumber: { type: String, required: true },
});
const BankAccount = mongoose.model("BankAccount", bankAccountSchema);

const sleep = (time) =>
  new Promise((resolve) => setTimeout(resolve, time * 1000));

const AMOUNT = process.env.AMOUNT ?? 10

const run = async () => {
  const accounts = Array.from({ length: 2000 }, () => ({
    accountNumber: faker.finance.account(),
  }));
  await BankAccount.insertMany(accounts);

  while (true) {
    for (let i = 0; i < accounts.length; i++) {
      const transfers = Array.from({ length: AMOUNT }, () => ({
        from: accounts[i].accountNumber,
        to: accounts[Math.floor(Math.random() * accounts.length)].accountNumber,
        amount: faker.finance.amount(),
      }));
      await queue.add({ transfers });
    }
    await sleep(20);
  }
};

run();
