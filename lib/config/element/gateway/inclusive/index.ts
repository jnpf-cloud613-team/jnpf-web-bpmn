import { bpmnInclusive, typeInclusion } from '../../../variableName';
import { jnpfConfigBpmnContextPad } from '../../../contextPad';
const { approver } = jnpfConfigBpmnContextPad;
const jnpfInclusiveConfig: any = {
  name: typeInclusion,
  shapeType: bpmnInclusive,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnInclusive,
    },
  },
  palette: {
    name: 'create.jnpf-task',
    group: 'model',
    className: 'icon-jnpf-create icon-jnpf-task',
    title: '创建一个类型为jnpf-task的任务节点',
  },
  renderer: {
    icon: 'icon-ym icon-ym-flow-node-approve',
    iconColor: '#1DACEB',
    titleColor: '#C0EDF8',
    background: '#ffffff',
    attr: { x: 0, y: 0, width: 90, rx: 16, height: 32 },
    rendererName: '条件分支',
    bodyDefaultText: '请设置审批人',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { approver }, // 自定义 只有default = false 开启
  },
  properties: {},
};

export { jnpfInclusiveConfig };
