import { bpmnFree, typeFree } from '../../variableName';
import { jnpfConfigBpmnContextPad } from '../../contextPad';
const { trigger, connect } = jnpfConfigBpmnContextPad;

const jnpfFreeConfig: any = {
  name: typeFree,
  shapeType: bpmnFree,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnFree,
    },
  },
  renderer: {
    icon: 'icon-ym icon-ym-flow-node-free',
    iconColor: '#1DACEB',
    titleColor: 'linear-gradient(90deg, #C0EDF8 0%, #B4DEF2 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '自由节点',
    bodyDefaultText: '审批人员自行结束',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { trigger, connect },
  },
  properties: {},
};

export { jnpfFreeConfig };
