# Palo Alto Networks Prisma AIRS - AI Security & Governance Framework

Welcome to Prisma AIRS, the industry's most comprehensive AI security platform. Once the core Azure infrastructure is provisioned, this module applies an enterprise-grade AI Security Framework to Discover, Assess, and Protect all inference traffic, model assets, and AI agents across any targeted deployment region.

## Prisma AIRS Integration

This directory contains submodules dedicated to configuring and validating each core capability of the Prisma AIRS platform:

| Security Module | Description & Focus Area | Direct Folder Link |
|---|---|---|
| **01. AI Gateway** | Governs all LLM, MCP, and agent-to-agent (A2A) interactions across multi-cloud environments. | [01-AI-Gateway](./01-AI-Gateway/) |
| **02. AI Supply Chain Security** | Decodes model architectures, weights, and operators to expose hidden backdoors. Automatically inspects codebase repositories to catch insecure configurations, permissions, and vulnerabilities in model files and skills. | [02-AI Supply Chain Security](./02-AI%20Supply%20Chain%20Security/) |
| **03. AI RedTeaming** | Simulates context-aware, automated attack scenarios to discover emergent behaviors and flaws in hours instead of weeks. | [03-AI RedTeaming](./03-AI%20RedTeaming/) |
| **04. AI Runtime** | Intercepts and blocks prompt injections, indirect injections, and data exfiltration across prompts, tool calls, and LLM outputs. | [04-AI Runtime](./04-AI%20Runtime/) |