import api from "@opentelemetry/api";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import {
  detectResources,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import { context } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { registerInstrumentations } from "@opentelemetry/instrumentation";

const detected = detectResources();
console.log("Detected resources:", detected);
const resources = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "server",
}).merge(detected);
console.log("Merged resources:", resources);
const exporter = new OTLPTraceExporter({
  url: `${process.env.TRACING_COLLECTOR_HOST}:${process.env.TRACING_COLLECTOR_PORT}`,
});

const processor = new SimpleSpanProcessor(exporter);
const provider = new NodeTracerProvider({
  resource: resources,
  spanProcessors: [processor],
});
provider.register();

// Create a new header for propagation from a given span
let createPropagationHeader;
if (context === "requester") {
  const propagator = new W3CTraceContextPropagator();
  createPropagationHeader = (span) => {
    let carrier = {};
    // Inject the current trace context into the carrier object
    propagator.inject(
      api.trace.setSpanContext(api.ROOT_CONTEXT, span.spanContext()),
      carrier,
      api.defaultTextMapSetter,
    );
    return carrier;
  };
}

registerInstrumentations({
  instrumentations: [getNodeAutoInstrumentations()],
});
