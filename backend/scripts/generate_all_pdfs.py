from fpdf import FPDF
import os

class AcademicPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.cell(0, 10, "Academic Research Proposal - Confidential", border=False, ln=0, align="R")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

def create_rich_pdf(filename, title, sections):
    pdf = AcademicPDF()
    pdf.add_page()
    
    # Main Title
    pdf.set_font("Helvetica", "B", 18)
    pdf.multi_cell(0, 10, title, align="C")
    pdf.ln(10)
    
    # Author & Date
    pdf.set_font("Helvetica", "I", 10)
    pdf.cell(0, 10, "Lead Researcher: J. Doe | Date: April 2026", ln=True, align="C")
    pdf.ln(10)
    
    for section_title, content in sections.items():
        # Clean content for FPDF (handles em-dashes etc.)
        content = content.replace('—', '-').replace('–', '-').replace('\u201c', '"').replace('\u201d', '"').replace('\u2018', "'").replace('\u2019', "'")
        
        # Section Heading
        pdf.set_font("Helvetica", "B", 14)
        pdf.set_text_color(31, 73, 125) # Dark Blue
        pdf.cell(0, 10, section_title, ln=True)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(2)
        
        # Section Content
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, content)
        pdf.ln(5)
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    pdf.output(filename)

# ---------------------------------------------------------
# Project 01: Biomedical Entity Linking
# ---------------------------------------------------------
p1_v1 = {
    "Abstract": "This proposal outlines the development of a 'Universal Multimodal Scientific Entity Linking' (UMSEL) framework. We aim to leverage cross-domain transformer architectures to bridge the semantic gap between textual mentions and visual representations in academic literature, specifically targeting unified linking across PubMed and arXiv databases.",
    "1. Introduction": "Scientific literature is expanding at an unprecedented rate, with interdisciplinary research becoming the norm. Existing entity linking (EL) systems are predominantly domain-specific (e.g., BioBERT for medicine) and fail to generalize. This project proposes a 'one-size-fits-all' model that learns from 5 million open-access papers, aiming for a global understanding of scientific entities.",
    "2. Proposed Methodology": "We propose a large-scale transformer-based architecture using multimodal fusion. The model integrates a textual encoder (SBERT) and a generic CNN-based vision encoder. We hypothesize that the structural topology of scientific diagrams (plots, charts) provides invariant features that can resolve ambiguous textual mentions. Training will utilize a Massive Multimodal Scientific (MMS) dataset crawled from diverse open-access repositories.",
    "3. Evaluation Plan": "The system will be benchmarked on standard entity linking datasets including BC5CDR, MedMentions, and SciERC. Our primary metric is Top-1 linking accuracy. We anticipate that pre-training on a massive, cross-domain corpus will yield superior performance compared to specialized baselines.",
    "4. Impact": "By providing a universal linker, we enable researchers to navigate complex cross-field dependencies, accelerating discovery in fields like material science and genomics."
}

p1_v2 = {
    "Abstract": "Following initial reviews, this research refocuses on 'Contrastive Learning for Low-Resource Biomedical Entity Linking'. We pivot from a universal approach to a specialized framework targeting rare chemical compounds by integrating textual context with 2D chemical structure diagrams (MBL - Multimodal Bio-Linking).",
    "1. Problem Definition": "General-purpose linkers struggle with rare entities due to data scarcity. However, these entities are often accompanied by diagrams in papers. We propose that these diagrams are more consistent than textual names. V2 addresses this by narrowing the domain to Biomedicine, where low-resource entities are a critical bottleneck.",
    "2. Methodology: Dual-Encoders": "We implement a Dual-Encoder framework. Encoder A (BioBERT) processes the textual mention, while Encoder B (ResNet-50) processes 2D chemical structure images. A contrastive loss function aligns these representations in a shared latent space. Data augmentation includes synonym replacement and image jittering to expand the limited training pairs.",
    "3. Evaluation": "We target the chemical subset of the BC5CDR dataset. Performance will be compared against a text-only BioBERT baseline to quantify the performance boost from visual features."
}

p1_v3 = {
    "Abstract": "The final iteration presents 'Adaptive Context-Swapping' (ACS)—a generative data augmentation framework for low-resource biomedical entity linking. We address the 'noise' problem in standard augmentation by using a fine-tuned LLM to generate high-fidelity synthetic contexts, paired with a semantic consistency filter.",
    "1. The Core Challenge": "Previous iterations (V2) used standard augmentation, which often introduced semantic noise, misleading the contrastive learner. For rare entities, the lack of diverse positive examples remains the primary barrier to high-accuracy linking.",
    "2. Methodology: ACS and ViT": "First, a Llama-3 (8B) model generates 50 diverse synthetic sentences for each rare entity. A Cross-Encoder quality filter discards examples with low semantic consistency. Second, we replace the ResNet-50 from V2 with a Vision Transformer (ViT) pre-trained on chemical diagrams. The final architecture uses a weighted triplet loss for optimization.",
    "3. Final Evaluation": "Results on MedMentions (4k+ rare entities) show significant improvements in Macro-F1 scores, demonstrating the effectiveness of ACS in handling the long tail of rare biomedical entities."
}

# ---------------------------------------------------------
# Project 02: Amazon Deforestation
# ---------------------------------------------------------
p2_v1 = {
    "Abstract": "Proposal for a 'Global Deforestation Monitoring System' using daily multi-spectral satellite feeds and deep learning. We aim to provides real-time alerts for forest loss across the entire tropical belt.",
    "1. Introduction": "Deforestation is a primary driver of carbon emissions. Current systems like GFDL are either too slow or have low resolution. We propose a high-resolution (10m) framework leveraging Sentinel-2 imagery to track forest changes daily, utilizing pixel-level classification to identify clearings.",
    "2. Methodology": "The system uses a modified U-Net architecture for semantic segmentation. We will train on a global dataset of hand-labeled forest masks. The model will output a probability map of forest loss for every 10m pixel, refreshed every 5 days based on satellite revisit cycles.",
    "3. Evaluation": "We will validate the system using high-resolution Planet Nicfi data across 50 test sites in Asia, Africa, and South America. Success is measured by IoU (Intersection over Union) and early detection latency."
}

p2_v2 = {
    "Abstract": "Refining the scope to 'Monitoring Amazon Cattle Ranching via Temporal Forest Analysis'. We address the need for driver-specific monitoring in the Amazon basin by analyzing temporal patterns of forest canopy change to distinguish ranching from other land uses.",
    "1. Background": "Cattle ranching is the single largest driver of Amazon deforestation. General monitors (V1) fail to identify the intended land use post-deforestation. By narrowing the focus, we can identify specific 'pasture' signatures in the cleared land.",
    "2. Methodology: ResNet-LSTM": "We adopt a temporal approach using a hybrid ResNet-LSTM model. This allows us to track the evolution of a pixel over time. Cattle ranching shows a distinct 'clearing followed by grass growth' signature. We will also incorporate weather metadata to filter seasonality effects.",
    "3. Expected Outcomes": "The model aims to provide a 'Driver Probability' score for each clearing, better informing policy makers and conservation groups."
}

p2_v3 = {
    "Abstract": "Final implementation: 'Multimodal SAR-Optical Fusion for Robust Deforestation Detection'. We overcome the persistent cloud coverage problem in the Amazon by integrating Synthetic Aperture Radar (SAR) with optical data, ensuring reliable monitoring regardless of weather.",
    "1. The Cloud Bottleneck": "In the Amazon, cloud cover can persist for months, rendering optical sensors (V1, V2) useless during the peak 'burning season'. SAR sensors (Sentinel-1) can 'see through' clouds but are harder to interpret in isolation.",
    "2. Technical Approach: Attention Fusion": "We propose a dual-stream architecture. Stream A processes Sentinel-2 optical data, while Stream B processes Sentinel-1 SAR backscatter. A cross-modal attention module dynamically weights the streams based on cloud probability. This allows the model to rely on SAR when clouds are present and use Optical for high-detail confirmation when clear.",
    "3. Validation": "Testing during the 2025 rainy season shows a 45% reduction in detection delay compared to optical-only systems, with no loss in classification accuracy."
}

# ---------------------------------------------------------
# Project 03: Urban Traffic Prediction
# ---------------------------------------------------------
p3_v1 = {
    "Abstract": "Proposal for 'Unified Graph Neural Network Architectures for Predictive Urban Traffic Analytics'. We aim to build a universal traffic predictor applicable to any city globally by training on OpenStreetMap (OSM) topologies.",
    "1. Motivation": "Urban congestion costs billions annually. Existing models are city-specific. We propose a Graph Convolutional Network (GCN) that learns the fundamental physics of traffic flow on the underlying road graph, making it transferable across diverse urban layouts.",
    "2. Methodology": "We represent city roads as a directed graph where nodes are intersections and edges are road segments. A spectral GCN is used to capture spatial dependencies. Training data will include floating car data (FCD) from 20 major cities. We hypothesize that the model will learn universal congestion propagation rules.",
    "3. Evaluation": "We will test the transferability of the model by training on US cities and testing on European cities, measuring Mean Absolute Error (MAE) and Root Mean Square Error (RMSE) of predicted speeds."
}

p3_v2 = {
    "Abstract": "Refined research on 'London Bike-Sharing Demand Prediction via Spatial-Temporal GCN'. We pivot to a specific multimodal transport problem in London, integrating weather and holiday metadata to capture the complex dynamics of urban micro-mobility.",
    "1. Problem Shift": "General traffic models (V1) often miss the nuances of micro-mobility. London's bike-sharing system (Santander Cycles) presents a unique challenge due to highly asymmetric demand during peak hours. V2 focuses on predicting station-level demand.",
    "2. Methodology: ST-GCN": "We implement a Spatial-Temporal Graph Convolutional Network (ST-GCN). We augment the road graph with station-to-station usage links. Input features include hourly weather (rain, temp) and city events. The model captures both the spatial proximity of stations and the temporal periodicity of commuter habits.",
    "3. Evaluation": "Evaluated on 12 months of London TFL open data. We compare ST-GCN against baseline LSTM and GRU models to demonstrate the value of the graph-based approach."
}

p3_v3 = {
    "Abstract": "Final Proposal: 'Adaptive Attention-GCN for Sparse Sensor Networks in Urban Traffic'. We address the real-world problem of missing sensor data and dynamic road dependencies using a Graph Attention Network (GAT).",
    "1. The Reality of Data": "V2 assumed a perfect graph with fixed edge weights. In practice, sensors fail frequently, and the 'influence' of one road on another changes with traffic volume. Fixed GCN weights are insufficient for high-fidelity prediction in sparse networks.",
    "2. Core Innovation: Adaptive Attention": "We replace the fixed GCN kernels with an Adaptive Attention mechanism. This allows the model to learn multi-head attention weights between nodes dynamically. Furthermore, we introduce a temporal interpolation module to 'fill in' gaps for failed sensors based on their neighbors' states.",
    "3. Performance Analysis": "Testing on a 'masked' London dataset (where 30% of sensors are missing) shows that the Attention-GCN maintains 90% accuracy, significantly outperforming the static ST-GCN from V2."
}

# ---------------------------------------------------------
# Project 04: Document Restoration
# ---------------------------------------------------------
p4_v1 = {
    "Abstract": "Proposal for 'Advanced Generative Adversarial Networks for the Holistic Restoration of Historical Manuscripts'. We aim to restore faded, torn, and water-damaged documents from any era using unsupervised image-to-image translation.",
    "1. Introduction": "Billions of historical pages are deteriorating in archives. Manual restoration is impossible. We propose using CycleGANs to learn the mapping between 'deteriorated' and 'restored' document distributions without requiring paired training data (which does not exist for old documents).",
    "2. Methodology": "Modified CycleGAN with a focus on text legibility. We use a combination of perceptual loss and a new 'Legibility Loss' based on localized contrast. We will train on synthetic aging data (artificially aged modern documents) and actual archival scans from the British Library.",
    "3. Evaluation": "We will conduct a qualitative study with paleographers to rate legibility. Quantitatively, we will measure OCR accuracy improvements on the restored documents."
}

p4_v2 = {
    "Abstract": "Refined Proposal: '18th-Century English Manuscript Tear Restoration via Partial Convolutions'. We narrow the focus to physical damage (tears/holes) in a specific historical corpus, using specialized inpainting techniques to ensure structural integrity.",
    "1. Strategy Shift": "The broad CycleGAN approach (V1) struggled with large missing regions (tears), often creating visual hallucinations. V2 addresses this by focusing on 'inpainting' for 18th-century English manuscripts, where the paper texture and ink style are highly consistent.",
    "2. Methodology: Partial Convolutions": "We use a U-Net with Partial Convolutions, which are designed specifically for irregular hole filling. The network prioritizes valid pixels and progressively masks out the 'holes'. We use a style-loss calculated from a pre-trained VGG network to match the grainy texture of 1700s rag paper.",
    "3. Evaluation": "Validation involves manually tearing modern replicas, scanning them, and measuring the Peak Signal-to-Noise Ratio (PSNR) between the original and the restored result."
}

p4_v3 = {
    "Abstract": "Final Implementation: 'Semantic-Consistent Restoration via OCR-Guided GAN'. We introduce a dual-task learning framework that ensures restored text is not just visually plausible but semantically correct using a joint restoration-recognition loss.",
    "1. The Semantic Problem": "Standard inpainting (V2) can create 'plausible' but incorrect letters (e.g., turning an 'e' into an 'o'). For historical documents, this is a fatal error as it changes the historical record. Visual fidelity must be coupled with semantic truth.",
    "2. Technical Innovation: OCR-Guided Loss": "We introduce a 'Semantic Consistency Loss'. A pre-trained OCR engine (Tesseract 5, fine-tuned on 18th-century fonts) acts as a second discriminator. The generator is penalized if the OCR output on the restored patch differs from the expected semantic content (when ground truth is available) or if the confidence score is low.",
    "3. Result Summary": "Testing on the Early English Books Online (EEBO) dataset shows a 25% increase in usable characters compared to V2, proving that semantic guidance is essential for true historical document restoration."
}

if __name__ == "__main__":
    base = "/Users/mgccvmacair/Myproject/Academic/ResearchProject/backend/projects"
    
    # Project 01
    create_rich_pdf(f"{base}/project01/files/f1.pdf", "Towards Universal Multimodal Scientific Entity Linking", p1_v1)
    create_rich_pdf(f"{base}/project01/files/f2.pdf", "Contrastive Learning for Low-Resource Biomedical Entity Linking", p1_v2)
    create_rich_pdf(f"{base}/project01/files/f3.pdf", "Adaptive Context-Swapping (ACS) for rare entities", p1_v3)
    
    # Project 02
    create_rich_pdf(f"{base}/project02/files/f1.pdf", "A Global Framework for Real-time Deforestation Monitoring", p2_v1)
    create_rich_pdf(f"{base}/project02/files/f2.pdf", "Monitoring Amazon Cattle Ranching via Temporal Forest Analysis", p2_v2)
    create_rich_pdf(f"{base}/project02/files/f3.pdf", "Multimodal SAR-Optical Fusion for Robust Deforestation Detection", p2_v3)
    
    # Project 03
    create_rich_pdf(f"{base}/project03/files/f1.pdf", "Unified GNN Architectures for Predictive Urban Traffic Analytics", p3_v1)
    create_rich_pdf(f"{base}/project03/files/f2.pdf", "London Bike-Sharing Demand Prediction via Spatial-Temporal GCN", p3_v2)
    create_rich_pdf(f"{base}/project03/files/f3.pdf", "Adaptive Attention-GCN for Sparse Sensor Networks in Urban Traffic", p3_v3)
    
    # Project 04
    create_rich_pdf(f"{base}/project04/files/f1.pdf", "Advanced GANs for the Holistic Restoration of Historical Manuscripts", p4_v1)
    create_rich_pdf(f"{base}/project04/files/f2.pdf", "18th-Century English Manuscript Tear Restoration via Partial Convolutions", p4_v2)
    create_rich_pdf(f"{base}/project04/files/f3.pdf", "Semantic-Consistent Restoration via OCR-Guided GAN", p4_v3)
    
    print("All 12 high-fidelity PDFs generated across 4 projects.")
