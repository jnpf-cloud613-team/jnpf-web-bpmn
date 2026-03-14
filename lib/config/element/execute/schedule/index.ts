import { jnpfConfigBpmnContextPad } from '../../../contextPad';
import { bpmnSchedule, typeSchedule } from '../../../variableName';
const { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del } = jnpfConfigBpmnContextPad;
const jnpfScheduleConfig: any = {
  name: typeSchedule,
  shapeType: bpmnSchedule,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnSchedule,
    },
  },
  renderer: {
    icon: 'icon-ym icon-ym-xingcheng',
    iconColor: '#7DB2F0',
    titleColor: 'linear-gradient(90deg, #ABE6FC 0%, #7DB2F0 100%)',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '创建日程',
    bodyDefaultText: '请设置创建日程信息',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, del },
    otherCustomization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del },
  },
  properties: {},
};

export { jnpfScheduleConfig };
