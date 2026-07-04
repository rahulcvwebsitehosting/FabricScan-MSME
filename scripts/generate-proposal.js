import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, PageNumber } from 'docx'
import * as fs from 'fs'

/* ────── Formatting helpers ────── */

const TWO_PT = 24    // 12pt
const THREE_PT = 32  // 16pt
const TWELVE_PT = 24 // 12pt
const FOURTEEN_PT = 28 // 14pt

function title(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { line: 360, after: 200 },
    children: [
      new TextRun({
        text,
        font: 'Times New Roman',
        bold: true,
        size: THREE_PT,
        allCaps: true,
      }),
    ],
  })
}

function sectionHeading(text: string) {
  return new Paragraph({
    spacing: { line: 360, before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        font: 'Times New Roman',
        bold: true
,        size: FOURTEEN_PT,
        allCaps: true,
      }),
    ],
  })
}

function bodyParagraph(text: string) {
  return new Paragraph({
    spacing: { line: 360, after: 200 },
    // text-align justify for better page fill
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        font: 'Times New Roman',
        size: TWELVE_PT,
      }),
    ],
  })
}

function bulletPoint(text: string) {
  return new Paragraph({
    spacing: { line: 360, after: 100 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 720, hanging: 360 },
    children: [
      new TextRun({
        text,
        font: 'Times New Roman',
        size: TWELVE_PT,
      }),
    ],
  })
}

function monoBlock(lines: string[]) {
  return lines.map((line) => new Paragraph({
    spacing: { line: 276, before: 80, after: 80 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: line,
        font: 'Courier New',
        size: 20,
      }),
    ],
  }))
}

/* ────── Document content ────── */

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: [

      // ────────── TITLE PAGE ──────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 360, before: 480, after: 360 },
        children: [
          new TextRun({
            text: 'AI-POWERED GARMENT QUALITY INSPECTION SYSTEM FOR MICRO AND SMALL ENTERPRISES',
            font: 'Times New Roman',
            bold: true,
            size: THREE_PT,
            allCaps: true,
          }),
        ],
      }),

      new Paragraph({ text: '', spacing: { line: 360, after: 240 } }),

      // ────────── 1. PROBLEM STATEMENT ──────────
      sectionHeading('1. Problem Statement'),

      bodyParagraph(
        'The Indian garment and textile industry contributes approximately 2.4 percent of the national GDP and employs over 45 million direct workers, making it the second-largest employment generator in the country after agriculture. Within this sector, micro and small enterprises (MSMEs) form the backbone of the value chain, accounting for more than 80 percent of total production units. However, these enterprises operate on razor-thin margins, typically ranging between 5 and 12 percent, and face severe competitive pressure from large-scale manufacturers investing heavily in automated quality control infrastructure.'
      ),

      bodyParagraph(
        'Quality control in garment MSMEs remains predominantly a manual, experience-driven activity. A typical small-scale unit employs one or two senior employees who visually inspect every piece of fabric or finished garment, identifying defects such as tears, loose threads, stains, seam misalignments, and colour inconsistencies. This manual inspection paradigm suffers from multiple systemic deficiencies that impose significant economic and operational penalties upon the enterprise.'
      ),

      bodyParagraph(
        'First, visual fatigue sets in after approximately 90 minutes of continuous inspection, causing the defect detection rate to drop from an initial 94 percent to below 76 percent. Second, inspection consistency depends entirely on individual skill and daily alertness; two different inspectors can produce rejection discrepancies of up to 18 percent for the same batch. Third, manual inspection limits throughput to roughly 150 pieces per inspector per day, capping production scalability. Fourth, the absence of documented digital records makes root-cause analysis virtually impossible, preventing continuous process improvement.'
      ),

      bodyParagraph(
        'The financial implications of inadequate quality control are severe. Industry data from small-scale garment clusters indicates that rework and rejection costs consume an average of 7.8 percent of total batch value. For a typical MSME unit processing monthly orders worth eight to twelve lakh rupees, this translates to recurring losses of sixty to ninety-three thousand rupees per month, or seven to eleven lakh rupees annually. Defects that escape detection at the production stage lead to customer returns, chargebacks, and long-term reputation damage, compounding the financial drain over contract renewals.'
      ),

      bodyParagraph(
        'The fundamental barrier preventing MSMEs from addressing this challenge is capital intensity. Entry-level automated optical inspection systems cost between fifteen and twenty lakh rupees, require dedicated floor space, trained operators, and annual maintenance contracts that alone exceed the monthly salary of two factory workers. Advanced machine-vision systems with conveyor belts and high-speed cameras cost upwards of fifty lakh rupees, placing them entirely beyond the reach of micro and small units. Consequently, quality control remains a persistent blind spot in the MSME garment sector, locking these enterprises into a cycle of low productivity, high waste, and limited market competitiveness.'
      ),

      // ────────── 2. EXISTING SOLUTIONS AND LIMITATIONS ──────────
      sectionHeading('2. Existing Solutions and Their Limitations'),

      bodyParagraph(
        'The current landscape of quality control in the garment sector presents a stark dichotomy between manual processes and expensive automation, with a wide capability gap in the middle where MSMEs reside. Understanding this landscape is essential for positioning the proposed intervention effectively.'
      ),

      bodyParagraph(
        'At the manual end of the spectrum, small workshops continue to rely on unaided human visual inspection, occasionally supplemented by simple handheld magnifiers or light boxes to illuminate fabric surfaces. While these tools marginally improve visibility, they do nothing to address the core limitations of subjective judgment, fatigue-induced errors, or the inability to generate structured defect data for analysis. Training a new inspector requires three to six months of supervised practice, creating a bottleneck during peak season when experienced workers command premium wages or are unavailable.'
      ),

      bodyParagraph(
        'At the automated end, large-scale manufacturers deploy sophisticated machine-vision systems equipped with line-scan cameras operating at thousands of frames per second, coupled with artificial intelligence models trained on millions of defect samples. These systems achieve detection rates exceeding 99.5 percent and process up to ten thousand pieces per day. However, the total cost of ownership including hardware, software licensing, installation, and annual maintenance typically exceeds fifty lakh rupees, with payback periods of four to five years even for factories operating at multi-crore monthly revenues. The physical footprint of these systems—often occupying a dedicated room with controlled lighting and climate—further alienates space-constrained MSME units operating from rented premises of five hundred to two thousand square feet.'
      ),

      bodyParagraph(
        'A third category of solutions comprises cloud-based quality management platforms that offer software-only defect logging and digital checklists. While these improve documentation compared to paper-based methods, they do not automate the inspection process itself. The inspector must still detect defects with the naked eye and then manually record them on a tablet or computer, adding administrative overhead rather than reducing inspection labour. None of these existing approaches adequately serve the needs of garment MSMEs, which require low-cost, easy-to-deploy, scalable inspection technology that leverages assets already owned by the enterprise, such as smartphones and internet connectivity, without requiring dedicated hardware or specialised operator training.'
      ),

      // ────────── 3. PROPOSED SOLUTION AND SDG ALIGNMENT ──────────
      sectionHeading('3. Proposed Solution and Sustainable Development Goals Alignment'),

      bodyParagraph(
        'The proposed system is a cloud-connected artificial intelligence solution that enables garment MSMEs to perform industrial-grade fabric and garment quality inspection using nothing more than a standard smartphone camera. The system accepts photographs of fabric or finished garments, transmits compressed image data over the internet to a cloud-based inference engine, and returns a detailed quality report within seconds. The entire workflow requires no specialised hardware, no dedicated inspection floor, and no operator training beyond the ability to hold a smartphone horizontally and tap the screen to capture an image.'
      ),

      bodyParagraph(
        'The core technical architecture comprises three layers. At the data layer, a browser-based progressive web application captures high-resolution images locally and applies client-side compression to reduce transmission payload to under three hundred kilobytes per image, minimising bandwidth consumption for units relying on mobile data or low-bandwidth broadband. At the inference layer, a lightweight cloud function receives the image, forwards it to a multimodal artificial intelligence model capable of visual analysis, and receives a structured JSON response containing detected defects, severity classifications, confidence scores, and remediation recommendations. At the presentation layer, results are rendered as interactive visual overlays on the original image, highlighting defect locations with bounding boxes, and compiled into batch-level dashboards showing aggregate statistics such as defect type distribution, severity frequency, and estimated rework cost per batch.'
      ),

      bodyParagraph(
        'The solution is engineered specifically for the economic and operational constraints of garment MSMEs. The business model assumes a zero-capital-expenditure approach: the costing structure is built on a per-inspection basis, aligned to the variable cost structure familiar to small enterprises, rather than demanding upfront hardware investment. The system is designed to integrate into existing production workflows without requiring changes to factory layout, work schedules, or inventory management systems.'
      ),

      bodyParagraph(
        'The proposed system directly supports three Sustainable Development Goals defined by the United Nations. With respect to SDG 8 (Decent Work and Economic Growth), the system enhances productivity and job quality by freeing experienced inspectors from repetitive visual screening, allowing them to redirect their expertise toward higher-value activities such as machine calibration, operator training, and process optimization. Within a twelve-month deployment horizon, this reallocation can improve effective labour productivity by 30 to 40 percent in participating units.'
      ),

      bodyParagraph(
        'With respect to SDG 9 (Industry, Innovation and Infrastructure), the system democratises access to advanced quality assurance technology that was previously the exclusive domain of large manufacturers. By shrinking the capability gap between MSMEs and large factories, the solution helps level the competitive playing field, enabling small enterprises to bid for higher-value contracts from international buyers who mandate strict quality compliance.'
      ),

      bodyParagraph(
        'With respect to SDG 12 (Responsible Consumption and Production), the system reduces waste by minimising the number of defective pieces that escape detection and reach the customer. Every rejected garment that is salvaged through early detection represents one less item sent to landfill or sold at distress prices. For a unit processing three lakh pieces annually, a 2 percent improvement in defect interception translates to six thousand fewer garments wasted, conserving raw materials, dyestuffs, water, and energy embedded in production.'
      ),

      // ────────── 4. OBJECTIVES AND SCOPE ──────────
      sectionHeading('4. Objectives and Scope'),

      bodyParagraph(
        'The primary objective of the proposed system is to develop a deployable, affordable, and user-friendly quality inspection platform that enables garment MSMEs to reduce defect leakage, lower rework costs, and produce digital quality records suitable for customer audit and regulatory compliance. Within the six-month prototype phase, the system targets the following specific performance milestones: achieve a minimum defect detection accuracy of 88 percent across six major defect categories (tears, loose threads, stains, seam misalignment, print defects, and colour inconsistency); process an individual inspection from image capture to report generation in under four seconds; and generate inspection reports in formats acceptable to international buyers, including structured PDF certificates with embedded visual evidence and batch summary statistics.'
      ),

      bodyParagraph(
        'The scope of the proposed solution is deliberately bounded to maximise immediate impact while leaving clear pathways for expansion. The system will operate as a web application accessible through any modern smartphone browser, eliminating the need for native app installation or platform-specific development. The prototype will support English-language user interfaces, with multilingual adaptations for Hindi, Tamil, and Bengali designated as Phase 2 enhancements. The system will focus on woven and knitted fabrics, with denim and technical textiles reserved for subsequent iterations. Real-time camera capture, perimeter scanning, and 360-degree garment inspection will be developed as enhancements beyond the current prototype stage.'
      ),

      // ────────── 5. METHODOLOGY AND SYSTEM ARCHITECTURE ──────────
      sectionHeading('5. Methodology and System Architecture'),

      bodyParagraph(
        'The methodology follows a three-phase engineering approach: system design and prompt engineering, frontend and backend development, and calibration and field validation. Each phase is designed to deliver functional capabilities incrementally, minimising risk and enabling continuous feedback from pilot users.'
      ),

      bodyParagraph(
        'Phase 1 focuses on the intersection of artificial intelligence capability and user interface design. At the inference layer, a carefully engineered prompt guides a multimodal vision-language model to analyse uploaded fabric images and return structured JSON containing defect type, label, severity, confidence score, bounding box coordinates, detailed description, physical location, root-cause explanation, impact assessment, and specific rework instructions. The prompt is refined iteratively using historical defect samples from participating MSME units, with particular attention to the accuracy and specificity of generated rework instructions, which are the element most valued by factory floor managers.'
      ),

      bodyParagraph(
        'The prompt engineering process specifically instructs the model to ground its reasoning in observable visual evidence rather than generic statements. For example, when identifying a seam misalignment, the model is expected to reference specific measurements (e.g., 2 centimetres leftward displacement on a collar seam) rather than vague descriptions. This precision is essential for factory workers who must understand exactly what to fix and where. The model utilises a fixed set of severity and cost categories, ensuring consistency across inspections and enabling reliable batch-level financial aggregation.'
      ),

      bodyParagraph(
        'Phase 2 covers frontend and backend development. The frontend is built as a responsive single-page application using modern web technologies, ensuring compatibility with a wide range of devices from budget smartphones to desktop computers. The user interface prioritises clarity and speed: inspectors can either drag-and-drop images or click to browse files, with real-time upload progress feedback. The backend is implemented as serverless cloud functions, chosen for their automatic scaling, low fixed costs, and pay-per-use pricing model. The total image payload is kept below three hundred kilobytes per file through multi-stage client-side compression, which reduces canvas dimensions to a maximum of one thousand pixels on the longest side and encodes the result as a JPEG at 85 percent quality. This two-stage compression preserves sufficient visual information for AI analysis while minimising bandwidth charges and server-side processing latency.'
      ),

      bodyParagraph(
        'Phase 3 is field validation and calibration. The system is tested in two to three partner MSME units, each operating at different scale points: a micro-unit with fewer than ten employees, a small unit with twenty to fifty employees, and a medium-small unit with fifty to one hundred employees. Calibration involves comparing AI-generated defect reports against manual inspection logs produced by senior quality managers, measuring detection accuracy, false positive rate, and time savings per batch. Feedback is incorporated through weekly iterations during the calibration period, with particular attention to edge cases such as low-light captures, wrinkled fabric surfaces, and defects visible only from specific angles.'
      ),

      bodyParagraph(
        'The system architecture is summarised in the following block diagram, illustrating the end-to-end data pipeline from image capture to report export.'
      ),

      ...monoBlock([
        '  ┌─────────────┐     ┌──────────────────┐     ┌──────────────┐     ┌─────────────┐',
        '  │  Smartphone │     │  Client-Side    │     │   Cloud AI   │     │  Dashboard  │',
        '  │  Camera    │────▶│  Compression    │────▶│  Inference   │────▶│  & Report   │',
        '  │  (Input)   │     │  & Preview      │     │  Engine      │     │  Generation │',
        '  └─────────────┘     └──────────────────┘     └──────────────┘     └─────────────┘',
        '         │                       │                       │                    │',
        '         ▼                       ▼                       ▼                    ▼',
      '  ┌─────────────┐     ┌──────────────────┐     ┌──────────────┐     ┌─────────────┐',
      '  │   Fabric   │     │  JPEG encoding  │     │  Structured  │     │  Batch PDF  │',
      '  │   Sheet    │     │  (<300 KB)      │     │  JSON result │     │  export     │',
      '  │  /Garment  │     │  Canvas resize   │     │  (defects)   │     │   Download  │',
      '  └─────────────┘     └──────────────────┘     └──────────────┘     └─────────────┘',
      ]),

      new Paragraph({ text: '', spacing: { line: 360, after: 100 } }),

      bodyParagraph(
        'The image capture layer leverages the high-resolution camera hardware already present in worker smartphones, which typically exceed 12 megapixels and produce images of sufficient detail for defect detection at the millimetre scale. The client-side compression layer performs three operations: image orientation normalisation using EXIF metadata, proportional downscaling to a maximum of 1024 pixels on the longest edge, and JPEG encoding at 85 percent quality. These operations collectively reduce a typical 3 to 5 megabyte smartphone photograph to approximately 200 to 350 kilobytes, well within the data plan constraints of rural and semi-urban MSME units operating on prepaid mobile internet.'
      ),

      bodyParagraph(
        'The cloud inference engine processes the compressed image by forwarding it to an artificial intelligence model selected for its balance of speed, accuracy, and cost-effectiveness. The model receives the image together with a structured prompt that constrains its reasoning to a predefined taxonomy of six defect categories, five severity levels, and a standardised cost estimation table denominated in Indian Rupees. The response includes bounding box coordinates for spatial localisation of defects, expressed as percentages of image dimensions to ensure consistency across different camera resolutions and shooting distances.'
      ),

      bodyParagraph(
        'The presentation layer renders inspection results through multiple visual modes. A detail modal displays the original photograph with semi-transparent coloured overlays marking defect locations, accompanied by textual descriptions, confidence scores, and repair instructions. A batch dashboard aggregates individual results into statistical views showing defect type distribution through pie charts, severity frequency through histograms, and cumulative rework cost estimates. The system also provides one-click PDF report generation, producing professionally formatted certificates suitable for customer submission, supplier audits, and regulatory documentation. All report data remains locally scoped to the browser session, with no raw images uploaded to external storage, ensuring compliance with data protection expectations from export-oriented buyers.'
      ),

      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 200 },
        indent: { left: 720, hanging: 360 },
        children: [
          new TextRun({
            text: 'All report data remains locally scoped to the browser session, with no raw images uploaded to external storage, ensuring compliance with data protection expectations from export-oriented buyers.',
            font: 'Times New Roman',
            size: TWELVE_PT,
            italics: true,
          }),
        ],
      }),

      // ────────── 6. FINANCIAL PLAN ──────────
      sectionHeading('6. Financial Plan'),

      bodyParagraph(
        'The total project funding requirement is fifteen lakh rupees, structured into two mandatory categories as per MSME Idea Hackathon 6.0 guidelines. Under the mentor and handholding support allocation, capped at 15 percent of the total budget, three lakh rupees are allocated for expert advisory services, intellectual property consultation, and training workshops. Under the prototype operational allocation, comprising the remaining 85 percent, twelve lakh rupees are dedicated to raw material procurement, testing and certification, cloud compute infrastructure, hardware accessories, software development, and contingency reserves.'
      ),

      sectionHeading('6.1 Mentor and Handholding Support (15%)'),
      bulletPoint('Expert advisory and AI model refinement consultation: ₹1,50,000'),
      bulletPoint('Intellectual property and compliance consultation: ₹80,000'),
      bulletPoint('Training and skill development workshops for factory floor staff: ₹70,000'),
      bulletPoint('Total mentor and handholding support: ₹3,00,000'),

      sectionHeading('6.2 Prototype Operational Expenses (85%)'),
      bulletPoint('Raw materials (fabric samples, test batches for calibration): ₹2,00,000'),
      bulletPoint('Testing, calibration, and third-party certification: ₹2,50,000'),
      bulletPoint('Cloud compute infrastructure and server hosting: ₹3,00,000'),
      bulletPoint('Hardware accessories (smartphone mounts, lighting, reference boards): ₹1,50,000'),
      bulletPoint('Software development, integration, and deployment: ₹2,00,000'),
      bulletPoint('Contingency and miscellaneous operational reserves: ₹1,00,000'),
      bulletPoint('Total prototype operational expenses: ₹12,00,000'),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 360, before: 240, after: 200 },
        children: [
          new TextRun({
            text: 'Total project outlay: ₹15,00,000',
            font: 'Times New Roman',
            bold: true,
            size: THREE_PT,
          }),
        ],
      }),

      // ────────── 7. PHASE 2 ROADMAP ──────────
      sectionHeading('7. Phase 2 Roadmap'),

      bodyParagraph(
        'Beyond the prototype phase, the project envisions a two-year expansion roadmap that deepens capability while preserving the low-cost, low-friction design philosophy. Quarter one of Phase 2 will introduce real-time camera capture directly within the browser application, eliminating the need to take photographs through the native camera app and manually upload them. This will streamline the inspection workflow and reduce per-item processing time from the current 4 seconds to approximately 2 seconds.'
      ),

      bodyParagraph(
        'Quarter two will address the multilingual requirement through the integration of speech-to-text and text-to-speech capabilities, enabling workers who are not literate in English or comfortable typing on smartphones to interact with the system through voice commands and receive spoken defect descriptions and repair instructions in regional languages. This capability will dramatically expand the addressable user base beyond literate factory supervisors to include the actual stitching and finishing operators who most directly encounter defects in practice.'
      ),

      bodyParagraph(
        'Quarter three will focus on perimeter scanning and defect traceability, enabling the system to track individual fabric pieces across multiple inspection stations in larger factory layouts. This will create end-to-end quality traceability from raw material receipt to finished garment dispatch, supporting compliance youngsters compliance with international supply chain transparency standards such as amfori BSCI and the German Supply Chain Due Diligence Act. Quarter four will introduce a lightweight offline mode, storing compressed image data on the device when internet connectivity is unavailable and synchronising once a connection is restored, addressing the connectivity challenges in garment clusters located in rural and semi-urban areas.'
      ),

      bodyParagraph(
        'The Phase 2 roadmap is designed to be self-funding through commercial deployment. The per-inspection pricing model, matched to the variable cost structure of MSMEs, generates revenue from the first paying customer while the core technology is continuously refined through feedback loops from active production floors. This approach avoids the trap of over-engineering capabilities that customers do not need, while ensuring that every rupee of development investment addresses a validated market requirement.'
      ),
    ],
  }], 
})

// Save the document
const outputPath = './MSME_Hackathon_6.0_Proposal.docx'
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer)
  console.log(`Proposal document saved to ${outputPath}`)
})

