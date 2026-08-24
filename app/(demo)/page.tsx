import { DemoHero } from "@/components/sections/demo-hero";
import { DemoShowcase } from "@/components/sections/demo-showcase";
import { DemoInstall } from "@/components/sections/demo-install";
import { DemoUsage } from "@/components/sections/demo-usage";
import { DemoPlayground } from "@/components/sections/demo-playground";
import { Footer } from "@/components/sections/footer";

export default function DemoPage() {
  return (
    <>
      <DemoHero />
      <DemoShowcase />
      <DemoInstall />
      <DemoUsage />
      <DemoPlayground />
      <Footer />
    </>
  );
}
