import { ComponentSystem } from '../system.js';
import { ScrollbarComponent } from './component.js';
import { ScrollbarComponentData } from './data.js';

/**
 * @import { AppBase } from '../../app-base.js'
 */

const _schema = [
    { name: 'enabled', type: 'boolean' },
    { name: 'orientation', type: 'number' },
    { name: 'value', type: 'number' },
    { name: 'handleSize', type: 'number' }
];

/**
 * Manages creation of {@link ScrollbarComponent}s.
 *
 * @category User Interface
 */
class ScrollbarComponentSystem extends ComponentSystem {
    /**
     * Create a new ScrollbarComponentSystem.
     *
     * @param {AppBase} app - The application.
     * @ignore
     */
    constructor(app) {
        super(app);

        this.id = 'scrollbar';

        this.ComponentType = ScrollbarComponent;
        this.DataType = ScrollbarComponentData;

        this.schema = _schema;

        this.on('add', this._onAddComponent, this);
        this.on('beforeremove', this._onRemoveComponent, this);
    }

    initializeComponentData(component, data, properties) {
        super.initializeComponentData(component, data, _schema);
        component.handleEntity = data.handleEntity;
    }

    _onAddComponent(entity) {
        entity.fire('scrollbar:add');
    }

    _onRemoveComponent(entity, component) {
        component.onRemove();
    }
}

export { ScrollbarComponentSystem };
