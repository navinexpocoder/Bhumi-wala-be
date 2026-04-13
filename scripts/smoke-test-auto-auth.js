#!/usr/bin/env node
/* eslint-disable no-console */

const DEFAULT_BASE = "http://localhost:5000";

const args = process.argv.slice(2);
const getArg = (name) => {
  const entry = args.find((item) => item.startsWith(`--${name}=`));
  return entry ? entry.slice(name.length + 3) : undefined;
};

const baseInput =
  getArg("baseUrl") ||
  process.env.API_BASE_URL ||
  process.env.SMOKE_BASE_URL ||
  DEFAULT_BASE;

const trimSlash = (value) => value.replace(/\/+$/, "");
const baseUrl = trimSlash(baseInput);
const apiBase = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

const randomSeed = Date.now().toString(36);
const defaults = {
  sellerEmail: `smoke-seller-${randomSeed}@bhumi.local`,
  sellerPassword: "SmokeTest@123",
  adminEmail: `smoke-admin-${randomSeed}@bhumi.local`,
  adminPassword: "SmokeTest@123",
};

const authConfig = {
  seller: {
    name: process.env.SMOKE_SELLER_NAME || "Smoke Seller",
    email: getArg("sellerEmail") || process.env.SMOKE_SELLER_EMAIL || defaults.sellerEmail,
    password: getArg("sellerPassword") || process.env.SMOKE_SELLER_PASSWORD || defaults.sellerPassword,
    role: "seller",
  },
  admin: {
    name: process.env.SMOKE_ADMIN_NAME || "Smoke Admin",
    email: getArg("adminEmail") || process.env.SMOKE_ADMIN_EMAIL || defaults.adminEmail,
    password: getArg("adminPassword") || process.env.SMOKE_ADMIN_PASSWORD || defaults.adminPassword,
    role: "admin",
  },
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
  { name: "Current user profile", method: "GET", url: `${apiBase}/auth/me`, auth: "seller", expect: [200] },
  { name: "My properties", method: "GET", url: `${apiBase}/properties/my-properties/list`, auth: "seller", expect: [200] },
  { name: "Admin users", method: "GET", url: `${apiBase}/admin/users`, auth: "admin", expect: [200] },
  { name: "Admin all properties", method: "GET", url: `${apiBase}/properties/admin/all?page=1&limit=2`, auth: "admin", expect: [200] },
];

const preview = (text, max = 180) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

const requestJson = async (url, init = {}) => {
  const response = await fetch(url, init);
  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return { response, text, json };
};

const extractToken = (payload) =>
  payload?.data?.token || payload?.token || null;

const login = async (email, password) => {
  const { response, json, text } = await requestJson(`${apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    return { ok: false, status: response.status, token: null, message: preview(text) };
  }

  return { ok: true, status: response.status, token: extractToken(json), message: "login ok" };
};

const register = async (name, email, password, role) => {
  const { response, text } = await requestJson(`${apiBase}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });

  return { ok: response.ok, status: response.status, message: preview(text) };
};

const ensureToken = async (type) => {
  const conf = authConfig[type];
  const firstLogin = await login(conf.email, conf.password);
  if (firstLogin.ok && firstLogin.token) {
    return { token: firstLogin.token, created: false };
  }

  const reg = await register(conf.name, conf.email, conf.password, conf.role);
  if (!reg.ok && reg.status !== 409) {
    throw new Error(`${type} register failed (${reg.status}): ${reg.message}`);
  }

  const secondLogin = await login(conf.email, conf.password);
  if (!secondLogin.ok || !secondLogin.token) {
    throw new Error(`${type} login failed (${secondLogin.status}): ${secondLogin.message}`);
  }

  return { token: secondLogin.token, created: reg.status !== 409 };
};

const run = async () => {
  console.log("=== Auto-Auth Smoke Test ===");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`API Base: ${apiBase}`);
  console.log("");

  let sellerToken;
  let adminToken;
  try {
    const seller = await ensureToken("seller");
    const admin = await ensureToken("admin");
    sellerToken = seller.token;
    adminToken = admin.token;
    console.log(`Seller auth: ok (${seller.created ? "created" : "existing"})`);
    console.log(`Admin auth: ok (${admin.created ? "created" : "existing"})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Auth bootstrap failed: ${message}`);
    process.exit(1);
  }

  console.log("");
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const token = test.auth === "admin" ? adminToken : test.auth === "seller" ? sellerToken : undefined;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { response, text } = await requestJson(test.url, { method: test.method, headers });
      const ok = test.expect.includes(response.status);

      if (ok) {
        passed += 1;
        console.log(`- PASS ${test.name} -> ${response.status}`);
      } else {
        failed += 1;
        console.log(`- FAIL ${test.name} -> ${response.status} (expected ${test.expect.join(", ")})`);
        console.log(`  body: ${preview(text)}`);
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
  process.exit(failed > 0 ? 1 : 0);
};

run();
