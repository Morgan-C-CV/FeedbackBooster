from fpdf import FPDF

def create_pdf(filename, title, sections):
    pdf = FPDF()
    pdf.add_page()
    
    # Title
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, title, ln=True, align="C")
    pdf.ln(10)
    
    # Metadata
    pdf.set_font("Helvetica", "I", 10)
    pdf.cell(0, 10, "Date: 2026-03-20 | Author: B (Student)", ln=True, align="R")
    pdf.ln(5)
    
    for section_title, content in sections.items():
        # Section Heading
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 10, section_title, ln=True)
        pdf.ln(2)
        
        # Section Content
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5, content)
        pdf.ln(5)
    
    pdf.output(filename)

# --- f1.pdf ---
f1_sections = {
    "1. Abstract": "This research proposal outlines the development of a 'Universal Multimodal Scientific Entity Linking' (UMSEL) system. Our goal is to create a single model capable of identifying and linking entities across all scientific domains by leveraging both textual context and figures from academic publications.",
    "2. Introduction": "Academic literature is growing at an exponential rate. Current entity linking systems are highly specialized and fail when applied to interdisciplinary research. For example, a system designed for computer science cannot effectively link biomedical entities. This project seeks to overcome this limitation by building a universal linker that works globally across PubMed, arXiv, and other major scientific databases.",
    "3. Proposed Methodology": "We propose a large-scale transformer-based architecture with multimodal fusion. The model will take an entity mention, its surrounding 512 tokens of context, and any associated image (like a plot or diagram) as input. We will crawl 5 million open-access papers for training. The vision component will use a generic CNN-based encoder to capture structural features from scientific diagrams.",
    "4. Preliminary Evaluation Plan": "We plan to test the model on every publicly available entity linking dataset (BC5CDR, MedMentions, SciERC, etc.). Our primary metric will be the overall Top-1 linking accuracy. We hypothesize that cross-domain pre-training will yield better results than domain-specific baselines.",
    "5. Discussion & Future Work": "While ambitious, the universal nature of the system is its key strength. Future work will include real-time linking for pre-print servers."
}

# --- f2.pdf ---
f2_sections = {
    "1. Abstract": "Following initial feedback, this proposal shifts focus to a more specialized domain: Biomedical Entity Linking. We specifically target chemical compounds and rare drug mentions by integrating textual context with 2D chemical structure diagrams. This 'Multimodal Bio-Linking' (MBL) approach aims to solve the data scarcity problem in low-resource biomedical entities.",
    "2. Research Problem": "Standard linkers like BioBERT often struggle with rare or newly discovered chemicals because they lack sufficient labeled textual examples. However, these chemicals are almost always accompanied by a structural diagram in the paper. These diagrams provide invariant features that can supplement the textual embedding.",
    "3. Methodology: Contrastive Learning": "We will use a Dual-Encoder framework. Encoder A (BioBERT) will process the textual mention, while Encoder B (ResNet-50) will process the 2D chemical structure images. We will use a contrastive loss to map these representations into a shared latent space. This way, the model learns that a textual name and its corresponding diagram refer to the same concept.",
    "3.2 Data Augmentation": "To handle the low-resource bottleneck, we will perform extensive data augmentation. On the textual side, we will use synonym replacement and back-translation. On the image side, we will use random rotations, cropping, and color jittering on the chemical structure diagrams. This should significantly increase the number of training pairs.",
    "4. Evaluation": "We will evaluate on the BC5CDR dataset, focusing on the chemical entity subset. We will compare our MBL approach against a text-only BioBERT baseline."
}

# --- f3.pdf ---
f3_sections = {
    "1. Abstract": "This final version presents 'Adaptive Context-Swapping' (ACS), a novel data augmentation framework for low-resource biomedical entity linking. Unlike standard augmentation, ACS uses a fine-tuned Large Language Model to generate diverse, high-fidelity synthetic contexts, paired with a semantic consistency filter to ensure data quality. We integrate this with a multimodal Vision Transformer (ViT) to link textual mentions to chemical structures.",
    "2. The Data Scarcity Bottleneck": "In low-resource scenarios, simple synonym replacement (as in V2) fails to capture the complex scientific phrasing required for high-accuracy linking. The core challenge is the lack of diverse positive examples. Rare entities often appear in only a handful of papers, leading to poor generalization in contrastive learning models.",
    "3. Methodology: Adaptive Context-Swapping (ACS)": "ACS is a two-stage pipeline for generating synthetic training data. First, we fine-tune a Llama-3 (8B) model on 100k biomedical abstracts. For each target rare entity, the LLM generates 50 diverse synthetic sentences that are grammatically and scientifically plausible. Second, we introduce a 'Quality Filter' using a Cross-Encoder to calculate a Semantic Consistency Score between the original and synthetic sentences. Only those above a 0.85 threshold are used.",
    "3.3 Multimodal Integration": "We replace the ResNet-50 from V2 with a Vision Transformer (ViT) pre-trained on chemical diagrams. The final embedding is a weighted fusion of the BioBERT textual embedding and the ViT visual embedding, optimized via a modified triplet loss function.",
    "4. Evaluation Plan": "We will use the MedMentions dataset, which contains over 4k rare entities. Our primary metrics will be Top-1 Accuracy and Macro-F1 (to specifically measure performance on the long tail of rare entities). We will also conduct an ablation study to measure the impact of the Quality Filter and the ACS module."
}

if __name__ == "__main__":
    import os
    base_path = "/Users/mgccvmacair/Myproject/Academic/ResearchProject/backend/projects/project01/files"
    os.makedirs(base_path, exist_ok=True)
    
    create_pdf(f"{base_path}/f1.pdf", "Proposal V1: Universal Multimodal Scientific Entity Linking", f1_sections)
    create_pdf(f"{base_path}/f2.pdf", "Proposal V2: Contrastive Learning for Biomedical Entity Linking", f2_sections)
    create_pdf(f"{base_path}/f3.pdf", "Proposal V3 (Final): Adaptive Context-Swapping for Low-Resource Linking", f3_sections)
    print("PDFs generated successfully.")
