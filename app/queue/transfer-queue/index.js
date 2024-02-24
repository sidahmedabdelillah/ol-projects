const mongoose = require("mongoose");
const Queue = require("bull");

const MONGODB_URI = process.env.MONGO_URI;
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const transfersSchema = mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: Number, required: true },
});

const TransfersModel = mongoose.model("transfers", transfersSchema);

const EMAIL_QUEUE_NAME = "TRANSFER_QUEUE";
const LOG_QUEUE = "LOG_QUEUE";

const queue = new Queue(EMAIL_QUEUE_NAME, {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PW,
  },
});

const logqueue = new Queue(LOG_QUEUE, {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PW,
  },
});

queue.process(async (job, done) => {
  const { transfers } = job.data;
  for (let i = 0; i < transfers.length; i++) {
    try {
      const logs =
        "TRANSFER FROM" + transfers[i].from + " to " + transfers[i].to + "\n";
      await TransfersModel.create(transfers[i]);
      await logqueue.add({ logs });
    } catch (err) {
      await job.log(JSON.stringify(err, null, 2));
    }
  }
  done()
});
