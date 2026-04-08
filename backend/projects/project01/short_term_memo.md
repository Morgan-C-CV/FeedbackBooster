# Short-term Research Memory

## 1. Background Summary
# Project Background Summary: Multimodal Bio-Linking (MBL)

## Project Overview
The research project has evolved from an overly ambitious proposal to develop a "Universal Multimodal Scientific Entity Linking" (UMSEL) system into a focused, rigorous study on **Biomedical Entity Linking (BEL)**. The current objective is to improve the identification and linking of rare or newly discovered chemical compounds in scientific literature by integrating textual context with visual structural diagrams.

## Evolution of Research Scope
*   **Initial Phase (V1):** The project aimed to create a domain-agnostic model for all scientific literature using a broad, vaguely defined multimodal approach. Academic feedback criticized this as impractical and lacking in evaluative rigor.
*   **Strategic Pivot (V2):** The project narrowed its focus to the **Biomedical domain**, specifically targeting chemical entities. This shift allowed for a more precise problem statement: addressing the data scarcity of rare chemicals by leveraging 2D chemical structure diagrams as a secondary modality.

## Technical Methodology
The project currently utilizes a **Dual-Encoder Contrastive Learning** framework:
*   **Textual Encoder:** Uses **BioBERT** to process textual context.
*   **Vision Encoder:** Uses **ResNet-50** to process 2D structural images.
*   **Goal:** To map textual and visual representations into a unified latent space using contrastive loss, thereby allowing the model to link names and structures that share the same semantic identity.

## Current Status and Critical Path
Following the most recent academic review, the project is shifting away from "standard" methodologies toward addressing a critical research bottleneck: **the low-resource data constraint.**

### Key Developments:
*   **Methodological Refinement:** The mentor identified the initial data augmentation strategies (e.g., simple rotation/synonym replacement) as insufficient and "hand-wavy." 
*   **New Technical Focus:** The project is pivoting to **"adaptive" generative augmentation**. Instead of relying on static, manual augmentation, the researcher is now tasked with developing a model-driven approach to generate high-quality, noise-resistant positive training pairs.

### Immediate Priorities:
1.  **Formalize Generative Augmentation:** Define a concrete, model-driven strategy to create context-aware positive pairs for training.
2.  **Ensure Academic Rigor:** Transition the methodology from a standard contrastive learning implementation to an innovative solution that specifically addresses the low-resource bottleneck.
3.  **Benchmarking:** Maintain the commitment to evaluating the model against the **BC5CDR dataset**, using a text-only BioBERT baseline to quantify the performance gains afforded by the multimodal integration.

## 2. File Differences (Latest vs. Previous)
### Differences in f2.pdf:
As an academic research assistant, I have analyzed the changes between the initial research proposal (V1) and the revised version (V2). The transition from V1 to V2 reflects a strategic shift from a broad, general-purpose approach to a focused, methodology-driven investigation.

### **Summary of Key Changes**

#### **1. Scope and Research Focus**
*   **From Universal to Specialized:** V1 proposed a "Universal Multimodal Scientific Entity Linking" (UMSEL) system intended for all scientific domains. V2 narrows the scope significantly to "Biomedical Entity Linking," specifically targeting chemical compounds and rare drug mentions.
*   **Refinement of Objectives:** The goal has shifted from building a global linker to addressing the "data scarcity problem" in low-resource biomedical entities.

#### **2. Methodological Advancement**
*   **Architecture Change:** V1 suggested a generic transformer-based architecture. V2 introduces a more concrete **Dual-Encoder framework**:
    *   **Textual Processing:** Utilizes **BioBERT** instead of generic transformer inputs.
    *   **Vision Processing:** Specifies **ResNet-50** for processing 2D chemical structure diagrams, moving away from a generic CNN approach.
*   **Loss Function Strategy:** V2 explicitly incorporates **Contrastive Learning** to map textual and visual representations into a shared latent space, which provides a more robust mathematical basis for the integration of multimodal data.

#### **3. Addition of Data Augmentation**
*   **New Section (3.2):** V2 introduces a dedicated strategy to combat data scarcity through augmentation, which was entirely absent in V1.
    *   **Textual:** Synonym replacement and back-translation.
    *   **Visual:** Geometric transformations (rotations, cropping) and color jittering.

#### **4. Evaluation Strategy**
*   **Increased Focus:** While V1 planned to test across all available datasets, V2 adopts a more targeted evaluation on the **BC5CDR dataset** (chemical subset).
*   **Benchmarking:** V2 establishes a clear baseline for comparison (text-only BioBERT) to measure the specific value-add of the proposed multimodal approach.

### **Conclusion**
The revisions in V2 demonstrate a more mature research plan. By narrowing the scope, the author has moved from an overly ambitious "universal" proposal to a technically viable project. The inclusion of specific model architectures (BioBERT/ResNet-50) and a defined strategy for data augmentation makes this version significantly more actionable for an academic research project.

## 3. Latest Conversation Record
```text
Student: I've revised the proposal. I'm now focusing on 'Contrastive Learning for Biomedical Entity Linking' with a focus on low-resource scenarios. I've removed the universal claims and specified how I'll use chemical structure images.
Advisor: The focus on Biomedicine in f2.pdf is better. However, your contrastive learning strategy is still quite standard. For low-resource entities, the main challenge is the lack of positive pairs for training. You mention 'data augmentation' in Section 3.2, but it's very hand-wavy. How exactly will you generate these pairs without introducing too much noise? This is the core of the methodology you need to solve.
Student: You're right. My augmentation plan was just simple synonym replacement, which might not be enough. I'll think about a more 'adaptive' way to generate context-aware pairs using a generative model.
```