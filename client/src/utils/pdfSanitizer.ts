/**
 * Sanitizes a DOM subtree for safe PDF export via html2canvas.
 * This removes unsupported CSS properties (like modern color functions)
 * and enforces safe legacy color formats.
 */
export function sanitizeForPdf(root: HTMLElement) {
    // 1. Force safe colors on the root container itself
    root.style.backgroundColor = "#ffffff";
    root.style.color = "#000000";
    root.style.borderColor = "#000000";

    // Inject a style block to force-safe pseudo-elements (::before, ::after)
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        *::before, *::after {
            background-image: none !important;
            background-color: #e2e8f0 !important;
            border-color: #000000 !important;
            color: #000000 !important;
            box-shadow: none !important;
            filter: none !important;
            backdrop-filter: none !important;
        }
    `;
    root.appendChild(styleTag);

    // 2. Process ALL nodes including root
    const descendants = Array.from(root.querySelectorAll("*"));
    const elements = [root, ...descendants];

    elements.forEach(node => {
        const el = node as HTMLElement;
        if (!el.style) return;

        // Skip script/style tags
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;

        // --- UNCONDITIONAL NUKE ---
        // Don't check computed styles. Just brute-force safe values.

        // 1. Kill all modern effects
        el.style.backgroundImage = 'none';
        el.style.boxShadow = 'none';
        el.style.filter = 'none';
        el.style.backdropFilter = 'none';

        // 2. Reset colors to simple hex
        // If it has text content, ensure it's black
        if (el.childNodes.length > 0) {
            // Check for direct text nodes
            let hasText = false;
            el.childNodes.forEach(c => {
                if (c.nodeType === 3 && c.textContent && c.textContent.trim().length > 0) hasText = true;
            });
            if (hasText) {
                el.style.color = '#000000';
            }
        }

        // 3. Reset backgrounds
        // Default to transparent instead of checking computed.
        // If we want to preserve structure, we rely on borders.
        // Exception: Buttons or logical containers might need a background, 
        // but for a print report, simple borders are safer.

        // IMPORTANT: Avoid overwriting the canvas background if it's transparent
        if (el.tagName !== 'CANVAS') {
            // If it looks like a card (based on common checks we can assume), maybe white?
            // Safest is just transparent + black border
            el.style.backgroundColor = 'transparent';
            el.style.borderColor = '#e2e8f0';
        }

        // 4. Specific fix for SVG icons (which use fill/stroke)
        if (el.tagName === 'svg' || el.tagName === 'path' || el.tagName === 'circle' || el.tagName === 'rect') {
            el.style.fill = '#000000';
            el.style.stroke = '#000000';
        }

        // 5. Cleanup variables
        el.style.removeProperty("--tw-bg-opacity");
        el.style.removeProperty("--tw-text-opacity");
        el.style.removeProperty("--tw-border-opacity");
        el.style.removeProperty("--tw-gradient-stops");
    });
}
