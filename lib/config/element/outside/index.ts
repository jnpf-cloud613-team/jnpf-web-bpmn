import { jnpfConfigBpmnContextPad } from '../../contextPad';
import { bpmnOutside, typeOutside } from '../../variableName';
const { approver, processing, connect, copy, del } = jnpfConfigBpmnContextPad;
const jnpfOutsideConfig: any = {
  name: typeOutside,
  shapeType: bpmnOutside,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnOutside,
    },
  },
  palette: {
    name: 'create.jnpf-task',
    group: 'model',
    className: 'icon-jnpf-create icon-ym icon-ym-flow-node-external',
    title: '创建一个类型为jnpf-task的任务节点',
  },
  renderer: {
    icon: 'icon-ym icon-ym-flow-node-external',
    iconColor: '#FC821A',
    titleColor: 'linear-gradient(90deg, #FCEDE2 0%, #FFBB81 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '外部节点',
    bodyDefaultText: '请设置外部审批',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { approver, processing, connect, copy, del },
  },
  properties: {},
};

export { jnpfOutsideConfig };
