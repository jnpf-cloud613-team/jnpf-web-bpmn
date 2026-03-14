import { jnpfConfigBpmnContextPad } from '../../../contextPad';
import { bpmnAddData, typeAddData } from '../../../variableName';
const { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, del, paste, copy } = jnpfConfigBpmnContextPad;
const jnpfAddDataConfig: any = {
  name: typeAddData,
  shapeType: bpmnAddData,
  element: {
    label: 'Task',
    actionName: 'replace-with-task',
    className: 'bpmn-icon-task',
    target: {
      type: bpmnAddData,
    },
  },
  renderer: {
    icon: 'icon-ym icon-ym-btn-add',
    iconColor: '#439815',
    titleColor: 'linear-gradient(90deg, #D6FABF 0%, #68C62C 100%',
    background: '#ffffff',
    attr: { x: 0, y: 0, rx: 8, width: 200, height: 88 },
    rendererName: '新增数据',
    bodyDefaultText: '请设置新增数据',
  },
  contextPad: {
    default: false, // contextPad 中的元素使用默认 否则遵循自定义
    customization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, del },
    otherCustomization: { getData, addData, updateData, delData, interfaceData, message, launch, schedule, connect, copy, paste, del },
  },
  properties: {},
};

export { jnpfAddDataConfig };
