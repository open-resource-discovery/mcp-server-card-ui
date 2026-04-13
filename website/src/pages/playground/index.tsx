import React, { useEffect, useRef, useState } from "react";
import Layout from "@theme/Layout";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Head from "@docusaurus/Head";

function getDocusaurusTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

export default function Playground(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cssUrl = useBaseUrl("/standalone/mcp-server-card-ui.css");
  const jsUrl = useBaseUrl("/standalone/mcp-server-card-ui.js");

  useEffect(() => {
    let mounted = true;

    const loadAndInit = async () => {
      try {
        if (!document.querySelector(`link[href="${cssUrl}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = cssUrl;
          document.head.appendChild(link);
        }

        if (!(window as any).MCPPlayground) {
          await new Promise<void>((resolve, reject) => {
            const existingScript = document.querySelector(
              `script[src="${jsUrl}"]`,
            );
            if (existingScript) {
              const checkInterval = setInterval(() => {
                if ((window as any).MCPPlayground) {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 50);
              setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error("Timeout waiting for MCPPlayground"));
              }, 10000);
              return;
            }

            const script = document.createElement("script");
            script.src = jsUrl;
            script.onload = () => setTimeout(resolve, 100);
            script.onerror = () =>
              reject(new Error("Failed to load MCPPlayground script"));
            document.body.appendChild(script);
          });
        }

        if (!mounted || !containerRef.current) return;

        const theme = getDocusaurusTheme();

        instanceRef.current = (window as any).MCPPlayground.init({
          el: containerRef.current,
          showSettings: true,
          showEditor: true,
          showFunctions: true,
          showRawHttp: true,
          theme,
        });

        if (mounted) setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load playground",
          );
          setIsLoading(false);
        }
      }
    };

    loadAndInit();

    const observer = new MutationObserver(() => {
      if (instanceRef.current) {
        const theme = getDocusaurusTheme();
        try {
          instanceRef.current.setTheme?.(theme);
        } catch {}
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      mounted = false;
      observer.disconnect();
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch {}
        instanceRef.current = null;
      }
    };
  }, [cssUrl, jsUrl]);

  return (
    <Layout
      title="Playground"
      description="Try the MCP Server Card UI"
      wrapperClassName="playground-page"
    >
      <Head>
        <style>{`
          .playground-page ~ footer,
          .playground-page ~ .VPFooter {
            display: none;
          }
        `}</style>
      </Head>
      <div className="playground-container" style={{ position: "relative" }}>
        {isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--ifm-background-color)",
              zIndex: 1,
            }}
          >
            Loading playground...
          </div>
        )}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "calc(100vh - var(--ifm-navbar-height, 60px))",
              color: "var(--ifm-color-danger)",
            }}
          >
            Error: {error}
          </div>
        )}
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "calc(100vh - var(--ifm-navbar-height, 60px))",
          }}
        />
      </div>
    </Layout>
  );
}
