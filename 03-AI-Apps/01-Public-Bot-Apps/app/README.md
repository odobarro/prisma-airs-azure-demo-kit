# 03-AI-Apps: AI Application Layer

This directory represents the **Consumer Layer** in our Zero Trust AI architecture. It houses the modular frontend interfaces, agents, and applications that interact with the foundation models deployed in Azure OpenAI.

Designed as a flexible toolkit, partners can deploy only the specific applications they need to demonstrate distinct capabilities to customers. By decoupling these applications from the underlying infrastructure (`01-azure-openai-infrastructure`) and the security/governance layer (`02-Prisma-AIRS`), we achieve strict Separation of Duties (SoD). 

### Architectural Purpose

*   **Modular Demos:** Spin up independent use cases (e.g., a public retail bot vs. an internal RAG agent) to showcase tailored policies without rebuilding the core infrastructure.
*   **Flexible Security Integration:** Depending on the modules deployed from `02-Prisma-AIRS`, these apps can route traffic through the AI Gateway for FinOps/DLP, or simply act as target environments for Red Teaming and Model Security assessments, ...
*   **FinOps & Showback:** When integrated with the AI Gateway, each application uses a unique identifier (API Key or Metadata tag), allowing granular cost tracking and budget enforcement per project in Strata Cloud Manager.
*   **Targeted Profiling:** Apply specific security policies tailored to the exact risk profile of each demo app.

### Directory Structure

*   `01-Public-Bot-Apps/` - Public-facing chatbots simulating unauthenticated external user interactions.
*   *(Future)* `02-Internal-RAG-Agents/` - Enterprise-scoped agents for internal employee use.