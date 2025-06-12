import "dotenv/config";
import express from "express";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const metricsExporter = new PrometheusExporter(
  {
    port: Number(process.env.OTEL_METRICS_EXPORTER_PORT),
  },
  () => {
    console.log("Prometheus scrape endpoint: http://localhost:9464/metrics");
  },
);
const sdk = new NodeSDK({
  metricReader: metricsExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-express": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-fs": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-http": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-net": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-runtime-node": {
        enabled: true,
      },
    }),
  ],
});
sdk.start();

const port = process.env.PORT;
const app = express();

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.get("/rolldice", (req, res) => {
  res.send(getRandomNumber(1, 6).toString());
});

app.listen(port, () => {
  console.log(`Express server is running on port ${port}`);
});
