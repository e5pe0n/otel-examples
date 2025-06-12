import "dotenv/config";
import express from "express";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import {
  detectResources,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";

const metricsExporter = new PrometheusExporter(
  {
    port: Number(process.env.OTEL_METRICS_EXPORTER_PORT),
  },
  () => {
    console.log("Prometheus scrape endpoint: http://localhost:9464/metrics");
  },
);

// Create OTLP trace exporter
const traceExporter = new OTLPTraceExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`,
});

const detected = detectResources();

// Create a Resource that identifies your service
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "express",
  [ATTR_SERVICE_VERSION]: "1.0.0",
}).merge(detected);

const sdk = new NodeSDK({
  resource,
  traceExporter,
  spanProcessors: [new SimpleSpanProcessor(traceExporter)],
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
