import { jnpfConfigBpmnContextPad } from '../../../contextPad';
import { bpmnMessage, typeMessage } from '../../../variableName';
const { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del } = jnpfConfigBpmnContextPad;
const jnpfMessageConfig: any = {
  name: typeMessage,
  shapeType: bpmnMessage,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnMessage,
    },
  },
  renderer: {
    icon: 'icon-ym icon-ym-header-message',
    iconColor: '#F5CD61',
    titleColor: 'linear-gradient(90deg, #FCE6AB 0%, #F5CD61 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '消息通知',
    bodyDefaultText: '请设置消息通知',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, del },
    otherCustomization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del },
  },
  properties: {},
};

export { jnpfMessageConfig };
