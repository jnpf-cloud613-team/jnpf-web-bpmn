import { jnpfConfigBpmnContextPad } from '../../../contextPad';
import { bpmnGetData, typeGetData } from '../../../variableName';
const { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, del, paste, copy } = jnpfConfigBpmnContextPad;
const jnpfGetDataConfig: any = {
  name: typeGetData,
  shapeType: bpmnGetData,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnGetData,
    },
  },
  renderer: {
    icon: 'icon-ym icon-ym-header-search',
    iconColor: '#4936DD',
    titleColor: 'linear-gradient(90deg, #C1C8FF 0%, #A481F2 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '获取数据',
    bodyDefaultText: '请设置获取数据',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, del },
    otherCustomization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del },
  },
  properties: {},
};

export { jnpfGetDataConfig };
