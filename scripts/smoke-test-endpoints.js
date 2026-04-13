#!/usr/bin/env node
/* eslint-disable no-console */

const DEFAULT_BASE = "http://localhost:5000";

const args = process.argv.slice(2);
const getArg = (name) => {
  const exact = args.find((entry) => entry.startsWith(`--${name}=`));
  return exact ? exact.slice(name.length + 3) : undefined;
};

const baseInput =
  getArg("baseUrl") ||
  process.env.API_BASE_URL ||
  process.env.SMOKE_BASE_URL ||
  DEFAULT_BASE;
const userToken = getArg("token") || process.env.SMOKE_TOKEN;
const adminToken = getArg("adminToken") || process.env.SMOKE_ADMIN_TOKEN;

const trimSlash = (value) => value.replace(/\/+$/, "");
const baseUrl = trimSlash(baseInput);
const apiBase = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

const label = {
  none: "public",
  user: "user-token",
  admin: "admin-token",
};

const tests = [
  { name: "Health check", method: "GET", url: `${baseUrl}/health`, auth: "none", expect: [200] },
  { name: "List properties", method: "GET", url: `${apiBase}/properties?page=1&limit=2`, auth: "none", expect: [200] },
  {
    name: "Nearby properties",
    method: "GET",
    url: `${apiBase}/properties/nearby?latitude=22.7196&longitude=75.8577&radius=5&limit=5`,
    auth: "none",
    expect: [200],
  },
  { name: "UI config list", method: "GET", url: `${apiBase}/ui-config`, auth: "none", expect: [200] },
  { name: "System config list", method: "GET", url: `${apiBase}/system-config`, auth: "none", expect: [200] },
  { name: "Current user profile", method: "GET", url: `${apiBase}/auth/me`, auth: "user", expect: [200] },
  { name: "My properties", method: "GET", url: `${apiBase}/properties/my-properties/list`, auth: "user", expect: [200] },
  { name: "Admin users", method: "GET", url: `${apiBase}/admin/users`, auth: "admin", expect: [200] },
  { name: "Admin all properties", method: "GET", url: `${apiBase}/properties/admin/all?page=1&limit=2`, auth: "admin", expect: [200] },
];

const getTokenForTest = (authType) => {
  if (authType === "admin") return adminToken;
  if (authType === "user") return userToken;
  return undefined;
};

const toPreview = (text, max = 180) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

const run = async () => {
  console.log("=== Endpoint Smoke Test ===");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`API Base: ${apiBase}`);
  console.log(`User Token: ${userToken ? "provided" : "missing"}`);
  console.log(`Admin Token: ${adminToken ? "provided" : "missing"}`);
  console.log("");

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const test of tests) {
    const token = getTokenForTest(test.auth);
    if (test.auth !== "none" && !token) {
      skipped += 1;
      console.log(`- SKIP ${test.name} (${label[test.auth]})`);
      continue;
    }

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(test.url, { method: test.method, headers });
      const bodyText = await response.text();
      const ok = test.expect.includes(response.status);

      if (ok) {
        passed += 1;
        console.log(`- PASS ${test.name} -> ${response.status}`);
      } else {
        failed += 1;
        console.log(`- FAIL ${test.name} -> ${response.status} (expected ${test.expect.join(", ")})`);
        console.log(`  body: ${toPreview(bodyText)}`);
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`- FAIL ${test.name} -> request error`);
      console.log(`  error: ${message}`);
    }
  }

  console.log("");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);

  process.exit(failed > 0 ? 1 : 0);
};

run();
