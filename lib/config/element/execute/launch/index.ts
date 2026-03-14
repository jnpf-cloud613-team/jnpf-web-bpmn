import { jnpfConfigBpmnContextPad } from '../../../contextPad';
import { bpmnLaunchFlow, typeLaunchFlow } from '../../../variableName';
const { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del } = jnpfConfigBpmnContextPad;
const jnpfLaunchConfig: any = {
  name: typeLaunchFlow,
  shapeType: bpmnLaunchFlow,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnLaunchFlow,
    },
  },
  renderer: {
    icon: 'icon-ym icon-ym-flow-node-branch',
    iconColor: '#5ED87F',
    titleColor: 'linear-gradient(90deg, #B6F7BB 0%, #5ED87F 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '发起审批',
    bodyDefaultText: '请设置发起审批',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, del },
    otherCustomization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del },
  },
  properties: {},
};

export { jnpfLaunchConfig };
