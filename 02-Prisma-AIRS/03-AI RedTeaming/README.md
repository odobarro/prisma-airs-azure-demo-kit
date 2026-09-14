# Module 03: AI Red Teaming in Prisma AIRS

## What is AI Red Teaming?
AI Red Teaming represents a systematic approach to adversarial testing that proactively identifies weaknesses in artificial intelligence systems ahead of malicious exploitation. By emulating authentic attack scenarios, this methodology exposes potential vulnerabilities across AI models, applications, and agents. Through this comprehensive evaluation process, organizations can fortify their AI infrastructure, mitigate security risks, and enhance overall system robustness against emerging threats.


## Prisma AIRS AI Red Teaming
Prisma AIRS AI Red Teaming helps you to:
* Leverage the collective expertise of over 18,000 threat researchers from Unit 42 and Huntr communities, and dedicated Red Teaming specialists powering 50+ attack techniques spanning 500+ attack scenarios to comprehensively test your systems across a broad risk spectrum.
* Launch AI application red teaming in under 10 minutes and receive comprehensive reports within 5 hours for typical systems—a process that traditionally requires weeks of manual effort.
* Scale your security assessments across hundreds of AI applications and agents with a solution designed for speed, simplicity, and thoroughness. Prisma AIRS AI Red Teaming delivers the perfect balance of comprehensive coverage and operational efficiency at enterprise scale.


## Prerequisites

Before initiating the AI Red Teaming setup, ensure the foundational inference and control layers are configured. This module builds upon the architecture established in previous steps:

* [**Module 01: Azure OpenAI**](../../01-azure-openai-infrastructure/README.md): The underlying LLM compute endpoints must be deployed and active to process the synthetic attack payloads.
* [**Module 02: AI Gateway (Highly Recommended)**](../01-AI-Gateway/README.md): While not strictly mandatory, deploying the enterprise AI Gateway is critical for traffic routing and FinOps token metering. If omitted, the API endpoints and connection configurations detailed in this guide will change, routing traffic directly to the cloud provider.
* [**Module 02: AI Runtime Security (Optional)**](../04-AI%20Runtime/README.md): Integrated with the AI Gateway, this layer provides real-time protection. By blocking attacks at the proxy level, it prevents malicious prompts from reaching the LLM, significantly reducing unnecessary token consumption and Azure compute costs.

## Step 1. Licensing and Activation (FinOps & SecOps Alignment)

AI Red Teaming is metered using **Palo Alto Networks Flex Credits**. 


#### Activation Steps

* Create a **Deployment Profile (DP)** in your Customer Support Portal (CSP) and allocate Flex Credits to AI Red Teaming.
* Map the Deployment Profile to a **Tenant Service Group (TSG)**.  
    > ⚠️ The Tenant Service Group (TSG) **MUST be located in a supported Region**.
* Launch SCM to complete setup and configuration.

> 📘 **Official Documentation Reference:**  
> [Palo Alto Networks - Create a Deployment Profile for Prisma AIRS AI Red Teaming](https://docs.paloaltonetworks.com/ai-runtime-security/ai-red-teaming/identify-ai-system-risks-with-ai-red-teaming/get-started-with-prisma-airs-ai-red-teaming/create-a-deployment-profile-for-prisma-airs-ai-red-teaming)


## Step 2: Register the Application Target
To safely attack our application through the AI Gateway without impacting production limits, we must map the API structure as a Target in Strata Cloud Manager (SCM).

### 1. Initial Setup
* Navigate to **AI Security** > **AI Red Teaming** > **Targets**.
* Click on **New Target**.
* **Target Name:** `az-open-ai-target`
* **Target Type:** Select **Application**.
* **Connection Method:** Select **REST API** to ensure compatibility across cloud providers.
* Click **Next**.

### 2. Choose Method (cURL Import)
* Select **cURL Import** and paste the following snippet. This maps the Portkey routing headers and the Azure OpenAI structure automatically:

```bash
curl "[https://aigw.portkey.ai/v1/chat/completions](https://aigw.portkey.ai/v1/chat/completions)" \
  --request POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer <YOUR_PORTKEY_API_KEY>" \
  --header "x-portkey-api-key: <YOUR_PORTKEY_API_KEY>" \
  --header "x-portkey-virtual-key: az-openai-gpt-4-1" \
  --header "x-portkey-provider: azure-openai" \
  --data '{
    "model": "azure-gpt4mini-demo",
    "messages": [
      {
        "role": "user",
        "content": "{INPUT}"
      }
    ]
  }'
```
* Click **Next**.

### 3. Verify Endpoint & Headers
* **API Endpoint:** Verify the URL is exactly `https://aigw.portkey.ai/v1/chat/completions`.
* **Custom HTTP Headers:** Confirm the following headers were extracted automatically:
  * `Content-Type`
  * `Authorization`
  * `x-portkey-api-key`
  * `x-portkey-virtual-key`
  * `x-portkey-provider`

### 4. Authentication Method
SCM synthetic testers filter custom headers by default. To guarantee connectivity during the validation test:
* Toggle the switch to **Enabled**.
* Select **Using Headers**.

### 5. Verify & Edit JSON (Variable Mapping)
Define where Prisma AIRS should inject the attack payload (`{INPUT}`) and where it should read the model's response (`{RESPONSE}`).

**Request JSON:**
```json
{
  "model": "azure-gpt4mini-demo",
  "messages": [
    {
      "role": "user",
      "content": "{INPUT}"
    }
  ]
}
```

**Response JSON** (Standard OpenAI/Azure structure):
```json
{
  "choices": [
    {
      "message": {
        "content": "{RESPONSE}"
      }
    }
  ]
}
```
* Click **Next**.

### 6. Advanced Configurations (FinOps & Rate Limiting)
* **Rate Limits (Recommended):** Enable and set to **30 RPM**. This acts as a FinOps safeguard, preventing the Red Teaming automated scans from exhausting your Portkey token quota or triggering native throttling limits on Azure OpenAI or AWS Bedrock.
* **Sample Exception JSON:** Paste the standardized error payload:
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Prisma AIRS Rate Limit Exceeded. Maximum allowed is 30 requests per minute.",
    "status": 429
  }
}
```
* Click **Validate Target** to confirm a `200 OK` status, then save.

### 7 Profiling
* **Agentic Profiling:** Enable and provide the business context to lower false positives:
  * **Industry:** `Retail, Financial Services, Industrial Manufacturing`
  * **Use Case:** `Multi-vertical enterprise AI proxy and gateway serving public customer support chatbots, internal financial analytics, and industrial operational copilots via Azure OpenAI.`
  * **Competitors:** Add relevant competitors (e.g., `Amazon`, `Shopify`, `Stripe`) to enable Brand Protection checks.

Click **Validate Target** to confirm a `200 OK` status, then click **Submit**.

## Step 3: Execute an AI Red Teaming Scan

With the AI Target safely registered, you can now launch an automated offensive scan to evaluate the model's resilience against adversarial tactics.

### Scan Configuration

1. Navigate to **AI Security** > **AI Red Teaming** > **Scans**.
2. Click on **+ New Scan**.
3. **Scan Name:** Enter a descriptive identifier (e.g., `az-open-ai-scan-library-OWASP-Prompt_Injection`).
4. **Select Target:** Choose the target configured in Step 2 (`az-open-ai-target`).
5. **Language:** Select the primary language for the synthetic attack payloads.
6. **Scan Strategy:** Select **Red Teaming using Attack Library** *(Note: You can explore other autonomous agent-based methods depending on your testing scope)*.
7. **Attack Modality:** Keep the default setting as **Text Attacks only**.
8. **Attack Categories:** Uncheck all default options and strictly select:
   * **Prompt Injection**
   * **OWASP Top 10 for LLMs 2025**
   *(Note: You can customize and select additional vulnerability categories based on your specific compliance requirements).*
9. Click **Start a Scan**.

### Execution and Reporting

The Prisma AIRS autonomous engine will now begin through the AI Gateway toward Azure OpenAI. 

* **Execution Time:** This process will take time. The duration depends on Azure's inference latency, the payload volume, and the 30 RPM rate limit we strictly enforced to protect your FinOps baseline.
* **Analysis:** Once the scan concludes, navigate back to the **Scans** dashboard and click **View Report**. This dashboard provides granular telemetry on successful jailbreaks, blocked L7 anomalies, and remediation steps to harden your system prompt.