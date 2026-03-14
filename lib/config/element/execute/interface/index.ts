import { jnpfConfigBpmnContextPad } from '../../../contextPad';
import { bpmnInterface, typeInterface } from '../../../variableName';
const { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, del, paste, copy } = jnpfConfigBpmnContextPad;
const jnpfInterfaceConfig: any = {
  name: typeInterface,
  shapeType: bpmnInterface,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnInterface,
    },
  },
  renderer: {
    icon: 'icon-ym icon-ym-options',
    iconColor: '#3C5EEF',
    titleColor: 'linear-gradient(90deg, #D0DCFF 0%, #90A5FF 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '数据接口',
    bodyDefaultText: '请设置数据接口',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, del },
    otherCustomization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del },
  },
  properties: {},
};

export { jnpfInterfaceConfig };
