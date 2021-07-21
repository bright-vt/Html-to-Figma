import { WithRef } from '../types';
import { fastClone, parseUnits, getRgb } from '../utils';
import { textNodesUnder, isHidden } from './dom-utils';

export const textToFigma = (el: Element) => {
    const layers = [];
    const textNodes = textNodesUnder(el);

    for (const node of textNodes) {
        const parent = node.parentElement;
        if (!node.textContent || !node.textContent.trim().length || !parent)
            continue;

        if (isHidden(parent)) {
            continue;
        }
        const computedStyles = getComputedStyle(parent);
        const range = document.createRange();
        range.selectNode(node);
        const rect = fastClone(range.getBoundingClientRect());
        const lineHeight = parseUnits(computedStyles.lineHeight);
        range.detach();
        if (lineHeight && rect.height < lineHeight.value) {
            const delta = lineHeight.value - rect.height;
            rect.top -= delta / 2;
            rect.height = lineHeight.value;
        }
        if (rect.height < 1 || rect.width < 1) {
            continue;
        }

        const textNode = {
            x: Math.round(rect.left),
            ref: node,
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            type: 'TEXT',
            characters: node.textContent.trim().replace(/\s+/g, ' ') || '',
        } as WithRef<TextNode>;

        const fills: SolidPaint[] = [];
        const rgb = getRgb(computedStyles.color);

        if (rgb) {
            fills.push({
                type: 'SOLID',
                color: {
                    r: rgb.r,
                    g: rgb.g,
                    b: rgb.b,
                },
                opacity: rgb.a || 1,
            } as SolidPaint);
        }

        if (fills.length) {
            textNode.fills = fills;
        }
        const letterSpacing = parseUnits(computedStyles.letterSpacing);
        if (letterSpacing) {
            textNode.letterSpacing = letterSpacing;
        }

        if (lineHeight) {
            textNode.lineHeight = lineHeight;
        }

        const { textTransform } = computedStyles;
        switch (textTransform) {
            case 'uppercase': {
                textNode.textCase = 'UPPER';
                break;
            }
            case 'lowercase': {
                textNode.textCase = 'LOWER';
                break;
            }
            case 'capitalize': {
                textNode.textCase = 'TITLE';
                break;
            }
        }

        const fontSize = parseUnits(computedStyles.fontSize);
        if (fontSize) {
            textNode.fontSize = Math.round(fontSize.value);
        }
        if (computedStyles.fontFamily) {
            // const font = computedStyles.fontFamily.split(/\s*,\s*/);
            (textNode as any).fontFamily = computedStyles.fontFamily;
        }

        if (computedStyles.textDecoration) {
            if (
                computedStyles.textDecoration === 'underline' ||
                computedStyles.textDecoration === 'strikethrough'
            ) {
                textNode.textDecoration =
                    computedStyles.textDecoration.toUpperCase() as any;
            }
        }
        if (computedStyles.textAlign) {
            if (
                ['left', 'center', 'right', 'justified'].includes(
                    computedStyles.textAlign
                )
            ) {
                textNode.textAlignHorizontal =
                    computedStyles.textAlign.toUpperCase() as any;
            }
        }

        layers.push(textNode);
    }
    return layers;
};
