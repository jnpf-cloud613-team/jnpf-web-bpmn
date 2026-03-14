import { jnpfConfigBpmnContextPad } from '../../../contextPad';
import { bpmnDelData, typeDelData } from '../../../variableName';
const { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, del, paste, copy } = jnpfConfigBpmnContextPad;
const jnpfDelDataConfig: any = {
  name: typeDelData,
  shapeType: bpmnDelData,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnDelData,
    },
  },
  renderer: {
    icon: 'icon-ym icon-ym-btn-clearn',
    iconColor: '#DD363C',
    titleColor: 'linear-gradient(90deg, #FFCDC1 0%, #FF8E92 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '删除数据',
    bodyDefaultText: '请设置删除节点',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, del },
    otherCustomization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del },
  },
  properties: {},
};

export { jnpfDelDataConfig };
