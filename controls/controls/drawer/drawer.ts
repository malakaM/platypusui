﻿module platui {
    var __drawerControllerInitEvent = '__platDrawerControllerInit',
        __drawerControllerFetchEvent = '__platDrawerControllerFetch',
        __drawerFoundEvent = '__platDrawerFound';

    /**
     * A Template Control that acts as a global drawer.
     */
    export class Drawer extends plat.ui.TemplateControl {
        $utils: plat.IUtils = plat.acquire(plat.IUtils);

        /**
         * The plat-options for the Drawer.
         */
        options: plat.observable.IObservableProperty<IDrawerOptions>;

        private __currentTransition: string;
        private __useContext: boolean;

        /**
         * Check for a transition direction and initialize event handling.
         */
        loaded(): void {
            var element = this.element,
                $utils = this.$utils,
                optionObj = this.options,
                options = $utils.isObject(optionObj) ? optionObj.value : <IDrawerOptions>{},
                transition = this.__currentTransition = options.transition || 'right',
                useContext = this.__useContext =
                    (options.useContext === true) ||
                    element.hasAttribute('plat-context') ||
                    element.hasAttribute('data-plat-context'),
                id = options.id,
                templateUrl = options.templateUrl;

            this.dom.addClass(element, transition);
            if ($utils.isString(templateUrl)) {
                plat.ui.TemplateControl.determineTemplate(this, templateUrl).then((template) => {
                    this.innerTemplate = template;
                    if (this.__useContext) {
                        this.bindableTemplates.add('drawer', template.cloneNode(true));
                        this.__bindTemplate();
                    }
                    this.__initializeEvents(id, transition);
                });
                return;
            } else if (useContext && $utils.isNode(this.innerTemplate)) {
                this.bindableTemplates.add('drawer', this.innerTemplate.cloneNode(true));
                this.__bindTemplate();
            }

            this.__initializeEvents(id, transition);
        }

        /**
         * Removes the innerHTML from the DOM and saves it.
         */
        setTemplate(): void {
            var childNodes = Array.prototype.slice.call(this.element.childNodes);
            if (childNodes.length > 0) {
                this.innerTemplate = this.dom.appendChildren(childNodes);
            }
        }

        /**
         * Changes the placement and implied transition direction of the drawer.
         */
        _changeDirection(transition: string): void {
            if (this.$utils.isNull(transition) || transition === this.__currentTransition) {
                return;
            }

            var dom = this.dom,
                element = this.element;

            dom.removeClass(element, this.__currentTransition);
            dom.addClass(element, transition);

            this.__currentTransition = transition;
        }

        private __initializeEvents(id: string, transition: string): void {
            var $utils = this.$utils,
                element = this.element,
                isString = $utils.isString,
                innerTemplate = this.innerTemplate,
                useContext = this.__useContext,
                DIRECT = plat.events.EventManager.DIRECT;

            this.on(__drawerControllerFetchEvent,
                (event: plat.events.IDispatchEventInstance, controllerArg: IDrawerHandshakeEvent) => {
                if (isString(id) && isString(controllerArg.id) && id !== controllerArg.id) {
                    return;
                } else if (isString(controllerArg.transition)) {
                    transition = controllerArg.transition;
                    this._changeDirection(transition);
                }

                this.dispatchEvent(__drawerFoundEvent, DIRECT, {
                    id: id,
                    transition: transition,
                    element: element,
                    useContext: useContext,
                    template: $utils.isNode(innerTemplate) ? innerTemplate.cloneNode(true) : null
                });
            });

            this.dispatchEvent(__drawerFoundEvent, DIRECT, {
                id: id,
                transition: transition,
                element: element,
                useContext: useContext,
                template: $utils.isNode(innerTemplate) ? innerTemplate.cloneNode(true) : null
            });
        }

        private __bindTemplate(): void {
            this.bindableTemplates.bind('drawer').then((template) => {
                this.element.appendChild(template);
            });
        }
    }

    plat.register.control('plat-drawer', Drawer);

    /**
     * A Template Control that manipulates and controls a global drawer.
     */
    export class DrawerController extends plat.ui.TemplateControl {
        $utils: plat.IUtils = plat.acquire(plat.IUtils);
        $compat: plat.ICompat = plat.acquire(plat.ICompat);
        $document: Document = plat.acquire(plat.Document);

        /**
         * The plat-options for the DrawerController.
         */
        options: plat.observable.IObservableProperty<IDrawerOptions>;

        /**
         * The transition direction of control for this DrawerController.
         */
        _transition: string;

        /**
         * The DrawerController's corresponding Drawer element.
         */
        _drawerElement: HTMLElement;

        /**
         * The CSS3 transform property.
         */
        _transform: string;

        /**
         * The last touch start recorded.
         */
        _lastTouch: plat.ui.IPoint;

        private __hasSwiped = false;
        private __isOpen = false;
        private __inTouch = false;
        private __useContext: boolean;
        private __removeSwipeOpen: plat.IRemoveListener;
        private __removeSwipeClose: plat.IRemoveListener;
        private __removePrimaryTrack: plat.IRemoveListener;
        private __removeSecondaryTrack: plat.IRemoveListener;
        private __rootElement: HTMLElement;
        private __templateUrl: string;
        private __transitionHash: plat.IObject<string> = {
            right: 'left',
            left: 'right',
            up: 'down',
            down: 'up'
        };

        /**
         * Initialize the track events on the element.
         */
        loaded(): void {
            var element = this.element,
                optionObj = this.options,
                options = this.$utils.isObject(optionObj) ? optionObj.value : <IDrawerOptions>{},
                transition = options.transition,
                id = options.id;

            this.__useContext = options.useContext === true;
            this.__templateUrl = options.templateUrl;
            this.__initializeEvents(id, transition);
        }

        /**
         * Remove the transition class off the root element.
         */
        dispose(): void {
            var dom = this.dom,
                rootElement = this.__rootElement;

            dom.removeClass(rootElement, 'plat-drawer-transition');
            dom.removeClass(rootElement, 'plat-drawer-transition-prep');
        }

        /**
         * Opens the drawer.
         */
        open(): void {
            var elementToMove = this.__rootElement,
                drawerElement = this._drawerElement,
                isNode = this.$utils.isNode;

            if (!isNode(elementToMove) || !isNode(drawerElement)) {
                return;
            }

            this.dom.addClass(elementToMove, 'plat-drawer-transition');

            var translation: string;
            switch (this._transition) {
                case 'up':
                    translation = 'translate3d(0,' + (-drawerElement.offsetHeight) + 'px,0)';
                    break;
                case 'down':
                    translation = 'translate3d(0,' + drawerElement.offsetHeight + 'px,0)';
                    break;
                case 'left':
                    translation = 'translate3d(' + (-drawerElement.offsetWidth) + 'px,0,0)';
                    break;
                case 'right':
                    translation = 'translate3d(' + drawerElement.offsetWidth + 'px,0,0)';
                    break;
                default:
                    return;
            }

            elementToMove.style[<any>this._transform] = translation;
            this.__isOpen = true;
        }

        /**
         * Closes the drawer.
         */
        close(): void {
            var elementToMove = this.__rootElement,
                drawerElement = this._drawerElement,
                isNode = this.$utils.isNode;

            if (!isNode(elementToMove) || !isNode(drawerElement)) {
                return;
            }

            this.dom.addClass(elementToMove, 'plat-drawer-transition');

            elementToMove.style[<any>this._transform] = '';
            this.__isOpen = false;
        }

        /**
         * Toggles the drawer's open/closed state.
         */
        toggle(): void {
            if (this.__isOpen) {
                this.close();
                return;
            }

            this.open();
        }

        /**
         * Resets the drawer to it's current open/closed state.
         */
        reset(): void {
            if (this.__isOpen) {
                this.open();
                return;
            }

            this.close();
        }

        /**
         * Indicates whether the drawer is currently open.
         */
        isOpen(): boolean {
            return this.__isOpen;
        }

        /**
         * Adds swipe events to the controller element.
         * 
         * @param transition The transition direction of opening for the drawer.
         */
        _addSwipeEvents(transition: string): void {
            var openEvent = '$swipe' + transition,
                closeEvent = '$swipe' + this.__transitionHash[transition],
                element = this.element;

            this.__removeSwipeOpen = this.addEventListener(element, openEvent, () => {
                this.__hasSwiped = true;
                this.open();
            });

            this.__removeSwipeClose = this.addEventListener(element, closeEvent, () => {
                this.__hasSwiped = true;
                this.close();
            });
        }

        /**
         * Adds primary and secondary tracking events to the controller element.
         * 
         * @param transition The transition direction of opening for the drawer.
         */
        _addEventListeners(transition: string): void {
            var element = this.element,
                primaryTrack = '$track' + transition,
                secondaryTrack = '$track' + this.__transitionHash[transition],
                trackFn = this._track.bind(this);

            this._transition = transition;

            // remove event listeners first in case we want to later be able to dynamically change transition direction of drawer.
            this._removeEventListeners();
            this.__removePrimaryTrack = this.addEventListener(element, primaryTrack, trackFn);
            this.__removeSecondaryTrack = this.addEventListener(element, secondaryTrack, trackFn);
            this._addSwipeEvents(transition);

            if (this.$utils.isNull(this._lastTouch)) {
                this._lastTouch = { x: 0, y: 0 };
                this.addEventListener(element, '$touchstart', (ev: plat.ui.IGestureEvent) => {
                    this.__inTouch = true;
                    this._lastTouch = {
                        x: ev.clientX,
                        y: ev.clientY
                    };
                });
                this.addEventListener(this.$document, '$touchend', this._touchEnd.bind(this));
            }
        }

        /**
         * Removes all event listeners.
         */
        _removeEventListeners(): void {
            var isFunction = this.$utils.isFunction;
            if (isFunction(this.__removePrimaryTrack)) {
                this.__removePrimaryTrack();
                this.__removePrimaryTrack = null;
            }

            if (isFunction(this.__removeSecondaryTrack)) {
                this.__removeSecondaryTrack();
                this.__removeSecondaryTrack = null;
            }

            if (isFunction(this.__removeSwipeOpen)) {
                this.__removeSwipeOpen();
                this.__removeSwipeOpen = null;
            }

            if (isFunction(this.__removeSwipeClose)) {
                this.__removeSwipeClose();
                this.__removeSwipeClose = null;
            }
        }

        /**
         * The $touchend event handler.
         * 
         * @param ev The touch event.
         */
        _touchEnd(ev: plat.ui.IGestureEvent): void {
            if (!this.__inTouch) {
                return;
            } else if (this.__hasSwiped) {
                this.__hasSwiped = this.__inTouch = false;
                return;
            }

            this.__inTouch = false;

            var drawerElement = this._drawerElement,
                distanceMoved: number,
                totalDistance: number;
            switch (this._transition) {
                case 'up':
                case 'down':
                    totalDistance = drawerElement.offsetHeight;
                    distanceMoved = ev.clientY - this._lastTouch.y;
                    break;
                case 'left':
                case 'right':
                    totalDistance = drawerElement.offsetWidth;
                    distanceMoved = ev.clientX - this._lastTouch.x;
                    break;
                default:
                    return;
            }

            if (Math.abs(distanceMoved) > Math.ceil(totalDistance / 2)) {
                this.toggle();
                return;
            }

            this.reset();
        }

        /**
         * The $track event handler. Used for tracking only horizontal or vertical tracking motions  
         * depending on the defined 'transition' direction.
         * 
         * @param ev The $tracking event.
         */
        _track(ev: plat.ui.IGestureEvent): void {
            var elementToMove = this.__rootElement,
                drawerElement = this._drawerElement,
                $utils = this.$utils;

            var distanceMoved: number,
                translation: string;
            switch (this._transition) {
                case 'up':
                    distanceMoved = this.__isOpen ?
                        (-drawerElement.offsetHeight) + ev.clientY - this._lastTouch.y :
                        ev.clientY - this._lastTouch.y;
                    translation = 'translate3d(0,' + distanceMoved + 'px,0)';
                    break;
                case 'down':
                    distanceMoved = this.__isOpen ?
                        drawerElement.offsetHeight + ev.clientY - this._lastTouch.y :
                        ev.clientY - this._lastTouch.y;
                    translation = 'translate3d(0,' + distanceMoved + 'px,0)';
                    break;
                case 'left':
                    distanceMoved = this.__isOpen ?
                        (-drawerElement.offsetWidth) + ev.clientX - this._lastTouch.x :
                        ev.clientX - this._lastTouch.x;
                    translation = 'translate3d(' + distanceMoved + 'px,0,0)';
                    break;
                case 'right':
                    distanceMoved = this.__isOpen ?
                        drawerElement.offsetWidth + ev.clientX - this._lastTouch.x :
                        ev.clientX - this._lastTouch.x;
                    translation = 'translate3d(' + distanceMoved + 'px,0,0)';
                    break;
                default:
                    return;
            }

            elementToMove.style[<any>this._transform] = translation;
        }

        private __initializeEvents(id: string, transition: string): void {
            var element = this.element,
                $utils = this.$utils,
                isString = $utils.isString,
                needsDirection = !isString(transition);

            this.__setTransform();

            var eventRemover = this.on(__drawerFoundEvent,
                (event: plat.events.IDispatchEventInstance, drawerArg: IDrawerHandshakeEvent) => {
                if (isString(id) && isString(drawerArg.id) && id !== drawerArg.id) {
                    return;
                }

                eventRemover();

                this._drawerElement = drawerArg.element;

                if (needsDirection) {
                    if (isString(drawerArg.transition)) {
                        transition = drawerArg.transition;
                    } else {
                        var Exception = plat.acquire(plat.IExceptionStatic);
                        Exception.warn('Transition direction is incorrectly defined for "plat-drawer" or "plat-drawer-controller."' +
                            ' Please ensure it is a string.');
                        return;
                    }
                }

                if (!this.__controllerIsValid(transition)) {
                    return;
                }

                this._addEventListeners(transition.toLowerCase());

                if (!this.__useContext && drawerArg.useContext === true) {
                    return;
                }

                this.__determineTemplate(drawerArg.template);
            });

            this.dispatchEvent(__drawerControllerFetchEvent, plat.events.EventManager.DIRECT, {
                id: id,
                transition: transition
            });
        }

        private __determineTemplate(fragment?: Node): void {
            var $utils = this.$utils;

            if ($utils.isString(this.__templateUrl)) {
                plat.ui.TemplateControl.determineTemplate(this, this.__templateUrl).then((template) => {
                    this.bindableTemplates.add('drawer', template);
                    this.__bindTemplate();
                });
            } else if ($utils.isNode(fragment)) {
                this.bindableTemplates.add('drawer', fragment);
                this.__bindTemplate();
            }
        }

        private __bindTemplate(): void {
            var drawerElement = this._drawerElement;
            this.bindableTemplates.bind('drawer').then((template) => {
                this.dom.clearNode(drawerElement);
                drawerElement.appendChild(template);
            });
        }

        private __setTransform(): void {
            var style = this.element.style,
                isUndefined = this.$utils.isUndefined;

            if (isUndefined(style.transform)) {
                var vendorPrefix = this.$compat.vendorPrefix;
                if (!isUndefined(style[<any>(vendorPrefix.lowerCase + 'Transform')])) {
                    this._transform = vendorPrefix.lowerCase + 'Transform';
                    return;
                } else if (!isUndefined(style[<any>(vendorPrefix.js + 'Transform')])) {
                    this._transform = vendorPrefix.lowerCase + 'Transform';
                    return;
                }
            }

            this._transform = 'transform';
        }

        private __controllerIsValid(transition: string): boolean {
            var isNull = this.$utils.isNull,
                Exception: plat.IExceptionStatic,
                rootElement = this.__rootElement = this.root.element,
                dom = this.dom;

            if (isNull(this.__transitionHash[transition])) {
                Exception = plat.acquire(plat.IExceptionStatic);
                Exception.warn('Incorrect transition direction: "' + transition +
                    '" defined for "plat-drawer" or "plat-drawer-controller"');
                return false;
            } else if (isNull(this._drawerElement)) {
                Exception = plat.acquire(plat.IExceptionStatic);
                Exception.warn('Could not find a corresponding plat-drawer for this "plat-drawer-controller"');
                return false;
            } else if (isNull(rootElement)) {
                var parent = this.root.parent;
                if (isNull(parent) || isNull(parent.element)) {
                    Exception = plat.acquire(plat.IExceptionStatic);
                    Exception.warn('Cannot have a "plat-drawer-controller" inside a root control with a null element.');
                    return false;
                }
                rootElement = this.__rootElement = parent.element;
            }

            dom.addClass(rootElement, 'plat-drawer-transition-prep');
            this.addEventListener(rootElement, this.$compat.animationEvents.$transitionEnd, () => {
                dom.removeClass(rootElement, 'plat-drawer-transition');
            });

            return true;
        }
    }

    plat.register.control('plat-drawer-controller', DrawerController);

    /**
     * The drawer options capable of being placed on the 'plat-drawer' and/or the 
     * 'plat-drawer-controller' as 'plat-options.'
     */
    export interface IDrawerOptions {
        /**
         * The unique ID of the drawer / drawer-controller pair.
         */
        id?: string;

        /**
         * The transition direction of drawer opening.
         */
        transition?: string;

        /**
         * The url of the drawer's intended template.
         */
        templateUrl?: string;

        /**
         * A boolean value stating whether to use this context or not.
         */
        useContext?: boolean;
    }

    /**
     * An interface for the drawer's event object used during the 
     * drawer / drawer-controller handshake.
     */
    interface IDrawerHandshakeEvent {
        /**
         * The unique ID of the drawer / drawer-controller pair.
         */
        id?: string;
        /**
         * The transition direction of drawer opening.
         */
        transition?: string;
        /**
         * The global drawer element.
         */
        element?: HTMLElement;
        /**
         * The intended template of the global drawer element.
         */
        template?: Node;
        /**
         * A boolean value stating whether to use this context or not.
         */
        useContext?: boolean;
    }
}
