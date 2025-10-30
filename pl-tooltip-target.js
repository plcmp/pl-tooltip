import { css, html, PlElement } from 'polylib';
import './pl-tooltip.js';

export class PlTooltipTarget extends PlElement {
    static properties = {
        text: { type: String },
        topLayer: { type: Boolean },
        keepHover: { type: Boolean }
    };

    static template = html`
        <div id="target"><slot></slot></div>
    <pl-tooltip target="[[$.target]]" top-layer="[[topLayer]]" keep-hover="[[keepHover]]">
        <template>[[text]]</template>
    </pl-tooltip>`;

    static css = css`
    :host {
        display: contents;
        position: relative;
    }`;
}

customElements.define('pl-tooltip-target', PlTooltipTarget);
