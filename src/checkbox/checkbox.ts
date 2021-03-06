﻿/// <reference path="../references.d.ts" />

module platui {
    /**
     * @name Checkbox
     * @memberof platui
     * @kind class
     * 
     * @extends {platui.Toggle}
     * 
     * @description
     * An {@link plat.ui.IBindablePropertyControl|IBindablePropertyControl} that standardizes the HTML5 checkbox.
     */
    export class Checkbox extends Toggle {
        protected static _inject: any = {
            _document: __Document
        };

        /**
         * @name templateString
         * @memberof platui.Checkbox
         * @kind property
         * @access public
         * 
         * @type {string}
         * 
         * @description
         * The HTML template represented as a string.
         */
        templateString: string =
        '<div class="plat-checkbox-container">\n' +
        '    <span class="plat-mark"></span>\n' +
        '</div>\n';

        /**
         * @name options
         * @memberof platui.Checkbox
         * @kind property
         * @access public
         * 
         * @type {plat.observable.IObservableProperty<platui.ICheckboxOptions>}
         * 
         * @description
         * The evaluated {@link plat.controls.Options|plat-options} object.
         */
        options: plat.observable.IObservableProperty<ICheckboxOptions>;

        /**
         * @name _document
         * @memberof platui.Checkbox
         * @kind property
         * @access protected
         * 
         * @type {Document}
         * 
         * @description
         * Reference to the Document injectable.
         */
        protected _document: Document;

        /**
         * @name _targetTypeSet
         * @memberof platui.Checkbox
         * @kind property
         * @access protected
         * 
         * @type {boolean}
         * 
         * @description
         * Whether the target type has been set already or not.
         */
        protected _targetTypeSet: boolean = false;

        /**
         * @name setClasses
         * @memberof platui.Checkbox
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
            this.dom.addClass(element || this.element, __Checkbox + ' ' + (className || ''));
        }

        /**
         * @name setTemplate
         * @memberof platui.Checkbox
         * @kind function
         * @access public
         * 
         * @description
         * Adds the inner template to the DOM making sure to wrap text nodes in spans.
         * 
         * @returns {void}
         */
        setTemplate(): void {
            var isNull = this.utils.isNull,
                innerTemplate = this.innerTemplate;

            if (isNull(innerTemplate)) {
                return;
            }

            var _document = this._document,
                element = this.element,
                childNodes = Array.prototype.slice.call(innerTemplate.childNodes),
                childNode: Node,
                span: HTMLSpanElement,
                match: Array<string>;

            while (childNodes.length > 0) {
                childNode = childNodes.shift();
                if (childNode.nodeType === Node.TEXT_NODE) {
                    match = childNode.textContent.trim().match(/[^\r\n]/g);
                    if (match !== null && match.length > 0) {
                        span = _document.createElement('span');
                        span.insertBefore(childNode, null);
                        element.insertBefore(span, null);
                    }
                } else {
                    element.insertBefore(childNode, null);
                }
            }
        }

        /**
         * @name loaded
         * @memberof platui.Checkbox
         * @kind function
         * @access public
         * 
         * @description
         * Checks for checked attributes and handles them accordingly. Also, 
         * initializes the mark and adds a listener for the tap event.
         * 
         * @returns {void}
         */
        loaded(): void {
            super.loaded();

            var optionObj = this.options || <plat.observable.IObservableProperty<ICheckboxOptions>>{},
                options = optionObj.value || <ICheckboxOptions>{},
                previousType = this._targetType,
                mark = this._targetType = options.mark || 'check';

            this._convertChecked();

            switch (mark.toLowerCase()) {
                case 'check':
                case 'x':
                    break;
                default:
                    this._log.debug('Invalid mark option specified for' + this.type + '. Defaulting to checkmark.');
                    this._targetType = 'check';
                    break;
            }

            if (this._targetTypeSet) {
                var target = this._targetElement;
                this.dom.removeClass(target, previousType);
                this._activate(target);
            }

            this._targetTypeSet = true;
        }

        /**
         * @name _convertChecked
         * @memberof platui.Checkbox
         * @kind function
         * @access protected
         * 
         * @description
         * A function for checking "checked" attributes and handling them accordingly.
         * 
         * @param {any} newValue The newValue of the attribute to convert.
         * @param {any} oldValue? The oldValue of the attribute to convert.
         * 
         * @returns {void}
         */
        protected _convertChecked(): void {
            var element = this.element;
            if (element.hasAttribute(__Checked)) {
                this._convertAttribute(element.getAttribute(__Checked));
                this.attributes.observe(this._convertAttribute, __CamelChecked);
            } else if (element.hasAttribute('data-' + __Checked)) {
                this._convertAttribute(element.getAttribute('data-' + __Checked));
                this.attributes.observe(this._convertAttribute, __CamelChecked);
            } else if (element.hasAttribute('checked') || element.hasAttribute('data-checked')) {
                this._convertAttribute(true);
            }
        }

        /**
         * @name _convertAttribute
         * @memberof platui.Checkbox
         * @kind function
         * @access protected
         * 
         * @description
         * A function for handling the attribute value conversion for updating the 
         * bound property.
         * 
         * @param {any} newValue The newValue of the attribute to convert.
         * @param {any} oldValue? The oldValue of the attribute to convert.
         * 
         * @returns {void}
         */
        protected _convertAttribute(newValue: any, oldValue?: any): void {
            var _utils = this.utils;
            if (_utils.isBoolean(newValue)) {
                return this._setBoundProperty(newValue, oldValue, null, true);
            } else if (!_utils.isString(newValue)) {
                return;
            }

            this._setBoundProperty(newValue === 'true', oldValue === 'true', null, true);
        }

        /**
         * @name _activate
         * @memberof platui.Checkbox
         * @kind function
         * @access protected
         * 
         * @description
         * A function to activate the given element by toggling the 
         * class specified as the target type.
         * 
         * @param {Element} element The element to activate.
         * 
         * @returns {void}
         */
        protected _activate(element: Element): void {
            if (this._targetTypeSet) {
                this.dom.toggleClass(element, __Plat + this._targetType);
                return;
            }

            this._targetTypeSet = true;
        }
    }

    plat.register.control(__Checkbox, Checkbox);

    /**
     * @name ICheckboxOptions
     * @memberof platui
     * @kind interface
     * 
     * @description
     * The available {@link plat.controls.Options|options} for the {@link platui.Checkbox|Checkbox} control.
     */
    export interface ICheckboxOptions {
        /**
         * @name mark
         * @memberof platui.ICheckboxOptions
         * @kind property
         * @access public
         * 
         * @type {string}
         * 
         * @description
         * The type of mark to place inside the {@link platui.Checkbox|Checkbox}. 
         * Defaults to "check".
         * 
         * @remarks
         * - "check"
         * - "x"
         */
        mark?: string;
    }
}
