// Iter 153 — Shared contract template definitions: single source of truth for
// both contracts.ts (manual creation) and quotes.ts (auto-generation on quote
// acceptance). Previously duplicated in both route files; consolidated here.

export const CONTRACT_TEMPLATES: Record<string, { title: string; content: string }> = {
  PHOTOGRAPHY_SHOOT: {
    title: 'Photography Shoot Agreement',
    content: `<h2>Photography Services Agreement</h2>
<p>This Photography Services Agreement ("Agreement") is entered into between <strong>{{studioName}}</strong> ("Photographer") and <strong>{{clientName}}</strong> ("Client") for the project described below.</p>
<h3>1. Project Details</h3>
<p><strong>Project:</strong> {{projectTitle}}<br/><strong>Event/Session Date:</strong> {{eventDate}}<br/><strong>Agreed Fee:</strong> {{estimatedValue}}</p>
<h3>2. Services Provided</h3>
<p>The Photographer agrees to provide professional photography services as discussed. This includes pre-shoot consultation, the photography session, and post-production editing of the final deliverables.</p>
<h3>3. Deliverables</h3>
<p>The Photographer will deliver a curated selection of professionally edited digital images. Delivery will be via a secure online gallery within 2-4 weeks of the session date, unless otherwise agreed.</p>
<h3>4. Payment Terms</h3>
<p>A non-refundable retainer of 30% of the total fee is due upon signing this agreement. The remaining balance is due no later than 7 days before the session date.</p>
<h3>5. Cancellation &amp; Rescheduling</h3>
<p>Client may reschedule with at least 14 days' written notice, subject to availability. Cancellations less than 14 days before forfeit the retainer. Cancellations less than 48 hours before forfeit the full fee. The Photographer may cancel due to unforeseen circumstances, in which case all payments will be fully refunded.</p>
<h3>6. Usage Rights</h3>
<p>Upon full payment, the Client receives a personal, non-exclusive license to use the images. The Photographer retains full copyright and may use images for portfolio and marketing unless otherwise agreed in writing.</p>
<h3>7. Liability Limitation</h3>
<p>Total liability shall not exceed the total fee paid. The Photographer is not liable for indirect or consequential damages.</p>
<h3>8. Agreement</h3>
<p>By agreeing below, both parties acknowledge they have read, understood, and agree to the terms outlined in this agreement.</p>`,
  },
  PORTRAIT_COMMISSION: {
    title: 'Art Commission Agreement',
    content: `<h2>Art Commission Agreement</h2>
<p>This Agreement is between <strong>{{studioName}}</strong> ("Artist") and <strong>{{clientName}}</strong> ("Client").</p>
<h3>1. Commission Details</h3>
<p><strong>Project:</strong> {{projectTitle}}<br/><strong>Agreed Fee:</strong> {{estimatedValue}}</p>
<h3>2. Scope of Work</h3>
<p>The Artist agrees to create an original artwork as described. Up to two rounds of revisions are included after the initial concept is presented.</p>
<h3>3. Deliverables</h3>
<p>The final deliverable will be the completed artwork in the agreed format (physical piece, digital file, or both).</p>
<h3>4. Payment Terms</h3>
<p>A non-refundable deposit of 50% is due upon acceptance. The remaining 50% is due upon completion and before delivery.</p>
<h3>5. Cancellation Policy</h3>
<p>If the Client cancels after work has begun, the deposit is non-refundable. If cancellation occurs after the concept phase, the Client will be billed for work completed to date.</p>
<h3>6. Intellectual Property</h3>
<p>Upon full payment, the Client receives ownership of the physical artwork (if applicable). The Artist retains the right to reproduce the work for portfolio and exhibitions.</p>
<h3>7. Liability</h3>
<p>Liability is limited to the total commission fee.</p>
<h3>8. Agreement</h3>
<p>By agreeing below, both parties acknowledge they have read, understood, and agree to the terms.</p>`,
  },
  LOGO_DESIGN: {
    title: 'Design Project Agreement',
    content: `<h2>Design Project Agreement</h2>
<p>This Agreement is between <strong>{{studioName}}</strong> ("Designer") and <strong>{{clientName}}</strong> ("Client").</p>
<h3>1. Project Details</h3>
<p><strong>Project:</strong> {{projectTitle}}<br/><strong>Estimated Completion:</strong> {{eventDate}}<br/><strong>Agreed Fee:</strong> {{estimatedValue}}</p>
<h3>2. Scope of Work</h3>
<p>Professional design services including concept development, design iterations, and final production files.</p>
<h3>3. Deliverables</h3>
<p>Final design files in industry-standard formats (AI, EPS, PDF, PNG, SVG). Source files provided upon full payment.</p>
<h3>4. Revisions</h3>
<p>Up to three rounds of revisions per concept are included. Additional revisions billed at agreed hourly rate.</p>
<h3>5. Payment Terms</h3>
<p>50% deposit due upon signing. Remaining balance due upon delivery of final files.</p>
<h3>6. Cancellation</h3>
<p>Deposit is non-refundable. Work completed beyond deposit value will be invoiced.</p>
<h3>7. Intellectual Property</h3>
<p>Upon full payment, all rights to final approved designs transfer to Client. Designer retains portfolio usage rights.</p>
<h3>8. Agreement</h3>
<p>By agreeing below, both parties acknowledge they have read, understood, and agree to the terms.</p>`,
  },
  WEB_DESIGN: {
    title: 'Web Design Agreement',
    content: `<h2>Web Design &amp; Development Agreement</h2>
<p>This Agreement is between <strong>{{studioName}}</strong> ("Designer") and <strong>{{clientName}}</strong> ("Client").</p>
<h3>1. Project Details</h3>
<p><strong>Project:</strong> {{projectTitle}}<br/><strong>Estimated Completion:</strong> {{eventDate}}<br/><strong>Agreed Fee:</strong> {{estimatedValue}}</p>
<h3>2. Scope of Work</h3>
<p>Website design and/or development including wireframing, visual design, development, and basic testing.</p>
<h3>3. Payment Terms</h3>
<p>50% deposit due upon signing. Remaining balance due upon completion.</p>
<h3>4. Timeline &amp; Revisions</h3>
<p>Timeline begins upon receipt of deposit and required content. Two rounds of design revisions included.</p>
<h3>5. Intellectual Property</h3>
<p>Upon full payment, Client owns the final website design. Third-party assets remain subject to their licenses.</p>
<h3>6. Agreement</h3>
<p>By agreeing below, both parties acknowledge they have read and agree to the terms.</p>`,
  },
  GENERAL_SERVICE: {
    title: 'General Service Agreement',
    content: `<h2>Service Agreement</h2>
<p>This Agreement is between <strong>{{studioName}}</strong> ("Provider") and <strong>{{clientName}}</strong> ("Client").</p>
<h3>1. Project Details</h3>
<p><strong>Project:</strong> {{projectTitle}}<br/><strong>Estimated Completion:</strong> {{eventDate}}<br/><strong>Agreed Fee:</strong> {{estimatedValue}}</p>
<h3>2. Services</h3>
<p>The Provider agrees to deliver the services as described in the project brief.</p>
<h3>3. Payment</h3>
<p>50% deposit due upon signing. Remaining balance due upon completion.</p>
<h3>4. Cancellation</h3>
<p>Either party may cancel with 14 days' written notice. Deposit is non-refundable.</p>
<h3>5. Liability</h3>
<p>Liability is limited to the total fee paid.</p>
<h3>6. Agreement</h3>
<p>By agreeing below, both parties acknowledge they agree to the terms.</p>`,
  },
  CUSTOM: {
    title: 'Custom Agreement',
    content: `<h2>Agreement</h2>
<p>This Agreement is between <strong>{{studioName}}</strong> and <strong>{{clientName}}</strong> for <strong>{{projectTitle}}</strong>.</p>
<p><em>Please customize this contract with your specific terms.</em></p>
<h3>1. Scope of Work</h3>
<p>[Describe the services to be provided]</p>
<h3>2. Payment Terms</h3>
<p>Agreed Fee: {{estimatedValue}}</p>
<h3>3. Timeline</h3>
<p>Estimated Completion: {{eventDate}}</p>
<h3>4. Agreement</h3>
<p>By agreeing below, both parties acknowledge they agree to the terms.</p>`,
  },
};

// Maps user industry/project type to the appropriate contract template key.
// Used during auto-generation when a quote is accepted.
export const INDUSTRY_TO_CONTRACT_TYPE: Record<string, string> = {
  PHOTOGRAPHY: 'PHOTOGRAPHY_SHOOT',
  VIDEOGRAPHY: 'PHOTOGRAPHY_SHOOT',
  CONTENT_CREATION: 'PHOTOGRAPHY_SHOOT',
  FINE_ART: 'PORTRAIT_COMMISSION',
  ILLUSTRATION: 'PORTRAIT_COMMISSION',
  SCULPTURE: 'PORTRAIT_COMMISSION',
  GRAPHIC_DESIGN: 'LOGO_DESIGN',
  WEB_DESIGN: 'WEB_DESIGN',
  BRANDING: 'LOGO_DESIGN',
  OTHER: 'GENERAL_SERVICE',
};

// Replaces {{placeholder}} tokens in contract template content with actual values.
export function fillContractTemplate(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || 'TBD');
  }
  return result;
}
