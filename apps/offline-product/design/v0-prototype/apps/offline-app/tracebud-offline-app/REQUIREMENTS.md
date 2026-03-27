# Tracebud: The Comprehensive Technical & Strategic Specification

## **I. Strategic Framework: The "Digital Product Passport" (DPP)**

Tracebud follows the **EU Ecodesign for Sustainable Products Regulation (ESPR)** logic.

* **User Hierarchy:**
* **Farmers (Owners):** Absolute control over data; one-time "Simplified Declaration" for micro-producers.
* **Exporters (Operators):** Aggregators who bundle GeoIDs and manage the **Due Diligence Statement (DDS)**.
* **Importers/Roasters (Sponsors):** Can "re-use" existing Reference Numbers to avoid double-reporting.
* **Consumers/Retailers:** QR-access to the **15-digit TRACES Reference Number** and origin story.


* **Multi-Commodity Scalability:** The core engine must be "Commodity Agnostic." While Coffee (HS 0901) is the pilot, the schema must accommodate **Cocoa, Rubber, and Soy** by simply switching the HS Code and Risk Matrix.

---

## **II. Meticulous Technical Requirements (The "Hard" Specs)**

### **A. GIS & Geolocation (WGS84 / EPSG:4326)**

* **Precision Standard:** Mandatory **6 decimal places**. Data with 5 or fewer decimals is rejected at the entry point.
* **Plot Definition (Contiguity Rule):** A "plot" is a single piece of land with an **unbroken border**. If a farmer has two fields separated by a road, they are **two distinct GeoIDs**.
* **Geometry Logic:**
* **< 4 Hectares:** Single Point (Centroid).
* **≥ 4 Hectares:** Full Polygon (GeoJSON format).


* **Precision Guardrail:** The app must log **HDOP (Horizontal Dilution of Precision)**. If HDOP > 2.0 (poor satellite fix), the "Save" button is disabled.

### **B. The Compliance Engine (The "Dual-Check")**

1. **Deforestation Check:** 2020 baseline check (FAO Definition: 0.5ha+, 5m height, 10% canopy).
2. **Forest Degradation Check:** (Critical for 2026 compliance) Detection of structural changes:
* Primary Forest $\rightarrow$ Plantation Forest.
* Naturally Regenerating Forest $\rightarrow$ Planted Forest.



* **False-Positive Mitigation:** Integrated **"Ground-Truth Photo Vault."** Timestamped, geo-tagged 360° photos to prove a plot is an "Agricultural Plantation" (Agroforestry) and not "Deforested Land."

### **C. Legality & Human Rights (The "Social" Pillar)**

* **Honduran Legality:** Capture *Clave Catastral* and Land Title photos with OCR. Support for "Productor en Posesión" declarations for informal tenure.
* **Protected Area Overlay:** Automatic rejection if a polygon overlaps with **SINAPH** (National Parks) or **Indigenous Territories**.
* **Free, Prior, and Informed Consent (FPIC):** Mandatory digital signature for land used in indigenous territories.
* **Labor Compliance:** Integrated checklist for ILO standards (No Child/Forced Labor).

---

## **III. Supply Chain & Interoperability**

### **A. Mass Balance & Transaction Integrity**

* **The "Yield Cap" Logic:** Backend must prevent "Laundering." If a 1ha plot (avg yield 1,500kg) attempts to sell 10,000kg, the transaction is flagged for fraud.
* **Batching:** Exporters can select individual "Farmer Vouchers" to generate a single **DDS JSON file** for TRACES NT.

### **B. ESG & External API Connectivity**

* **Inbound:** Sync with **IHCAFE National Census** and **Honduran ICF** (Forest Institute).
* **Outbound:** Real-time data push to **EcoVadis, Sustainalytics,** and **Carbon Credit Registries**.
* **Format:** Support **GS1 Standards** for global interoperability.

---

## **IV. App Structure & Navigation (Linear Compliance Flow)**

### **1. Identity (Farmer/Agent)**

* Login $\rightarrow$ Producer Profile $\rightarrow$ Compliance Score.
* Digital Signature of the "Self-Declaration."

### **2. Asset Management (The Map)**

* **Offline Vector Tiles:** Cached maps for the Honduran "First Mile."
* **The Perimeter Tool:** Walk-the-border with real-time hectare display and "Precision Status."

### **3. Verification (Satellite AI)**

* Immediate "Pre-Check" status: **Green (Compliant)**, **Amber (Degradation Risk)**, or **Red (Deforestation Detected)**.

### **4. Transaction (The Digital Receipt)**

* Record "Kg Delivered" $\rightarrow$ QR Code generation for the Farmer. This is the **Farmer's Proof of Compliance** they can sell to any buyer.

---

## **V. Audit & Data Governance**

* **Immutable Ledger:** Every coordinate change is logged with a "Reason for Edit" and Device ID.
* **5-Year Retention:** Secure cloud storage with redundant backups.
* **Anonymization:** Importers see the "Polygon ID" and "Reference Number," but Farmer PII is hashed for privacy.