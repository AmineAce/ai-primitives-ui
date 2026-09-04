"use client";

import { useEffect } from "react";
import { onCLS, onINP, onLCP } from "web-vitals";

function send(metric: { name: string; value: number; rating: string }) {
  console.log(
    `[Web Vitals] ${metric.name}: ${metric.value} (${metric.rating})`,
  );
}

export function WebVitals() {
  useEffect(() => {
    onLCP(send);
    onINP(send);
    onCLS(send);
  }, []);
  return null;
}
