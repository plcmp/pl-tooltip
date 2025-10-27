import { css, html, TemplateInstance } from 'polylib';
import { PlPopover } from '@plcmp/pl-popover';
import { debounce } from '@plcmp/utils';

const shiftX = 8, shiftY = 8;
const popupDelay = 500;

export class PlTooltip extends PlPopover {
    templateContext = [];

    static properties = {
        text: { type: String },
        target: { type: Object },
        followCursor: { type: Boolean },
        contentTemplate: { type: Object }
    };

    static template = html`<div id="outerBox" part="outerBox"><slot></slot></div>`;
    static css = css`
        :host {
            position: absolute;
            display: none;
            z-index: 100; 
            border: 0;
            padding: 0;
            inset: unset;
        }
        :host([visible]) {
            display: block;
        }
        #outerBox {
            background: black;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            max-width: 310px;
        }
    `;

    constructor(tooltipTpl) {
        super();
        this.tooltipTpl = tooltipTpl;
    }

    connectedCallback() {
        this.topLayer = true;
        super.connectedCallback();

        this.style['pointer-events'] = 'none';

        if (!this.tooltipTpl) {
            const templateElement = [...this.childNodes].find(n => n.nodeType === document.COMMENT_NODE && n.textContent.startsWith('tpl:'));
            this.tooltipTpl = templateElement?._tpl ?? html`[[text]]`;
            this.templateContext = templateElement?._hctx ?? [];
        }

        const target = this.target ?? this.parentElement;
        target?.addEventListener('mouseenter', event => this.onMouseEnter(event));
    }

    onMouseEnter(event, contexts) {
        const target = event.target;
        const abortController = new AbortController();
        event.target.addEventListener('mouseleave', () => {
            this.hide();
            abortController.abort();
        }, { signal: abortController.signal, once: true });

        /** @type { (event?: MouseEvent) => void } */
        const delayShow = debounce((event) => {
            if (!abortController.signal.aborted) {
                this.show(target, contexts);
                if (this.followCursor && event) {
                    this.refitToMouseEvent(event);
                }
            }
        }, popupDelay);

        event.target.addEventListener('mousemove', (event) => {
            if (this.visible) {
                if (this.followCursor) {
                    this.refitToMouseEvent(event);
                }
            } else {
                delayShow(event);
            }
        }, { signal: abortController.signal });

        delayShow();
    }

    refitToMouseEvent(event) {
        const { clientX: x, clientY: y } = event;
        const point = new DOMPoint(x + shiftX, y + shiftY);
        this.reFit(point);
    }

    show(node, useContext) {
        if (this._stampedTemplateInstance && this.usedContext !== useContext) {
            this._stampedTemplateInstance.detach();
            // ensure remove stamped template
            this.$.outerBox.replaceChildren();
            this._stampedTemplateInstance = null;
        }

        if (!this._stampedTemplateInstance ) {
            const templateInstance = new TemplateInstance(this.tooltipTpl);
            let context = [...this.templateContext, this];
            if (useContext) context = context.concat(...useContext);
            templateInstance.attach(this.$.outerBox, null, context);

            this.usedContext = useContext;
            this._stampedTemplateInstance = templateInstance;
        }

        super.show(node);
    }

    hide() {
        super.hide();
    }
}

export function createTooltip(tooltipTpl) {
    return new PlTooltip(tooltipTpl);
}

customElements.define('pl-tooltip', PlTooltip);
