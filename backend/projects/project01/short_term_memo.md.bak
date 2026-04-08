# Short-term Research Memory

## 1. Background Summary
### Project Background Summary: Multimodal Bio-Linking (MBL)

This project has evolved from an ambitious, broad-scope attempt at "Universal Scientific Entity Linking" to a focused, rigorous study on **Multimodal Biomedical Entity Linking (MBL)**. The research aims to improve the identification of rare or newly discovered chemical compounds in scientific literature by leveraging visual chemical structure diagrams alongside textual data.

#### **1. Evolution of Scope**
*   **Original Concept:** Initially, the project sought to develop a "universal" transformer-based system to standardize entity linking across all scientific domains.
*   **Strategic Pivot:** Following advisor feedback regarding the impracticality of universal systems, the project was narrowed to the **Biomedical domain**. 
*   **Current Focus:** The research now specifically targets the "data scarcity" bottleneck—where rare chemicals are under-represented in textual datasets—by treating 2D structural diagrams as invariant features that complement textual embeddings.

#### **2. Methodology & Technical Architecture**
The project employs a **Dual-Encoder framework** designed to align textual and visual data into a shared latent space through **contrastive learning**:
*   **Text Encoder:** Utilizes **BioBERT** to process chemical mentions in context.
*   **Vision Encoder:** Utilizes **ResNet-50** to extract features from 2D chemical structure images.
*   **Core Objective:** Implement a contrastive loss function to ensure that textual and visual representations of the same chemical concept are closely mapped.

#### **3. Current Status & Critical Challenges**
The project is currently in a phase of **methodological refinement**. While the pivot to a dual-encoder/contrastive learning approach has been accepted, the following areas remain the primary focus:

*   **The Data Augmentation Bottleneck:** The previous plan for simple synonym replacement and basic image transformation was rejected for being too simplistic and prone to noise.
*   **Required Shift:** The project is moving away from "hand-wavy" augmentation toward an **adaptive, generative approach**.
*   **Next Steps:** The researcher is tasked with developing a context-aware mechanism for generating high-quality "positive pairs" for training. The viability of the final research hinges on this strategy, as it must demonstrate the ability to augment data without compromising the reliability of the training set.

#### **4. Evaluation Strategy**
*   **Target:** The **BC5CDR dataset** (chemical subset).
*   **Benchmark:** Performance will be measured against a **text-only BioBERT baseline** to isolate and quantify the specific performance gains attributed to the integration of structural (visual) data.

***

**Status Summary:** The project is currently at a high-priority stage, with the primary objective being the development of a sophisticated, non-trivial data augmentation strategy to support the contrastive learning framework.

## 2. File Differences (Latest vs. Previous)
### Differences in f2.pdf:
As an academic research assistant, I have analyzed the changes between the initial research proposal (V1) and the revised version (V2). The transition reflects a shift from a broad, ambitious scope to a more focused, technically specific research plan.

### Summary of Key Changes

The primary change is a **narrowing of the research scope**: moving from a "Universal" system (across all scientific domains) to a specialized "Biomedical" system. This significantly improves the feasibility of the project.

#### 1. Shift in Research Focus
*   **V1 (Broad):** Aimed to build a "Universal Multimodal Scientific Entity Linking" (UMSEL) system for all scientific databases (PubMed, arXiv, etc.).
*   **V2 (Specialized):** Re-focused on "Multimodal Bio-Linking" (MBL), specifically targeting chemical compounds and rare drug mentions. This addresses the challenge of data scarcity in the biomedical domain.

#### 2. Refined Methodology
*   **Architecture Change:** V1 proposed a generic transformer-based architecture. V2 introduces a more concrete **Dual-Encoder framework**, utilizing **BioBERT** for text and **ResNet-50** for chemical structure images.
*   **Learning Objective:** V2 introduces **Contrastive Learning** as the primary mechanism for mapping textual mentions and visual diagrams into a shared latent space, which is more robust for entity linking than the generic "multimodal fusion" described in V1.
*   **New Section on Data Augmentation:** V2 introduces a specific strategy (Section 3.2) to address the identified "low-resource bottleneck," proposing standard NLP augmentation (synonym replacement/back-translation) and Computer Vision augmentation (rotation/cropping/jittering) to increase training pairs.

#### 3. Evaluation Plan
*   **V1:** Proposed testing across a wide range of disparate datasets (BC5CDR, MedMentions, SciERC).
*   **V2:** Simplified to a more rigorous evaluation focused on the **BC5CDR dataset (chemical subset)**, using a text-only BioBERT model as the primary baseline. This provides a clearer "apples-to-apples" comparison of the effectiveness of the multimodal approach.

#### 4. Structural Adjustments
*   **Problem Definition:** The "Introduction" section in V1 was replaced with a "Research Problem" section in V2, which more effectively justifies the necessity of the proposed work by highlighting why standard models (like BioBERT) fail on rare chemical entities.
*   **Elimination of Vague Objectives:** V2 removes the "Discussion & Future Work" section and the plan to crawl "5 million open-access papers," suggesting the author has moved toward a more achievable, data-driven approach based on specific datasets.

### Conclusion
The new version (V2) is a **significant improvement**. By transitioning from a highly ambitious, generalized proposal to a focused biomedical application with a concrete technical framework (Dual-Encoder/Contrastive Learning) and a clear data augmentation strategy, the research is now much more viable and academically defensible.

## 3. Latest Conversation Record
```text
Student: I've revised the proposal. I'm now focusing on 'Contrastive Learning for Biomedical Entity Linking' with a focus on low-resource scenarios. I've removed the universal claims and specified how I'll use chemical structure images.
Advisor: The focus on Biomedicine in f2.pdf is better. However, your contrastive learning strategy is still quite standard. For low-resource entities, the main challenge is the lack of positive pairs for training. You mention 'data augmentation' in Section 3.2, but it's very hand-wavy. How exactly will you generate these pairs without introducing too much noise? This is the core of the methodology you need to solve.
Student: You're right. My augmentation plan was just simple synonym replacement, which might not be enough. I'll think about a more 'adaptive' way to generate context-aware pairs using a generative model.
```