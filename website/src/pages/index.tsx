import React from "react";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

function HeroSection(): React.JSX.Element {
  return (
    <section className="hero-section">
      <h1 className="hero-title">MCP Server Card UI</h1>
      <p className="hero-description">
        Edit, validate, and test MCP Server Cards. Connect to servers, inspect
        capabilities, and execute tools and prompts in real-time.
      </p>
      <Link className="hero-cta" to="/playground">
        Open Playground
      </Link>
    </section>
  );
}

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <main>
        <HeroSection />
      </main>
    </Layout>
  );
}
