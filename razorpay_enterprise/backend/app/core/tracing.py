import os
from contextlib import contextmanager

try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

    # Initialize OpenTelemetry TracerProvider
    provider = TracerProvider()
    
    # Configure console or remote span processor
    processor = BatchSpanProcessor(ConsoleSpanExporter())
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)

    tracer = trace.get_tracer("payresq-revenue-recovery", "2.0.0")
    OTEL_AVAILABLE = True
except Exception as e:
    print(f"[Tracing] Notice: Running fallback trace provider: {e}")
    tracer = None
    OTEL_AVAILABLE = False

def setup_tracing(app):
    """Instruments FastAPI application with OpenTelemetry distributed tracing."""
    if OTEL_AVAILABLE and app:
        try:
            FastAPIInstrumentor.instrument_app(app)
            print("[Tracing] OpenTelemetry FastAPI instrumentation activated.")
        except Exception as err:
            print(f"[Tracing] Could not instrument FastAPI: {err}")

@contextmanager
def trace_span(name: str, attributes: dict = None):
    """Context manager for tracing operations across Workers, Gateway, and DB."""
    if OTEL_AVAILABLE and tracer:
        with tracer.start_as_current_span(name) as span:
            if attributes:
                for k, v in attributes.items():
                    span.set_attribute(k, str(v) if v is not None else "")
            yield span
    else:
        # Fallback dummy span
        class DummySpan:
            def set_attribute(self, key, value): pass
            def record_exception(self, exc): pass
        yield DummySpan()
