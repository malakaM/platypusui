﻿module platui {
    /**
     * @name Slider
     * @memberof platui
     * @kind class
     * 
     * @extends {plat.ui.BindablePropertyControl}
     * @implements {platui.IUIControl}
     * 
     * @description
     * An {@link plat.ui.IBindablePropertyControl|IBindablePropertyControl} that standardizes an HTML5 input[type="range"].
     */
    export class Slider extends plat.ui.BindablePropertyControl implements IUIControl {
        /**
         * @name $document
         * @memberof platui.Slider
         * @kind property
         * @access public
         * 
         * @type {Document}
         * 
         * @description
         * Reference to the Document injectable.
         */
        $document: Document = plat.acquire(__Document);
        /**
         * @name $utils
         * @memberof platui.Slider
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
         * @name $animator
         * @memberof platui.Slider
         * @kind property
         * @access public
         * 
         * @type {plat.ui.animations.IAnimator}
         * 
         * @description
         * Reference to the {@link plat.ui.animations.IAnimator|IAnimator} injectable.
         */
        $animator: plat.ui.animations.IAnimator = plat.acquire(__Animator);

        /**
         * @name templateString
         * @memberof platui.Slider
         * @kind property
         * @access public
         * 
         * @type {string}
         * 
         * @description
         * The HTML template represented as a string.
         */
        templateString =
        '<div class="plat-slider-container">' +
            '<div class="plat-slider-offset">' +
                '<div class="plat-knob"></div>' +
            '</div>' +
        '</div>';
        
        /**
         * @name options
         * @memberof platui.Slider
         * @kind property
         * @access public
         * 
         * @type {plat.observable.IObservableProperty<platui.ISliderOptions>}
         * 
         * @description
         * The evaluated {@link plat.controls.Options|plat-options} object.
         */
        options: plat.observable.IObservableProperty<ISliderOptions>;
        
        /**
         * @name value
         * @memberof platui.Slider
         * @kind property
         * @access public
         * 
         * @type {number}
         * 
         * @description
         * The current value of the {@link platui.Slider|Slider}.
         */
        value: number;
        
        /**
         * @name min
         * @memberof platui.Slider
         * @kind property
         * @access public
         * 
         * @type {number}
         * 
         * @description
         * The min value of the {@link platui.Slider|Slider}.
         */
        min: number;
        
        /**
         * @name max
         * @memberof platui.Slider
         * @kind property
         * @access public
         * 
         * @type {number}
         * 
         * @description
         * The max value of the {@link platui.Slider|Slider}.
         */
        max: number;
        
        /**
         * @name _sliderElement
         * @memberof platui.Slider
         * @kind property
         * @access protected
         * 
         * @type {HTMLElement}
         * 
         * @description
         * The HTMLElement representing the slider.
         */
        _sliderElement: HTMLElement;
        
        /**
         * @name _knobElement
         * @memberof platui.Slider
         * @kind property
         * @access protected
         * 
         * @type {HTMLElement}
         * 
         * @description
         * The HTMLElement representing the knob.
         */
        _knobElement: HTMLElement;
        
        /**
         * @name _lastTouch
         * @memberof platui.Slider
         * @kind property
         * @access protected
         * 
         * @type {plat.ui.IPoint}
         * 
         * @description
         * The last touch start recorded.
         */
        _lastTouch: plat.ui.IPoint;
        
        /**
         * @name __sliderOffset
         * @memberof platui.Slider
         * @kind property
         * @access private
         * 
         * @type {number}
         * 
         * @description
         * The current slider offset.
         */
        private __sliderOffset = 0;
        /**
         * @name __maxOffset
         * @memberof platui.Slider
         * @kind property
         * @access private
         * 
         * @type {number}
         * 
         * @description
         * The maximum slider offset.
         */
        private __maxOffset: number;
        /**
         * @name __increment
         * @memberof platui.Slider
         * @kind property
         * @access private
         * 
         * @type {number}
         * 
         * @description
         * The slider's pixel based increment value.
         */
        private __increment: number;
        /**
         * @name __step
         * @memberof platui.Slider
         * @kind property
         * @access private
         * 
         * @type {number}
         * 
         * @description
         * Denotes the incremental step value of the {@link platui.Slider|Slider's} value property.
         */
        private __step: number;
        /**
         * @name __loaded
         * @memberof platui.Slider
         * @kind property
         * @access private
         * 
         * @type {boolean}
         * 
         * @description
         * Whether or not the slider has already been loaded. Useful for when 
         * the {@link plat.controls.Bind|Bind} tries to set a value.
         */
        private __loaded = false;
        /**
         * @name __inTouch
         * @memberof platui.Slider
         * @kind property
         * @access private
         * 
         * @type {boolean}
         * 
         * @description
         * Whether or not the user is currently touching the screen.
         */
        private __inTouch = false;
        /**
         * @name __usingBind
         * @memberof platui.Slider
         * @kind property
         * @access private
         * 
         * @type {boolean}
         * 
         * @description
         * Whether or not the control is bound to a context value with a 
         * {@link plat.controls.Bind|Bind} control.
         */
        private __usingBind: boolean;
        /**
         * @name __transition
         * @memberof platui.Slider
         * @kind property
         * @access private
         * 
         * @type {string}
         * 
         * @description
         * The transition direction of this control.
         */
        private __transition: string;
        /**
         * @name __lengthProperty
         * @memberof platui.Slider
         * @kind property
         * @access private
         * 
         * @type {string}
         * 
         * @description
         * Denotes whether we're using height or width as the length of the slider.
         */
        private __lengthProperty: string;
        
        /**
         * @name setClasses
         * @memberof platui.Slider
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
            this.dom.addClass(element || this.element, __Slider + ' ' + (className || ''));
        }
        
        /**
         * @name initialize
         * @memberof platui.Slider
         * @kind function
         * @access public
         * 
         * @description
         * Check if using the {@link plat.controls.Bind|Bind} control.
         * 
         * @returns {void}
         */
        initialize(): void {
            var element = this.element;
            this.__usingBind = element.hasAttribute(__Bind) || element.hasAttribute('data-' + __Bind);
            this.setClasses();
        }
        
        /**
         * @name setTemplate
         * @memberof platui.Slider
         * @kind function
         * @access public
         * 
         * @description
         * Grab the knob element.
         * 
         * @returns {void}
         */
        setTemplate(): void {
            var slider = this._sliderElement = <HTMLElement>this.element.firstElementChild.firstElementChild;
            this._knobElement = <HTMLElement>slider.firstElementChild;
        }
        
        /**
         * @name loaded
         * @memberof platui.Slider
         * @kind function
         * @access public
         * 
         * @description
         * Determine the button type and apply the proper classes.
         * 
         * @returns {void}
         */
        loaded(): void {
            var dom = this.dom,
                element = this.element,
                $utils = this.$utils,
                isNumber = $utils.isNumber,
                optionObj = this.options || <plat.observable.IObservableProperty<ISliderOptions>>{},
                options = optionObj.value || <ISliderOptions>{},
                optionValue = Number(options.value),
                optionMin = options.min,
                optionMax = options.max,
                step = options.step,
                style = options.style || 'primary',
                transition = this.__transition = options.transition || 'right',
                length = this.__getLength(transition);

            dom.addClass(element, style + ' ' + transition);

            var bindValue = this.value,
                value = isNumber(bindValue) ? bindValue : isNumber(optionValue) ? optionValue : min,
                min = this.min = isNumber(optionMin) ? Math.floor(optionMin) : 0,
                max = this.max = isNumber(optionMax) ? Math.ceil(optionMax) : 100;

            // reset value to minimum in case Bind set it to a value
            this.value = min;
            this.__maxOffset = length;
            this.__step = isNumber(step) ? (step > 0 ? step : 1) : 1;

            if (min >= max) {
                var Exception: plat.IExceptionStatic = plat.acquire(__ExceptionStatic);
                Exception.warn('"' + __Slider + '\'s" min is greater than or equal to its max. Setting max to min + 1.');
                this.max = min + 1;
            }

            this.__setIncrement();
            this.__initializeEvents(transition);
            this.setValue(value);
            this.__loaded = true;
        }
        
        /**
         * @name setProperty
         * @memberof platui.Slider
         * @kind function
         * @access public
         * 
         * @description
         * The function called when the {@link platui.Slider|Slider's} bindable property is set externally.
         * 
         * @param {any} newValue The new value of the bindable property.
         * @param {any} oldValue? The old value of the bindable property.
         * 
         * @returns {void}
         */
        setProperty(newValue: any, oldValue?: any): void {
            if (newValue === oldValue || newValue === this.value) {
                return;
            } else if (!this.$utils.isNumber(newValue)) {
                newValue = this.min;
            }

            if (this.__loaded) {
                this.__setValue(newValue, true, false);
                return;
            }

            this.value = newValue;
        }
        
        /**
         * @name setValue
         * @memberof platui.Slider
         * @kind function
         * @access public
         * 
         * @description
         * Set the value of the {@link platui.Slider|Slider}.
         * 
         * @param {number} value The value to set the {@link platui.Slider|Slider} to.
         * 
         * @returns {void}
         */
        setValue(value: number): void {
            if (!this.$utils.isNumber(value)) {
                value = this.min;
            }

            this.__setValue(value, true, true);
        }
        
        /**
         * @name _touchStart
         * @memberof platui.Slider
         * @kind function
         * @access protected
         * 
         * @description
         * Log the first touch.
         * 
         * @param {plat.ui.IGestureEvent} ev The touch event object.
         * 
         * @returns {void}
         */
        _touchStart(ev: plat.ui.IGestureEvent): void {
            this.__inTouch = true;
            this._lastTouch = {
                x: ev.clientX,
                y: ev.clientY
            };
        }
        
        /**
         * @name _touchEnd
         * @memberof platui.Slider
         * @kind function
         * @access protected
         * 
         * @description
         * Set the new slider offset.
         * 
         * @param {plat.ui.IGestureEvent} ev The $trackend event object.
         * 
         * @returns {void}
         */
        _touchEnd(ev: plat.ui.IGestureEvent): void {
            if (!this.__inTouch) {
                return;
            }

            this.__inTouch = false;

            var newOffset = this.__calculateOffset(ev),
                maxOffset = this.__maxOffset || (this.__maxOffset = this.__getLength(this.__transition));
            if (newOffset < 0) {
                this.__sliderOffset = 0;
                return;
            } else if (newOffset > maxOffset) {
                this.__sliderOffset = maxOffset;
                return;
            }

            this.__sliderOffset = newOffset;
        }
        
        /**
         * @name _track
         * @memberof platui.Slider
         * @kind function
         * @access protected
         * 
         * @description
         * Track the knob movement.
         * 
         * @param {plat.ui.IGestureEvent} ev The $track event object.
         * 
         * @returns {void}
         */
        _track(ev: plat.ui.IGestureEvent): void {
            var length = this.__calculateOffset(ev),
                value: number,
                maxOffset = this.__maxOffset || (this.__maxOffset = this.__getLength(this.__transition));

            if (length < 0) {
                value = this.min;
                if (value - this.value >= 0) {
                    return;
                }
                length = 0;
            } else if (length > maxOffset) {
                value = this.max;
                if (value - this.value <= 0) {
                    return;
                }
                length = maxOffset;
            } else {
                value = this.__calculateValue(length);
            }

            this.__setValue(value, false, true);
            this._sliderElement.style[<any>this.__lengthProperty] = length + 'px';
        }

        /**
         * @name __initializeEvents
         * @memberof platui.Slider
         * @kind function
         * @access private
         * 
         * @description
         * Initialize the proper tracking events.
         * 
         * @param {string} transition The transition direction of the control.
         * 
         * @returns {void}
         */
        private __initializeEvents(transition: string): void {
            var knob = this._knobElement,
                trackBack: string,
                trackForward: string,
                track: EventListener = this._track;

            switch (transition) {
                case 'right':
                    trackBack = __$track + 'left';
                    trackForward = __$track + 'right';
                    track = this._track;
                    break;
                case 'left':
                    trackBack = __$track + 'right';
                    trackForward = __$track + 'left';
                    track = this._track;
                    break;
                case 'up':
                    trackBack = __$track + 'down';
                    trackForward = __$track + 'up';
                    break;
                case 'down':
                    trackBack = __$track + 'up';
                    trackForward = __$track + 'down';
                    break;
                default:
                    var Exception: plat.IExceptionStatic = plat.acquire(__ExceptionStatic);
                    Exception.warn('Invalid direction "' + transition + '" for "' + __Slider + '."');
                    return;
            }

            this.addEventListener(knob, __$touchstart, this._touchStart, false);
            this.addEventListener(knob, trackBack, track, false);
            this.addEventListener(knob, trackForward, track, false);

            var touchEnd = this._touchEnd;
            this.addEventListener(knob, __$trackend, touchEnd, false);
            this.addEventListener(knob, __$touchend, touchEnd, false);
        }
        
        /**
         * @name __calculateValue
         * @memberof platui.Slider
         * @kind function
         * @access private
         * 
         * @description
         * Calculates the current value based on knob position and slider width.
         * 
         * @param {number} width The current width of the slider.
         * 
         * @returns {number} The current value of the {link platui.Slider|Slider}.
         */
        private __calculateValue(width: number): number {
            var increment = this.__increment || this.__setIncrement(),
                step = this.__step;

            return (this.min + Math.round(width / increment / step) * step);
        }
        
        /**
         * @name __calculateKnobPosition
         * @memberof platui.Slider
         * @kind function
         * @access private
         * 
         * @description
         * Calculates knob position based on current value.
         * 
         * @param {number} value The current value of the {link platui.Slider|Slider}.
         * 
         * @returns {number} The current position of the knob in pixels.
         */
        private __calculateKnobPosition(value: number): number {
            var increment = this.__increment || this.__setIncrement();
            return (value - this.min) * increment;
        }
        
        /**
         * @name __calculateOffset
         * @memberof platui.Slider
         * @kind function
         * @access private
         * 
         * @description
         * Calculates the new offset of the slider based on the old offset and the distance moved.
         * 
         * @param {plat.ui.IGestureEvent} ev The $track or $trackend event object.
         * 
         * @returns {number} The current position of the knob in pixels.
         */
        private __calculateOffset(ev: plat.ui.IGestureEvent): number {
            switch (this.__transition) {
                case 'right':
                    return this.__sliderOffset + ev.clientX - this._lastTouch.x;
                case 'left':
                    return this.__sliderOffset + this._lastTouch.x - ev.clientX;
                case 'up':
                    return this.__sliderOffset + this._lastTouch.y - ev.clientY;
                case 'down':
                    return this.__sliderOffset + ev.clientY - this._lastTouch.y;
            }
        }
        
        /**
         * @name __getLength
         * @memberof platui.Slider
         * @kind function
         * @access private
         * 
         * @description
         * Gets the property to use for and the current length of the slider.
         * 
         * @param {string} transition The control's transition direction.
         * 
         * @returns {number} The length of the slider.
         */
        private __getLength(transition: string): number {
            switch (transition) {
                case 'right':
                case 'left':
                    this.__lengthProperty = 'width';
                    return this._sliderElement.parentElement.offsetWidth;
                case 'up':
                case 'down':
                    this.__lengthProperty = 'height';
                    return this._sliderElement.parentElement.offsetHeight;
                default:
                    return 0;
            }
        }
        
        /**
         * @name __setIncrement
         * @memberof platui.Slider
         * @kind function
         * @access private
         * 
         * @description
         * Sets the increment for sliding the {link platui.Slider|Slider}.
         * 
         * @returns {number} The slider's increment value.
         */
        private __setIncrement(): number {
            return (this.__increment = this.__maxOffset / (this.max - this.min));
        }
        
        /**
         * @name __setValue
         * @memberof platui.Slider
         * @kind function
         * @access private
         * 
         * @description
         * Sets the value of the {@link platui.Slider|Slider}.
         * 
         * @param {number} newValue The new value to set.
         * @param {boolean} setKnob Whether or not we need to set the knob position.
         * @param {boolean} setProperty Whether or not we need to fire a propertyChanged event.
         * 
         * @returns {void}
         */
        private __setValue(newValue: number, setKnob: boolean, setProperty: boolean): void {
            var value = this.value;
            if (newValue === value) {
                return;
            } else if (newValue >= this.max) {
                newValue = this.max;
            } else if (newValue <= this.min) {
                newValue = this.min;
            } else if (Math.abs(newValue - value) < this.__step) {
                return;
            }

            this.value = newValue;
            if (setKnob) {
                this.__setKnob();
            }

            if (setProperty) {
                this.propertyChanged(newValue, value);
            }
        }
        
        /**
         * @name __setKnob
         * @memberof platui.Slider
         * @kind function
         * @access private
         * 
         * @description
         * Animates and sets the knob position.
         * 
         * @param {number} value? The value to use to calculate the knob position. If no value is 
         * specified, the current {@link platui.Slider|Slider's} value will be used.
         * 
         * @returns {void}
         */
        private __setKnob(value?: number): void {
            var animationOptions: plat.IObject<string> = {},
                length = this.__calculateKnobPosition((value || this.value));

            animationOptions[this.__lengthProperty] = length + 'px';
            this.$animator.animate(this._sliderElement, __Transition, animationOptions);
            this.__sliderOffset = length;
        }
    }

    plat.register.control(__Slider, Slider);
    
    /**
     * @name ISliderOptions
     * @memberof platui
     * @kind interface
     * 
     * @description
     * The available {@link plat.controls.Options|options} for the {@link platui.Slider|Slider} control.
     */
    export interface ISliderOptions {
        /**
         * @name style
         * @memberof platui.ISliderOptions
         * @kind property
         * @access public
         * 
         * @type {string}
         * 
         * @description
         * The style of {@link platui.Slider|Slider}. 
         * Defaults to "primary".
         * 
         * @remarks
         * - "primary"
         * - "secondary"
         */
        style?: string;
        
        /**
         * @name transition
         * @memberof platui.ISliderOptions
         * @kind property
         * @access public
         * 
         * @type {string}
         * 
         * @description
         * The transition direction of the {@link platui.Slider|Slider}. 
         * Defaults to "right".
         * 
         * @remarks
         * - "right" - the minimum is all the way to the left and the maximum is all the way to the right.
         * - "left" - the minimum is all the way to the right and the maximum is all the way to the left.
         * - "up" - the minimum is at the bottom and the maximum is at the top.
         * - "down" - the minimum is at the top and the maximum is at the bottom.
         */
        transition?: string;
        
        /**
         * @name value
         * @memberof platui.ISliderOptions
         * @kind property
         * @access public
         * 
         * @type {number}
         * 
         * @description
         * The current value of the {@link platui.Slider|Slider}.
         */
        value?: number;
        
        /**
         * @name min
         * @memberof platui.ISliderOptions
         * @kind property
         * @access public
         * 
         * @type {number}
         * 
         * @description
         * The min value of the {@link platui.Slider|Slider}.
         */
        min?: number;
        
        /**
         * @name max
         * @memberof platui.ISliderOptions
         * @kind property
         * @access public
         * 
         * @type {number}
         * 
         * @description
         * The max value of the {@link platui.Slider|Slider}.
         */
        max?: number;

        /**
         * @name step
         * @memberof platui.ISliderOptions
         * @kind property
         * @access public
         * 
         * @type {number}
         * 
         * @description
         * The incremental step value of the {@link platui.Slider|Slider}.
         */
        step?: number;
    }
}
