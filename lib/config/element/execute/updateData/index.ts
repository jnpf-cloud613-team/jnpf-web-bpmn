import { jnpfConfigBpmnContextPad } from '../../../contextPad';
import { bpmnUpdateData, typeUpdateData } from '../../../variableName';
const { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del } = jnpfConfigBpmnContextPad;
const jnpfUpdateDataConfig: any = {
  name: typeUpdateData,
  shapeType: bpmnUpdateData,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnUpdateData,
    },
  },
  renderer: {
    icon: 'icon-ym icon-ym-generator-annular',
    iconColor: '#24BEC4',
    titleColor: 'linear-gradient(90deg, #CDFAF3 0%, #55E2CC 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '更新数据',
    bodyDefaultText: '请设置更新数据',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, del },
    otherCustomization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del },
  },
  properties: {},
};

export { jnpfUpdateDataConfig };
