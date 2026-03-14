import { bpmnGroup } from '../../variableName';
import { jnpfConfigBpmnContextPad } from '../../contextPad';
const { approver, subFlow, inclusive, parallel, exclusive } = jnpfConfigBpmnContextPad;
const jnpfGroupConfig: any = {
  name: bpmnGroup,
  shapeType: bpmnGroup,
  element: {
    label: 'Group',
    actionName: 'replace-with-group',
    className: 'bpmn-icon-group',
    target: {
      type: bpmnGroup,
    },
  },
  palette: {
    name: 'create.yinmai-group',
    group: 'model',
    className: 'icon-yinmai-create icon-yinmai-group',
    title: '修改为渲染按钮',
  },
  renderer: {
    background: '#ffffff',
    attr: { x: 0, y: 0, width: 28, height: 28 },
    rendererName: '分组123',
    fillColor: 'rgb(255,255,255)',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { approver, subFlow, inclusive, parallel, exclusive }, // 自定义 只有default = false 开启
  },
  properties: {},
};

export { jnpfGroupConfig };
