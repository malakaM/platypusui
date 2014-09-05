﻿module platui {
    /**
     * @name Modal
     * @memberof platui
     * @kind class
     * 
     * @extends {plat.ui.TemplateControl}
     * @implements {platui.IUIControl}
     * 
     * @description
     * An {@link plat.ui.ITemplateControl|ITemplateControl} for showing a templated and animated overlay.
     */
    export class Modal extends plat.ui.TemplateControl implements IUIControl {
        /**
         * @name $utils
         * @memberof platui.Modal
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
         * @name $compat
         * @memberof platui.Modal
         * @kind property
         * @access public
         * 
         * @type {plat.ICompat}
         * 
         * @description
         * Reference to the {@link plat.ICompat|ICompat} injectable.
         */
        $compat: plat.ICompat = plat.acquire(__Compat);
        
        /**
         * @name templateString
         * @memberof platui.Modal
         * @kind property
         * @access public
         * 
         * @type {string}
         * 
         * @description
         * The HTML template represented as a string.
         */
        templateString = '<div class="plat-modal-container"></div>';
        
        /**
         * @name options
         * @memberof platui.Modal
         * @kind property
         * @access public
         * 
         * @type {plat.observable.IObservableProperty<platui.IModalOptions>}
         * 
         * @description
         * The evaluated {@link plat.controls.Options|plat-options} object.
         */
        options: plat.observable.IObservableProperty<IModalOptions>;
        
        /**
         * @name _modalElement
         * @memberof platui.Modal
         * @kind property
         * @access protected
         * 
         * @type {HTMLElement}
         * 
         * @description
         * The HTML element representing the content of the modal.
         */
        _modalElement: HTMLElement;

        /**
         * @name __isVisible
         * @memberof platui.Modal
         * @kind property
         * @access private
         * 
         * @type {boolean}
         * 
         * @description
         * Whether or not the modal is currently visible.
         */
        private __isVisible = false;
        /**
         * @name __transitionEnd
         * @memberof platui.Modal
         * @kind property
         * @access private
         * 
         * @type {string}
         * 
         * @description
         * The browser's "transitionend" event.
         */
        private __transitionEnd: string;
        /**
         * @name __transitionHash
         * @memberof platui.Modal
         * @kind property
         * @access private
         * 
         * @type {plat.IObject<boolean>}
         * 
         * @description
         * A hash for validating available transitions.
         */
        private __transitionHash: plat.IObject<boolean> = {
            up: true,
            down: true,
            left: true,
            right: true,
            fade: true
        };
        
        /**
         * @name setClasses
         * @memberof platui.Modal
         * @kind function
         * @access public
         * 
         * @description
         * Sets the proper class name on this control.
         * 
         * @param {string} className? The class name to set on the button element.
         * @param {Element} element? The element to set the class on. Defaults to this 
         * control's element.
         * 
         * @returns {void}
         */
        setClasses(className?: string, element?: Element): void {
            var dom = this.dom,
                element = element || this.element;

            dom.addClass(element, __Modal);
            dom.addClass(element, 'hide');
            dom.addClass(element, className);
        }
        
        /**
         * @name initialize
         * @memberof platui.Modal
         * @kind function
         * @access public
         * 
         * @description
         * Check for templateUrl and set if needed then hide the control.
         * 
         * @returns {void}
         */
        initialize(): void {
            var optionObj = this.options || <plat.observable.IObservableProperty<IModalOptions>>{},
                options = optionObj.value || <IModalOptions>{};

            this.templateUrl = options.templateUrl;
            this.setClasses();
        }
        
        /**
         * @name setTemplate
         * @memberof platui.Modal
         * @kind function
         * @access public
         * 
         * @description
         * Add the innerTemplate to the control's element.
         * 
         * @returns {void}
         */
        setTemplate(): void {
            var modal = this._modalElement = <HTMLElement>this.element.firstElementChild,
                innerTemplate = this.innerTemplate;
            if (this.$utils.isNode(innerTemplate)) {
                modal.appendChild(innerTemplate);
            }
        }
        
        /**
         * @name loaded
         * @memberof platui.Modal
         * @kind function
         * @access public
         * 
         * @description
         * Check for a transition and initialize it if necessary.
         * 
         * @returns {void}
         */
        loaded(): void {
            var optionObj = this.options,
                $utils = this.$utils,
                dom = this.dom,
                modalElement = this._modalElement,
                options = $utils.isObject(optionObj) ? optionObj.value : <IModalOptions>{},
                transition = options.transition;

            if (!this.$utils.isString(transition) || transition === 'none') {
                dom.addClass(modalElement, 'plat-no-transition');
                return;
            } else if ($utils.isNull(this.__transitionHash[transition])) {
                var Exception: plat.IExceptionStatic = plat.acquire(plat.IExceptionStatic);
                Exception.warn('Custom transition direction: "' + transition +
                    '" defined for "' + __Modal + '." Please ensure a transition is defined to avoid errors.');
            }

            this.__transitionEnd = this.$compat.animationEvents.$transitionEnd;
            dom.addClass(modalElement, 'plat-modal-transition');
            dom.addClass(modalElement, transition);
        }
        
        /**
         * @name show
         * @memberof platui.Modal
         * @kind function
         * @access public
         * 
         * @description
         * Shows the {@link platui.Modal|Modal}.
         * 
         * @returns {void}
         */
        show(): void {
            var dom = this.dom;
            dom.removeClass(this.element, 'hide');
            this.$utils.postpone(() => {
                dom.addClass(this._modalElement, 'activate');
            });

            this.__isVisible = true;
        }
        
        /**
         * @name hide
         * @memberof platui.Modal
         * @kind function
         * @access public
         * 
         * @description
         * Hides the {@link platui.Modal|Modal}.
         * 
         * @returns {void}
         */
        hide(): void {
            var dom = this.dom;
            dom.removeClass(this._modalElement, 'activate');
            if (this.$utils.isString(this.__transitionEnd)) {
                this._addHideOnTransitionEnd();
            } else {
                dom.addClass(this.element, 'hide');
            }

            this.__isVisible = false;
        }
        
        /**
         * @name toggle
         * @memberof platui.Modal
         * @kind function
         * @access public
         * 
         * @description
         * Toggles the visibility of the {@link platui.Modal|Modal}.
         * 
         * @returns {void}
         */
        toggle(): void {
            if (this.__isVisible) {
                this.hide();
                return;
            }

            this.show();
        }
        
        /**
         * @name isVisible
         * @memberof platui.Modal
         * @kind function
         * @access public
         * 
         * @description
         * Whether or not the {@link platui.Modal|Modal} is currently visible.
         * 
         * @returns {boolean} True if the {@link platui.Modal|Modal} is currently open 
         * and visible, false otherwise.
         */
        isVisible(): boolean {
            return this.__isVisible;
        }
        
        /**
         * @name _addHideOnTransitionEnd
         * @memberof platui.Modal
         * @kind function
         * @access protected
         * 
         * @description
         * Listens for the transition to end and hides the element after it is finished.
         * 
         * @returns {void}
         */
        _addHideOnTransitionEnd(): void {
            var element = this.element,
                dom = this.dom,
                remove = this.addEventListener(element, this.__transitionEnd, () => {
                    remove();
                    dom.addClass(element, 'hide');
                }, false);
        }
    }

    plat.register.control(__Modal, Modal);
    
    /**
     * @name IModalOptions
     * @memberof platui
     * @kind interface
     * 
     * @description
     * The available {@link plat.controls.Options|options} for the {@link platui.Modal|Modal} control.
     */
    export interface IModalOptions {
        /**
         * @name transition
         * @memberof platui.IModalOptions
         * @kind property
         * @access public
         * 
         * @type {string}
         * 
         * @description
         * The transition type/direction the {@link platui.Modal|Modal} will enter with.
         */
        transition?: string;
        
        /**
         * @name templateUrl
         * @memberof platui.IModalOptions
         * @kind property
         * @access public
         * 
         * @type {string}
         * 
         * @description
         * The url of the {@link platui.Modal|Modal's} intended template if not using 
         * innerHTML.
         */
        templateUrl?: string;
    }
}
