const Queue = require("bull");
const { Client } = require("@elastic/elasticsearch");

const LOG_QUEUE = "LOG_QUEUE";

const queue = new Queue(LOG_QUEUE, {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PW,
  },
});

const ELASTICSEARCH_URI = process.env.ELASTICSEARCH_URI;
const ELASTICSEARCH_USERNAME = process.env.ELASTICSEARCH_USERNAME;
const ELASTICSEARCH_PASSWORD = process.env.ELASTICSEARCH_PASSWORD;

const elasticClient = new Client({
  node: ELASTICSEARCH_URI,
  auth: {
    username: ELASTICSEARCH_USERNAME,
    password: ELASTICSEARCH_PASSWORD,
  },
});

queue.process(async (job, done) => {
  try {
    const {logs} = job.data;

    await elasticClient.index({
      index: "bank-account-logs",
      body: {
        message: logs,
        timestamp: new Date(),
      },
    });
    done();
  } catch (err) {
    job.log(err);
    done(err);
  }
});
