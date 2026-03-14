import { jnpfConfigBpmnContextPad } from '../../contextPad';
import { bpmnEnd, typeEnd } from '../../variableName';

const { del } = jnpfConfigBpmnContextPad;

const jnpfEndConfig: any = {
  name: typeEnd,
  shapeType: bpmnEnd,
  palette: {
    name: 'create.jnpf-task',
    group: 'model',
    className: 'icon-jnpf-create icon-jnpf-task',
    title: '创建一个类型为jnpf-task的任务节点',
  },
  renderer: {
    icon: 'icon-ym icon-ym-flow-node-end',
    iconColor: '#8B8BA0',
    titleColor: '#EDF3F8',
    attr: { x: 0, y: 0, width: 90, rx: 16, height: 32 },
    rendererName: '流程结束',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { del }, // 自定义 只有default = false 开启
    freeCustomization: {},
  },
  properties: {},
};

export { jnpfEndConfig };
