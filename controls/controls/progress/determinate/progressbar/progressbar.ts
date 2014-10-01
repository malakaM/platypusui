﻿module platui {
    /**
     * @name ProgressBar
     * @memberof platui
     * @kind class
     * 
     * @extends {plat.ui.TemplateControl}
     * @implements {platui.IUIControl}
     * 
     * @description
     * An {@link plat.ui.ITemplateControl|ITemplateControl} for showing incremental progress.
     */
    export class ProgressBar extends plat.ui.TemplateControl implements IUIControl {
        /**
         * @name $utils
         * @memberof platui.ProgressBar
         * @kind property
         * @access public
         * 
         * @type {plat.IUtils}
         * 
         * @description
         * Reference to the {@link plat.IUtils|IUtils} injectable.
         */
        $utils: plat.IUtils = plat.acquire(__Utils);

        /**
         * @name templateString
         * @memberof platui.ProgressBar
         * @kind property
         * @access public
         * 
         * @type {string}
         * 
         * @description
         * The HTML template represented as a string.
         */
        templateString =
        '<div class="plat-progress-container">' +
        '    <div class="plat-animated-bar"></div>' +
        '</div>';

        /**
         * @name _barElement
         * @memberof platui.ProgressBar
         * @kind property
         * @access protected
         * 
         * @type {HTMLElement}
         * 
         * @description
         * The animated bar element.
         */
        _barElement: HTMLElement;

        /**
         * @name _barMax
         * @memberof platui.ProgressBar
         * @kind property
         * @access protected
         * 
         * @type {number}
         * 
         * @description
         * The max value of the bar.
         */
        _barMax: number;

        /**
         * @name setClasses
         * @memberof platui.ProgressBar
         * @kind function
         * @access public
         * 
         * @description
         * Sets the classes on the proper elements.
         * 
         * @param {string} className? An optional, additional class name or class names to set on the control 
         * in addition to its standard set.
         * @param {Element} element? The element to set the class name on. Should default to 
         * the control's element if not specified.
         * 
         * @returns {void}
         */
        setClasses(className?: string, element?: Element): void {
            this.dom.addClass(element || this.element, __ProgressBar + ' ' + (className || ''));
        }

        /**
         * @name initialize
         * @memberof platui.ProgressBar
         * @kind function
         * @access public
         * 
         * @description
         * Set the class name.
         * 
         * @returns {void}
         */
        initialize(): void {
            this.setClasses(__ProgressBar);
        }

        /**
         * @name setTemplate
         * @memberof platui.ProgressBar
         * @kind function
         * @access public
         * 
         * @description
         * Grabs the bar element and bar max value.
         * 
         * @returns {void}
         */
        setTemplate(): void {
            this._barElement = <HTMLElement>this.element.firstElementChild.firstElementChild;
        }

        /**
         * @name loaded
         * @memberof platui.ProgressBar
         * @kind function
         * @access public
         * 
         * @description
         * Checks to make sure the context is correctly set or a plat-bind is being used, 
         * then does the initial animation of the bar.
         * 
         * @returns {void}
         */
        loaded(): void {
            var context = this.context;

            this._barMax = this._barElement.parentElement.offsetWidth;

            if (!this.$utils.isNumber(context) || context > 1 || context < 0) {
                var Exception: plat.IExceptionStatic = plat.acquire(plat.IExceptionStatic);
                Exception.warn('The context of a "' + __ProgressBar + '" control must be a number between 0 and 1, ' +
                    'or a "' + __Bind + '" control must be used.');
                return;
            }

            this.setProgress();
        }

        /**
         * @name contextChanged
         * @memberof platui.ProgressBar
         * @kind function
         * @access public
         * 
         * @description
         * Animates the bar on a context changed.
         * 
         * @returns {void}
         */
        contextChanged(): void {
            this.setProgress();
        }

        /**
         * @name setProgress
         * @memberof platui.ProgressBar
         * @kind function
         * @access public
         * 
         * @description
         * Sets the progress bar value.
         * 
         * @param {number} value? The decimal number between 0 and 1 to set as the 
         * bar percentage (e.g. - 0.5 would be 50% complete).
         * 
         * @returns {void}
         */
        setProgress(value?: number): void {
            var barValue = value || this.context,
                barMax = this._barMax || (this._barMax = this._barElement.parentElement.offsetWidth);

            if (!this.$utils.isNumber(barValue) || barValue > 1 || barValue < 0) {
                return;
            }

            this._barElement.style.width = Math.ceil(barMax * barValue) + 'px';
        }

        /**
         * @name _setOffsetWithClone
         * @memberof platui.ProgressBar
         * @kind function
         * @access protected
         * 
         * @description
         * Creates a clone of this element and uses it to find the max offset.
         * 
         * @returns {void}
         */
        _setOffsetWithClone(): void {
            var element = this.element,
                clone = <HTMLElement>element.cloneNode(true),
                style = clone.style,
                regex = /\d+(?!\d+|%)/,
                $window: Window = plat.acquire(__Window),
                $document: Document = plat.acquire(__Document),
                body = $document.body,
                width: string;

            while (!regex.test(width = $window.getComputedStyle(element).width)) {
                element = element.parentElement;
            }

            clone.style.width = width;
            style.position = 'absolute';
            style.display = 'block';
            style.visibility = 'hidden';
            body.appendChild(clone);
            this._barMax = (<HTMLElement>clone.firstElementChild).offsetWidth;
            body.removeChild(clone);
        }
    }

    plat.register.control(__ProgressBar, ProgressBar);
}
