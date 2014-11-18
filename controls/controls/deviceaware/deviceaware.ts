module platui {
    export class DeviceAwareControl extends plat.ui.TemplateControl {
        static PORTRAIT = 'portrait';
        static LANDSCAPE = 'landscape';
        static PHONE = 'phone';
        static PHABLET = 'phablet';
        static TABLET = 'tablet';
        static DESKTOP = 'desktop';

        static config = {
            PORTRAIT: <IDeviceBreakpoints<number>> {
                phone: 420,
                phablet: 620,
                tablet: 820
            },
            LANDSCAPE: <IDeviceBreakpoints<number>> {
                phone: 600,
                phablet: 850,
                tablet: 1100
            }
        };

        $window: Window = plat.acquire(__Window);
        $document: Document = plat.acquire(__Document);
        $utils: plat.IUtils = plat.acquire(__Utils);

        orientation: string;
        device: string;
        templateLoaded: plat.async.IThenable<void>;

        templates: IDeviceTemplates<Node> = {
            portrait: {
                phone: null,
                phablet: null,
                tablet: null,
                desktop: null
            },
            landscape: {
                phone: null,
                phablet: null,
                tablet: null,
                desktop: null
            }
        };

        _determinedDevice: string;

        initialize(): void {
            this._setDeviceAndOrientation();
            this.addEventListener(this.$window, 'resize', this._setDeviceAndOrientation, false);
        }

        setTemplate(): void {
            var isUndefined = this.$utils.isUndefined,
                element = this.element,
                templates = this.templates,
                slice = Array.prototype.slice,
                childNodes: Array<Node> = slice.call(element.childNodes),
                innerNodes: Array<Node>,
                childNode: Node,
                orientedTemplate: Node,
                deviceTemplates: IDeviceBreakpoints<Node>,
                outerNodeName: string,
                innerNodeName: string;

            while (childNodes.length > 0) {
                childNode = childNodes.pop();
                outerNodeName = childNode.nodeName.toLowerCase();
                deviceTemplates = templates[outerNodeName];
                orientedTemplate = element.removeChild(childNode);

                if (isUndefined(deviceTemplates)) {
                    continue;
                }

                innerNodes = slice.call(orientedTemplate.childNodes);
                while (innerNodes.length > 0) {
                    childNode = innerNodes.pop();
                    innerNodeName = childNode.nodeName.toLowerCase();

                    if (isUndefined(deviceTemplates[innerNodeName])) {
                        continue;
                    }

                    deviceTemplates[innerNodeName] = orientedTemplate.removeChild(childNode);
                }
            }

            this._addDeterminedDeviceTemplate();
        }

        loaded(): void {
            this._bindDeterminedDeviceTemplate();
        }

        deviceChanged(): boolean { return true; }

        orientationChanged(): boolean { return true; }

        _determineDeviceTemplate(orientation: string, device: string, lowestDevice?: string): Node {
            var $utils = this.$utils,
                templates = this.templates,
                deviceTemplates = templates[orientation];

            if (!$utils.isObject(deviceTemplates)) {
                return;
            } else if ($utils.isNode(deviceTemplates[device])) {
                this._determinedDevice = device;
                return deviceTemplates[device];
            } else if (device === lowestDevice) {
                return;
            }

            switch (device) {
                case DeviceAwareControl.DESKTOP:
                    return this._determineDeviceTemplate(orientation, DeviceAwareControl.TABLET);
                case DeviceAwareControl.TABLET:
                    return this._determineDeviceTemplate(orientation, DeviceAwareControl.PHABLET);
                case DeviceAwareControl.PHABLET:
                    return this._determineDeviceTemplate(orientation, DeviceAwareControl.PHONE);
                case DeviceAwareControl.PHONE:
                    return deviceTemplates[this._determinedDevice];
                default:
                    return;
            }
        }

        _addDeterminedDeviceTemplate(overwrite?: boolean): void {
            var $utils = this.$utils,
                isNode = $utils.isNode,
                orientation = this.orientation,
                device = this.device,
                template = this._determineDeviceTemplate(orientation, device),
                bindableTemplates = this.bindableTemplates;

            // if the template is not a node or overwrite is not true and the template is already set, return
            if (!isNode(template)) {
                template = this._determineDeviceTemplate(orientation, DeviceAwareControl.DESKTOP, device);
                if (!isNode(template)) {
                    return;
                }
            }

            var key = orientation + '-' + this._determinedDevice;
            if (overwrite !== true && !$utils.isNull(bindableTemplates.templates[key])) {
                return;
            }

            bindableTemplates.add(key, template);
        }

        _bindDeterminedDeviceTemplate(): plat.async.IThenable<void> {
            var bindableTemplates = this.bindableTemplates,
                definedTemplates = bindableTemplates.templates,
                isNull = this.$utils.isNull,
                key = this.orientation + '-' + this._determinedDevice;

            if (isNull(definedTemplates[key])) {
                this._addDeterminedDeviceTemplate();
                if (isNull(definedTemplates[key])) {
                    return;
                }
            }

            return this._bindTemplate(key);
        }

        _bindTemplate(key: string): plat.async.IThenable<void> {
            var element = this.element;

            this.dom.clearNode(element);
            var templatePromise = this.bindableTemplates.bind(key).then((boundTemplate) => {
                element.appendChild(boundTemplate);
            });

            return (this.templateLoaded = templatePromise);
        }

        _setDeviceAndOrientation(): void {
            var $window = this.$window,
                config = DeviceAwareControl.config,
                width = $window.innerWidth,
                height = $window.innerHeight,
                device = this.device,
                orientation = this.orientation,
                newOrientation: string,
                breakpoints: IDeviceBreakpoints<number>;

            // check for portrait
            if (height > width) {
                newOrientation = DeviceAwareControl.PORTRAIT;
                breakpoints = config.PORTRAIT;
            } else {
                newOrientation = DeviceAwareControl.LANDSCAPE;
                breakpoints = config.LANDSCAPE;
            }

            this.orientation = newOrientation;
            this._setDevice(width, breakpoints);

            // if we haven't loaded yet, return
            if (this.$utils.isNull(this.templateLoaded)) {
                return;
            }

            var implementChange = false;
            if (this.device !== device) {
                // fire deviceChanged
                implementChange = this.deviceChanged();
            } else if (orientation !== newOrientation) {
                // fire orientationChanged
                implementChange = this.orientationChanged();
            }

            // only refrain from making the change if the virtual function explicitly returns false
            if (implementChange === false) {
                return;
            }

            this._bindDeterminedDeviceTemplate();
        }

        _setDevice(length: number, breakpoints: IDeviceBreakpoints<number>): void {
            if (length > breakpoints.tablet) {
                this.device = DeviceAwareControl.DESKTOP;
            } else if (length > breakpoints.phablet) {
                this.device = DeviceAwareControl.TABLET;
            } else if (length > breakpoints.phone) {
                this.device = DeviceAwareControl.PHABLET;
            } else {
                this.device = DeviceAwareControl.PHONE;
            }
        }
    }

    plat.register.control('device-aware', DeviceAwareControl);

    export interface IDeviceTemplates<T> {
        [key: string]: IDeviceBreakpoints<T>;

        portrait: IDeviceBreakpoints<T>;
        landscape: IDeviceBreakpoints<T>;
    }

    export interface IDeviceBreakpoints<T> {
        [key: string]: T;

        phone: T;
        phablet: T;
        tablet: T;
        desktop?: T;
    }
}
