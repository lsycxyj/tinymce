import * as Behaviour from './Behaviour';
import * as ActiveDisable from '../../behaviour/disabling/ActiveDisable';
import * as DisableApis from '../../behaviour/disabling/DisableApis';
import DisableSchema from '../../behaviour/disabling/DisableSchema';

export interface DisableBehaviour extends Behaviour.AlloyBehaviour {
  config: (DisablingConfig) => { key: string, value: any };
  enable?: (component, disableConfig?, disableState?) => void;
  disable?: (component, disableConfig?, disableState?) => void;
  isDisabled?: (component) => boolean;
  onLoad?: (component, disableConfig, disableState) => void;
}

export interface DisablingConfig<T> extends Behaviour.AlloyBehaviourConfig {
  active: {
    exhibit: (base: {}, disableConfig: {DisableConfig}, disableState?) => any,
    events: (disableConfig, disableState) => any
  };
}

export interface DisableConfig {
  disabled: () => boolean;
  disableClass?: () => string;
}

const Disabling: DisableBehaviour = Behaviour.create({
  fields: DisableSchema,
  name: 'disabling',
  active: ActiveDisable,
  apis: DisableApis
});

export {
  Disabling
};