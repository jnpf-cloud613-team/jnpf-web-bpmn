import { bpmnTask, bpmnTrigger, typeTrigger } from '../../variableName';
import { jnpfConfigBpmnContextPad } from '../../contextPad';
const { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del } = jnpfConfigBpmnContextPad;
const jnpfTriggerConfig: any = {
  name: typeTrigger,
  shapeType: bpmnTrigger,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnTask,
    },
  },
  renderer: {
    icon: 'icon-ym icon-ym-flow-trigger-event',
    iconColor: '#4DCE62',
    titleColor: 'linear-gradient(90deg, #BFEBC6 0%, #A4EBAF 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '触发节点',
    bodyDefaultText: '请设置触发事件',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, del },
    otherCustomization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del },
  },
  properties: {},
};

export { jnpfTriggerConfig };
