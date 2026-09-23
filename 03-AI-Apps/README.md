# 03-AI-Apps: AI Application Layer

This directory represents the **Consumer & Service Layer** in our Zero Trust AI architecture. It houses the modular frontend interfaces, agents, and service applications that interact with the foundation models deployed in Azure OpenAI and the security APIs of Palo Alto Networks.

Designed as a flexible toolkit, partners can deploy only the specific applications they need to demonstrate distinct capabilities to customers. By decoupling these applications from the underlying infrastructure (`01-azure-openai-infrastructure`) and the security/governance layer (`02-Prisma-AIRS`), we achieve strict Separation of Duties (SoD). 

### Architectural Purpose

*   **Modular Demos & Services:** Spin up independent use cases (e.g., a public retail bot, or a SecOps validation portal) to showcase tailored policies without rebuilding the core infrastructure.
*   **Flexible Security Integration:** Depending on the modules deployed from `02-Prisma-AIRS`, these apps can route traffic through the AI Gateway (Portkey/Idira) for FinOps/DLP, act as target environments for Red Teaming, or connect directly to the AIMS API for static Model Security supply chain validation.
*   **FinOps & Showback:** When integrated with the AI Gateway in multi-cloud environments (Azure/AWS/GCP), each application uses a unique identifier (API Key or Metadata tag), allowing granular cost tracking and budget enforcement per project in Strata Cloud Manager.
*   **Targeted Profiling:** Apply specific security policies tailored to the exact risk profile of each demo or service app.

### Directory Structure

*   `01-Public-Bot-Apps/` - Public-facing chatbots simulating unauthenticated external user interactions. Ideal for demonstrating runtime protections against prompt injection, jailbreaks, and PII exfiltration.
*   `02-Service-Apps/` - Internal service applications, SecOps tools, and administrative interfaces. This directory includes the **Model Validation Hub**, designed to interface with Strata Cloud Manager (SCM) to perform AI supply chain analysis (Model Security) for Hugging Face and GitLab artifacts, manage policy groups, and enforce CI/CD compliance *before* runtime deployment.
*   *(Future)* `03-Internal-RAG-Agents/` - Enterprise-scoped agents for internal employee use, demonstrating RBAC, secure data grounding, and internal Data Loss Prevention (DLP) policies.